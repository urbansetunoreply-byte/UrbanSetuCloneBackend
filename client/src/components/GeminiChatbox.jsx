import React, { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaRobot, FaCopy, FaCheck, FaDownload, FaUpload, FaCog, FaLightbulb, FaHistory, FaBookmark, FaShare, FaThumbsUp, FaThumbsDown, FaRegBookmark, FaBookmark as FaBookmarkSolid } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { formatLinksInText } from '../utils/linkFormatter.jsx';
import { useSelector } from 'react-redux';

const GeminiChatbox = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I\'m your AI assistant powered by Gemini. How can I help you with your real estate needs today?',
            timestamp: new Date().toISOString()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const [sendIconAnimating, setSendIconAnimating] = useState(false);
    const [sendIconSent, setSendIconSent] = useState(false);
    const messagesContainerRef = useRef(null);
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const abortControllerRef = useRef(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const lastUserMessageRef = useRef('');
    const [tone, setTone] = useState(() => localStorage.getItem('gemini_tone') || 'neutral'); // modes dropdown (tone)
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [showFeatures, setShowFeatures] = useState(false);
    const [bookmarkedMessages, setBookmarkedMessages] = useState(() => JSON.parse(localStorage.getItem('gemini_bookmarks') || '[]'));
    const [messageRatings, setMessageRatings] = useState(() => JSON.parse(localStorage.getItem('gemini_ratings') || '{}'));
    const [showSettings, setShowSettings] = useState(false);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [chatSessions, setChatSessions] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingText, setTypingText] = useState('');
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showMessageMenu, setShowMessageMenu] = useState(false);
    const [highlightedMessage, setHighlightedMessage] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const scrollToBottomInstant = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    // Generate or retrieve session ID
    const getOrCreateSessionId = () => {
        if (sessionId) return sessionId;
        
        // Try to get existing session from localStorage
        const existingSessionId = localStorage.getItem('gemini_session_id');
        if (existingSessionId) {
            setSessionId(existingSessionId);
            return existingSessionId;
        }
        
        // Create new session ID
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('gemini_session_id', newSessionId);
        setSessionId(newSessionId);
        return newSessionId;
    };

    // Load chat history for authenticated users
    const loadChatHistory = async (currentSessionId) => {
        if (!currentUser || !currentSessionId) return;

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/chat-history/session/${currentSessionId}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.messages && data.data.messages.length > 0) {
                    setMessages(data.data.messages);
                    console.log('Chat history loaded:', data.data.messages.length, 'messages');
                }
            } else if (response.status === 404) {
                // No history found, keep default welcome message
                console.log('No chat history found for session');
            } else {
                console.error('Failed to load chat history:', response.status);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        } finally {
            setIsHistoryLoaded(true);
        }
    };

    // Clear chat history locally
    const clearLocalChatHistory = () => {
        setMessages([
            {
                role: 'assistant',
                content: 'Hello! I\'m your AI assistant powered by Gemini. How can I help you with your real estate needs today?',
                timestamp: new Date().toISOString()
            }
        ]);
        // Generate new session ID
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('gemini_session_id', newSessionId);
        setSessionId(newSessionId);
    };

    // Clear chat history (server + local) from within the chatbox header
    const handleClearChatHistory = async () => {
        try {
            // If user is not authenticated, just clear local chat
            if (!currentUser) {
                clearLocalChatHistory();
                toast.success('Chat cleared');
                return;
            }

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/chat-history/clear-all`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                toast.success('Chat history cleared');
                clearLocalChatHistory();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to clear chat history');
            }
        } catch (error) {
            console.error('Error clearing chat history:', error);
            toast.error('Failed to clear chat history');
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize session and load history when component mounts or user changes
    useEffect(() => {
        const currentSessionId = getOrCreateSessionId();
        if (currentUser && currentSessionId && !isHistoryLoaded) {
            loadChatHistory(currentSessionId);
            // Load ratings for current session
            loadMessageRatings(currentSessionId);
        } else if (!currentUser) {
            setIsHistoryLoaded(true);
        }
        // Restore draft input
        const draftKey = `gemini_draft_${currentSessionId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) setInputMessage(savedDraft);
    }, [currentUser, isHistoryLoaded]);

    // Persist draft input per session
    useEffect(() => {
        const currentSessionId = sessionId || localStorage.getItem('gemini_session_id');
        if (!currentSessionId) return;
        const draftKey = `gemini_draft_${currentSessionId}`;
        localStorage.setItem(draftKey, inputMessage);
    }, [inputMessage, sessionId]);

    // Listen for clear chat history events from header
    useEffect(() => {
        const handleClearChatHistory = () => {
            clearLocalChatHistory();
        };

        window.addEventListener('clearChatHistory', handleClearChatHistory);
        return () => {
            window.removeEventListener('clearChatHistory', handleClearChatHistory);
        };
    }, []);

    // Keyboard shortcuts: Ctrl+F focus, Esc close
    useEffect(() => {
        if (!isOpen) return;
        
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.key === 'f') {
                event.preventDefault(); // Prevent browser find dialog
                inputRef.current?.focus();
            } else if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Enhanced scroll lock for modal with mobile support
    useEffect(() => {
        if (isOpen) {
            // Store current scroll position
            const scrollY = window.scrollY;
            
            // Apply scroll lock styles
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            
            // Additional mobile-specific fixes
            document.documentElement.style.overflow = 'hidden';
            document.documentElement.style.height = '100%';
            
            // Prevent touch events on the body (iOS specific)
            const preventTouch = (e) => {
                if (e.target.closest('.gemini-chatbox-modal')) return;
                e.preventDefault();
            };
            
            document.addEventListener('touchmove', preventTouch, { passive: false });
            
            return () => {
                // Restore scroll position and styles
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
                
                // Remove touch event listener
                document.removeEventListener('touchmove', preventTouch);
                
                // Restore scroll position
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    // Dispatch custom event when Gemini chatbot opens/closes
    useEffect(() => {
        const event = new CustomEvent('geminiChatboxToggle', { 
            detail: { isOpen } 
        });
        window.dispatchEvent(event);
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    // Autofocus input when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Ensure latest content is visible at bottom when opening and after history loads
    useEffect(() => {
        if (isOpen) {
            // Give layout a tick, then jump to bottom instantly
            setTimeout(() => scrollToBottomInstant(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && isHistoryLoaded) {
            setTimeout(() => scrollToBottomInstant(), 50);
        }
    }, [isHistoryLoaded, isOpen]);

    // Track scroll to bottom detection and compute initial state on open and updates
    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const compute = () => {
            const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            setIsScrolledUp(distanceFromBottom > 80);
        };
        compute();
        const onScroll = () => compute();
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, [isOpen, messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        // Trigger send icon fly animation
        setSendIconAnimating(true);
        setTimeout(() => setSendIconAnimating(false), 800);

        let userMessage = inputMessage.trim();
        if (tone && tone !== 'neutral') {
            userMessage = `[Tone: ${tone}] ${userMessage}`;
        }
        setInputMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }]);
        lastUserMessageRef.current = userMessage;
        setIsLoading(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const currentSessionId = getOrCreateSessionId();
            console.log('Sending message to Gemini:', userMessage, 'Session:', currentSessionId);
            
            // Support cancelling with AbortController
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();
            const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.slice(-10), // Send last 10 messages for context
                    sessionId: currentSessionId,
                    tone: tone // Send current tone setting
                }),
                signal: abortControllerRef.current.signal
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data received:', data);
            console.log('Response content length:', data.response ? data.response.length : 0);
            
            // Validate response structure
            if (data && data.response && typeof data.response === 'string') {
                const trimmedResponse = data.response.trim();
                console.log('Setting message with response length:', trimmedResponse.length);
                setMessages(prev => [...prev, { role: 'assistant', content: trimmedResponse, timestamp: new Date().toISOString() }]);
                if (!isOpen) {
                    setUnreadCount(count => count + 1);
                }

                // Update session ID if provided in response
                if (data.sessionId && data.sessionId !== sessionId) {
                    setSessionId(data.sessionId);
                    localStorage.setItem('gemini_session_id', data.sessionId);
                }

                // Show sent success check briefly
                setSendIconSent(true);
                setTimeout(() => setSendIconSent(false), 600);
            } else {
                console.error('Invalid response structure:', data);
                throw new Error('Invalid response structure from server');
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            let errorMessage = 'Sorry, I\'m having trouble connecting right now. Please try again later.';
            
            if (error.name === 'AbortError') {
                // Do not append error message on cancel
                setIsLoading(false);
                return;
            }

            if (error.message.includes('timeout')) {
                errorMessage = 'Request timed out. The response is taking longer than expected. Please try again.';
            } else if (error.message.includes('HTTP error')) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.message.includes('Invalid response structure')) {
                errorMessage = 'I received an invalid response. Please try again.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: errorMessage,
                timestamp: new Date().toISOString(),
                isError: true,
                originalUserMessage: lastUserMessageRef.current
            }]);
            if (!isOpen) {
                setUnreadCount(count => count + 1);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Message copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            toast.success('Message copied to clipboard!');
        }
    };

    const retryMessage = async (originalMessage, messageIndex) => {
        if (!originalMessage || isLoading) return;
        
        setIsLoading(true);
        
        // Remove the error message
        setMessages(prev => prev.filter((_, index) => index !== messageIndex));
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const currentSessionId = getOrCreateSessionId();
            
            // Support cancelling with AbortController
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();
            
            const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: originalMessage,
                    history: messages.slice(-10), // Send last 10 messages for context
                    sessionId: currentSessionId,
                    tone: tone // Send current tone setting
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data && data.response && typeof data.response === 'string') {
                const trimmedResponse = data.response.trim();
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: trimmedResponse, 
                    timestamp: new Date().toISOString() 
                }]);
                
                // Update session ID if provided in response
                if (data.sessionId && data.sessionId !== sessionId) {
                    setSessionId(data.sessionId);
                    localStorage.setItem('gemini_session_id', data.sessionId);
                }
            } else {
                throw new Error('Invalid response structure from server');
            }
        } catch (error) {
            console.error('Error in retryMessage:', error);
            let errorMessage = 'Sorry, I\'m having trouble connecting right now. Please try again later.';
            
            if (error.name === 'AbortError') {
                setIsLoading(false);
                return;
            }

            if (error.message.includes('timeout')) {
                errorMessage = 'Request timed out. The response is taking longer than expected. Please try again.';
            } else if (error.message.includes('HTTP error')) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.message.includes('Invalid response structure')) {
                errorMessage = 'I received an invalid response. Please try again.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: errorMessage,
                timestamp: new Date().toISOString(),
                isError: true,
                originalUserMessage: originalMessage
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Enhanced features helper functions
    const toggleBookmark = (messageIndex, message) => {
        const bookmarkKey = `${messageIndex}_${message.timestamp}`;
        const isBookmarked = bookmarkedMessages.some(bm => bm.key === bookmarkKey);
        
        let newBookmarks;
        if (isBookmarked) {
            newBookmarks = bookmarkedMessages.filter(bm => bm.key !== bookmarkKey);
            toast.success('Bookmark removed');
        } else {
            newBookmarks = [...bookmarkedMessages, {
                key: bookmarkKey,
                content: message.content,
                timestamp: message.timestamp,
                role: message.role,
                sessionId: sessionId
            }];
            toast.success('Message bookmarked');
        }
        
        setBookmarkedMessages(newBookmarks);
        localStorage.setItem('gemini_bookmarks', JSON.stringify(newBookmarks));
    };

    const rateMessage = async (messageIndex, rating) => {
        if (!currentUser) {
            toast.error('Please log in to rate messages');
            return;
        }

        const message = messages[messageIndex];
        if (!message) return;

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const currentSessionId = getOrCreateSessionId();
            
            const response = await fetch(`${API_BASE_URL}/api/gemini/rate`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: currentSessionId,
                    messageIndex,
                    messageTimestamp: message.timestamp,
                    rating,
                    messageContent: message.content,
                    messageRole: message.role
                })
            });

            if (response.ok) {
                const ratingKey = `${messageIndex}_${message.timestamp}`;
                const newRatings = { ...messageRatings, [ratingKey]: rating };
                setMessageRatings(newRatings);
                localStorage.setItem('gemini_ratings', JSON.stringify(newRatings));
                toast.success(rating === 'up' ? 'Thanks for the feedback!' : 'Feedback recorded');
            } else {
                toast.error('Failed to save rating');
            }
        } catch (error) {
            console.error('Error rating message:', error);
            toast.error('Failed to save rating');
        }
    };

    const shareMessage = async (message) => {
        const shareData = {
            title: 'Gemini AI Response',
            text: message.content,
            url: window.location.href
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                toast.success('Message shared!');
            } catch (err) {
                copyToClipboard(message.content);
            }
        } else {
            copyToClipboard(message.content);
        }
    };

    const loadChatSessions = async () => {
        if (!currentUser) return;
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/gemini/sessions`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                setChatSessions(data.sessions || []);
            } else {
                console.error('Failed to load chat sessions:', response.status);
            }
        } catch (error) {
            console.error('Error loading chat sessions:', error);
        }
    };

    const loadSessionHistory = async (sessionId) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/chat-history/session/${sessionId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.messages) {
                    setMessages(data.data.messages);
                    setSessionId(sessionId);
                    localStorage.setItem('gemini_session_id', sessionId);
                    
                    // Load ratings for this session
                    await loadMessageRatings(sessionId);
                    
                    toast.success('Session loaded');
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
            toast.error('Failed to load session');
        }
    };

    const loadMessageRatings = async (sessionId) => {
        if (!currentUser || !sessionId) return;
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/gemini/ratings/${sessionId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.ratings) {
                    setMessageRatings(data.ratings);
                    localStorage.setItem('gemini_ratings', JSON.stringify(data.ratings));
                }
            }
        } catch (error) {
            console.error('Error loading message ratings:', error);
        }
    };

    const simulateTyping = (text) => {
        setIsTyping(true);
        setTypingText('');
        let index = 0;
        
        const typeInterval = setInterval(() => {
            if (index < text.length) {
                setTypingText(text.substring(0, index + 1));
                index++;
            } else {
                clearInterval(typeInterval);
                setIsTyping(false);
            }
        }, 30);
    };

    const highlightMessage = (bookmarkKey) => {
        // Find the message index by bookmark key
        const messageIndex = messages.findIndex((message, index) => {
            const key = `${index}_${message.timestamp}`;
            return key === bookmarkKey;
        });

        if (messageIndex !== -1) {
            setHighlightedMessage(messageIndex);
            // Scroll to the message
            setTimeout(() => {
                const messageElement = document.querySelector(`[data-message-index="${messageIndex}"]`);
                if (messageElement) {
                    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                setHighlightedMessage(null);
            }, 3000);
        }
    };

    return (
        <>
            {/* Enhanced Floating AI Chat Button */}
            <div className="fixed bottom-20 right-6 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative group w-12 h-12 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 flex items-center justify-center"
                    style={{ 
                        background: `linear-gradient(135deg, #6366f1, #6366f1dd)`,
                        boxShadow: `0 10px 25px #6366f140`
                    }}
                    aria-label="Open AI Chat"
                    title="Chat with Gemini AI Assistant!"
                >
                    {/* Animated background ring */}
                    <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                            border: `3px solid #6366f155`, // semi-transparent color
                        }}
                    ></div>
                    
                    {/* Icon */}
                    {isOpen ? <FaTimes className="w-5 h-5 text-white drop-shadow-lg" /> : <FaComments className="w-5 h-5 text-white drop-shadow-lg" />}
                    {!isOpen && unreadCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white shadow-lg">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                    )}
                    
                    {/* Enhanced Hover Tooltip */}
                    <div className="absolute bottom-full right-0 mb-3 bg-white text-gray-800 text-sm px-4 py-2 rounded-xl shadow-2xl hidden group-hover:block z-10 whitespace-nowrap border border-gray-100 transform -translate-y-1 transition-all duration-200">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🤖</span>
                            <span className="font-medium">Chat with AI Assistant!</span>
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                </button>
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-0 md:items-end md:justify-end gemini-chatbox-modal animate-fadeIn">
                    <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col relative ${isExpanded ? 'w-full max-w-3xl h-[80vh] md:mb-12 md:mr-12' : 'w-full max-w-md h-full max-h-[90vh] md:w-96 md:h-[500px] md:mb-32 md:mr-6 md:max-h-[500px]'} animate-slideUp`}>
                        {/* Header: left icon+title, right controls: modes dropdown, options (kebab), close */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 md:p-4 rounded-t-2xl flex items-center justify-between flex-shrink-0 relative">
                            {/* Left: assistant identity */}
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                <div className="p-1.5 md:p-2 bg-white/10 rounded-lg border border-white/20">
                                    <FaRobot size={16} className="opacity-90" />
                                </div>
                                <div className="leading-tight block max-w-full">
                                    <div className="text-xs md:text-sm font-semibold truncate">
                                        Gemini AI
                                    </div>
                                    <div className="text-[10px] md:text-xs text-white/80 truncate">
                                        Your Smart Real Estate Assistant
                                    </div>
                                </div>
                            </div>

                            {/* Right controls: modes dropdown + kebab menu + close */}
                            <div className="flex items-center gap-1 relative flex-shrink-0">
                                {/* Modes dropdown */}
                                <select
                                    value={tone}
                                    onChange={(e) => { setTone(e.target.value); localStorage.setItem('gemini_tone', e.target.value); }}
                                    className="text-white/90 bg-white/10 hover:bg-white/20 border border-white/30 text-[10px] md:text-xs px-2 py-1 rounded outline-none max-w-[100px] md:max-w-[120px]"
                                    title="Response Tone"
                                    aria-label="Response Tone"
                                >
                                    <option className="text-gray-800" value="neutral">Neutral</option>
                                    <option className="text-gray-800" value="friendly">Friendly</option>
                                    <option className="text-gray-800" value="formal">Formal</option>
                                    <option className="text-gray-800" value="concise">Concise</option>
                                </select>
                                
                                <button
                                    onClick={() => setIsHeaderMenuOpen(open => !open)}
                                    className="inline-flex text-white/90 hover:text-white text-xs px-2 py-1 rounded border border-white/30 hover:border-white transition-colors"
                                    title="More options"
                                    aria-label="More options"
                                >
                                    ⋯
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-white hover:text-gray-200 transition-colors"
                                    aria-label="Close"
                                >
                                    <FaTimes size={16} />
                                </button>

                                {/* Dropdown menu */}
                                {isHeaderMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 bg-white text-gray-800 rounded shadow-lg border border-gray-200 w-48 z-50">
                                        <ul className="py-1 text-sm">
                                            {/* Quick Actions */}
                                            <li>
                                                <button
                                                    onClick={() => { setShowQuickActions(true); setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <FaLightbulb size={12} className="text-yellow-500" />
                                                    Quick Actions
                                                </button>
                                            </li>
                                            
                                            {/* Bookmarks */}
                                            <li>
                                                <button
                                                    onClick={() => { setShowBookmarks(true); loadChatSessions(); setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <FaBookmark size={12} className="text-yellow-500" />
                                                    Bookmarks
                                                </button>
                                            </li>
                                            
                                            {/* Chat History */}
                                            <li>
                                                <button
                                                    onClick={() => { setShowHistory(true); loadChatSessions(); setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <FaHistory size={12} className="text-blue-500" />
                                                    Chat History
                                                </button>
                                            </li>
                                            
                                            <li className="border-t border-gray-200 my-1"></li>
                                            
                                            {/* Expand/Collapse only on desktop */}
                                            <li className="hidden md:block">
                                                <button
                                                    onClick={() => { setIsExpanded(expanded => !expanded); setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                                >
                                                    {isExpanded ? 'Collapse' : 'Expand'}
                                                </button>
                                            </li>
                                            
                                            {/* Export */}
                                            <li>
                                                <button
                                                    onClick={() => {
                                                        try {
                                                            const lines = messages.map(m => `${m.role === 'user' ? 'You' : 'Gemini'}: ${m.content}`);
                                                            const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `gemini_chat_${new Date().toISOString().split('T')[0]}.txt`;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            document.body.removeChild(a);
                                                            URL.revokeObjectURL(url);
                                                            setIsHeaderMenuOpen(false);
                                                        } catch (e) {
                                                            toast.error('Failed to export transcript');
                                                        }
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <FaDownload size={12} className="text-green-500" />
                                                    Export
                                                </button>
                                            </li>
                                            
                                            {/* Features */}
                                            <li>
                                                <button
                                                    onClick={() => { setShowFeatures(true); setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <FaCog size={12} className="text-gray-500" />
                                                    Features
                                                </button>
                                            </li>
                                            
                                            {/* Clear */}
                                            {(messages && (messages.length > 1 || messages.some(m => m.role === 'user'))) && (
                                                <li>
                                                    <button
                                                        onClick={() => { setIsHeaderMenuOpen(false); setShowConfirmClear(true); }}
                                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
                                                    >
                                                        Clear Chat
                                                    </button>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    data-message-index={index}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${
                                        highlightedMessage === index ? 'animate-pulse' : ''
                                    }`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl break-words relative group ${
                                            message.role === 'user'
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                                : message.isError 
                                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                                    : 'bg-gray-100 text-gray-800'
                                        } ${
                                            highlightedMessage === index 
                                                ? 'ring-4 ring-yellow-400 ring-opacity-50 shadow-lg transform scale-105' 
                                                : ''
                                        } transition-all duration-300`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{formatLinksInText(message.content, message.role === 'user')}</p>
                                        
                                        {/* Message footer with timestamp and actions */}
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/20">
                                            {message.timestamp && (
                                                <div className={`${message.role === 'user' ? 'text-white/80' : message.isError ? 'text-red-600' : 'text-gray-500'} text-[10px]`}>
                                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                            
                                            {/* Action buttons */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                {/* Copy icon for all messages */}
                                                <button
                                                    onClick={() => copyToClipboard(message.content)}
                                                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-all duration-200"
                                                    title="Copy message"
                                                    aria-label="Copy message"
                                                >
                                                    <FaCopy size={10} />
                                                </button>
                                                
                                                {/* Bookmark button for assistant messages */}
                                                {message.role === 'assistant' && !message.isError && (
                                                    <button
                                                        onClick={() => toggleBookmark(index, message)}
                                                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-all duration-200"
                                                        title="Bookmark message"
                                                        aria-label="Bookmark message"
                                                    >
                                                        {bookmarkedMessages.some(bm => bm.key === `${index}_${message.timestamp}`) ? 
                                                            <FaBookmarkSolid size={10} className="text-yellow-500" /> : 
                                                            <FaRegBookmark size={10} />
                                                        }
                                                    </button>
                                                )}
                                                
                                                {/* Share button for assistant messages */}
                                                {message.role === 'assistant' && !message.isError && (
                                                    <button
                                                        onClick={() => shareMessage(message)}
                                                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-all duration-200"
                                                        title="Share message"
                                                        aria-label="Share message"
                                                    >
                                                        <FaShare size={10} />
                                                    </button>
                                                )}
                                                
                                                {/* Rating buttons for assistant messages */}
                                                {message.role === 'assistant' && !message.isError && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => rateMessage(index, 'up')}
                                                            className={`p-1 rounded transition-all duration-200 ${
                                                                messageRatings[`${index}_${message.timestamp}`] === 'up' 
                                                                    ? 'text-green-600 bg-green-100' 
                                                                    : 'text-gray-500 hover:text-green-600 hover:bg-green-100'
                                                            }`}
                                                            title="Good response"
                                                            aria-label="Good response"
                                                        >
                                                            <FaThumbsUp size={10} />
                                                        </button>
                                                        <button
                                                            onClick={() => rateMessage(index, 'down')}
                                                            className={`p-1 rounded transition-all duration-200 ${
                                                                messageRatings[`${index}_${message.timestamp}`] === 'down' 
                                                                    ? 'text-red-600 bg-red-100' 
                                                                    : 'text-gray-500 hover:text-red-600 hover:bg-red-100'
                                                            }`}
                                                            title="Poor response"
                                                            aria-label="Poor response"
                                                        >
                                                            <FaThumbsDown size={10} />
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {/* Retry button for failed messages */}
                                                {message.isError && message.originalUserMessage && (
                                                    <button
                                                        onClick={() => retryMessage(message.originalUserMessage, index)}
                                                        disabled={isLoading}
                                                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-200 rounded transition-all duration-200 disabled:opacity-50"
                                                        title="Retry message"
                                                        aria-label="Retry message"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            </div>
                                            <span className="text-sm text-gray-600 font-medium">Gemini is thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                            {/* scroll button moved to container-level absolute positioning */}
                        </div>

                        {/* Floating Scroll to bottom button - container-level absolute */}
                        {isScrolledUp && (
                            <div className="absolute bottom-20 right-4 z-30">
                                <button
                                    onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-3 shadow-xl transition-all duration-200 hover:scale-110 relative transform hover:shadow-2xl"
                                    title="Jump to latest"
                                    aria-label="Jump to latest"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="transform">
                                        <path d="M12 16l-6-6h12l-6 6z" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Quick suggestion prompts - always visible at bottom */}
                        {messages && (
                            <div className="px-4 pb-2 pt-2 border-t border-gray-100 flex-shrink-0">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        'Show trending properties',
                                        'How do I schedule a viewing?',
                                        'What are popular areas near me?',
                                        'Explain mortgage basics'
                                    ].map((prompt) => (
                                        <button
                                            key={prompt}
                                            onClick={() => { setInputMessage(prompt); setTimeout(() => handleSubmit(new Event('submit')), 0); }}
                                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Enhanced Features modal */}
                        {showFeatures && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                                <div className="bg-white rounded-xl shadow-xl p-5 w-96 max-w-full max-h-[80vh] overflow-y-auto">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <FaRobot className="text-blue-500" />
                                        Gemini AI Features
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <h5 className="font-medium text-gray-800 mb-2">💬 Chat Features</h5>
                                            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                                                <li>Real-time conversation with AI</li>
                                                <li>Multiple response tones (Neutral, Friendly, Formal, Concise)</li>
                                                <li>Session-based chat history</li>
                                                <li>Export conversations to .txt</li>
                                                <li>Retry failed responses</li>
                                            </ul>
                                        </div>
                                        
                                        <div>
                                            <h5 className="font-medium text-gray-800 mb-2">🔖 Message Management</h5>
                                            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                                                <li>Bookmark important responses</li>
                                                <li>Rate responses (thumbs up/down)</li>
                                                <li>Share messages via native sharing</li>
                                                <li>Copy any message to clipboard</li>
                                            </ul>
                                        </div>
                                        
                                        <div>
                                            <h5 className="font-medium text-gray-800 mb-2">⚡ Quick Actions</h5>
                                            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                                                <li>Property search assistance</li>
                                                <li>Market analysis guidance</li>
                                                <li>Home buying process help</li>
                                                <li>Investment advice</li>
                                                <li>Legal information</li>
                                                <li>Property management tips</li>
                                            </ul>
                                        </div>
                                        
                                        <div>
                                            <h5 className="font-medium text-gray-800 mb-2">📱 User Experience</h5>
                                            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                                                <li>Mobile-friendly responsive design</li>
                                                <li>Keyboard shortcuts (Ctrl+F, Esc)</li>
                                                <li>Auto-scroll to latest messages</li>
                                                <li>Typing indicators</li>
                                                <li>Unread message notifications</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <button onClick={() => setShowFeatures(false)} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Close</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-4 border-t border-gray-200 flex-shrink-0">
                            <form onSubmit={handleSubmit} className="flex space-x-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask me anything about real estate..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    disabled={isLoading}
                                />
                                {isLoading ? (
                                    <button
                                        type="button"
                                        onClick={() => { abortControllerRef.current?.abort(); toast.info('Generation stopped'); }}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 rounded-full h-10 text-xs font-medium shadow"
                                        title="Stop generating"
                                        aria-label="Stop generating"
                                    >
                                        Stop
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={!inputMessage.trim()}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-full hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 flex-shrink-0 flex items-center justify-center w-10 h-10 group hover:shadow-xl active:scale-95"
                                    >
                                        <div className="relative">
                                            {sendIconSent ? (
                                                <FaCheck className="text-white send-icon animate-sent" size={16} />
                                            ) : (
                                                <FaPaperPlane className={`text-white send-icon ${sendIconAnimating ? 'animate-fly' : ''} group-hover:scale-110 transition-all duration-300`} size={16} />
                                            )}
                                        </div>
                                    </button>
                                )}
                            </form>
                        </div>
                        {/* Quick Actions Modal */}
                        {showQuickActions && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                                <div className="bg-white rounded-xl shadow-xl p-5 w-96 max-w-full">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <FaLightbulb className="text-yellow-500" />
                                        Quick Actions
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { icon: '🏠', text: 'Property Search', prompt: 'Help me find properties in my area' },
                                            { icon: '💰', text: 'Market Analysis', prompt: 'Analyze the real estate market trends' },
                                            { icon: '📋', text: 'Buying Guide', prompt: 'Guide me through the home buying process' },
                                            { icon: '📊', text: 'Investment Tips', prompt: 'Give me real estate investment advice' },
                                            { icon: '⚖️', text: 'Legal Info', prompt: 'Explain real estate legal requirements' },
                                            { icon: '🔧', text: 'Property Management', prompt: 'Help with property management tips' }
                                        ].map((action, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setInputMessage(action.prompt);
                                                    setShowQuickActions(false);
                                                    setTimeout(() => handleSubmit(new Event('submit')), 0);
                                                }}
                                                className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
                                            >
                                                <div className="text-lg mb-1">{action.icon}</div>
                                                <div className="text-sm font-medium text-gray-800">{action.text}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <button onClick={() => setShowQuickActions(false)} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Close</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bookmarks Modal */}
                        {showBookmarks && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                                <div className="bg-white rounded-xl shadow-xl p-5 w-96 max-w-full max-h-[80vh] overflow-y-auto">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <FaBookmark className="text-yellow-500" />
                                        Bookmarked Messages
                                    </h4>
                                    {bookmarkedMessages.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No bookmarked messages yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {bookmarkedMessages.map((bookmark, idx) => (
                                                <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        {new Date(bookmark.timestamp).toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-gray-800 mb-2 line-clamp-3">
                                                        {bookmark.content}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                highlightMessage(bookmark.key);
                                                                setShowBookmarks(false);
                                                            }}
                                                            className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                                                        >
                                                            Go to Message
                                                        </button>
                                                        <button
                                                            onClick={() => copyToClipboard(bookmark.content)}
                                                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                                                        >
                                                            Copy
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const newBookmarks = bookmarkedMessages.filter((_, i) => i !== idx);
                                                                setBookmarkedMessages(newBookmarks);
                                                                localStorage.setItem('gemini_bookmarks', JSON.stringify(newBookmarks));
                                                            }}
                                                            className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex justify-end mt-4">
                                        <button onClick={() => setShowBookmarks(false)} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Close</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chat History Modal */}
                        {showHistory && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                                <div className="bg-white rounded-xl shadow-xl p-5 w-96 max-w-full max-h-[80vh] overflow-y-auto">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <FaHistory className="text-blue-500" />
                                        Chat History
                                    </h4>
                                    {chatSessions.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No chat history found</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {chatSessions.map((session, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        loadSessionHistory(session.sessionId);
                                                        setShowHistory(false);
                                                    }}
                                                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
                                                >
                                                    <div className="text-sm font-medium text-gray-800">
                                                        Session {idx + 1}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        {new Date(session.lastMessageAt).toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {session.messageCount} messages
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex justify-end mt-4">
                                        <button onClick={() => setShowHistory(false)} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Close</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Clear confirmation modal */}
                        {showConfirmClear && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                                <div className="bg-white rounded-xl shadow-xl p-5 w-80">
                                    <h4 className="font-semibold mb-2">Clear chat?</h4>
                                    <p className="text-sm text-gray-600 mb-4">This will remove your conversation here. This action cannot be undone.</p>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowConfirmClear(false)} className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700">Cancel</button>
                                        <button onClick={() => { setShowConfirmClear(false); handleClearChatHistory(); }} className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700">Clear</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Animation styles */}
            <style>
                {`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideUp {
                  from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.98);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }
                .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
                .animate-slideUp { animation: slideUp 0.28s ease-out; }
                @keyframes sendIconFly {
                  0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 1;
                  }
                  20% {
                    transform: translate(-3px, -6px) scale(1.05);
                    opacity: 0.9;
                  }
                  40% {
                    transform: translate(-8px, -12px) scale(1.1);
                    opacity: 0.8;
                  }
                  60% {
                    transform: translate(8px, -18px) scale(1.15);
                    opacity: 0.9;
                  }
                  80% {
                    transform: translate(15px, -20px) scale(1.2);
                    opacity: 0.95;
                  }
                  100% {
                    transform: translate(0, 0) scale(1);
                    opacity: 1;
                  }
                }
                .send-icon.animate-fly {
                  animation: sendIconFly 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                @keyframes sentSuccess {
                  0% {
                    transform: scale(0.8);
                    opacity: 0;
                  }
                  50% {
                    transform: scale(1.2);
                    opacity: 1;
                  }
                  100% {
                    transform: scale(1);
                    opacity: 1;
                  }
                }
                .send-icon.animate-sent {
                  animation: sentSuccess 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                `}
            </style>
        </>
    );
};

export default GeminiChatbox;

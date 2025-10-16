import React, { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaRobot, FaCopy, FaCheck, FaDownload, FaUpload, FaCog, FaLightbulb, FaHistory, FaBookmark, FaShare, FaThumbsUp, FaThumbsDown, FaRegBookmark, FaBookmark as FaBookmarkSolid, FaMicrophone, FaStop, FaImage, FaFileAlt, FaMagic, FaSparkles, FaStar, FaMoon, FaSun, FaPalette, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress, FaSearch, FaFilter, FaSort, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { formatLinksInText } from '../utils/linkFormatter.jsx';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

const GeminiChatbox = ({ forceModalOpen = false, onModalClose = null }) => {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(forceModalOpen);
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
    const headerMenuButtonRef = useRef(null);
    const headerMenuRef = useRef(null);
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
    const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
    const [openHistoryMenuSessionId, setOpenHistoryMenuSessionId] = useState(null);
    
    // Prompt limit for non-logged-in users
    const [promptCount, setPromptCount] = useState(() => {
        const saved = localStorage.getItem('gemini_prompt_count');
        return saved ? parseInt(saved) : 0;
    });
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
    const [deleteTargetSessionId, setDeleteTargetSessionId] = useState(null);
    const [showDeleteSingleModal, setShowDeleteSingleModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameTargetSessionId, setRenameTargetSessionId] = useState(null);
    const [renameInput, setRenameInput] = useState('');
    // Floating date label like WhatsApp
    const [floatingDateLabel, setFloatingDateLabel] = useState('');
    const [showFloatingDate, setShowFloatingDate] = useState(false);
    const floatingHideTimeoutRef = useRef(null);
    
    // Enhanced UI and Feature States
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('gemini_dark_mode') === 'true');
    const [showVoiceInput, setShowVoiceInput] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [showSmartSuggestions, setShowSmartSuggestions] = useState(true);
    const [smartSuggestions, setSmartSuggestions] = useState([
        "Find properties under ₹50L in Bangalore",
        "What are the best areas for investment?",
        "Help me understand home loan process",
        "Compare 2BHK vs 3BHK apartments"
    ]);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showSearchInChat, setShowSearchInChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMessages, setFilteredMessages] = useState([]);
    const [showMessageFilters, setShowMessageFilters] = useState(false);
    const [messageFilter, setMessageFilter] = useState('all'); // all, user, assistant, bookmarked
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
    const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('gemini_theme') || 'blue');
    const [showTypingIndicator, setShowTypingIndicator] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [messageReactions, setMessageReactions] = useState({});
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [reactionTargetMessage, setReactionTargetMessage] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const scrollToBottomInstant = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    // Helpers for date divider and labels
    const isSameDay = (a, b) => {
        const da = new Date(a);
        const db = new Date(b);
        return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
    };
    const getDateLabel = (iso) => {
        const d = new Date(iso);
        const today = new Date();
        const yest = new Date();
        yest.setDate(today.getDate() - 1);
        if (isSameDay(d, today)) return 'Today';
        if (isSameDay(d, yest)) return 'Yesterday';
        return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
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
        // Clear ratings for new session
        setMessageRatings({});
        localStorage.setItem('gemini_ratings', JSON.stringify({}));
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
            const currentSessionId = getOrCreateSessionId();
            const response = await fetch(`${API_BASE_URL}/api/chat-history/session/${currentSessionId}/clear`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                toast.success('Chat cleared');
                clearLocalChatHistory();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to clear chat');
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

    // Reset prompt count when user logs in
    useEffect(() => {
        if (currentUser) {
            setPromptCount(0);
            localStorage.removeItem('gemini_prompt_count');
        }
    }, [currentUser]);

    // Handle force modal opening
    useEffect(() => {
        if (forceModalOpen) {
            setIsOpen(true);
        }
    }, [forceModalOpen]);


    // Get appropriate AI URL based on user role
    const getAIUrl = () => {
        if (!currentUser) {
            return '/ai';
        } else if (currentUser.role === 'admin' || currentUser.role === 'rootadmin') {
            return '/admin/ai';
        } else {
            return '/user/ai';
        }
    };

    // Handle modal open (floating button - no URL change)
    const handleOpen = () => {
        setIsOpen(true);
        // Don't navigate - just open modal on current page
    };

    // Handle modal close with callback
    const handleClose = () => {
        setIsOpen(false);
        
        if (onModalClose) {
            onModalClose();
        }
    };

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

    // Close header menu when clicking outside of menu or button
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!isHeaderMenuOpen) return;
            const clickedInsideButton = headerMenuButtonRef.current && headerMenuButtonRef.current.contains(event.target);
            const clickedInsideMenu = headerMenuRef.current && headerMenuRef.current.contains(event.target);
            if (!clickedInsideButton && !clickedInsideMenu) {
                setIsHeaderMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isHeaderMenuOpen]);

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

            // Floating date label: find the first fully visible message and use its date
            const children = Array.from(el.querySelectorAll('[data-message-index]'));
            let currentIndex = 0;
            for (let i = 0; i < children.length; i++) {
                const node = children[i];
                const top = node.offsetTop;
                const bottom = top + node.offsetHeight;
                if (bottom >= el.scrollTop + 8) { // 8px tolerance
                    currentIndex = Number(node.getAttribute('data-message-index')) || 0;
                    break;
                }
            }
            const msg = messages[currentIndex];
            if (msg && msg.timestamp) {
                const label = getDateLabel(msg.timestamp);
                setFloatingDateLabel(label);
                // Visibility is controlled by scroll activity; compute only updates label
            }
        };
        compute();
        const onScroll = () => {
            compute();
            // Show floating date while actively scrolling when not at bottom, hide after inactivity
            const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (distanceFromBottom > 80) {
                setShowFloatingDate(true);
                if (floatingHideTimeoutRef.current) clearTimeout(floatingHideTimeoutRef.current);
                floatingHideTimeoutRef.current = setTimeout(() => {
                    setShowFloatingDate(false);
                }, 1000);
            } else {
                setShowFloatingDate(false);
            }
        };
        el.addEventListener('scroll', onScroll);
        return () => {
            el.removeEventListener('scroll', onScroll);
            if (floatingHideTimeoutRef.current) clearTimeout(floatingHideTimeoutRef.current);
        };
    }, [isOpen, messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        // Check prompt limit for non-logged-in users
        if (!currentUser && promptCount >= 5) {
            setShowSignInModal(true);
            return;
        }

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

                // Increment prompt count for non-logged-in users
                if (!currentUser) {
                    const newCount = promptCount + 1;
                    setPromptCount(newCount);
                    localStorage.setItem('gemini_prompt_count', newCount.toString());
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

        // Check prompt limit for non-logged-in users
        if (!currentUser && promptCount >= 5) {
            setShowSignInModal(true);
            return;
        }
        
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

                // Increment prompt count for non-logged-in users
                if (!currentUser) {
                    const newCount = promptCount + 1;
                    setPromptCount(newCount);
                    localStorage.setItem('gemini_prompt_count', newCount.toString());
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
        // Check if user is logged in
        if (!currentUser) {
            toast.error('Please sign in to bookmark messages');
            return;
        }

        const currentSessionId = getOrCreateSessionId();
        const bookmarkKey = `${currentSessionId}_${messageIndex}_${message.timestamp}`;
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
                sessionId: currentSessionId
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
                    // Ensure the first message is always the default welcome message
                    const defaultMessage = {
                        role: 'assistant',
                        content: 'Hello! I\'m your AI assistant powered by Gemini. How can I help you with your real estate needs today?',
                        timestamp: new Date().toISOString()
                    };
                    
                    let sessionMessages = data.data.messages;
                    if (sessionMessages.length === 0 || sessionMessages[0].content !== defaultMessage.content) {
                        sessionMessages = [defaultMessage, ...sessionMessages];
                    }
                    
                    setMessages(sessionMessages);
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

    const createNewSession = async () => {
        if (!currentUser) {
            toast.error('Please log in to create new sessions');
            return;
        }

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            
            // Always save the current session to history before creating new one
            const currentSessionId = getOrCreateSessionId();
            if (messages.length > 0) {
                // Save current session to history
                const saveResponse = await fetch(`${API_BASE_URL}/api/chat-history/session/${currentSessionId}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: messages,
                        totalMessages: messages.length
                    })
                });
                
                if (!saveResponse.ok) {
                    console.error('Failed to save current session');
                }
            }

            // Now create a new session
            const response = await fetch(`${API_BASE_URL}/api/gemini/sessions`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.sessionId) {
                    // Set the new session ID
                    setSessionId(data.sessionId);
                    localStorage.setItem('gemini_session_id', data.sessionId);
                    
                    // Reset messages to default welcome message
                    const defaultMessage = {
                        role: 'assistant',
                        content: 'Hello! I\'m your AI assistant powered by Gemini. How can I help you with your real estate needs today?',
                        timestamp: new Date().toISOString()
                    };
                    setMessages([defaultMessage]);
                    
                    // Clear ratings for new session
                    setMessageRatings({});
                    localStorage.setItem('gemini_ratings', JSON.stringify({}));
                    
                    // Refresh chat sessions
                    await loadChatSessions();
                    
                    toast.success('New chat session created');
                }
            } else {
                toast.error('Failed to create new session');
            }
        } catch (error) {
            console.error('Error creating new session:', error);
            toast.error('Failed to create new session');
        }
    };

    const deleteSession = async (sessionId) => {
        if (!currentUser) {
            toast.error('Please log in to delete sessions');
            return;
        }

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/gemini/sessions/${sessionId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Refresh chat sessions
                    await loadChatSessions();
                    toast.success('Session deleted successfully');
                }
            } else {
                toast.error('Failed to delete session');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            toast.error('Failed to delete session');
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
        // Find the message index by bookmark key (new format includes session ID)
        const messageIndex = messages.findIndex((message, index) => {
            const currentSessionId = getOrCreateSessionId();
            const key = `${currentSessionId}_${index}_${message.timestamp}`;
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

    // Enhanced Features Functions
    const startVoiceRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (event) => {
                chunks.push(event.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/wav' });
                // Here you would typically send the audio to a speech-to-text service
                toast.info('Voice input feature coming soon!');
                setAudioChunks([]);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setAudioChunks(chunks);
        } catch (error) {
            toast.error('Microphone access denied');
        }
    };

    const stopVoiceRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        const validFiles = files.filter(file => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
            return file.size <= maxSize && validTypes.includes(file.type);
        });

        if (validFiles.length !== files.length) {
            toast.error('Some files were rejected. Only images, PDFs, and text files under 10MB are allowed.');
        }

        setUploadedFiles(prev => [...prev, ...validFiles]);
        toast.success(`${validFiles.length} file(s) uploaded successfully`);
    };

    const removeUploadedFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        localStorage.setItem('gemini_dark_mode', newDarkMode.toString());
    };

    const handleSmartSuggestion = (suggestion) => {
        setInputMessage(suggestion);
        setShowSmartSuggestions(false);
        inputRef.current?.focus();
    };

    const searchInMessages = (query) => {
        if (!query.trim()) {
            setFilteredMessages([]);
            return;
        }

        const filtered = messages.filter(message => 
            message.content.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredMessages(filtered);
    };

    const filterMessages = (filter) => {
        setMessageFilter(filter);
        let filtered = messages;

        switch (filter) {
            case 'user':
                filtered = messages.filter(m => m.role === 'user');
                break;
            case 'assistant':
                filtered = messages.filter(m => m.role === 'assistant');
                break;
            case 'bookmarked':
                filtered = messages.filter((message, index) => {
                    const currentSessionId = getOrCreateSessionId();
                    const key = `${currentSessionId}_${index}_${message.timestamp}`;
                    return bookmarkedMessages.some(bm => bm.key === bookmarkKey);
                });
                break;
            default:
                filtered = messages;
        }

        setFilteredMessages(filtered);
    };

    const addReaction = (messageIndex, reaction) => {
        setMessageReactions(prev => ({
            ...prev,
            [`${messageIndex}_${messages[messageIndex]?.timestamp}`]: reaction
        }));
        setShowReactionPicker(false);
        setReactionTargetMessage(null);
    };

    const getThemeColors = () => {
        const themes = {
            blue: {
                primary: 'from-blue-600 to-purple-600',
                secondary: 'bg-blue-50',
                accent: 'text-blue-600',
                border: 'border-blue-200'
            },
            green: {
                primary: 'from-green-600 to-emerald-600',
                secondary: 'bg-green-50',
                accent: 'text-green-600',
                border: 'border-green-200'
            },
            purple: {
                primary: 'from-purple-600 to-pink-600',
                secondary: 'bg-purple-50',
                accent: 'text-purple-600',
                border: 'border-purple-200'
            },
            orange: {
                primary: 'from-orange-600 to-red-600',
                secondary: 'bg-orange-50',
                accent: 'text-orange-600',
                border: 'border-orange-200'
            }
        };
        return themes[selectedTheme] || themes.blue;
    };

    const themeColors = getThemeColors();

    return (
        <>
            {/* Enhanced Floating AI Chat Button */}
            <div className="fixed bottom-20 right-6 z-50">
                <div className="relative">
                    {/* Quick Action Buttons */}
                    {!isOpen && (
                        <div className="absolute bottom-16 right-0 flex flex-col gap-2 opacity-0 hover:opacity-100 transition-all duration-300">
                            <button
                                onClick={() => setShowVoiceInput(true)}
                                className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                title="Voice Input"
                            >
                                <FaMicrophone size={14} />
                            </button>
                            <button
                                onClick={() => setShowFileUpload(true)}
                                className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                title="Upload File"
                            >
                                <FaUpload size={14} />
                            </button>
                        </div>
                    )}
                    
                    <button
                        onClick={isOpen ? handleClose : handleOpen}
                        className={`relative group w-14 h-14 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 flex items-center justify-center ${
                            isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : `bg-gradient-to-br ${themeColors.primary}`
                        }`}
                        style={{ 
                            boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.3)' : `0 10px 25px ${selectedTheme === 'blue' ? '#6366f140' : '#10b98140'}`
                        }}
                        aria-label="Open AI Chat"
                        title="Chat with Gemini AI Assistant!"
                    >
                        {/* Animated background ring */}
                        <div
                            className={`absolute inset-0 rounded-full animate-ping ${
                                isDarkMode ? 'border-gray-600' : 'border-blue-400'
                            }`}
                            style={{
                                border: `3px solid ${isDarkMode ? '#4b5563' : '#60a5fa'}`,
                            }}
                        ></div>
                        
                        {/* Icon with sparkle effect */}
                        <div className="relative">
                            {isOpen ? (
                                <FaTimes className="w-6 h-6 text-white drop-shadow-lg" />
                            ) : (
                                <div className="relative">
                                    <FaComments className="w-6 h-6 text-white drop-shadow-lg" />
                                    <FaSparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-pulse" />
                                </div>
                            )}
                        </div>
                        
                        {!isOpen && unreadCount > 0 && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] px-1 flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                        )}
                        
                        {/* Enhanced Hover Tooltip */}
                        <div className={`absolute bottom-full right-0 mb-3 ${
                            isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-100'
                        } text-sm px-4 py-2 rounded-xl shadow-2xl hidden group-hover:block z-10 whitespace-nowrap border transform -translate-y-1 transition-all duration-200`}>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🤖</span>
                                <span className="font-medium">Chat with AI Assistant!</span>
                            </div>
                            {/* Tooltip arrow */}
                            <div className={`absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                                isDarkMode ? 'border-t-gray-800' : 'border-t-white'
                            }`}></div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed inset-0 ${isDarkMode ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-0 md:items-end md:justify-end gemini-chatbox-modal animate-fadeIn`}>
                    <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl border flex flex-col relative ${
                        isFullscreen ? 'w-full h-full max-w-none max-h-none rounded-none' :
                        isExpanded ? 'w-full max-w-4xl h-[85vh] md:mb-12 md:mr-12' : 
                        'w-full max-w-md h-full max-h-[90vh] md:w-96 md:h-[500px] md:mb-32 md:mr-6 md:max-h-[500px]'
                    } animate-slideUp`}>
                        {/* Enhanced Header */}
                        <div className={`bg-gradient-to-r ${themeColors.primary} text-white p-3 md:p-4 ${isFullscreen ? 'rounded-none' : 'rounded-t-2xl'} flex items-center justify-between flex-shrink-0 relative`}>
                            {/* Left: assistant identity with status */}
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                <div className="relative">
                                    <div className="p-1.5 md:p-2 bg-white/10 rounded-lg border border-white/20">
                                        <FaRobot size={16} className="opacity-90" />
                                    </div>
                                    {/* Online status indicator */}
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="leading-tight block max-w-full">
                                    <div className="text-xs md:text-sm font-semibold truncate flex items-center gap-2">
                                        Gemini AI
                                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">PRO</span>
                                    </div>
                                    <div className="text-[10px] md:text-xs text-white/80 truncate flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        Online • Real Estate Expert
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Right controls */}
                            <div className="flex items-center gap-1 relative flex-shrink-0">
                                {/* Theme selector */}
                                <div className="relative group">
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className="text-white/90 hover:text-white p-1.5 rounded border border-white/30 hover:border-white transition-colors"
                                        title="Themes & Settings"
                                    >
                                        <FaPalette size={12} />
                                    </button>
                                </div>

                                {/* Dark mode toggle */}
                                <button
                                    onClick={toggleDarkMode}
                                    className="text-white/90 hover:text-white p-1.5 rounded border border-white/30 hover:border-white transition-colors"
                                    title={isDarkMode ? "Light Mode" : "Dark Mode"}
                                >
                                    {isDarkMode ? <FaSun size={12} /> : <FaMoon size={12} />}
                                </button>

                                {/* Search in chat */}
                                <button
                                    onClick={() => setShowSearchInChat(!showSearchInChat)}
                                    className="text-white/90 hover:text-white p-1.5 rounded border border-white/30 hover:border-white transition-colors"
                                    title="Search in Chat"
                                >
                                    <FaSearch size={12} />
                                </button>

                                {/* Fullscreen toggle */}
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="text-white/90 hover:text-white p-1.5 rounded border border-white/30 hover:border-white transition-colors"
                                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                >
                                    {isFullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
                                </button>

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
                                    ref={headerMenuButtonRef}
                                    onClick={() => setIsHeaderMenuOpen(open => !open)}
                                    className="inline-flex text-white/90 hover:text-white text-xs px-2 py-1 rounded border border-white/30 hover:border-white transition-colors"
                                    title="More options"
                                    aria-label="More options"
                                >
                                    ⋯
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="text-white hover:text-gray-200 transition-colors"
                                    aria-label="Close"
                                >
                                    <FaTimes size={16} />
                                </button>

                                {/* Dropdown menu */}
                                {isHeaderMenuOpen && (
                                    <div ref={headerMenuRef} className="absolute right-0 top-full mt-2 bg-white text-gray-800 rounded shadow-lg border border-gray-200 w-48 z-50">
                                        <ul className="py-1 text-sm">
                                            {/* New Chat */}
                                            <li>
                                                <button
                                                    onClick={() => { createNewSession(); setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <FaComments size={12} className="text-blue-500" />
                                                    New Chat
                                                </button>
                                            </li>
                                            
                                            <li className="border-t border-gray-200 my-1"></li>
                                            
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
                                            
                                            {/* Bookmarks - Only for logged-in users */}
                                            {currentUser && (
                                                <li>
                                                    <button
                                                        onClick={() => { setShowBookmarks(true); loadChatSessions(); setIsHeaderMenuOpen(false); }}
                                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                                    >
                                                        <FaBookmark size={12} className="text-yellow-500" />
                                                        Bookmarks
                                                    </button>
                                                </li>
                                            )}
                                            
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
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h7v2H6v5H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z"/></svg>
                                                    {isExpanded ? 'Collapse' : 'Expand'}
                                                </button>
                                            </li>
                                            
                                            {/* Share current chat */}
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
                                                            toast.error('Failed to share chat');
                                                        }
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <FaShare size={12} className="text-green-500" />
                                                    Share Chat
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
                                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                                        Clear Chat
                                                    </button>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages with date dividers */}
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 relative">
                            {/* Floating Date Indicator (sticky below header) */}
                            {showFloatingDate && floatingDateLabel && (
                                <div className={`sticky top-0 left-0 right-0 z-30 pointer-events-none`}>
                                    <div className="w-full flex justify-center py-2">
                                        <div className="bg-blue-600 text-white text-xs px-4 py-2 rounded-full shadow-lg border-2 border-white">
                                            {floatingDateLabel}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {messages.map((message, index) => {
                                const showDivider = index === 0 || !isSameDay(messages[index - 1]?.timestamp, message.timestamp);
                                const dividerLabel = showDivider ? getDateLabel(message.timestamp) : '';
                                return (
                                    <React.Fragment key={index}>
                                        {showDivider && (
                                            <div className="flex items-center my-2">
                                                <div className="flex-1 h-px bg-gray-200" />
                                                <span className="mx-3 text-xs text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                                    {dividerLabel}
                                                </span>
                                                <div className="flex-1 h-px bg-gray-200" />
                                            </div>
                                        )}
                                        <div
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
                                                        {message.role === 'assistant' && !message.isError && currentUser && (
                                                            <button
                                                                onClick={() => toggleBookmark(index, message)}
                                                                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-all duration-200"
                                                                title="Bookmark message"
                                                                aria-label="Bookmark message"
                                                            >
                                                                {(() => {
                                                                    const currentSessionId = getOrCreateSessionId();
                                                                    const bookmarkKey = `${currentSessionId}_${index}_${message.timestamp}`;
                                                                    return bookmarkedMessages.some(bm => bm.key === bookmarkKey) ? 
                                                                        <FaBookmarkSolid size={10} className="text-yellow-500" /> : 
                                                                        <FaRegBookmark size={10} className="text-gray-500" />
                                                                })()}
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
                                                        
                                                        {/* Retry buttons */}
                                                        {message.role === 'assistant' && (
                                                            <button
                                                                onClick={() => {
                                                                    const previousUserMessage = (() => {
                                                                        for (let i = index - 1; i >= 0; i--) {
                                                                            if (messages[i]?.role === 'user') return messages[i].content;
                                                                        }
                                                                        return lastUserMessageRef.current;
                                                                    })();
                                                                    if (previousUserMessage) retryMessage(previousUserMessage, index);
                                                                }}
                                                                disabled={isLoading || (!currentUser && promptCount >= 5)}
                                                                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-all duration-200 disabled:opacity-50"
                                                                title="Try Again"
                                                                aria-label="Try Again"
                                                            >
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26l1.46-1.46C6.26 13.86 6 12.97 6 12c0-3.31 2.69-6 6-6zm5.76 1.74L16.3 9.2C17.74 10.14 18.5 11.49 18.5 13c0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
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

                        {/* Floating date label */}
                        {/* Removed old absolute-positioned floating date label */}

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
                            {/* Prompt Counter for Non-Logged-In Users */}
                            {!currentUser && (
                                <div className="mb-3 text-center">
                                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        <span className="mr-1">💬</span>
                                        <span>
                                            {promptCount < 5 
                                                ? `${5 - promptCount} free prompts remaining` 
                                                : 'No free prompts left'
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Smart Suggestions */}
                            {showSmartSuggestions && messages.length <= 1 && (
                                <div className="mb-3">
                                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                                        <FaLightbulb size={10} />
                                        Try asking:
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {smartSuggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSmartSuggestion(suggestion)}
                                                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 hover:scale-105 ${
                                                    isDarkMode 
                                                        ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' 
                                                        : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                                }`}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Uploaded Files Display */}
                            {uploadedFiles.length > 0 && (
                                <div className="mb-3">
                                    <div className="text-xs text-gray-500 mb-2">Attached files:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {uploadedFiles.map((file, index) => (
                                            <div key={index} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                                                isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
                                            }`}>
                                                <FaFileAlt size={12} className="text-blue-500" />
                                                <span className="text-xs truncate max-w-[120px]">{file.name}</span>
                                                <button
                                                    onClick={() => removeUploadedFile(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FaTimes size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex space-x-2">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={!currentUser && promptCount >= 5 ? "Sign in to continue chatting..." : "Ask me anything about real estate..."}
                                        className={`flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                                            isDarkMode 
                                                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                        disabled={isLoading || (!currentUser && promptCount >= 5)}
                                    />
                                    {inputMessage.length > 1800 && (
                                        <div className="absolute -top-6 right-0 text-xs text-orange-600">
                                            {inputMessage.length}/2000
                                        </div>
                                    )}
                                </div>
                                
                                {/* Voice Input Button */}
                                <button
                                    type="button"
                                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                                    className={`px-3 py-2 rounded-full transition-all duration-200 ${
                                        isRecording 
                                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                    title={isRecording ? "Stop Recording" : "Voice Input"}
                                >
                                    {isRecording ? <FaStop size={14} /> : <FaMicrophone size={14} />}
                                </button>

                                {/* File Upload Button */}
                                <label className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-all duration-200 cursor-pointer">
                                    <FaUpload size={14} />
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf,.txt"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>

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
                                        disabled={!inputMessage.trim() || (!currentUser && promptCount >= 5)}
                                        className={`bg-gradient-to-r ${themeColors.primary} text-white p-2 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 flex-shrink-0 flex items-center justify-center w-10 h-10 group hover:shadow-xl active:scale-95`}
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
                                    {(() => {
                                        const currentSessionId = getOrCreateSessionId();
                                        const sessionBookmarks = bookmarkedMessages.filter(bm => bm.sessionId === currentSessionId);
                                        return sessionBookmarks.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">No bookmarked messages in this session</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {sessionBookmarks.map((bookmark, idx) => (
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
                                                                const newBookmarks = bookmarkedMessages.filter(bm => bm.key !== bookmark.key);
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
                                        );
                                    })()}
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
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <FaHistory className="text-blue-500" />
                                            Chat History
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setShowDeleteAllModal(true)}
                                                className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                                            >
                                                Delete All
                                            </button>
                                            <button
                                                onClick={() => { createNewSession(); setShowHistory(false); }}
                                                className="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                                            >
                                                <FaComments size={10} />
                                                New Chat
                                            </button>
                                        </div>
                                    </div>
                                    {chatSessions.length === 0 ? (
                                        <div className="text-center py-8 space-y-3">
                                            <p className="text-gray-500">No chats yet</p>
                                            <button
                                                onClick={async () => { await createNewSession(); await loadChatSessions(); setShowHistory(false); }}
                                                className="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                            >
                                                Create First Chat
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {chatSessions.map((session, idx) => (
                                                <div
                                                    key={session.sessionId || idx}
                                                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1"
                                                            checked={selectedHistoryIds.includes(session.sessionId)}
                                                            onChange={(e) => {
                                                                const id = session.sessionId;
                                                                setSelectedHistoryIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
                                                            }}
                                                            aria-label="Select chat"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                loadSessionHistory(session.sessionId);
                                                                setShowHistory(false);
                                                            }}
                                                            className="flex-1 text-left"
                                                        >
                                                            <div className="text-sm font-medium text-gray-800">
                                                                {session.name?.trim() ? session.name : `New chat ${idx + 1}`}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                {new Date(session.lastMessageAt).toLocaleString()}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {session.messageCount} messages
                                                            </div>
                                                        </button>
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenHistoryMenuSessionId(prev => prev === session.sessionId ? null : session.sessionId);
                                                                }}
                                                                className="ml-2 p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-all duration-200"
                                                                title="Chat options"
                                                            >
                                                                ⋯
                                                            </button>
                                                            {openHistoryMenuSessionId === session.sessionId && (
                                                            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded shadow-lg z-10 w-36">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteTargetSessionId(session.sessionId);
                                                                        setShowDeleteSingleModal(true);
                                                                    }}
                                                                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                                                >
                                                                    Delete chat
                                                                </button>
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        try {
                                                                            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
                                                                            const resp = await fetch(`${API_BASE_URL}/api/chat-history/session/${session.sessionId}`, { credentials: 'include' });
                                                                            const data = await resp.json();
                                                                            if (!resp.ok || !data?.data?.messages) throw new Error('load');
                                                                            const lines = data.data.messages.map(m => `${m.role === 'user' ? 'You' : 'Gemini'}: ${m.content}`);
                                                                            const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
                                                                            const url = URL.createObjectURL(blob);
                                                                            const a = document.createElement('a');
                                                                            a.href = url;
                                                                            a.download = `gemini_chat_${new Date().toISOString().split('T')[0]}.txt`;
                                                                            document.body.appendChild(a);
                                                                            a.click();
                                                                            document.body.removeChild(a);
                                                                            URL.revokeObjectURL(url);
                                                                            setOpenHistoryMenuSessionId(null);
                                                                        } catch {
                                                                            toast.error('Failed to share chat');
                                                                        }
                                                                    }}
                                                                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                                                >
                                                                    Share chat
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setRenameTargetSessionId(session.sessionId);
                                                                        const currentName = session.name?.trim() || '';
                                                                        setRenameInput(currentName);
                                                                        setShowRenameModal(true);
                                                                    }}
                                                                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                                                >
                                                                    Rename
                                                                </button>
                                                            </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {selectedHistoryIds.length > 0 && (
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => setShowDeleteSelectedModal(true)}
                                                        className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                                                    >
                                                        Delete Selected
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex justify-end mt-4">
                                        <button onClick={() => { setShowHistory(false); setOpenHistoryMenuSessionId(null); }} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Close</button>
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

        {/* Delete All Chats Modal */}
        {showDeleteAllModal && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className="bg-white rounded-xl shadow-xl p-5 w-80">
                    <h4 className="font-semibold mb-2">Delete all chats?</h4>
                    <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowDeleteAllModal(false)} className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700">Cancel</button>
                        <button onClick={async () => {
                            try {
                                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
                                await fetch(`${API_BASE_URL}/api/gemini/sessions`, { method: 'DELETE', credentials: 'include' });
                                await createNewSession();
                                await loadChatSessions();
                                toast.success('All chats deleted');
                                setShowHistory(false);
                            } catch (e) {
                                toast.error('Failed to delete all chats');
                            } finally {
                                setShowDeleteAllModal(false);
                            }
                        }} className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Selected Chats Modal */}
        {showDeleteSelectedModal && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className="bg-white rounded-xl shadow-xl p-5 w-80">
                    <h4 className="font-semibold mb-2">Delete selected chats?</h4>
                    <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowDeleteSelectedModal(false)} className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700">Cancel</button>
                        <button onClick={async () => {
                            try {
                                for (const id of selectedHistoryIds) { await deleteSession(id); }
                                setSelectedHistoryIds([]);
                                await loadChatSessions();
                                toast.success('Selected chats deleted');
                            } catch (e) {
                                toast.error('Failed to delete selected chats');
                            } finally {
                                setShowDeleteSelectedModal(false);
                            }
                        }} className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Single Chat Modal */}
        {showDeleteSingleModal && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className="bg-white rounded-xl shadow-xl p-5 w-80">
                    <h4 className="font-semibold mb-2">Delete this chat?</h4>
                    <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowDeleteSingleModal(false)} className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700">Cancel</button>
                        <button onClick={async () => {
                            try {
                                if (deleteTargetSessionId) { await deleteSession(deleteTargetSessionId); }
                                await loadChatSessions();
                                toast.success('Chat deleted');
                            } catch (e) {
                                toast.error('Failed to delete chat');
                            } finally {
                                setDeleteTargetSessionId(null);
                                setShowDeleteSingleModal(false);
                                setOpenHistoryMenuSessionId(null);
                            }
                        }} className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </div>
        )}

        {/* Rename Chat Modal */}
        {showRenameModal && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className="bg-white rounded-xl shadow-xl p-5 w-96 max-w-full">
                    <h4 className="font-semibold mb-2">Rename chat</h4>
                    <input
                        type="text"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
                        placeholder="Enter chat name"
                        maxLength={80}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setShowRenameModal(false); setRenameTargetSessionId(null); }} className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700">Cancel</button>
                        <button onClick={async () => {
                            try {
                                const name = renameInput.trim();
                                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
                                await fetch(`${API_BASE_URL}/api/chat-history/session/${renameTargetSessionId}`, {
                                    method: 'PUT',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ name })
                                });
                                await loadChatSessions();
                                toast.success('Chat renamed');
                            } catch {
                                toast.error('Failed to rename chat');
                            } finally {
                                setShowRenameModal(false);
                                setRenameTargetSessionId(null);
                                setOpenHistoryMenuSessionId(null);
                            }
                        }} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
                    </div>
                </div>
            </div>
        )}

        {/* Sign In Modal for Prompt Limit */}
        {showSignInModal && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className="bg-white rounded-xl shadow-xl p-6 w-96 max-w-sm mx-4">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                            <FaRobot className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Prompt Limit Reached
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            You've used all 5 free prompts! Sign in to enjoy unlimited access to our AI assistant and unlock premium features like chat history, message ratings, and more.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setShowSignInModal(false);
                                    window.location.href = '/signin';
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                            >
                                Sign In to Continue
                            </button>
                            <button
                                onClick={() => {
                                    setShowSignInModal(false);
                                    window.location.href = '/signup';
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                            >
                                Create Free Account
                            </button>
                            <button
                                onClick={() => setShowSignInModal(false)}
                                className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Enhanced Settings Modal */}
        {showSettings && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl p-6 w-96 max-w-full`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Settings & Themes
                        </h3>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Theme Selection */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Theme Color
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {['blue', 'green', 'purple', 'orange'].map((theme) => (
                                    <button
                                        key={theme}
                                        onClick={() => {
                                            setSelectedTheme(theme);
                                            localStorage.setItem('gemini_theme', theme);
                                        }}
                                        className={`w-8 h-8 rounded-full border-2 ${
                                            selectedTheme === theme ? 'border-gray-400' : 'border-gray-200'
                                        } ${
                                            theme === 'blue' ? 'bg-gradient-to-br from-blue-500 to-purple-500' :
                                            theme === 'green' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                                            theme === 'purple' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                                            'bg-gradient-to-br from-orange-500 to-red-500'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Dark Mode
                            </span>
                            <button
                                onClick={toggleDarkMode}
                                className={`w-12 h-6 rounded-full transition-colors ${
                                    isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                    isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </div>

                        {/* Smart Suggestions Toggle */}
                        <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Smart Suggestions
                            </span>
                            <button
                                onClick={() => setShowSmartSuggestions(!showSmartSuggestions)}
                                className={`w-12 h-6 rounded-full transition-colors ${
                                    showSmartSuggestions ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                    showSmartSuggestions ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Voice Input Modal */}
        {showVoiceInput && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl p-6 w-80 max-w-full text-center`}>
                    <div className="mb-4">
                        <FaMicrophone size={32} className="mx-auto text-blue-500 mb-2" />
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Voice Input
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Click and hold to record your message
                        </p>
                    </div>
                    
                    <div className="space-y-3">
                        <button
                            onMouseDown={startVoiceRecording}
                            onMouseUp={stopVoiceRecording}
                            onMouseLeave={stopVoiceRecording}
                            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all duration-200 ${
                                isRecording 
                                    ? 'bg-red-500 animate-pulse' 
                                    : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                        >
                            <FaMicrophone size={24} className="text-white" />
                        </button>
                        
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isRecording ? 'Recording... Release to stop' : 'Hold to record'}
                        </p>
                    </div>
                    
                    <button
                        onClick={() => setShowVoiceInput(false)}
                        className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        )}

        {/* File Upload Modal */}
        {showFileUpload && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl p-6 w-80 max-w-full`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Upload Files
                        </h3>
                        <button
                            onClick={() => setShowFileUpload(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <FaUpload size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Drag & drop files here or click to browse
                            </p>
                            <input
                                type="file"
                                multiple
                                accept="image/*,.pdf,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="mt-2 inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors"
                            >
                                Choose Files
                            </label>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                            Supported: Images (JPG, PNG, GIF), PDF, Text files. Max 10MB per file.
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Search in Chat Modal */}
        {showSearchInChat && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl p-6 w-96 max-w-full`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Search in Chat
                        </h3>
                        <button
                            onClick={() => setShowSearchInChat(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                searchInMessages(e.target.value);
                            }}
                            placeholder="Search messages..."
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isDarkMode 
                                    ? 'bg-gray-800 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                            }`}
                        />
                        
                        {searchQuery && (
                            <div className="max-h-40 overflow-y-auto">
                                {filteredMessages.length > 0 ? (
                                    <div className="space-y-2">
                                        {filteredMessages.map((message, index) => (
                                            <div
                                                key={index}
                                                className={`p-2 rounded border ${
                                                    isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
                                                }`}
                                            >
                                                <div className="text-xs text-gray-500 mb-1">
                                                    {message.role === 'user' ? 'You' : 'Gemini'} • {new Date(message.timestamp).toLocaleString()}
                                                </div>
                                                <div className="text-sm">{message.content.substring(0, 100)}...</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        No messages found
                                    </p>
                                )}
                            </div>
                        )}
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

import React, { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaRobot, FaCopy, FaCheck, FaDownload, FaUpload, FaCog, FaLightbulb, FaHistory, FaBookmark, FaShare, FaThumbsUp, FaThumbsDown, FaRegBookmark, FaBookmark as FaBookmarkSolid, FaMicrophone, FaStop, FaImage, FaFileAlt, FaMagic, FaStar, FaMoon, FaSun, FaPalette, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress, FaSearch, FaFilter, FaSort, FaEye, FaEyeSlash, FaEdit, FaCheck as FaCheckCircle, FaTimes as FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
// import { FormattedTextWithLinks } from '../utils/linkFormatter.jsx';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';

const GeminiChatbox = ({ forceModalOpen = false, onModalClose = null }) => {
    const { currentUser } = useSelector((state) => state.user);
    
    // Helper functions for user-specific localStorage
    const getUserKey = (key) => {
        if (!currentUser) return key; // For public users, use global keys
        return `user_${currentUser._id}_${key}`;
    };
    
    const getUserSetting = (key, defaultValue) => {
        const userKey = getUserKey(key);
        return localStorage.getItem(userKey) || defaultValue;
    };
    
    const setUserSetting = (key, value) => {
        const userKey = getUserKey(key);
        localStorage.setItem(userKey, value);
    };
    
    // Helper function to get theme color as hex value for the ring
    const getThemeRingColor = () => {
        const theme = getThemeColors();
        const accentClass = theme.accent;
        
        // Map Tailwind color classes to hex values
        const colorMap = {
            'text-blue-400': '#60a5fa',
            'text-blue-500': '#3b82f6',
            'text-blue-600': '#2563eb',
            'text-green-400': '#4ade80',
            'text-green-500': '#22c55e',
            'text-green-600': '#16a34a',
            'text-purple-400': '#a78bfa',
            'text-purple-500': '#8b5cf6',
            'text-purple-600': '#7c3aed',
            'text-pink-400': '#f472b6',
            'text-pink-500': '#ec4899',
            'text-pink-600': '#db2777',
            'text-red-400': '#f87171',
            'text-red-500': '#ef4444',
            'text-red-600': '#dc2626',
            'text-orange-400': '#fb923c',
            'text-orange-500': '#f97316',
            'text-orange-600': '#ea580c',
            'text-yellow-400': '#facc15',
            'text-yellow-500': '#eab308',
            'text-yellow-600': '#ca8a04',
            'text-indigo-400': '#818cf8',
            'text-indigo-500': '#6366f1',
            'text-indigo-600': '#4f46e5',
            'text-cyan-400': '#22d3ee',
            'text-cyan-500': '#06b6d4',
            'text-cyan-600': '#0891b2',
            'text-teal-400': '#2dd4bf',
            'text-teal-500': '#14b8a6',
            'text-teal-600': '#0d9488',
        };
        
        return colorMap[accentClass] || '#60a5fa'; // Default to blue if not found
    };
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
    const audioUploadAbortControllerRef = useRef(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const lastUserMessageRef = useRef('');
    const [tone, setTone] = useState(() => localStorage.getItem('gemini_tone') || 'neutral'); // modes dropdown (tone)
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const headerMenuButtonRef = useRef(null);
    const suggestionsRef = useRef(null);
    const headerMenuRef = useRef(null);
    const [showFeatures, setShowFeatures] = useState(false);
    
    // Property suggestion states
    const [showPropertySuggestions, setShowPropertySuggestions] = useState(false);
    const [propertySuggestions, setPropertySuggestions] = useState([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [suggestionQuery, setSuggestionQuery] = useState('');
    const [suggestionStartPos, setSuggestionStartPos] = useState(-1);
    const [selectedProperties, setSelectedProperties] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [bookmarkedMessages, setBookmarkedMessages] = useState([]);
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
    
    // Rate limiting state
    const [rateLimitInfo, setRateLimitInfo] = useState({
        role: currentUser ? (currentUser.role || 'user') : 'public',
        limit: currentUser ? (currentUser.role === 'admin' ? 500 : currentUser.role === 'rootadmin' ? Infinity : 50) : 5,
        remaining: currentUser ? (currentUser.role === 'admin' ? 500 : currentUser.role === 'rootadmin' ? Infinity : 50) : 5,
        resetTime: null,
        windowMs: currentUser ? (currentUser.role === 'admin' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000) : 15 * 60 * 1000
    });
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showSignInOverlay, setShowSignInOverlay] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
    const [deleteTargetSessionId, setDeleteTargetSessionId] = useState(null);
    const [showDeleteSingleModal, setShowDeleteSingleModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameTargetSessionId, setRenameTargetSessionId] = useState(null);
    const [renameInput, setRenameInput] = useState('');
    const [refreshingBookmarks, setRefreshingBookmarks] = useState(false);
    // Floating date label like WhatsApp
    const [floatingDateLabel, setFloatingDateLabel] = useState('');
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef(null);
    
    // Enhanced UI and Feature States
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(() => getUserSetting('gemini_dark_mode', 'false') === 'true');
    const [showVoiceInput, setShowVoiceInput] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [showSmartSuggestions, setShowSmartSuggestions] = useState(() => {
        // Disable smart suggestions by default for public users
        if (!currentUser) return false;
        return getUserSetting('gemini_smart_suggestions', 'true') === 'true';
    });
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
    const [selectedTheme, setSelectedTheme] = useState(() => getUserSetting('gemini_theme', 'blue'));
    const [customTheme, setCustomTheme] = useState(() => {
        const saved = getUserSetting('gemini_custom_theme', null);
        return saved ? JSON.parse(saved) : null;
    });
    const [fontSize, setFontSize] = useState(() => getUserSetting('gemini_font_size', 'medium'));
    const [messageDensity, setMessageDensity] = useState(() => getUserSetting('gemini_message_density', 'comfortable'));
    const [autoScroll, setAutoScroll] = useState(() => getUserSetting('gemini_auto_scroll', 'true') !== 'false');
    const [showTimestamps, setShowTimestamps] = useState(() => getUserSetting('gemini_show_timestamps', 'true') !== 'false');
    const [aiResponseLength, setAiResponseLength] = useState(() => {
        // For public users, default to 'small', for logged-in users use saved setting or 'medium'
        if (!currentUser) return 'small';
        return getUserSetting('gemini_response_length', 'medium');
    });
    const [aiCreativity, setAiCreativity] = useState(() => {
        // For public users, default to 'conservative', for logged-in users use saved setting or 'balanced'
        if (!currentUser) return 'conservative';
        return getUserSetting('gemini_creativity', 'balanced');
    });
    const [soundEnabled, setSoundEnabled] = useState(() => getUserSetting('gemini_sound_enabled', 'true') !== 'false');
    const [typingSounds, setTypingSounds] = useState(() => getUserSetting('gemini_typing_sounds', 'true') !== 'false');
    const [dataRetention, setDataRetention] = useState(() => getUserSetting('gemini_data_retention', '30'));
    const [showCustomThemePicker, setShowCustomThemePicker] = useState(false);
    
    // Advanced Settings
    const [autoSave, setAutoSave] = useState(() => getUserSetting('gemini_auto_save', 'true') !== 'false');
    const [messageLimit, setMessageLimit] = useState(() => getUserSetting('gemini_message_limit', '100'));
    const [sessionTimeout, setSessionTimeout] = useState(() => getUserSetting('gemini_session_timeout', '30'));
    const [enableMarkdown, setEnableMarkdown] = useState(() => getUserSetting('gemini_enable_markdown', 'true') !== 'false');
    const [enableCodeHighlighting, setEnableCodeHighlighting] = useState(() => getUserSetting('gemini_code_highlighting', 'true') !== 'false');
    const [enableEmojiReactions, setEnableEmojiReactions] = useState(() => getUserSetting('gemini_emoji_reactions', 'true') !== 'false');
    const [enableMessageSearch, setEnableMessageSearch] = useState(() => getUserSetting('gemini_message_search', 'true') !== 'false');
    const [enableQuickActions, setEnableQuickActions] = useState(() => getUserSetting('gemini_quick_actions', 'true') !== 'false');
    const [enableSmartSuggestions, setEnableSmartSuggestions] = useState(() => getUserSetting('gemini_smart_suggestions', 'true') !== 'false');
    const [enableTypingIndicator, setEnableTypingIndicator] = useState(() => getUserSetting('gemini_typing_indicator', 'true') !== 'false');
    
    // Accessibility Settings
    const [highContrast, setHighContrast] = useState(() => {
        // For public users (no currentUser), default to false
        if (!currentUser) return false;
        return getUserSetting('gemini_high_contrast', 'false') === 'true';
    });
    const [reducedMotion, setReducedMotion] = useState(() => getUserSetting('gemini_reduced_motion', 'false') === 'true');
    const [screenReaderSupport, setScreenReaderSupport] = useState(() => getUserSetting('gemini_screen_reader', 'false') === 'true');
    const [largeText, setLargeText] = useState(() => getUserSetting('gemini_large_text', 'false') === 'true');
    const [keyboardNavigation, setKeyboardNavigation] = useState(() => getUserSetting('gemini_keyboard_nav', 'true') !== 'false');
    
    // Performance Settings
    const [messageCaching, setMessageCaching] = useState(() => getUserSetting('gemini_message_caching', 'true') !== 'false');
    const [lazyLoading, setLazyLoading] = useState(() => getUserSetting('gemini_lazy_loading', 'true') !== 'false');
    const [imageOptimization, setImageOptimization] = useState(() => getUserSetting('gemini_image_optimization', 'true') !== 'false');
    const [preloadMessages, setPreloadMessages] = useState(() => getUserSetting('gemini_preload_messages', 'true') !== 'false');
    const [batchOperations, setBatchOperations] = useState(() => getUserSetting('gemini_batch_operations', 'true') !== 'false');
    
    // Privacy Settings
    const [enableAnalytics, setEnableAnalytics] = useState(() => getUserSetting('gemini_analytics', 'true') !== 'false');
    const [enableErrorReporting, setEnableErrorReporting] = useState(() => getUserSetting('gemini_error_reporting', 'true') !== 'false');
    const [enableUsageTracking, setEnableUsageTracking] = useState(() => getUserSetting('gemini_usage_tracking', 'true') !== 'false');
    const [enableCrashReports, setEnableCrashReports] = useState(() => getUserSetting('gemini_crash_reports', 'true') !== 'false');
    const [enablePerformanceMonitoring, setEnablePerformanceMonitoring] = useState(() => getUserSetting('gemini_performance_monitoring', 'true') !== 'false');
    
    // Advanced AI Settings
    const [temperature, setTemperature] = useState(() => getUserSetting('gemini_temperature', '0.7'));
    const [topP, setTopP] = useState(() => getUserSetting('gemini_top_p', '0.8'));
    const [topK, setTopK] = useState(() => getUserSetting('gemini_top_k', '40'));
    const [maxTokens, setMaxTokens] = useState(() => getUserSetting('gemini_max_tokens', '2048'));
    const [enableStreaming, setEnableStreaming] = useState(() => {
        // For public users, default to 'false', for logged-in users use saved setting or 'true'
        if (!currentUser) return false;
        return getUserSetting('gemini_streaming', 'true') !== 'false';
    });
    const [enableContextMemory, setEnableContextMemory] = useState(() => getUserSetting('gemini_context_memory', 'true') !== 'false');
    const [contextWindow, setContextWindow] = useState(() => getUserSetting('gemini_context_window', '10'));
    const [enableSystemPrompts, setEnableSystemPrompts] = useState(() => getUserSetting('gemini_system_prompts', 'true') !== 'false');
    
    // Notification Settings
    const [enableDesktopNotifications, setEnableDesktopNotifications] = useState(() => getUserSetting('gemini_desktop_notifications', 'true') !== 'false');
    const [enableEmailNotifications, setEnableEmailNotifications] = useState(() => getUserSetting('gemini_email_notifications', 'true') !== 'false');
    const [enablePushNotifications, setEnablePushNotifications] = useState(() => getUserSetting('gemini_push_notifications', 'true') !== 'false');
    const [notificationSound, setNotificationSound] = useState(() => getUserSetting('gemini_notification_sound', 'default'));
    const [notificationFrequency, setNotificationFrequency] = useState(() => getUserSetting('gemini_notification_frequency', 'immediate'));
    
    // UI/UX Settings
    const [enableAnimations, setEnableAnimations] = useState(() => getUserSetting('gemini_animations', 'true') !== 'false');
    const [enableHoverEffects, setEnableHoverEffects] = useState(() => getUserSetting('gemini_hover_effects', 'true') !== 'false');
    const [enableTransitions, setEnableTransitions] = useState(() => getUserSetting('gemini_transitions', 'true') !== 'false');
    const [enableTooltips, setEnableTooltips] = useState(() => getUserSetting('gemini_tooltips', 'true') !== 'false');
    const [enableKeyboardShortcuts, setEnableKeyboardShortcuts] = useState(() => getUserSetting('gemini_keyboard_shortcuts', 'true') !== 'false');
    const [enableDragAndDrop, setEnableDragAndDrop] = useState(() => getUserSetting('gemini_drag_drop', 'true') !== 'false');
    const [enableRightClickMenu, setEnableRightClickMenu] = useState(() => getUserSetting('gemini_right_click', 'true') !== 'false');
    const [enableContextMenu, setEnableContextMenu] = useState(() => getUserSetting('gemini_context_menu', 'true') !== 'false');
    const [showTypingIndicator, setShowTypingIndicator] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [messageReactions, setMessageReactions] = useState({});
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [reactionTargetMessage, setReactionTargetMessage] = useState(null);
    const [showAudioPreview, setShowAudioPreview] = useState(false);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
    const [recordedAudioFile, setRecordedAudioFile] = useState(null);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [recordingStartTime, setRecordingStartTime] = useState(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordedAudioType, setRecordedAudioType] = useState('audio/webm');
    const recordingChunksRef = useRef([]);
    const [editingMessageIndex, setEditingMessageIndex] = useState(null);
    const [editingMessageContent, setEditingMessageContent] = useState('');
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = () => {
        if (autoScroll) {
            // Use a small timeout to ensure DOM has updated
            setTimeout(() => {
                const messagesContainer = messagesContainerRef.current;
                if (messagesContainer) {
                    const scrollTop = messagesContainer.scrollTop;
                    const scrollHeight = messagesContainer.scrollHeight;
                    const clientHeight = messagesContainer.clientHeight;
                    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30; // 30px tolerance
                    
                    console.log('Scroll check:', { scrollTop, scrollHeight, clientHeight, isAtBottom });
                    
                    if (!isAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }
                } else {
                    // Fallback if container not found
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }
            }, 50); // Small delay to ensure DOM updates
        }
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

    // Fetch rate limit status from backend
    const fetchRateLimitStatus = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            
            const response = await fetch(`${API_BASE_URL}/api/gemini/rate-limit-status`, {
                method: 'GET',
                credentials: 'include', // Use cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Frontend - Rate limit status response:', data);
                if (data.success && data.rateLimit) {
                    console.log('Frontend - Setting rate limit info:', data.rateLimit);
                    setRateLimitInfo(data.rateLimit);
                    
                    // Show appropriate modal if rate limit is exceeded
                    if (data.rateLimit.remaining <= 0 && data.rateLimit.role !== 'rootadmin') {
                        if (currentUser) {
                            setShowSignInModal(true);
                        } else {
                            setShowSignInOverlay(true);
                        }
                    } else {
                        // Hide modals if rate limit is not exceeded
                        setShowSignInModal(false);
                        setShowSignInOverlay(false);
                    }
                }
            } else {
                console.error('Frontend - Rate limit status failed:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Failed to fetch rate limit status:', error);
            // Fallback: set default rate limit based on user role
            const fallbackRole = currentUser ? (currentUser.role || 'user') : 'public';
            const fallbackLimit = currentUser ? (currentUser.role === 'admin' ? 500 : currentUser.role === 'rootadmin' ? Infinity : 50) : 5;
            setRateLimitInfo({
                role: fallbackRole,
                limit: fallbackLimit,
                remaining: fallbackLimit,
                resetTime: null,
                windowMs: currentUser ? (currentUser.role === 'admin' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000) : 15 * 60 * 1000
            });
            
            // Hide modals in fallback case since we're setting full limit
            setShowSignInModal(false);
            setShowSignInOverlay(false);
        }
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
                if (data.success && data.data.messages && Array.isArray(data.data.messages) && data.data.messages.length > 0) {
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

    // Fetch current session name from backend
    const fetchSessionName = async (sessionId) => {
        if (!currentUser || !sessionId) return null;

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/chat-history/session/${sessionId}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.name) {
                    return data.data.name;
                }
            }
            return null;
        } catch (error) {
            console.error('Error fetching session name:', error);
            return null;
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

    // Refresh messages function - reloads current session without losing state
    const refreshMessages = async () => {
        try {
            const currentSessionId = getOrCreateSessionId();
            if (!currentSessionId) {
                toast.error('No active session to refresh');
                return;
            }

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/chat-history/session/${currentSessionId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.messages) {
                    // Only update if there are new messages or changes
                    const serverMessages = data.data.messages;
                    const currentMessageCount = messages.length;
                    
                    if (serverMessages.length !== currentMessageCount) {
                        setMessages(serverMessages);
                        toast.success(`Messages refreshed! ${serverMessages.length - currentMessageCount} new messages loaded.`);
                    } else {
                        // Check if any messages have been updated
                        let hasUpdates = false;
                        for (let i = 0; i < serverMessages.length; i++) {
                            if (serverMessages[i].content !== messages[i]?.content || 
                                serverMessages[i].timestamp !== messages[i]?.timestamp) {
                                hasUpdates = true;
                                break;
                            }
                        }
                        
                        if (hasUpdates) {
                            setMessages(serverMessages);
                            toast.success('Messages refreshed! Updates loaded.');
                        } else {
                            toast.info('Messages are already up to date.');
                        }
                    }
                    
                    // Scroll to bottom after refresh
                    setTimeout(() => scrollToBottom(), 100);
                } else {
                    toast.info('No messages found to refresh.');
                }
            } else if (response.status === 404) {
                toast.info('No saved messages found for this session.');
            } else {
                toast.error('Failed to refresh messages');
            }
        } catch (error) {
            console.error('Error refreshing messages:', error);
            toast.error('Failed to refresh messages');
        }
    };

    // Search properties for @ suggestions
    const searchProperties = async (query) => {
        try {
            setIsLoadingSuggestions(true);
            // Show suggestions even for empty query (to show all properties)
            const searchQuery = query ? query.trim() : '';

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const url = `${API_BASE_URL}/api/property-search/search?query=${encodeURIComponent(searchQuery)}&limit=5`;
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                setPropertySuggestions(data.data || []);
            } else {
                const errorText = await response.text();
                setPropertySuggestions([]);
            }
        } catch (error) {
            setPropertySuggestions([]);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    // Detect UrbanSetu listing links in input and resolve to property
    const resolvePropertyFromInput = async (text) => {
        try {
            const urlMatch = text.match(/https?:\/\/[^\s]*\/listing\/(\w{24})/i);
            const idMatch = text.match(/(?:^|\s)@?(\w{24})(?:\s|$)/); // fallback if only id typed after @
            const listingId = urlMatch?.[1] || idMatch?.[1];
            if (!listingId) return;

            // Avoid duplicates
            if (selectedProperties.some(p => (p.id || p._id) === listingId)) return;

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const url = `${API_BASE_URL}/api/property-search/${listingId}`;
            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) return;
            const data = await response.json();
            if (data?.success && data.data) {
                setSelectedProperties(prev => {
                    const exists = prev.some(p => (p.id || p._id) === (data.data.id || data.data._id));
                    return exists ? prev : [...prev, data.data];
                });
            }
        } catch (_) {
            // silent fail
        }
    };

    // Handle @ input for property suggestions
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputMessage(value);
        handleTyping(); // Call the existing typing handler

        // Check for UrbanSetu listing URL or 24-char id to auto-resolve
        resolvePropertyFromInput(value);

        // Check for @ symbol
        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        
        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            const hasSpaceAfterAt = textAfterAt.includes(' ');
            
            if (!hasSpaceAfterAt) {
                // Show suggestions
                setShowPropertySuggestions(true);
                setSuggestionQuery(textAfterAt);
                setSuggestionStartPos(lastAtIndex);
                setSelectedSuggestionIndex(-1);
                
                // Search properties
                searchProperties(textAfterAt);
            } else {
                setShowPropertySuggestions(false);
            }
        } else {
            setShowPropertySuggestions(false);
        }
    };

    // Handle suggestion selection
    const handleSuggestionSelect = (property) => {
        const beforeAt = inputMessage.substring(0, suggestionStartPos);
        const afterAt = inputMessage.substring(suggestionStartPos + suggestionQuery.length + 1);
        
        const newMessage = `${beforeAt}@${property.name}${afterAt}`;
        setInputMessage(newMessage);
        
        // Add property to selected properties
        setSelectedProperties(prev => [...prev, property]);
        
        // Hide suggestions
        setShowPropertySuggestions(false);
        setSuggestionQuery('');
        setSuggestionStartPos(-1);
        setSelectedSuggestionIndex(-1);
        
        // Focus back to input
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);
    };

    // Handle keyboard navigation for suggestions
    const handleKeyDown = (e) => {
        if (!showPropertySuggestions) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev < propertySuggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev > 0 ? prev - 1 : propertySuggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0 && propertySuggestions[selectedSuggestionIndex]) {
                    handleSuggestionSelect(propertySuggestions[selectedSuggestionIndex]);
                }
                break;
            case 'Escape':
                setShowPropertySuggestions(false);
                setSuggestionQuery('');
                setSuggestionStartPos(-1);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedInsideInput = inputRef.current && inputRef.current.contains(event.target);
            const clickedInsideSuggestions = suggestionsRef.current && suggestionsRef.current.contains(event.target);
            if (showPropertySuggestions && !clickedInsideInput && !clickedInsideSuggestions) {
                setShowPropertySuggestions(false);
                setSuggestionQuery('');
                setSuggestionStartPos(-1);
                setSelectedSuggestionIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPropertySuggestions]);

    // Force suggestions to appear above the message input (fixed placement)
    // We intentionally avoid dynamic positioning to keep the dropdown anchored above the footer input

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

    // Load user-specific settings when currentUser changes
    useEffect(() => {
        if (currentUser) {
            // Reload all user-specific settings
            setSelectedTheme(getUserSetting('gemini_theme', 'blue'));
            
            const savedCustomTheme = getUserSetting('gemini_custom_theme', null);
            setCustomTheme(savedCustomTheme ? JSON.parse(savedCustomTheme) : null);
            
            setFontSize(getUserSetting('gemini_font_size', 'medium'));
            setMessageDensity(getUserSetting('gemini_message_density', 'comfortable'));
            setAutoScroll(getUserSetting('gemini_auto_scroll', 'true') !== 'false');
            setShowTimestamps(getUserSetting('gemini_show_timestamps', 'true') !== 'false');
            setAiResponseLength(getUserSetting('gemini_response_length', currentUser ? 'medium' : 'small'));
            setAiCreativity(getUserSetting('gemini_creativity', currentUser ? 'balanced' : 'conservative'));
            setSoundEnabled(getUserSetting('gemini_sound_enabled', 'true') !== 'false');
            setTypingSounds(getUserSetting('gemini_typing_sounds', 'true') !== 'false');
            setDataRetention(getUserSetting('gemini_data_retention', '30'));
            
            // Advanced Settings
            setAutoSave(getUserSetting('gemini_auto_save', 'true') !== 'false');
            setMessageLimit(getUserSetting('gemini_message_limit', '100'));
            setSessionTimeout(getUserSetting('gemini_session_timeout', '30'));
            setEnableMarkdown(getUserSetting('gemini_enable_markdown', 'true') !== 'false');
            setEnableCodeHighlighting(getUserSetting('gemini_code_highlighting', 'true') !== 'false');
            setEnableEmojiReactions(getUserSetting('gemini_emoji_reactions', 'true') !== 'false');
            setEnableMessageSearch(getUserSetting('gemini_message_search', 'true') !== 'false');
            setEnableQuickActions(getUserSetting('gemini_quick_actions', 'true') !== 'false');
            setEnableSmartSuggestions(getUserSetting('gemini_smart_suggestions', 'true') !== 'false');
            setEnableTypingIndicator(getUserSetting('gemini_typing_indicator', 'true') !== 'false');
            
            // Accessibility Settings
            setHighContrast(getUserSetting('gemini_high_contrast', 'false') === 'true');
            setReducedMotion(getUserSetting('gemini_reduced_motion', 'false') === 'true');
            setScreenReaderSupport(getUserSetting('gemini_screen_reader', 'false') === 'true');
            setLargeText(getUserSetting('gemini_large_text', 'false') === 'true');
            setKeyboardNavigation(getUserSetting('gemini_keyboard_nav', 'true') !== 'false');
            
            // Performance Settings
            setMessageCaching(getUserSetting('gemini_message_caching', 'true') !== 'false');
            setLazyLoading(getUserSetting('gemini_lazy_loading', 'true') !== 'false');
            setImageOptimization(getUserSetting('gemini_image_optimization', 'true') !== 'false');
            setPreloadMessages(getUserSetting('gemini_preload_messages', 'true') !== 'false');
            setBatchOperations(getUserSetting('gemini_batch_operations', 'true') !== 'false');
            
            // Privacy Settings
            setEnableAnalytics(getUserSetting('gemini_analytics', 'true') !== 'false');
            setEnableErrorReporting(getUserSetting('gemini_error_reporting', 'true') !== 'false');
            setEnableUsageTracking(getUserSetting('gemini_usage_tracking', 'true') !== 'false');
            setEnableCrashReports(getUserSetting('gemini_crash_reports', 'true') !== 'false');
            setEnablePerformanceMonitoring(getUserSetting('gemini_performance_monitoring', 'true') !== 'false');
            
            // Advanced AI Settings
            setTemperature(getUserSetting('gemini_temperature', '0.7'));
            setTopP(getUserSetting('gemini_top_p', '0.9'));
            setTopK(getUserSetting('gemini_top_k', '40'));
            setMaxTokens(getUserSetting('gemini_max_tokens', '2048'));
            setEnableStreaming(getUserSetting('gemini_streaming', currentUser ? 'true' : 'false') !== 'false');
            setEnableContextMemory(getUserSetting('gemini_context_memory', 'true') !== 'false');
            setContextWindow(getUserSetting('gemini_context_window', '4'));
            setEnableSystemPrompts(getUserSetting('gemini_system_prompts', 'true') !== 'false');
            
            // Notification Settings
            setEnableDesktopNotifications(getUserSetting('gemini_desktop_notifications', 'true') !== 'false');
            setEnableEmailNotifications(getUserSetting('gemini_email_notifications', 'false') !== 'false');
            setEnablePushNotifications(getUserSetting('gemini_push_notifications', 'true') !== 'false');
            setNotificationSound(getUserSetting('gemini_notification_sound', 'default'));
            setNotificationFrequency(getUserSetting('gemini_notification_frequency', 'immediate'));
            
            // UI/UX Settings
            setEnableAnimations(getUserSetting('gemini_animations', 'true') !== 'false');
            setEnableHoverEffects(getUserSetting('gemini_hover_effects', 'true') !== 'false');
            setEnableTransitions(getUserSetting('gemini_transitions', 'true') !== 'false');
            setEnableTooltips(getUserSetting('gemini_tooltips', 'true') !== 'false');
            setEnableKeyboardShortcuts(getUserSetting('gemini_keyboard_shortcuts', 'true') !== 'false');
            setEnableDragAndDrop(getUserSetting('gemini_drag_drop', 'true') !== 'false');
            setEnableRightClickMenu(getUserSetting('gemini_right_click', 'true') !== 'false');
            setEnableContextMenu(getUserSetting('gemini_context_menu', 'true') !== 'false');
            
            // Dark mode
            setIsDarkMode(getUserSetting('gemini_dark_mode', 'false') === 'true');
        }
    }, [currentUser]);

    // Initialize session and load history when component mounts or user changes
    useEffect(() => {
        const currentSessionId = getOrCreateSessionId();
        if (currentUser && currentSessionId && !isHistoryLoaded) {
            loadChatHistory(currentSessionId);
            // Load ratings for current session
            loadMessageRatings(currentSessionId);
            // Load bookmarks for current session
            loadBookmarkedMessages(currentSessionId);
        } else if (!currentUser) {
            setIsHistoryLoaded(true);
        }
        // Restore draft input
        const draftKey = `gemini_draft_${currentSessionId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) setInputMessage(savedDraft);
        
        // Initialize smart suggestions from localStorage
        const savedSmartSuggestions = localStorage.getItem('gemini_smart_suggestions');
        if (savedSmartSuggestions !== null) {
            setShowSmartSuggestions(savedSmartSuggestions === 'true');
        }
        
        // Fetch rate limit status
        fetchRateLimitStatus();
    }, [currentUser, isHistoryLoaded]);

    // Initialize Prism.js highlighting
    useEffect(() => {
        if (enableCodeHighlighting) {
            Prism.highlightAll();
        }
    }, [messages, enableCodeHighlighting]);

    // Screen reader announcements for new messages
    useEffect(() => {
        if (screenReaderSupport && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const announcementElement = document.getElementById('screen-reader-announcements');
            
            if (announcementElement && lastMessage) {
                const messageType = lastMessage.role === 'user' ? 'You said' : 'AI responded';
                const content = lastMessage.content.length > 100 
                    ? lastMessage.content.substring(0, 100) + '...' 
                    : lastMessage.content;
                
                const announcementText = `${messageType}: ${content}`;
                
                // Debug logging
                console.log('Screen Reader Announcement:', announcementText);
                
                // Clear first, then set new content to ensure announcement
                announcementElement.textContent = '';
                announcementElement.setAttribute('aria-live', 'off');
                
                setTimeout(() => {
                    announcementElement.setAttribute('aria-live', 'polite');
                    announcementElement.textContent = announcementText;
                    
                    // Force a re-render by briefly changing and restoring the content
                    setTimeout(() => {
                        const currentText = announcementElement.textContent;
                        announcementElement.textContent = '';
                        setTimeout(() => {
                            announcementElement.textContent = currentText;
                        }, 50);
                    }, 100);
                }, 100);
                
                // Clear the announcement after a longer delay to allow screen readers to process
                setTimeout(() => {
                    announcementElement.textContent = '';
                }, 5000);
            }
        }
    }, [messages, screenReaderSupport]);

    // Screen reader announcements for loading states
    useEffect(() => {
        if (screenReaderSupport) {
            const announcementElement = document.getElementById('screen-reader-announcements');
            const statusElement = document.getElementById('screen-reader-status');
            
            if (announcementElement && statusElement) {
                if (isLoading) {
                    const loadingText = 'AI is typing a response...';
                    console.log('Screen Reader Loading Announcement:', loadingText);
                    statusElement.textContent = loadingText;
                } else if (isTyping) {
                    const typingText = 'AI is typing...';
                    console.log('Screen Reader Typing Announcement:', typingText);
                    statusElement.textContent = typingText;
                } else {
                    // Clear loading announcements when not loading
                    if (statusElement.textContent.includes('typing')) {
                        console.log('Screen Reader: Clearing loading announcements');
                        statusElement.textContent = '';
                    }
                }
            }
        }
    }, [isLoading, isTyping, screenReaderSupport]);

    // Test screen reader support when enabled
    useEffect(() => {
        if (screenReaderSupport) {
            const statusElement = document.getElementById('screen-reader-status');
            if (statusElement) {
                console.log('Screen Reader Support enabled - testing announcement');
                statusElement.textContent = 'Screen Reader Support is now active';
                setTimeout(() => {
                    statusElement.textContent = '';
                }, 2000);
            }
        }
    }, [screenReaderSupport]);

    // Persist draft input per session
    useEffect(() => {
        const currentSessionId = sessionId || localStorage.getItem('gemini_session_id');
        if (!currentSessionId) return;
        const draftKey = `gemini_draft_${currentSessionId}`;
        localStorage.setItem(draftKey, inputMessage);
    }, [inputMessage, sessionId]);

    // Reset rate limit info when user logs in
    useEffect(() => {
        if (currentUser) {
            fetchRateLimitStatus();
        }
    }, [currentUser]);

    // Data retention cleanup effect
    useEffect(() => {
        // Only run cleanup if dataRetention is a valid value
        if (dataRetention && (dataRetention === '0' || !isNaN(parseInt(dataRetention)))) {
            cleanupOldData();
        }
        
        // Set up periodic cleanup (every hour) - only if data retention is enabled
        if (dataRetention && dataRetention !== '0') {
            const cleanupInterval = setInterval(() => {
                if (dataRetention && (dataRetention === '0' || !isNaN(parseInt(dataRetention)))) {
                    cleanupOldData();
                }
            }, 60 * 60 * 1000);
            
            return () => clearInterval(cleanupInterval);
        }
    }, [dataRetention, currentUser]);

    // Disable auto-save, high contrast, and smart suggestions for public users
    // Also set default AI settings for public users
    useEffect(() => {
        if (!currentUser) {
            if (autoSave) {
                setAutoSave(false);
            }
            if (highContrast) {
                setHighContrast(false);
            }
            if (showSmartSuggestions) {
                setShowSmartSuggestions(false);
            }
            // Set default AI settings for public users
            if (aiResponseLength !== 'small') {
                setAiResponseLength('small');
            }
            if (aiCreativity !== 'conservative') {
                setAiCreativity('conservative');
            }
            if (enableStreaming !== false) {
                setEnableStreaming(false);
            }
            // Tone is already set to 'neutral' by default, so no need to change it
        }
    }, [currentUser, autoSave, highContrast, showSmartSuggestions, aiResponseLength, aiCreativity, enableStreaming]);

    // Auto-save effect
    useEffect(() => {
        if (autoSave && messages.length > 0 && currentUser) {
            const currentSessionId = getOrCreateSessionId();
            if (currentSessionId) {
                // Auto-save every 30 seconds
                const autoSaveInterval = setInterval(() => {
                    // Double-check user is still logged in before auto-saving
                    if (currentUser) {
                        saveCurrentSession();
                    }
                }, 30000);
                
                return () => clearInterval(autoSaveInterval);
            }
        }
    }, [autoSave, messages, currentUser]);

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

    // Close chat options dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!openHistoryMenuSessionId) return;
            // Check if click is outside any chat options dropdown
            const clickedInsideDropdown = event.target.closest('[data-chat-options-dropdown]');
            if (!clickedInsideDropdown) {
                setOpenHistoryMenuSessionId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [openHistoryMenuSessionId]);

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
            
            // Show floating date when scrolling starts
            setIsScrolling(true);
            
            // Clear existing timeout
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            
            // Hide floating date after scrolling stops (1 second of inactivity)
            scrollTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false);
            }, 1000);
        };
        el.addEventListener('scroll', onScroll);
        return () => {
            el.removeEventListener('scroll', onScroll);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, [isOpen, messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        // Check message limit
        const messageLimitNum = parseInt(messageLimit);
        if (messages.length >= messageLimitNum) {
            toast.error(`Message limit reached (${messageLimitNum} messages). Please start a new chat session.`);
            return;
        }

        // Check rate limit
        console.log('Frontend - Rate limit check:', { remaining: rateLimitInfo.remaining, role: rateLimitInfo.role, limit: rateLimitInfo.limit });
        if (rateLimitInfo.remaining <= 0 && rateLimitInfo.role !== 'rootadmin') {
            console.log('Frontend - Rate limit exceeded, showing sign-in modal');
            if (currentUser) {
                setShowSignInModal(true);
            } else {
                setShowSignInOverlay(true);
            }
            return;
        }

        // Trigger send icon fly animation
        setSendIconAnimating(true);
        setTimeout(() => setSendIconAnimating(false), 800);

        let userMessage = inputMessage.trim();
        const currentTone = currentUser ? tone : 'neutral'; // Use default tone for public users
        if (currentTone && currentTone !== 'neutral') {
            userMessage = `[Tone: ${currentTone}] ${userMessage}`;
        }
        setInputMessage('');
        setSelectedProperties([]); // Clear selected properties after sending
        setMessages(prev => {
            const currentMessages = Array.isArray(prev) ? prev : [];
            return [...currentMessages, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }];
        });
        lastUserMessageRef.current = userMessage;
        
        // Set loading state to show cancel button
        setIsLoading(true);
        
        // Play sound when message is sent
        playSound('message-sent.mp3');

        // Track message sent event
        trackEvent('message_sent', { 
            messageLength: userMessage.length,
            sessionId: getOrCreateSessionId(),
            tone: currentUser ? tone : 'neutral'
        });

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const currentSessionId = getOrCreateSessionId();
            console.log('Sending message to Gemini:', userMessage, 'Session:', currentSessionId);
            
            // Note: Session name will be auto-generated by backend after second message
            // This allows the backend to create a more meaningful title based on the conversation
            
            // Support cancelling with AbortController
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();
            // Handle streaming vs non-streaming responses
            let data;
            if (enableStreaming === true || enableStreaming === 'true') {
                console.log('Streaming enabled - setting up streaming request');
                
            const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
                method: 'POST',
                    credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                        history: enableContextMemory ? messages.slice(-parseInt(contextWindow)) : messages.slice(-10),
                    sessionId: currentSessionId,
                        tone: currentUser ? tone : 'neutral',
                        responseLength: aiResponseLength,
                        creativity: aiCreativity,
                        temperature: temperature,
                        topP: topP,
                        topK: topK,
                        maxTokens: maxTokens,
                        enableStreaming: enableStreaming,
                        enableContextMemory: enableContextMemory,
                        contextWindow: contextWindow,
                        enableSystemPrompts: enableSystemPrompts,
                        selectedProperties: selectedProperties
                }),
                signal: abortControllerRef.current.signal
            });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                // Handle streaming response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let streamingResponse = '';
                let isStreamingComplete = false;

                // Add streaming message to UI
                setMessages(prev => {
                    const currentMessages = Array.isArray(prev) ? prev : [];
                    return [...currentMessages, { 
                        role: 'assistant', 
                        content: '', 
                        timestamp: new Date().toISOString(),
                        isStreaming: true
                    }];
                });

                try {
                    while (!isStreamingComplete) {
                        const { done, value } = await reader.read();
                        
                        if (done) break;
                        
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const streamData = JSON.parse(line.slice(6));
                                    
                                    if (streamData.type === 'chunk') {
                                        streamingResponse += streamData.content;
                                        
                                        // Update the streaming message in real-time
                                        setMessages(prev => {
                                            const currentMessages = Array.isArray(prev) ? prev : [];
                                            const updatedMessages = [...currentMessages];
                                            const lastMessage = updatedMessages[updatedMessages.length - 1];
                                            if (lastMessage && lastMessage.isStreaming) {
                                                lastMessage.content = streamingResponse;
                                            }
                                            return updatedMessages;
                                        });
                                    } else if (streamData.type === 'done') {
                                        isStreamingComplete = true;
                                        streamingResponse = streamData.content;
                                        
                                        // Finalize the streaming message
                                        setMessages(prev => {
                                            const currentMessages = Array.isArray(prev) ? prev : [];
                                            const updatedMessages = [...currentMessages];
                                            const lastMessage = updatedMessages[updatedMessages.length - 1];
                                            if (lastMessage && lastMessage.isStreaming) {
                                                lastMessage.content = streamingResponse;
                                                delete lastMessage.isStreaming;
                                            }
                                            return updatedMessages;
                                        });
                                        
                                        // Clear loading state for streaming
                                        setIsLoading(false);
                                    } else if (streamData.type === 'error') {
                                        throw new Error(streamData.content);
                                    }
                                } catch (parseError) {
                                    console.warn('Failed to parse streaming chunk:', parseError);
                                }
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                }

                // Use streamingResponse as the final response
                data = { success: true, response: streamingResponse, sessionId: currentSessionId };
            } else {
                // Non-streaming response (original logic)
                const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: userMessage,
                        history: enableContextMemory ? messages.slice(-parseInt(contextWindow)) : messages.slice(-10),
                        sessionId: currentSessionId,
                        tone: currentUser ? tone : 'neutral',
                        responseLength: aiResponseLength,
                        creativity: aiCreativity,
                        temperature: temperature,
                        topP: topP,
                        topK: topK,
                        maxTokens: maxTokens,
                        enableStreaming: enableStreaming,
                        enableContextMemory: enableContextMemory,
                        contextWindow: contextWindow,
                        enableSystemPrompts: enableSystemPrompts,
                        selectedProperties: selectedProperties
                    }),
                    signal: abortControllerRef.current.signal
                });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

                data = await response.json();
            }
            console.log('Response data received:', data);
            console.log('Response content length:', data.response ? data.response.length : 0);
            
            // Only handle non-streaming responses here (streaming is handled above)
            if (!enableStreaming || enableStreaming === 'false') {
            // Validate response structure
            if (data && data.response && typeof data.response === 'string') {
                const trimmedResponse = data.response.trim();
                console.log('Setting message with response length:', trimmedResponse.length);
                setMessages(prev => {
                    const currentMessages = Array.isArray(prev) ? prev : [];
                    return [...currentMessages, { role: 'assistant', content: trimmedResponse, timestamp: new Date().toISOString() }];
                });
                if (!isOpen) {
                    setUnreadCount(count => count + 1);
                }
                
                // Play sound when message is received
                playSound('message-received.mp3');

                // Update session ID if provided in response
                if (data.sessionId && data.sessionId !== sessionId) {
                    setSessionId(data.sessionId);
                    localStorage.setItem('gemini_session_id', data.sessionId);
                }

                // Refresh rate limit status after successful request
                fetchRateLimitStatus();

                // Show sent success check briefly
                setSendIconSent(true);
                setTimeout(() => setSendIconSent(false), 600);
            } else {
                console.error('Invalid response structure:', data);
                throw new Error('Invalid response structure from server');
                }
            } else {
                // For streaming responses, handle final processing
                if (data && data.response && typeof data.response === 'string') {
                    if (!isOpen) {
                        setUnreadCount(count => count + 1);
                    }
                    
                    // Play sound when streaming is complete
                    playSound('message-received.mp3');

                    // Update session ID if provided in response
                    if (data.sessionId && data.sessionId !== sessionId) {
                        setSessionId(data.sessionId);
                        localStorage.setItem('gemini_session_id', data.sessionId);
                    }

                    // Refresh rate limit status after successful request
                    fetchRateLimitStatus();

                    // Show sent success check briefly
                    setSendIconSent(true);
                    setTimeout(() => setSendIconSent(false), 600);
                }
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
            
            setMessages(prev => {
                const currentMessages = Array.isArray(prev) ? prev : [];
                return [...currentMessages, { 
                    role: 'assistant', 
                    content: errorMessage,
                    timestamp: new Date().toISOString(),
                    isError: true,
                    originalUserMessage: lastUserMessageRef.current
                }];
            });
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

        // Check rate limit
        console.log('Frontend - Retry rate limit check:', { remaining: rateLimitInfo.remaining, role: rateLimitInfo.role, limit: rateLimitInfo.limit });
        if (rateLimitInfo.remaining <= 0 && rateLimitInfo.role !== 'rootadmin') {
            console.log('Frontend - Retry rate limit exceeded, showing sign-in modal');
            if (currentUser) {
                setShowSignInModal(true);
            } else {
                setShowSignInOverlay(true);
            }
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
                    history: enableContextMemory ? messages.slice(-parseInt(contextWindow)) : messages.slice(-10), // Send context window messages
                    sessionId: currentSessionId,
                    tone: currentUser ? tone : 'neutral', // Send current tone setting or default for public users
                    responseLength: aiResponseLength, // Send response length setting
                    creativity: aiCreativity, // Send creativity level setting
                    temperature: temperature, // Send custom temperature
                    topP: topP, // Send custom topP
                    topK: topK, // Send custom topK
                    maxTokens: maxTokens, // Send custom max tokens
                    enableStreaming: enableStreaming, // Send streaming preference
                    enableContextMemory: enableContextMemory, // Send context memory preference
                    contextWindow: contextWindow, // Send context window size
                    enableSystemPrompts: enableSystemPrompts // Send system prompts preference
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

                // Refresh rate limit status after successful request
                fetchRateLimitStatus();
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
    const toggleBookmark = async (messageIndex, message) => {
        // Check if user is logged in
        if (!currentUser) {
            toast.error('Please sign in to bookmark messages');
            return;
        }

        const currentSessionId = getOrCreateSessionId();
        const bookmarkKey = `${currentSessionId}_${messageIndex}_${message.timestamp}`;
        const isBookmarked = bookmarkedMessages.some(bm => bm.key === bookmarkKey);
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            
            if (isBookmarked) {
                // Remove bookmark
                const response = await fetch(`${API_BASE_URL}/api/gemini/bookmark`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId: currentSessionId,
                        messageIndex,
                        messageTimestamp: message.timestamp
                    })
                });

                    if (response.ok) {
                        // Reload bookmarks from backend
                        loadBookmarkedMessages(currentSessionId);
                        toast.success('Bookmark removed');
                    } else {
                        toast.error('Failed to remove bookmark');
                    }
            } else {
                // Add bookmark
                const response = await fetch(`${API_BASE_URL}/api/gemini/bookmark`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId: currentSessionId,
                        messageIndex,
                        messageTimestamp: message.timestamp,
                        messageContent: message.content,
                        messageRole: message.role
                    })
                });

                    if (response.ok) {
                        // Reload bookmarks from backend
                        loadBookmarkedMessages(currentSessionId);
                        toast.success('Message bookmarked');
                    } else {
                        toast.error('Failed to bookmark message');
                    }
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            toast.error('Failed to bookmark message');
        }
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

    // Edit message functions
    const startEditingMessage = (messageIndex, messageContent) => {
        setEditingMessageIndex(messageIndex);
        setEditingMessageContent(messageContent);
    };

    const cancelEditingMessage = () => {
        setEditingMessageIndex(null);
        setEditingMessageContent('');
    };

    const submitEditedMessage = async (messageIndex) => {
        if (!editingMessageContent.trim()) {
            toast.error('Message cannot be empty');
            return;
        }

        try {
            // Update the user message in the messages array
            const updatedMessages = [...messages];
            updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                content: editingMessageContent.trim()
            };
            setMessages(updatedMessages);

            // Remove the assistant's response that came after this user message
            const messagesToKeep = updatedMessages.slice(0, messageIndex + 1);
            setMessages(messagesToKeep);

            // Clear editing state first
            setEditingMessageIndex(null);
            setEditingMessageContent('');

            // Send the edited message directly to API without using input field
            await sendEditedMessageToAPI(editingMessageContent.trim());

            toast.success('Message updated and sent');
        } catch (error) {
            console.error('Error submitting edited message:', error);
            toast.error('Failed to send edited message');
        }
    };

    // Send edited message directly to API (using same format as handleSubmit)
    const sendEditedMessageToAPI = async (messageContent) => {
        if (!messageContent.trim() || isLoading) return;

        // Check rate limit
        if (rateLimitInfo.remaining <= 0 && rateLimitInfo.role !== 'rootadmin') {
            toast.error('Rate limit exceeded. Please wait before sending more messages.');
            return;
        }

        setIsLoading(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const currentSessionId = getOrCreateSessionId();
            console.log('Sending edited message to Gemini:', messageContent, 'Session:', currentSessionId);
            
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
                    message: messageContent,
                    history: messages.slice(-10), // Send last 10 messages for context
                    sessionId: currentSessionId,
                    tone: currentUser ? tone : 'neutral', // Send current tone setting or default for public users
                    responseLength: aiResponseLength, // Send response length setting
                    creativity: aiCreativity, // Send creativity level setting
                    enableStreaming: false // Force non-streaming to ensure JSON response when editing
                }),
                signal: abortControllerRef.current.signal
            });

            console.log('Edited message response status:', response.status);
            console.log('Edited message response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Edited message response data received:', data);
            console.log('Edited message response content length:', data.response ? data.response.length : 0);
            
            // Validate response structure
            if (data && data.response && typeof data.response === 'string') {
                const trimmedResponse = data.response.trim();
                console.log('Setting edited message with response length:', trimmedResponse.length);
                console.log('Edited message response content:', trimmedResponse);
                setMessages(prev => {
                    const newMessages = [...prev, { role: 'assistant', content: trimmedResponse, timestamp: new Date().toISOString() }];
                    console.log('Updated messages array length:', newMessages.length);
                    console.log('Last message:', newMessages[newMessages.length - 1]);
                    return newMessages;
                });
                
                // Play sound when edited message response is received
                playSound('message-received.mp3');
                
                // Update session ID if provided in response
                if (data.sessionId && data.sessionId !== sessionId) {
                    setSessionId(data.sessionId);
                    localStorage.setItem('gemini_session_id', data.sessionId);
                }

                // Refresh rate limit status after successful request
                fetchRateLimitStatus();
                
                // Scroll to bottom to show the new response
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
            } else {
                console.error('Invalid response structure for edited message:', data);
                throw new Error('Invalid response structure from server');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Edited message request was aborted');
                return;
            }
            console.error('Error in sendEditedMessageToAPI:', error);
            
            let errorMessage = 'Sorry, I\'m having trouble connecting right now. Please try again later.';
            
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
                isError: true
            }]);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    // Handle keyboard shortcuts for editing
    const handleEditKeyDown = (e, messageIndex) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submitEditedMessage(messageIndex);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditingMessage();
        }
    };

    // Generate session name based on first user message
    const generateSessionName = (message) => {
        // Remove tone prefix if present
        const cleanMessage = message.replace(/^\[Tone: \w+\]\s*/, '');
        
        // Truncate to reasonable length (max 50 characters)
        let sessionName = cleanMessage.trim();
        if (sessionName.length > 50) {
            sessionName = sessionName.substring(0, 47) + '...';
        }
        
        // If message is too short or empty, use a default name
        if (sessionName.length < 3) {
            sessionName = 'New Chat';
        }
        
        return sessionName;
    };

    // Update session name via API
    const updateSessionName = async (sessionId, name) => {
        if (!currentUser || !sessionId || !name) return;
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/chat-history/session/${sessionId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            if (response.ok) {
                console.log('Session name updated successfully:', name);
                // Refresh chat sessions to show updated name
                await loadChatSessions();
            } else {
                console.error('Failed to update session name:', response.status);
            }
        } catch (error) {
            console.error('Error updating session name:', error);
        }
    };

    const loadChatSessions = async () => {
        if (!currentUser) return [];
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/gemini/sessions`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                const sessions = data.sessions || [];
                setChatSessions(sessions);
                return sessions;
            } else {
                console.error('Failed to load chat sessions:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error loading chat sessions:', error);
            return [];
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
                if (data.success && data.data.messages && Array.isArray(data.data.messages)) {
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
                    
                    // Load bookmarks for this session
                    await loadBookmarkedMessages(sessionId);
                    
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

    // Load bookmarked messages for current session
    const loadBookmarkedMessages = async (sessionId) => {
        if (!currentUser || !sessionId) return;
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/gemini/bookmarks/${sessionId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.bookmarks) {
                    // Convert backend bookmarks to frontend format
                    const formattedBookmarks = data.bookmarks.map(bookmark => ({
                        key: `${sessionId}_${bookmark.messageIndex}_${bookmark.messageTimestamp}`,
                        content: bookmark.messageContent,
                        timestamp: bookmark.messageTimestamp,
                        role: bookmark.messageRole,
                        sessionId: sessionId
                    }));
                    setBookmarkedMessages(formattedBookmarks);
                }
            }
        } catch (error) {
            console.error('Error loading bookmarked messages:', error);
        }
    };

    const createNewSession = async () => {
        if (!currentUser) {
            toast.info('Please log in to create new sessions');
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
                    
                    // Clear bookmarks for new session
                    setBookmarkedMessages([]);
                    
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

    // Web Speech API for real-time transcription (fallback)
    const [isWebSpeechSupported, setIsWebSpeechSupported] = useState(false);
    const [webSpeechRecognition, setWebSpeechRecognition] = useState(null);

    // Check for Web Speech API support
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setIsWebSpeechSupported(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            setWebSpeechRecognition(recognition);
        }
    }, []);

    // Enhanced Features Functions
    const startVoiceRecording = async () => {
        // Prevent multiple simultaneous recordings
        if (isRecording) {
            console.log('Recording already in progress, ignoring start request');
            return;
        }
        
        try {
            // Cleanup any existing recording state
            if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(recordedAudioUrl);
            }
            setRecordedAudioUrl(null);
            setRecordedAudioFile(null);
            setAudioChunks([]);
            recordingChunksRef.current = [];
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            // Check supported MIME types (prioritize formats that work with backend)
            const supportedTypes = [
                'audio/wav',
                'video/webm',  // Backend expects video/webm for audio
                'video/mp4',   // Backend expects video/mp4 for audio
                'audio/webm',
                'audio/webm;codecs=opus'
            ];
            
            let selectedType = 'audio/wav';
            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedType = type;
                    break;
                }
            }
            
            console.log('Selected audio type:', selectedType);
            
            const recorder = new MediaRecorder(stream, { mimeType: selectedType });
            
            // Reset chunks array for new recording
            recordingChunksRef.current = [];
            console.log('Starting new recording, chunks reset');

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordingChunksRef.current.push(event.data);
                    // Only log every 25th chunk to reduce console spam
                    if (recordingChunksRef.current.length % 25 === 0) {
                        console.log('Recording progress:', recordingChunksRef.current.length, 'chunks');
                    }
                }
            };

            recorder.onstop = async () => {
                try {
                    // Get the current chunks from ref
                    const chunks = [...recordingChunksRef.current]; // Create a copy
                    console.log('Recording stopped, chunks:', chunks.length);
                    console.log('Chunks array:', chunks);
                    console.log('Ref current:', recordingChunksRef.current);
                    
                    if (chunks.length === 0) {
                        console.error('No chunks found in recordingChunksRef.current');
                        throw new Error('No audio data recorded');
                    }
                    
                    // Check if recording was too short
                    const totalSize = chunks.reduce((total, chunk) => total + chunk.size, 0);
                    if (totalSize < 1000) { // Less than 1KB
                        throw new Error('Recording too short, please record for at least 1 second');
                    }
                    
                    const audioBlob = new Blob(chunks, { type: selectedType });
                    console.log('Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);
                    
                    if (audioBlob.size === 0) {
                        throw new Error('Empty audio blob');
                    }
                    
                    // Skip blob test to avoid playback issues
                    console.log('Audio blob created successfully, skipping test');
                    
                    // Generate filename with proper extension
                    let extension = 'webm';
                    if (selectedType.includes('wav')) extension = 'wav';
                    else if (selectedType.includes('mp4')) extension = 'mp4';
                    else if (selectedType.includes('ogg')) extension = 'ogg';
                    else if (selectedType.includes('opus')) extension = 'webm';
                    
                    const fileName = `recording-${Date.now()}.${extension}`;
                    const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    console.log('Audio URL created:', audioUrl);
                    
                    // Store audio for preview and upload
                    setAudioChunks([audioBlob]);
                    setRecordedAudioFile(audioFile);
                    setRecordedAudioUrl(audioUrl);
                    setRecordedAudioType(selectedType);
                    
                    // Show audio preview
                    setShowAudioPreview(true);
                } catch (error) {
                    console.error('Error processing recording:', error);
                    toast.error('Failed to process recording: ' + error.message);
                } finally {
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            recorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                toast.error('Recording error occurred');
            };

            // Start recording with time slice for better data handling
            recorder.start(100);
            setMediaRecorder(recorder);
            setIsRecording(true);
            setAudioChunks([]);
            
            // Start recording timer
            setRecordingStartTime(Date.now());
        } catch (error) {
            console.error('Voice recording error:', error);
            toast.error('Microphone access denied or not available');
        }
    };

    const stopVoiceRecording = () => {
        if (mediaRecorder && isRecording) {
            console.log('Stopping recording...');
            if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
            setIsRecording(false);
            setRecordingStartTime(null);
            setRecordingDuration(0);
            // Don't clear chunks here - let onstop handle it
        } else {
            console.log('No active recording to stop');
        }
    };

    // Cleanup audio blob URL when component unmounts or when new recording starts
    useEffect(() => {
        return () => {
            if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(recordedAudioUrl);
            }
        };
    }, [recordedAudioUrl]);

    // Recording timer effect
    useEffect(() => {
        let interval;
        if (isRecording && recordingStartTime) {
            interval = setInterval(() => {
                setRecordingDuration(Math.floor((Date.now() - recordingStartTime) / 1000));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording, recordingStartTime]);

    // Upload audio to Cloudinary and get transcription
    const uploadAudioAndTranscribe = async (audioFile) => {
        try {
            setUploadingAudio(true);
            setUploadProgress(0);

            // Create new AbortController for this upload
            audioUploadAbortControllerRef.current = new AbortController();

            // Upload audio to Cloudinary
            const formData = new FormData();
            formData.append('audio', audioFile);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/upload/audio`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
                signal: audioUploadAbortControllerRef.current.signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Audio upload failed:', response.status, errorText);
                throw new Error(`Audio upload failed: ${response.status} - ${errorText}`);
            }

            const uploadData = await response.json();
            const audioUrl = uploadData.audioUrl;

            // Use real speech-to-text API for transcription
            try {
                const transcriptionResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/speech/transcribe`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        audioUrl: audioUrl
                    }),
                    signal: audioUploadAbortControllerRef.current.signal,
                });

                if (!transcriptionResponse.ok) {
                    const errorData = await transcriptionResponse.json();
                    
                    // Handle rate limiting with specific user feedback
                    if (transcriptionResponse.status === 429) {
                        const retryAfter = errorData.retryAfter || 60;
                        throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
                    }
                    
                    throw new Error(errorData.message || 'Transcription failed');
                }

                const transcriptionData = await transcriptionResponse.json();
                
                if (transcriptionData.success && transcriptionData.transcription) {
                    return {
                        audioUrl,
                        transcription: transcriptionData.transcription,
                        confidence: transcriptionData.confidence || 0,
                        language: transcriptionData.language || 'en',
                        duration: transcriptionData.duration || 0
                    };
                } else {
                    throw new Error('No transcription received');
                }
            } catch (transcriptionError) {
                console.error('Speech-to-text error:', transcriptionError);
                
                // Check if it's a rate limit error
                if (transcriptionError.message.includes('Rate limit exceeded')) {
                    return {
                        audioUrl,
                        transcription: 'I\'ve uploaded your audio recording, but the transcription service is currently experiencing high demand. Please describe what you said in the audio or what you need help with, and I\'ll assist you accordingly.'
                    };
                }
                
                // Fallback to asking user to describe their audio
                return {
                    audioUrl,
                    transcription: 'I\'ve uploaded an audio recording but had trouble transcribing it with Whisper AI. Please describe what you said in the audio or what you need help with, and I\'ll assist you accordingly.'
                };
            }

        } catch (error) {
            console.error('Audio upload/transcription error:', error);
            
            // Handle cancellation
            if (error.name === 'AbortError') {
                console.log('Audio upload/transcription cancelled by user');
                toast.info('Audio upload cancelled');
                return null; // Return null to indicate cancellation
            }
            
            toast.error('Failed to upload and transcribe audio with Whisper AI');
            throw error;
        } finally {
            setUploadingAudio(false);
            setUploadProgress(0);
            audioUploadAbortControllerRef.current = null;
        }
    };

    // Cancel audio upload/transcription
    const cancelAudioUpload = () => {
        if (audioUploadAbortControllerRef.current) {
            audioUploadAbortControllerRef.current.abort();
            audioUploadAbortControllerRef.current = null;
        }
        setUploadingAudio(false);
        setUploadProgress(0);
    };

    // Handle sending recorded audio
    const handleSendRecordedAudio = async () => {
        if (!recordedAudioFile) return;

        try {
            const result = await uploadAudioAndTranscribe(recordedAudioFile);
            
            // Check if upload was cancelled
            if (result === null) {
                return; // Upload was cancelled, do nothing
            }
            
            const { audioUrl, transcription } = result;
            
            // Add the transcribed message to input
            setInputMessage(transcription);
            
            // Close audio preview and voice input modals immediately
            setShowAudioPreview(false);
            setShowVoiceInput(false);
            
            // Cleanup blob URL
            if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(recordedAudioUrl);
            }
            
            // Clear all audio-related state
            setRecordedAudioUrl(null);
            setRecordedAudioFile(null);
            setAudioChunks([]);
            recordingChunksRef.current = [];
            
            // Auto-submit the transcribed message
            setTimeout(() => {
                handleSubmit(new Event('submit'));
            }, 100);

        } catch (error) {
            console.error('Error sending recorded audio:', error);
            
            // Show fallback option
            const shouldContinue = window.confirm(
                'Audio upload failed. Would you like to send a message about the audio recording instead?'
            );
            
            if (shouldContinue) {
                // Send a message about the audio instead
                setInputMessage('I recorded an audio message but had trouble uploading it. Please help me with my question.');
                
                // Close audio preview and voice input modals
                setShowAudioPreview(false);
                setShowVoiceInput(false);
                if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(recordedAudioUrl);
                }
                setRecordedAudioUrl(null);
                setRecordedAudioFile(null);
                setAudioChunks([]);
                recordingChunksRef.current = [];
                
                // Auto-submit the fallback message
                setTimeout(() => {
                    handleSubmit(new Event('submit'));
                }, 100);
            } else {
                toast.error('Audio upload failed. Please try recording again.');
            }
        }
    };

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        
        if (files.length === 0) {
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const validAudioTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/webm'];
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/mkv'];
        const validDocTypes = ['application/pdf', 'text/plain', 'text/csv', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        
        const allValidTypes = [...validImageTypes, ...validAudioTypes, ...validVideoTypes, ...validDocTypes];

        const validFiles = [];
        const rejectedFiles = [];

        files.forEach(file => {
            if (file.size > maxSize) {
                rejectedFiles.push(`${file.name} (too large - max 10MB)`);
            } else if (!allValidTypes.includes(file.type)) {
                rejectedFiles.push(`${file.name} (unsupported format)`);
            } else {
                validFiles.push(file);
            }
        });

        // Show error messages for rejected files
        if (rejectedFiles.length > 0) {
            toast.error(`Rejected files: ${rejectedFiles.join(', ')}`);
        }

        // Upload valid files immediately and close modal
        if (validFiles.length > 0) {
            await uploadFilesAndSend(validFiles);
            setShowFileUpload(false);
        }

        // Clear the input so the same file can be selected again
        event.target.value = '';
    };

    // Upload files to Cloudinary and send to chat
    const uploadFilesAndSend = async (files) => {
        try {
            setUploadingFile(true);
            setUploadProgress(0);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));

                let uploadEndpoint = '';
                let formData = new FormData();

                // Determine upload endpoint based on file type
                if (file.type.startsWith('image/')) {
                    uploadEndpoint = '/api/upload/image';
                    formData.append('image', file);
                } else if (file.type.startsWith('audio/')) {
                    uploadEndpoint = '/api/upload/audio';
                    formData.append('audio', file);
                } else if (file.type.startsWith('video/')) {
                    uploadEndpoint = '/api/upload/video';
                    formData.append('video', file);
                } else {
                    uploadEndpoint = '/api/upload/document';
                    formData.append('document', file);
                }

                // Upload to Cloudinary
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${uploadEndpoint}`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }

                const uploadData = await response.json();
                
                // Send to Gemini chat with file context
                const fileType = file.type.startsWith('image/') ? 'image' : 
                                file.type.startsWith('audio/') ? 'audio' : 
                                file.type.startsWith('video/') ? 'video' : 'document';
                
                const fileUrl = uploadData.imageUrl || uploadData.audioUrl || uploadData.videoUrl || uploadData.documentUrl;
                
                // Create a message with file context
                const messageWithFile = `I've uploaded a ${fileType} file: ${file.name}. Please analyze it and help me with it. File URL: ${fileUrl}`;
                
                // Add to input and auto-send
                setInputMessage(messageWithFile);
                
                // Auto-submit after a short delay
                setTimeout(() => {
                    handleSubmit(new Event('submit'));
                }, 100);
            }

            toast.success(`${files.length} file(s) uploaded and sent successfully`);
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Failed to upload files');
        } finally {
            setUploadingFile(false);
            setUploadProgress(0);
        }
    };

    const removeUploadedFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        setUserSetting('gemini_dark_mode', newDarkMode.toString());
    };

    // Helper functions for new settings
    const updateFontSize = (size) => {
        setFontSize(size);
        setUserSetting('gemini_font_size', size);
    };

    const updateMessageDensity = (density) => {
        setMessageDensity(density);
        setUserSetting('gemini_message_density', density);
    };

    const updateAutoScroll = (enabled) => {
        setAutoScroll(enabled);
        setUserSetting('gemini_auto_scroll', enabled.toString());
    };

    const updateShowTimestamps = (enabled) => {
        setShowTimestamps(enabled);
        setUserSetting('gemini_show_timestamps', enabled.toString());
    };

    const updateAiResponseLength = (length) => {
        setAiResponseLength(length);
        setUserSetting('gemini_response_length', length);
    };

    const updateAiCreativity = (creativity) => {
        setAiCreativity(creativity);
        setUserSetting('gemini_creativity', creativity);
    };

    const updateSoundEnabled = (enabled) => {
        setSoundEnabled(enabled);
        setUserSetting('gemini_sound_enabled', enabled.toString());
    };

    const updateTypingSounds = (enabled) => {
        setTypingSounds(enabled);
        setUserSetting('gemini_typing_sounds', enabled.toString());
    };

    const updateDataRetention = (days) => {
        setDataRetention(days);
        setUserSetting('gemini_data_retention', days);
    };

    // Advanced Settings Helper Functions
    const updateAutoSave = (enabled) => {
        setAutoSave(enabled);
        setUserSetting('gemini_auto_save', enabled.toString());
    };

    const updateMessageLimit = (limit) => {
        setMessageLimit(limit);
        setUserSetting('gemini_message_limit', limit);
    };

    const updateSessionTimeout = (timeout) => {
        setSessionTimeout(timeout);
        setUserSetting('gemini_session_timeout', timeout);
    };

    const updateEnableMarkdown = (enabled) => {
        setEnableMarkdown(enabled);
        setUserSetting('gemini_enable_markdown', enabled.toString());
    };

    const updateEnableCodeHighlighting = (enabled) => {
        setEnableCodeHighlighting(enabled);
        setUserSetting('gemini_code_highlighting', enabled.toString());
    };

    const updateEnableEmojiReactions = (enabled) => {
        setEnableEmojiReactions(enabled);
        setUserSetting('gemini_emoji_reactions', enabled.toString());
    };

    const updateEnableMessageSearch = (enabled) => {
        setEnableMessageSearch(enabled);
        setUserSetting('gemini_message_search', enabled.toString());
    };

    const updateEnableQuickActions = (enabled) => {
        setEnableQuickActions(enabled);
        setUserSetting('gemini_quick_actions', enabled.toString());
    };

    const updateEnableSmartSuggestions = (enabled) => {
        setEnableSmartSuggestions(enabled);
        setUserSetting('gemini_smart_suggestions', enabled.toString());
    };

    const updateEnableTypingIndicator = (enabled) => {
        setEnableTypingIndicator(enabled);
        setUserSetting('gemini_typing_indicator', enabled.toString());
    };

    // Accessibility Settings Helper Functions
    const updateHighContrast = (enabled) => {
        setHighContrast(enabled);
        setUserSetting('gemini_high_contrast', enabled.toString());
    };

    const updateReducedMotion = (enabled) => {
        setReducedMotion(enabled);
        setUserSetting('gemini_reduced_motion', enabled.toString());
    };

    const updateScreenReaderSupport = (enabled) => {
        setScreenReaderSupport(enabled);
        setUserSetting('gemini_screen_reader', enabled.toString());
    };

    const updateLargeText = (enabled) => {
        setLargeText(enabled);
        setUserSetting('gemini_large_text', enabled.toString());
    };

    const updateKeyboardNavigation = (enabled) => {
        setKeyboardNavigation(enabled);
        setUserSetting('gemini_keyboard_nav', enabled.toString());
    };

    // Performance Settings Helper Functions
    const updateMessageCaching = (enabled) => {
        setMessageCaching(enabled);
        setUserSetting('gemini_message_caching', enabled.toString());
    };

    const updateLazyLoading = (enabled) => {
        setLazyLoading(enabled);
        setUserSetting('gemini_lazy_loading', enabled.toString());
    };

    const updateImageOptimization = (enabled) => {
        setImageOptimization(enabled);
        setUserSetting('gemini_image_optimization', enabled.toString());
    };

    const updatePreloadMessages = (enabled) => {
        setPreloadMessages(enabled);
        setUserSetting('gemini_preload_messages', enabled.toString());
    };

    const updateBatchOperations = (enabled) => {
        setBatchOperations(enabled);
        setUserSetting('gemini_batch_operations', enabled.toString());
    };

    // Privacy Settings Helper Functions
    const updateEnableAnalytics = (enabled) => {
        setEnableAnalytics(enabled);
        setUserSetting('gemini_analytics', enabled.toString());
    };

    const updateEnableErrorReporting = (enabled) => {
        setEnableErrorReporting(enabled);
        setUserSetting('gemini_error_reporting', enabled.toString());
    };

    const updateEnableUsageTracking = (enabled) => {
        setEnableUsageTracking(enabled);
        setUserSetting('gemini_usage_tracking', enabled.toString());
    };

    const updateEnableCrashReports = (enabled) => {
        setEnableCrashReports(enabled);
        setUserSetting('gemini_crash_reports', enabled.toString());
    };

    const updateEnablePerformanceMonitoring = (enabled) => {
        setEnablePerformanceMonitoring(enabled);
        setUserSetting('gemini_performance_monitoring', enabled.toString());
    };

    // Advanced AI Settings Helper Functions
    const updateTemperature = (value) => {
        setTemperature(value);
        setUserSetting('gemini_temperature', value);
    };

    const updateTopP = (value) => {
        setTopP(value);
        setUserSetting('gemini_top_p', value);
    };

    const updateTopK = (value) => {
        setTopK(value);
        setUserSetting('gemini_top_k', value);
    };

    const updateMaxTokens = (value) => {
        setMaxTokens(value);
        setUserSetting('gemini_max_tokens', value);
    };

    const updateEnableStreaming = (enabled) => {
        setEnableStreaming(enabled);
        setUserSetting('gemini_streaming', enabled.toString());
    };

    const updateEnableContextMemory = (enabled) => {
        setEnableContextMemory(enabled);
        setUserSetting('gemini_context_memory', enabled.toString());
    };

    const updateContextWindow = (value) => {
        setContextWindow(value);
        setUserSetting('gemini_context_window', value);
    };

    const updateEnableSystemPrompts = (enabled) => {
        setEnableSystemPrompts(enabled);
        setUserSetting('gemini_system_prompts', enabled.toString());
    };

    // Notification Settings Helper Functions
    const updateEnableDesktopNotifications = (enabled) => {
        setEnableDesktopNotifications(enabled);
        setUserSetting('gemini_desktop_notifications', enabled.toString());
    };

    const updateEnableEmailNotifications = (enabled) => {
        setEnableEmailNotifications(enabled);
        setUserSetting('gemini_email_notifications', enabled.toString());
    };

    const updateEnablePushNotifications = (enabled) => {
        setEnablePushNotifications(enabled);
        setUserSetting('gemini_push_notifications', enabled.toString());
    };

    const updateNotificationSound = (sound) => {
        setNotificationSound(sound);
        setUserSetting('gemini_notification_sound', sound);
    };

    const updateNotificationFrequency = (frequency) => {
        setNotificationFrequency(frequency);
        setUserSetting('gemini_notification_frequency', frequency);
    };

    // UI/UX Settings Helper Functions
    const updateEnableAnimations = (enabled) => {
        setEnableAnimations(enabled);
        setUserSetting('gemini_animations', enabled.toString());
    };

    const updateEnableHoverEffects = (enabled) => {
        setEnableHoverEffects(enabled);
        setUserSetting('gemini_hover_effects', enabled.toString());
    };

    const updateEnableTransitions = (enabled) => {
        setEnableTransitions(enabled);
        setUserSetting('gemini_transitions', enabled.toString());
    };

    const updateEnableTooltips = (enabled) => {
        setEnableTooltips(enabled);
        setUserSetting('gemini_tooltips', enabled.toString());
    };

    const updateEnableKeyboardShortcuts = (enabled) => {
        setEnableKeyboardShortcuts(enabled);
        setUserSetting('gemini_keyboard_shortcuts', enabled.toString());
    };

    const updateEnableDragAndDrop = (enabled) => {
        setEnableDragAndDrop(enabled);
        setUserSetting('gemini_drag_drop', enabled.toString());
    };

    const updateEnableRightClickMenu = (enabled) => {
        setEnableRightClickMenu(enabled);
        setUserSetting('gemini_right_click', enabled.toString());
    };

    const updateEnableContextMenu = (enabled) => {
        setEnableContextMenu(enabled);
        setUserSetting('gemini_context_menu', enabled.toString());
    };

    const createCustomTheme = (primaryColor, secondaryColor) => {
        const customThemeData = {
            primary: `from-${primaryColor}-600 to-${secondaryColor}-600`,
            secondary: `bg-${primaryColor}-50`,
            accent: `text-${primaryColor}-600`,
            border: `border-${primaryColor}-200`
        };
        setCustomTheme(customThemeData);
        setUserSetting('gemini_custom_theme', JSON.stringify(customThemeData));
        setSelectedTheme('custom');
        setUserSetting('gemini_theme', 'custom');
    };

    // Sound playing functions
    const playSound = (soundFile) => {
        if (!soundEnabled) return;
        try {
            const audio = new Audio(`/sounds/${soundFile}`);
            audio.volume = 0.3; // Lower volume to not be intrusive
            audio.play().catch(error => {
                console.warn('Could not play sound:', error);
            });
        } catch (error) {
            console.warn('Sound file not found or error playing sound:', error);
        }
    };

    const playTypingSound = () => {
        if (!soundEnabled || !typingSounds) return;
        try {
            const audio = new Audio('/sounds/typing.mp3');
            audio.volume = 0.2; // Even lower volume for typing
            audio.play().catch(error => {
                console.warn('Could not play typing sound:', error);
            });
        } catch (error) {
            console.warn('Typing sound file not found or error playing sound:', error);
        }
    };

    // Debounced typing sound function
    const handleTyping = () => {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Play typing sound immediately
        playTypingSound();
        
        // Set timeout to play sound again after 500ms of no typing
        typingTimeoutRef.current = setTimeout(() => {
            // This will be called if user stops typing for 500ms
        }, 500);
    };

    // Data retention cleanup function
    const cleanupOldData = async () => {
        try {
            if (dataRetention === '0') return; // Forever - no cleanup
            
            const retentionDays = parseInt(dataRetention);
            if (isNaN(retentionDays) || retentionDays <= 0) return; // Invalid retention days
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            
            console.log(`Data retention cleanup: removing data older than ${retentionDays} days (${cutoffDate.toISOString()})`);
            
            // Clean up old chat sessions
            if (currentUser) {
                loadChatSessions().then(async sessions => {
                    // Check if sessions is an array before filtering
                    if (Array.isArray(sessions) && sessions.length > 0) {
                        const sessionsToDelete = sessions.filter(session => {
                            try {
                                const sessionDate = new Date(session.createdAt || session.timestamp);
                                return sessionDate < cutoffDate;
                            } catch (error) {
                                console.warn('Invalid session date:', session, error);
                                return false;
                            }
                        });
                        
                        console.log(`Found ${sessionsToDelete.length} old sessions to delete`);
                        
                        // Delete sessions with a small delay between each to avoid overwhelming the server
                        for (let i = 0; i < sessionsToDelete.length; i++) {
                            const session = sessionsToDelete[i];
                            try {
                                console.log(`Deleting session ${i + 1}/${sessionsToDelete.length}:`, session.sessionId);
                                await deleteSession(session.sessionId);
                                
                                // Small delay between deletions
                                if (i < sessionsToDelete.length - 1) {
                                    await new Promise(resolve => setTimeout(resolve, 100));
                                }
                            } catch (error) {
                                console.error('Error deleting session:', session, error);
                            }
                        }
                    }
                }).catch(error => {
                    console.error('Error loading chat sessions for cleanup:', error);
                });
            }
            
            // Clean up old messages from current session
            setMessages(prev => {
                if (Array.isArray(prev) && prev.length > 0) {
                    const filteredMessages = prev.filter(message => {
                        try {
                            const messageDate = new Date(message.timestamp);
                            return messageDate >= cutoffDate;
                        } catch (error) {
                            console.warn('Invalid message date:', message, error);
                            return true; // Keep message if date is invalid
                        }
                    });
                    
                    if (filteredMessages.length !== prev.length) {
                        console.log(`Cleaned up ${prev.length - filteredMessages.length} old messages from current session`);
                    }
                    
                    return filteredMessages;
                }
                return prev;
            });
        } catch (error) {
            console.error('Error in data retention cleanup:', error);
        }
    };

    const handleSmartSuggestion = (suggestion) => {
        setInputMessage(suggestion);
        // Don't permanently disable smart suggestions - they should be controlled by message count
        inputRef.current?.focus();
    };

    const searchInMessages = (query) => {
        if (!query.trim()) {
            setFilteredMessages([]);
            return;
        }

        const filtered = messages.map((message, index) => ({
            ...message,
            originalIndex: index
        })).filter(message => 
            message.content.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredMessages(filtered);
    };

    const handleSearchResultClick = (message) => {
        // Close the search modal
        setShowSearchInChat(false);
        setSearchQuery('');
        setFilteredMessages([]);
        
        // Find the original message index
        const originalIndex = message.originalIndex;
        
        // Highlight the message
        setHighlightedMessage(originalIndex);
        
        // Scroll to the message
        setTimeout(() => {
            const messageElement = document.querySelector(`[data-message-index="${originalIndex}"]`);
            if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
            setHighlightedMessage(null);
        }, 3000);
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
        // If custom theme is selected and exists, use it
        if (selectedTheme === 'custom' && customTheme) {
            return {
                primary: customTheme.primary,
                secondary: customTheme.secondary,
                accent: customTheme.accent,
                border: customTheme.border
            };
        }

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
            },
            red: {
                primary: 'from-red-600 to-pink-600',
                secondary: 'bg-red-50',
                accent: 'text-red-600',
                border: 'border-red-200'
            },
            indigo: {
                primary: 'from-indigo-600 to-blue-600',
                secondary: 'bg-indigo-50',
                accent: 'text-indigo-600',
                border: 'border-indigo-200'
            },
            teal: {
                primary: 'from-teal-600 to-cyan-600',
                secondary: 'bg-teal-50',
                accent: 'text-teal-600',
                border: 'border-teal-200'
            },
            pink: {
                primary: 'from-pink-600 to-rose-600',
                secondary: 'bg-pink-50',
                accent: 'text-pink-600',
                border: 'border-pink-200'
            },
            yellow: {
                primary: 'from-yellow-500 to-orange-500',
                secondary: 'bg-yellow-50',
                accent: 'text-yellow-600',
                border: 'border-yellow-200'
            },
            cyan: {
                primary: 'from-cyan-600 to-blue-600',
                secondary: 'bg-cyan-50',
                accent: 'text-cyan-600',
                border: 'border-cyan-200'
            },
            custom: {
                primary: customTheme?.primary || 'from-blue-600 to-purple-600',
                secondary: customTheme?.secondary || 'bg-blue-50',
                accent: customTheme?.accent || 'text-blue-600',
                border: customTheme?.border || 'border-blue-200'
            }
        };
        return themes[selectedTheme] || themes.blue;
    };

    const themeColors = getThemeColors();

    // Apply accessibility settings
    const getAccessibilityClasses = () => {
        let classes = '';
        if (highContrast) classes += ' high-contrast';
        if (reducedMotion) classes += ' reduced-motion';
        if (largeText) classes += ' large-text';
        if (screenReaderSupport) classes += ' screen-reader-support';
        return classes;
    };

    // Helper function for toggle switch styling that considers high contrast mode
    const getToggleSwitchClasses = (isEnabled) => {
        if (isEnabled) {
            return 'w-12 h-6 rounded-full transition-colors bg-blue-600';
        } else {
            // Use darker gray for disabled state when high contrast is enabled
            return `w-12 h-6 rounded-full transition-colors ${highContrast ? 'bg-gray-600' : 'bg-gray-300'}`;
        }
    };

    // Simple link formatting function
    const formatTextWithLinks = (text, isSentMessage = false) => {
        if (!text || typeof text !== 'string') return text;

        // Simple URL regex pattern
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]{2,}(?:\/[^\s]*)?|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
        
        const parts = text.split(urlRegex);
        
        return parts.map((part, index) => {
            // Check if this part is a URL
            if (urlRegex.test(part)) {
                // Ensure URL has protocol
                let url = part;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                
                // Different styling for sent vs received messages
                const linkClasses = isSentMessage 
                    ? "text-white hover:text-blue-200 underline transition-colors duration-200 cursor-pointer" 
                    : "text-blue-600 hover:text-blue-800 underline transition-colors duration-200 cursor-pointer";
                
                return (
                    <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClasses}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            
            return part;
        });
    };

    // Enhanced markdown rendering function with code highlighting
    const renderMarkdown = (text) => {
        if (!enableMarkdown) return text;
        
        let processedText = text;
        
        // Process code blocks first (before other markdown)
        processedText = processedText.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, language, code) => {
            let lang = language || 'text';
            const cleanCode = code.trim();
            
            // Map common language aliases to Prism.js language names
            const languageMap = {
                'html': 'markup',
                'xml': 'markup',
                'svg': 'markup',
                'js': 'javascript',
                'py': 'python',
                'sh': 'bash',
                'shell': 'bash',
                'md': 'markdown'
            };
            
            lang = languageMap[lang] || lang;
            
            if (enableCodeHighlighting) {
                try {
                    // Highlight the code with Prism.js
                    const highlightedCode = Prism.highlight(cleanCode, Prism.languages[lang] || Prism.languages.text, lang);
                    return `<div class="code-block"><pre class="bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-200 p-4 rounded-lg overflow-x-auto my-4 border border-gray-700 dark:border-gray-600"><code class="language-${lang}">${highlightedCode}</code></pre></div>`;
                } catch (error) {
                    console.warn('Code highlighting failed:', error);
                    return `<div class="code-block"><pre class="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-4 rounded-lg overflow-x-auto my-4 border border-gray-300 dark:border-gray-600"><code class="language-${lang}">${cleanCode}</code></pre></div>`;
                }
            } else {
                return `<div class="code-block"><pre class="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-4 rounded-lg overflow-x-auto my-4 border border-gray-300 dark:border-gray-600"><code class="language-${lang}">${cleanCode}</code></pre></div>`;
            }
        });
        
        // Process inline code
        processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 px-2 py-1 rounded text-sm font-mono border border-gray-300 dark:border-gray-600">$1</code>');
        
        // Process other markdown elements
        processedText = processedText
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-black dark:text-white">$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em class="italic text-black dark:text-white">$1</em>') // Italic
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-black dark:text-white">$1</h3>') // H3
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2 text-black dark:text-white">$1</h2>') // H2
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2 text-black dark:text-white">$1</h1>') // H1
            .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-black dark:text-white">$1</li>') // Bullet points
            .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-black dark:text-white">$1</li>') // Numbered lists
            .replace(/\n/g, '<br>'); // Line breaks
        
        return processedText;
    };

    // Combined function to render text with both links and markdown
    const renderTextWithMarkdownAndLinks = (text, isSentMessage = false) => {
        if (!text || typeof text !== 'string') return text;

        // If markdown is disabled, just use link formatting
        if (!enableMarkdown) {
            return formatTextWithLinks(text, isSentMessage);
        }

        // First process markdown
        const markdownProcessed = renderMarkdown(text);
        
        // Then process links in the markdown-processed text
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]{2,}(?:\/[^\s]*)?|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
        
        // Split by URLs and process each part
        const parts = markdownProcessed.split(urlRegex);
        
        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                let url = part;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                
                const linkClasses = isSentMessage 
                    ? "text-white hover:text-blue-200 underline transition-colors duration-200 cursor-pointer" 
                    : "text-blue-600 hover:text-blue-800 underline transition-colors duration-200 cursor-pointer";
                
                return (
                    <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClasses}
                        onClick={(e) => e.stopPropagation()}
                        dangerouslySetInnerHTML={{ __html: part }}
                    />
                );
            }
            return <span key={index} className={isSentMessage ? "text-white" : "text-gray-800 dark:text-gray-100"} dangerouslySetInnerHTML={{ __html: part }} />;
        });
    };

    // Analytics tracking
    const trackEvent = (eventName, data = {}) => {
        if (!enableAnalytics) return;
        
        // Simple analytics tracking
        const event = {
            event: eventName,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id || 'anonymous',
            sessionId: getOrCreateSessionId(),
            data: data
        };
        
        // Store in localStorage for now (in production, send to analytics service)
        const analyticsData = localStorage.getItem('gemini_analytics');
        let analytics = [];
        try {
            const parsed = JSON.parse(analyticsData || '[]');
            analytics = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('Corrupted analytics data, resetting:', error);
            analytics = [];
        }
        analytics.push(event);
        localStorage.setItem('gemini_analytics', JSON.stringify(analytics.slice(-100))); // Keep last 100 events
    };

    // Error reporting
    const reportError = (error, context = {}) => {
        if (!enableErrorReporting) return;
        
        const errorReport = {
            error: error.message || error,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id || 'anonymous',
            sessionId: getOrCreateSessionId(),
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store in localStorage for now (in production, send to error reporting service)
        const errorsData = localStorage.getItem('gemini_errors');
        let errors = [];
        try {
            const parsed = JSON.parse(errorsData || '[]');
            errors = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('Corrupted errors data, resetting:', error);
            errors = [];
        }
        errors.push(errorReport);
        localStorage.setItem('gemini_errors', JSON.stringify(errors.slice(-50))); // Keep last 50 errors
        
        console.error('Error reported:', errorReport);
    };

    // Save current session to backend
    const saveCurrentSession = async () => {
        if (!currentUser || messages.length === 0) {
            console.log('Auto-save skipped: No user or no messages');
            return;
        }
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const currentSessionId = getOrCreateSessionId();
            
            if (!currentSessionId) {
                console.log('Auto-save skipped: No session ID');
                return;
            }
            
            console.log('Auto-saving session:', currentSessionId, 'Messages:', messages.length);
            
            const saveResponse = await fetch(`${API_BASE_URL}/api/chat-history/session/${currentSessionId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: messages,
                    name: `Chat ${new Date().toLocaleDateString()}`,
                    totalMessages: messages.length,
                    lastActivity: new Date().toISOString()
                })
            });
            
            if (saveResponse.ok) {
                console.log('Session auto-saved successfully');
            } else {
                console.error('Failed to auto-save current session:', saveResponse.status, saveResponse.statusText);
            }
        } catch (error) {
            console.error('Error auto-saving session:', error);
            // Only report error if it's not a network issue for anonymous users
            if (currentUser) {
                reportError(error, { action: 'auto_save_session' });
            }
        }
    };

    // Get dynamic classes based on settings
    const getFontSizeClass = () => {
        switch (fontSize) {
            case 'small': return 'text-sm';
            case 'large': return 'text-lg';
            default: return 'text-base';
        }
    };

    const getMessageDensityClass = () => {
        switch (messageDensity) {
            case 'compact': return 'py-2 px-3';
            case 'spacious': return 'py-6 px-4';
            default: return 'py-4 px-3';
        }
    };

    return (
        <>
            {/* Enhanced Floating AI Chat Button */}
            <div className="fixed bottom-20 right-6 z-50">
                <div className="relative">
                    {/* Quick Action Buttons */}
                    {!isOpen && (
                        <div className="absolute bottom-16 right-0 flex flex-col gap-2 opacity-0 hover:opacity-100 transition-all duration-300">
                            <button
                                onClick={() => {
                                    if (!currentUser) {
                                        toast.info('Please login to use voice input');
                                        return;
                                    }
                                    setIsOpen(true);
                                    setTimeout(() => setShowVoiceInput(true), 100);
                                }}
                                className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                title="Voice Input"
                            >
                                <FaMicrophone size={14} />
                            </button>
                            <button
                                onClick={() => {
                                    if (!currentUser) {
                                        toast.info('Please login to upload files');
                                        return;
                                    }
                                    setIsOpen(true);
                                    setTimeout(() => setShowFileUpload(true), 100);
                                }}
                                className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                title="Upload File"
                            >
                                <FaUpload size={14} />
                            </button>
                        </div>
                    )}
                    
                    <button
                        onClick={isOpen ? handleClose : handleOpen}
                        className={`relative group w-12 h-12 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 flex items-center justify-center ${
                            isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : `bg-gradient-to-br ${themeColors.primary}`
                        }`}
                        style={{ 
                            boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.3)' : `0 10px 25px ${getThemeRingColor()}40`
                        }}
                        aria-label="Open AI Chat"
                        title="Chat with Gemini AI Assistant!"
                    >
                        {/* Animated background ring */}
                        <div
                            className={`absolute inset-0 rounded-full animate-ping`}
                            style={{
                                border: `3px solid ${isDarkMode ? '#4b5563' : getThemeRingColor()}`,
                            }}
                        ></div>
                        
                        {/* Icon with sparkle effect */}
                        <div className="relative">
                            {isOpen ? (
                                <FaTimes className="w-5 h-5 text-white drop-shadow-lg" />
                            ) : (
                                <div className="relative">
                                    <FaComments className="w-5 h-5 text-white drop-shadow-lg" />
                                    <FaStar className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-pulse" />
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
                <div 
                    className={`fixed inset-0 ${isDarkMode ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50 p-4 md:p-0 md:items-end md:justify-end gemini-chatbox-modal animate-fadeIn${getAccessibilityClasses()}`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="chat-title"
                    aria-describedby="chat-description"
                >
                    <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl border flex flex-col relative ${
                        isFullscreen ? 'w-full h-full max-w-none max-h-none rounded-none' :
                        isExpanded ? 'w-full max-w-4xl h-[85vh] md:mb-12 md:mr-12' : 
                        'w-full max-w-md h-full max-h-[90vh] md:w-96 md:h-[500px] md:mb-32 md:mr-6 md:max-h-[500px]'
                    } animate-slideUp`}>
                        {/* Screen reader only elements */}
                        {screenReaderSupport && (
                            <>
                                <h1 id="chat-title" className="sr-only">Gemini AI Chat Assistant</h1>
                                <div id="chat-description" className="sr-only">
                                    Interactive chat interface with Gemini AI assistant. You can send messages, receive responses, and access various features like voice input, file upload, and settings.
                                </div>
                                <div 
                                    id="screen-reader-announcements" 
                                    className="sr-only" 
                                    aria-live="polite" 
                                    aria-atomic="true"
                                    role="status"
                                    aria-label="New message announcements"
                                    aria-relevant="additions text"
                                >
                                    {/* This will be updated to announce new messages */}
                                </div>
                                <div 
                                    id="screen-reader-status" 
                                    className="sr-only" 
                                    aria-live="assertive" 
                                    aria-atomic="true"
                                    role="status"
                                    aria-label="Status announcements"
                                >
                                    {/* This will be updated to announce status changes */}
                                </div>
                            </>
                        )}
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
                                
                                <button
                                    ref={headerMenuButtonRef}
                                    onClick={() => setIsHeaderMenuOpen(open => !open)}
                                    className={`group relative inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                                        isHeaderMenuOpen 
                                            ? 'bg-white/20 text-white shadow-lg scale-105' 
                                            : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105'
                                    }`}
                                    title="More options"
                                    aria-label="More options"
                                >
                                    <div className={`flex flex-col items-center justify-center space-y-0.5 transition-all duration-200 ${
                                        isHeaderMenuOpen ? 'rotate-90' : 'group-hover:scale-110'
                                    }`}>
                                        <div className={`w-1 h-1 rounded-full bg-current transition-all duration-200 ${
                                            isHeaderMenuOpen ? 'w-1.5 h-1.5' : ''
                                        }`}></div>
                                        <div className={`w-1 h-1 rounded-full bg-current transition-all duration-200 ${
                                            isHeaderMenuOpen ? 'w-1.5 h-1.5' : ''
                                        }`}></div>
                                        <div className={`w-1 h-1 rounded-full bg-current transition-all duration-200 ${
                                            isHeaderMenuOpen ? 'w-1.5 h-1.5' : ''
                                        }`}></div>
                                    </div>
                                    
                                    {/* Subtle glow effect when open */}
                                    {isHeaderMenuOpen && (
                                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
                                    )}
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
                                    <div ref={headerMenuRef} className={`absolute right-0 top-full mt-3 ${isDarkMode ? 'bg-gray-800/95 text-gray-200 border-gray-600' : 'bg-white/95 text-gray-800 border-gray-200'} rounded-xl shadow-2xl border backdrop-blur-sm w-64 z-50 animate-slideDown`}>
                                        <ul className="py-2 text-sm">
                                            {/* New Chat */}
                                            <li>
                                                <button
                                                    onClick={() => { createNewSession(); setIsHeaderMenuOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                        <FaComments size={14} className="text-blue-500" />
                                                    </div>
                                                    <span className="font-medium">New Chat</span>
                                                </button>
                                            </li>
                                            
                                            <li className={`border-t ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'} my-2`}></li>
                                            
                                            {/* Theme & Settings */}
                                            <li>
                                                <button
                                                    onClick={() => { setShowSettings(true); setIsHeaderMenuOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                        <FaPalette size={14} className="text-purple-500" />
                                                    </div>
                                                    <span className="font-medium">Theme & Settings</span>
                                                </button>
                                            </li>

                                            {/* Search in Chat */}
                                            <li>
                                                <button
                                                    onClick={() => { setShowSearchInChat(true); setIsHeaderMenuOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                        <FaSearch size={14} className="text-blue-500" />
                                                    </div>
                                                    <span className="font-medium">Search in Chat</span>
                                                </button>
                                            </li>

                                            {/* Refresh Messages */}
                                            <li>
                                                <button
                                                    onClick={() => { refreshMessages(); setIsHeaderMenuOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                                                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                                                        </svg>
                                                    </div>
                                                    <span className="font-medium">Refresh Messages</span>
                                                </button>
                                            </li>

                                            {/* Fullscreen toggle */}
                                            <li>
                                                <button
                                                    onClick={() => { setIsFullscreen(!isFullscreen); setIsHeaderMenuOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-gray-500/20' : 'bg-gray-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                        {isFullscreen ? <FaCompress size={14} className="text-gray-600" /> : <FaExpand size={14} className="text-gray-600" />}
                                                    </div>
                                                    <span className="font-medium">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                                                </button>
                                            </li>

                                            <li className={`border-t ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'} my-2`}></li>
                                            
                                            {/* Quick Actions */}
                                            <li>
                                                <button
                                                    onClick={() => { setShowQuickActions(true); setIsHeaderMenuOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                        <FaLightbulb size={14} className="text-yellow-500" />
                                                    </div>
                                                    <span className="font-medium">Quick Actions</span>
                                                </button>
                                            </li>
                                            
                                            {/* Bookmarks - Only for logged-in users */}
                                            {currentUser && (
                                                <li>
                                                    <button
                                                        onClick={() => { setShowBookmarks(true); loadChatSessions(); setIsHeaderMenuOpen(false); }}
                                                        className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                    >
                                                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                            <FaBookmark size={14} className="text-yellow-500" />
                                                        </div>
                                                        <span className="font-medium">Bookmarks</span>
                                                    </button>
                                                </li>
                                            )}
                                            
                                            {/* Chat History */}
                                            <li>
                                                <button
                                                    onClick={() => { setShowHistory(true); loadChatSessions(); setIsHeaderMenuOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                        <FaHistory size={14} className="text-blue-500" />
                                                    </div>
                                                    <span className="font-medium">Chat History</span>
                                                </button>
                                            </li>
                                            
                                            <li className={`border-t ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'} my-2`}></li>
                                            
                                            {/* Expand/Collapse only on desktop */}
                                            <li className="hidden md:block">
                                                <button
                                                    onClick={() => { setIsExpanded(expanded => !expanded); setIsHeaderMenuOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-gray-500/20' : 'bg-gray-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
                                                            <path d="M4 4h7v2H6v5H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z"/>
                                                        </svg>
                                                    </div>
                                                    <span className="font-medium">{isExpanded ? 'Collapse' : 'Expand'}</span>
                                                </button>
                                            </li>
                                            
                                            {/* Save current chat */}
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
                                                            toast.error('Failed to save chat');
                                                        }
                                                    }}
                                                    className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                        <FaDownload size={14} className="text-green-500" />
                                                    </div>
                                                    <span className="font-medium">Save Chat</span>
                                                </button>
                                            </li>
                                            
                                            {/* Clear */}
                                            {(messages && (messages.length > 1 || messages.some(m => m.role === 'user'))) && (
                                                <li>
                                                    <button
                                                        onClick={() => { setIsHeaderMenuOpen(false); setShowConfirmClear(true); }}
                                                        className={`w-full text-left px-4 py-3 ${isDarkMode ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'} flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group`}
                                                    >
                                                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'} group-hover:scale-110 transition-transform duration-200`}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                                            </svg>
                                                        </div>
                                                        <span className="font-medium">Clear Chat</span>
                                                    </button>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages with date dividers */}
                        <div 
                            ref={messagesContainerRef} 
                            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 relative"
                            role="log"
                            aria-live={screenReaderSupport ? "polite" : "off"}
                            aria-label="Chat messages"
                        >
                            {/* Floating Date Indicator (sticky below header) */}
                            {floatingDateLabel && (
                                <div className={`sticky top-0 left-0 right-0 z-30 pointer-events-none transition-all duration-500 ease-out ${
                                    isScrolling ? 'opacity-100 scale-100 translate-y-0 animate-floatingDateFadeIn' : 'opacity-0 scale-95 translate-y-2 animate-floatingDateFadeOut'
                                }`}>
                                    <div className="w-full flex justify-center py-2">
                                        <div className={`bg-gradient-to-r ${themeColors.primary} text-white text-xs px-4 py-2 rounded-full shadow-lg border-2 border-white transform transition-all duration-300 ${
                                            isScrolling ? 'shadow-xl' : 'shadow-lg'
                                        }`}>
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
                                                <span className={`mx-3 text-xs ${themeColors.accent} ${themeColors.secondary} px-3 py-1 rounded-full border ${themeColors.border} shadow-sm`}>
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
                                            role="article"
                                            aria-label={`${message.role === 'user' ? 'Your message' : 'AI response'}`}
                                            aria-describedby={screenReaderSupport ? `message-${index}-content` : undefined}
                                        >
                                            <div
                                                className={`max-w-[85%] ${getMessageDensityClass()} rounded-2xl break-words relative group ${
                                                    message.role === 'user'
                                                        ? `bg-gradient-to-r ${themeColors.primary} text-white`
                                                        : message.isError 
                                                            ? `${isDarkMode ? 'bg-red-900/20 text-red-300 border border-red-700' : 'bg-red-50 text-red-900 border border-red-300 shadow-sm'}`
                                                            : `${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'}`
                                                } ${
                                                    highlightedMessage === index 
                                                        ? 'ring-4 ring-yellow-400 ring-opacity-50 shadow-lg transform scale-105' 
                                                        : ''
                                                } transition-all duration-300`}
                                            >
                                                {/* Media Display */}
                                                {message.imageUrl && (
                                                    <div className="mb-2">
                                                        <div className="relative">
                                                            <img
                                                                src={message.imageUrl}
                                                                alt="Shared image"
                                                                className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Open image in new tab
                                                                    window.open(message.imageUrl, '_blank');
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
                                                                    e.target.className = "max-w-full max-h-64 rounded-lg opacity-50";
                                                                }}
                                                            />
                                                            <button
                                                                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 p-1 rounded-full shadow-md transition-colors"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const response = await fetch(message.imageUrl, { mode: 'cors' });
                                                                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                                                        
                                                                        const contentType = response.headers.get('content-type') || 'image/jpeg';
                                                                        const blob = await response.blob();
                                                                        const blobUrl = window.URL.createObjectURL(blob);
                                                                        
                                                                        const getFileExtension = (contentType) => {
                                                                            const mimeToExt = {
                                                                                'image/jpeg': 'jpg',
                                                                                'image/jpg': 'jpg',
                                                                                'image/png': 'png',
                                                                                'image/gif': 'gif',
                                                                                'image/webp': 'webp',
                                                                                'image/svg+xml': 'svg',
                                                                                'image/bmp': 'bmp',
                                                                                'image/tiff': 'tiff'
                                                                            };
                                                                            return mimeToExt[contentType] || 'jpg';
                                                                        };
                                                                        
                                                                        const extension = getFileExtension(contentType);
                                                                        const fileName = `image-${Date.now()}.${extension}`;
                                                                        
                                                                        const a = document.createElement('a');
                                                                        a.href = blobUrl;
                                                                        a.download = fileName;
                                                                        document.body.appendChild(a);
                                                                        a.click();
                                                                        document.body.removeChild(a);
                                                                        window.URL.revokeObjectURL(blobUrl);
                                                                        
                                                                        console.log('Downloaded image:', fileName, 'Type:', contentType);
                                                                    } catch (error) {
                                                                        console.error('Image download failed:', error);
                                                                        // Fallback to direct link
                                                                        const a = document.createElement('a');
                                                                        a.href = message.imageUrl;
                                                                        a.download = `image-${Date.now()}.jpg`;
                                                                        a.target = '_blank';
                                                                        document.body.appendChild(a);
                                                                        a.click();
                                                                        document.body.removeChild(a);
                                                                    }
                                                                }}
                                                                title="Download Image"
                                                            >
                                                                <FaDownload className="text-xs" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {message.audioUrl && (
                                                    <div className="mb-2">
                                                        <div className="relative">
                                                            <div className="w-full min-w-[280px]">
                                                                <audio
                                                                    src={message.audioUrl}
                                                                    className="w-full"
                                                                    controls
                                                                    preload="metadata"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                            <button
                                                                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 p-1 rounded-full shadow-md transition-colors"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const response = await fetch(message.audioUrl, { mode: 'cors' });
                                                                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                                                        
                                                                        const contentType = response.headers.get('content-type') || 'audio/mpeg';
                                                                        const blob = await response.blob();
                                                                        const blobUrl = window.URL.createObjectURL(blob);
                                                                        
                                                                        const getFileExtension = (contentType) => {
                                                                            const mimeToExt = {
                                                                                'audio/mpeg': 'mp3',
                                                                                'audio/wav': 'wav',
                                                                                'audio/webm': 'webm',
                                                                                'audio/ogg': 'ogg',
                                                                                'audio/mp4': 'm4a',
                                                                                'audio/aac': 'aac'
                                                                            };
                                                                            return mimeToExt[contentType] || 'mp3';
                                                                        };
                                                                        
                                                                        const extension = getFileExtension(contentType);
                                                                        const fileName = `audio-${Date.now()}.${extension}`;
                                                                        
                                                                        const a = document.createElement('a');
                                                                        a.href = blobUrl;
                                                                        a.download = fileName;
                                                                        document.body.appendChild(a);
                                                                        a.click();
                                                                        document.body.removeChild(a);
                                                                        window.URL.revokeObjectURL(blobUrl);
                                                                        
                                                                        console.log('Downloaded audio:', fileName, 'Type:', contentType);
                                                                    } catch (error) {
                                                                        console.error('Audio download failed:', error);
                                                                        // Fallback to direct link
                                                                        const a = document.createElement('a');
                                                                        a.href = message.audioUrl;
                                                                        a.download = `audio-${Date.now()}.mp3`;
                                                                        a.target = '_blank';
                                                                        document.body.appendChild(a);
                                                                        a.click();
                                                                        document.body.removeChild(a);
                                                                    }
                                                                }}
                                                                title="Download Audio"
                                                            >
                                                                <FaDownload className="text-xs" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {message.videoUrl && (
                                                    <div className="mb-2">
                                                        <div className="relative">
                                                            <video
                                                                src={message.videoUrl}
                                                                className="max-w-full max-h-64 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                                                controls
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (e.target.requestFullscreen) {
                                                                        e.target.requestFullscreen();
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 p-1 rounded-full shadow-md transition-colors"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const response = await fetch(message.videoUrl, { mode: 'cors' });
                                                                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                                                        
                                                                        const contentType = response.headers.get('content-type') || 'video/mp4';
                                                                        const blob = await response.blob();
                                                                        const blobUrl = window.URL.createObjectURL(blob);
                                                                        
                                                                        const getFileExtension = (contentType) => {
                                                                            const mimeToExt = {
                                                                                'video/mp4': 'mp4',
                                                                                'video/avi': 'avi',
                                                                                'video/mov': 'mov',
                                                                                'video/wmv': 'wmv',
                                                                                'video/flv': 'flv',
                                                                                'video/webm': 'webm',
                                                                                'video/ogg': 'ogv'
                                                                            };
                                                                            return mimeToExt[contentType] || 'mp4';
                                                                        };
                                                                        
                                                                        const extension = getFileExtension(contentType);
                                                                        const fileName = `video-${Date.now()}.${extension}`;
                                                                        
                                                                        const a = document.createElement('a');
                                                                        a.href = blobUrl;
                                                                        a.download = fileName;
                                                                        document.body.appendChild(a);
                                                                        a.click();
                                                                        document.body.removeChild(a);
                                                                        window.URL.revokeObjectURL(blobUrl);
                                                                        
                                                                        console.log('Downloaded video:', fileName, 'Type:', contentType);
                                                                    } catch (error) {
                                                                        console.error('Video download failed:', error);
                                                                        // Fallback to direct link
                                                                        const a = document.createElement('a');
                                                                        a.href = message.videoUrl;
                                                                        a.download = `video-${Date.now()}.mp4`;
                                                                        a.target = '_blank';
                                                                        document.body.appendChild(a);
                                                                        a.click();
                                                                        document.body.removeChild(a);
                                                                    }
                                                                }}
                                                                title="Download Video"
                                                            >
                                                                <FaDownload className="text-xs" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {message.documentUrl && (
                                                    <div className="mb-2">
                                                        <button
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    console.log('Starting download for URL:', message.documentUrl);
                                                                    
                                                                    const response = await fetch(message.documentUrl, { mode: 'cors' });
                                                                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                                                    
                                                                    // Get the actual file type from response headers
                                                                    const contentType = response.headers.get('content-type') || 'application/octet-stream';
                                                                    console.log('Response content-type:', contentType);
                                                                    
                                                                    // Detect file type from URL if content-type is generic
                                                                    const detectFileTypeFromUrl = (url) => {
                                                                        const urlLower = url.toLowerCase();
                                                                        if (urlLower.includes('.pdf')) return { mime: 'application/pdf', ext: 'pdf' };
                                                                        if (urlLower.includes('.doc')) return { mime: 'application/msword', ext: 'doc' };
                                                                        if (urlLower.includes('.docx')) return { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' };
                                                                        if (urlLower.includes('.xls')) return { mime: 'application/vnd.ms-excel', ext: 'xls' };
                                                                        if (urlLower.includes('.xlsx')) return { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' };
                                                                        if (urlLower.includes('.ppt')) return { mime: 'application/vnd.ms-powerpoint', ext: 'ppt' };
                                                                        if (urlLower.includes('.pptx')) return { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: 'pptx' };
                                                                        if (urlLower.includes('.txt')) return { mime: 'text/plain', ext: 'txt' };
                                                                        if (urlLower.includes('.csv')) return { mime: 'text/csv', ext: 'csv' };
                                                                        if (urlLower.includes('.zip')) return { mime: 'application/zip', ext: 'zip' };
                                                                        if (urlLower.includes('.rar')) return { mime: 'application/x-rar-compressed', ext: 'rar' };
                                                                        return null;
                                                                    };
                                                                    
                                                                    // Use URL detection if content-type is generic
                                                                    let finalContentType = contentType;
                                                                    let fileExtension = 'bin';
                                                                    
                                                                    if (contentType === 'application/octet-stream' || contentType === 'binary/octet-stream') {
                                                                        const urlDetection = detectFileTypeFromUrl(message.documentUrl);
                                                                        if (urlDetection) {
                                                                            finalContentType = urlDetection.mime;
                                                                            fileExtension = urlDetection.ext;
                                                                            console.log('Detected from URL:', finalContentType, fileExtension);
                                                                        }
                                                                    } else {
                                                                        // Use content-type mapping
                                                                        const mimeToExt = {
                                                                            'application/pdf': 'pdf',
                                                                            'application/msword': 'doc',
                                                                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                                                                            'application/vnd.ms-excel': 'xls',
                                                                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
                                                                            'application/vnd.ms-powerpoint': 'ppt',
                                                                            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
                                                                            'text/plain': 'txt',
                                                                            'text/csv': 'csv',
                                                                            'application/zip': 'zip',
                                                                            'application/x-rar-compressed': 'rar'
                                                                        };
                                                                        fileExtension = mimeToExt[contentType] || 'bin';
                                                                    }
                                                                    
                                                                    const blob = await response.blob();
                                                                    console.log('Blob size:', blob.size, 'Blob type:', blob.type);
                                                                    
                                                                    // Create blob with correct MIME type
                                                                    const correctedBlob = new Blob([blob], { type: finalContentType });
                                                                    const blobUrl = window.URL.createObjectURL(correctedBlob);
                                                                    
                                                                    // Extract filename from URL or use document name
                                                                    let fileName = message.documentName;
                                                                    if (!fileName) {
                                                                        // Try to extract filename from URL
                                                                        const urlParts = message.documentUrl.split('/');
                                                                        const lastPart = urlParts[urlParts.length - 1];
                                                                        if (lastPart && lastPart.includes('.')) {
                                                                            fileName = lastPart;
                                                                        } else {
                                                                            // Generate filename with correct extension
                                                                            fileName = `document-${Date.now()}.${fileExtension}`;
                                                                        }
                                                                    } else if (!fileName.includes('.')) {
                                                                        // Add extension if filename doesn't have one
                                                                        fileName = `${fileName}.${fileExtension}`;
                                                                    }
                                                                    
                                                                    console.log('Final filename:', fileName, 'Final MIME type:', finalContentType);
                                                                    
                                                                    const a = document.createElement('a');
                                                                    a.href = blobUrl;
                                                                    a.download = fileName;
                                                                    document.body.appendChild(a);
                                                                    a.click();
                                                                    document.body.removeChild(a);
                                                                    window.URL.revokeObjectURL(blobUrl);
                                                                    
                                                                    console.log('Download completed successfully');
                                                                } catch (error) {
                                                                    console.error('Download failed:', error);
                                                                    // Fallback to direct link
                                                                    const a = document.createElement('a');
                                                                    a.href = message.documentUrl;
                                                                    a.download = message.documentName || `document-${Date.now()}.pdf`;
                                                                    a.target = '_blank';
                                                                    document.body.appendChild(a);
                                                                    a.click();
                                                                    document.body.removeChild(a);
                                                                }
                                                            }}
                                                        >
                                                            <FaFileAlt className="text-blue-500" />
                                                            <span className="text-sm">
                                                                {message.documentName || 'Download Document'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {/* Message content - editable for user messages */}
                                                {editingMessageIndex === index ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={editingMessageContent}
                                                            onChange={(e) => setEditingMessageContent(e.target.value)}
                                                            onKeyDown={(e) => handleEditKeyDown(e, index)}
                                                            className={`w-full p-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 ${themeColors.accent.replace('text-', 'focus:ring-').replace('-600', '-500')} placeholder-gray-500`}
                                                            rows={3}
                                                            placeholder="Edit your message... (Ctrl+Enter to send, Esc to cancel)"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={() => cancelEditingMessage()}
                                                                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                                            >
                                                                <FaTimesCircle size={10} className="inline mr-1" />
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => submitEditedMessage(index)}
                                                                disabled={!editingMessageContent.trim() || isLoading}
                                                                className={`px-3 py-1 text-xs bg-gradient-to-r ${themeColors.primary} text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                                            >
                                                                <FaCheckCircle size={10} className="inline mr-1" />
                                                                Send
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div 
                                                        className={`${getFontSizeClass()} whitespace-pre-wrap leading-relaxed ${message.role === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}
                                                        id={screenReaderSupport ? `message-${index}-content` : undefined}
                                                    >
                                                        {renderTextWithMarkdownAndLinks(message.content, message.role === 'user')}
                                                    </div>
                                                )}
                                                
                                                {/* Message footer with timestamp and actions */}
                                                <div className={`flex items-center justify-between mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-200/20' : 'border-gray-300/60'}`}>
                                                    {message.timestamp && showTimestamps && (
                                                        <div className={`${message.role === 'user' ? 'text-white/80' : message.isError ? (isDarkMode ? 'text-red-400' : 'text-red-700') : 'text-gray-500'} text-[10px]`}>
                                                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Action buttons - hidden when editing */}
                                                    {editingMessageIndex !== index && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        {/* Copy icon for all messages */}
                                                        <button
                                                            onClick={() => copyToClipboard(message.content)}
                                                            className={`p-1 rounded transition-all duration-200 ${
                                                                message.role === 'user' 
                                                                    ? 'text-white/80 hover:text-white hover:bg-white/20' 
                                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                            title="Copy message"
                                                            aria-label="Copy message"
                                                        >
                                                            <FaCopy size={10} />
                                                        </button>
                                                        
                                                        {/* Edit button for user messages */}
                                                        {message.role === 'user' && (
                                                            <button
                                                                onClick={() => startEditingMessage(index, message.content)}
                                                                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded transition-all duration-200"
                                                                title="Edit message"
                                                                aria-label="Edit message"
                                                            >
                                                                <FaEdit size={10} />
                                                            </button>
                                                        )}
                                                        
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
                                                                            ? 'text-green-600 hover:text-green-700' 
                                                                            : 'text-gray-500 hover:text-green-600'
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
                                                                            ? 'text-red-600 hover:text-red-700' 
                                                                            : 'text-gray-500 hover:text-red-600'
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
                                                                disabled={isLoading || (rateLimitInfo.remaining <= 0 && rateLimitInfo.role !== 'rootadmin')}
                                                                className={`p-1 ${themeColors.accent} hover:opacity-80 hover:${themeColors.secondary} rounded transition-all duration-200 disabled:opacity-50`}
                                                                title="Try Again"
                                                                aria-label="Try Again"
                                                            >
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26l1.46-1.46C6.26 13.86 6 12.97 6 12c0-3.31 2.69-6 6-6zm5.76 1.74L16.3 9.2C17.74 10.14 18.5 11.49 18.5 13c0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className={`${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} p-3 rounded-2xl`}>
                                        <div className="flex items-center space-x-3">
                                            <div className="flex space-x-1">
                                                <div className={`w-2 h-2 ${isDarkMode ? 'bg-gray-300' : 'bg-gray-400'} rounded-full animate-bounce`}></div>
                                                <div className={`w-2 h-2 ${isDarkMode ? 'bg-gray-300' : 'bg-gray-400'} rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
                                                <div className={`w-2 h-2 ${isDarkMode ? 'bg-gray-300' : 'bg-gray-400'} rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
                                            </div>
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>Gemini is thinking...</span>
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
                                    className={`bg-gradient-to-r ${themeColors.primary} hover:opacity-90 text-white rounded-full p-3 shadow-xl transition-all duration-200 hover:scale-110 relative transform hover:shadow-2xl`}
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
                                                <li>Multiple response tones (Neutral, Friendly, Formal, Concise) - Login Required</li>
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
                            {/* Rate Limit Counter */}
                            {rateLimitInfo.role === 'public' && (
                                <div className="mb-3 text-center">
                                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${themeColors.secondary} ${themeColors.accent} border ${themeColors.border}`}>
                                        <span className="mr-1">💬</span>
                                        <span>
                                            {rateLimitInfo.remaining > 0 
                                                ? `${rateLimitInfo.remaining} free prompts remaining` 
                                                : 'No free prompts left'
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Root Admin Indicator */}
                            {rateLimitInfo.role === 'rootadmin' && (
                                <div className="mb-3 text-center">
                                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200">
                                        <span className="mr-1">👑</span>
                                        <span>Unlimited AI Access - Root Admin</span>
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

                            {/* Smart Suggestions - Above Footer */}
                            {showSmartSuggestions && (
                                <div className="mb-3 px-2">
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
                                                        : `${themeColors.secondary} ${themeColors.border} ${themeColors.accent} hover:opacity-80`
                                                }`}
                                            >
                                                {suggestion}
                                            </button>
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
                                        onChange={handleInputChange}
                                        onKeyPress={handleKeyPress}
                                        onKeyDown={handleKeyDown}
                                        placeholder={(rateLimitInfo.remaining <= 0 && rateLimitInfo.role !== 'rootadmin') ? "Sign in to continue chatting..." : "Ask me anything about real estate..."}
                                        aria-label="Type your message"
                                        aria-describedby="input-help"
                                        role="textbox"
                                        className={`w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 ${themeColors.accent.replace('text-', 'focus:ring-').replace('-600', '-500')} focus:border-transparent text-sm ${
                                            isDarkMode 
                                                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                        disabled={isLoading || (rateLimitInfo.remaining <= 0 && rateLimitInfo.role !== 'rootadmin')}
                                    />
                                    {inputMessage.length > 1800 && (
                                        <div className="absolute -top-6 right-0 text-xs text-orange-600">
                                            {inputMessage.length}/2000
                                        </div>
                                    )}
                                    {screenReaderSupport && (
                                        <div id="input-help" className="sr-only">
                                            Press Enter to send your message, or use the voice input and file upload buttons for additional options.
                                        </div>
                                    )}
                                    
                                    {/* Property Suggestions Dropdown */}
                                    {showPropertySuggestions && (
                                        <div ref={suggestionsRef} className={`absolute bottom-full left-0 right-0 mb-2 ${isDarkMode ? 'bg-gray-800 border-blue-600' : 'bg-white border-blue-300'} border-2 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto animate-fadeIn`}
                                        style={{
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                            minWidth: '300px'
                                        }}>
                                            <div className={`p-3 text-sm font-medium ${isDarkMode ? 'text-blue-400 border-gray-600 bg-blue-900/20' : 'text-blue-600 border-gray-200 bg-blue-50'} border-b`}>
                                                <div className="flex items-center gap-2">
                                                    {isLoadingSuggestions ? (
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                    )}
                                                    {isLoadingSuggestions ? 'Loading properties...' : 
                                                     propertySuggestions.length > 0 ? 'Select a property to reference:' : 'No properties found'}
                                                </div>
                                            </div>
                                            {propertySuggestions.length > 0 ? propertySuggestions.map((property, index) => (
                                                <button
                                                    type="button"
                                                    key={property.id}
                                                    onMouseDown={(e) => { e.preventDefault(); handleSuggestionSelect(property); }}
                                                    className={`w-full text-left p-3 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors ${
                                                        index === selectedSuggestionIndex ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        {property.image && (
                                                            <img
                                                                src={property.image}
                                                                alt={property.name}
                                                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                                                                {property.name}
                                                            </div>
                                                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {property.location}
                                                            </div>
                                                            <div className={`text-sm font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                                ₹{property.price.toLocaleString()}
                                                            </div>
                                                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                {property.bedrooms}BHK • {property.area} sq ft • {property.type}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className={`p-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                                                    No properties found. Try typing more characters.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Voice Input Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!currentUser) {
                                            toast.info('Please login to use voice input');
                                            return;
                                        }
                                        setShowVoiceInput(true);
                                    }}
                                    className={`px-3 py-2 ${themeColors.secondary} hover:opacity-80 ${themeColors.accent} rounded-full transition-all duration-200 flex items-center justify-center`}
                                    title="Voice Input"
                                >
                                    <FaMicrophone size={14} />
                                </button>

                                {/* File Upload Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!currentUser) {
                                            toast.info('Please login to upload files');
                                            return;
                                        }
                                        setShowFileUpload(true);
                                    }}
                                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-all duration-200 flex items-center justify-center"
                                    title="Upload files (Images, PDF, Documents)"
                                >
                                    <FaUpload size={14} />
                                </button>

                                {isLoading ? (
                                    <button
                                        type="button"
                                        onClick={() => { 
                                            abortControllerRef.current?.abort(); 
                                            setIsLoading(false);
                                            toast.info('Generating stopped.'); 
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full hover:opacity-90 transition-all duration-300 transform hover:scale-110 flex-shrink-0 flex items-center justify-center w-10 h-10 group hover:shadow-xl active:scale-95"
                                        title="Stop generating"
                                        aria-label="Stop generating"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={!inputMessage.trim() || (rateLimitInfo.remaining <= 0 && rateLimitInfo.role !== 'rootadmin')}
                                        className={`bg-gradient-to-r ${themeColors.primary} text-white p-2 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 flex-shrink-0 flex items-center justify-center w-10 h-10 group hover:shadow-xl active:scale-95`}
                                        aria-label="Send message"
                                        title="Send message"
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
                                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-5 w-96 max-w-full`}>
                                    <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                                                className={`p-3 text-left border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg ${isDarkMode ? 'hover:bg-gray-700 hover:border-gray-500' : 'hover:bg-gray-50 hover:border-blue-300'} transition-all duration-200`}
                                            >
                                                <div className="text-lg mb-1">{action.icon}</div>
                                                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{action.text}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <button onClick={() => setShowQuickActions(false)} className={`px-3 py-1.5 text-sm rounded bg-gradient-to-r ${themeColors.primary} text-white hover:opacity-90`}>Close</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bookmarks Modal */}
                        {showBookmarks && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-5 w-96 max-w-full max-h-[80vh] overflow-y-auto`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <FaBookmark className="text-yellow-500" />
                                        Bookmarked Messages
                                    </h4>
                                        <button
                                            onClick={async () => {
                                                if (refreshingBookmarks) return; // Prevent multiple clicks
                                                setRefreshingBookmarks(true);
                                                try {
                                                    const currentSessionId = getOrCreateSessionId();
                                                    await loadBookmarkedMessages(currentSessionId);
                                                    toast.success('Bookmarks refreshed successfully');
                                                } catch (error) {
                                                    toast.error('Failed to refresh bookmarks');
                                                } finally {
                                                    setRefreshingBookmarks(false);
                                                }
                                            }}
                                            disabled={refreshingBookmarks}
                                            className={`p-2 rounded-lg transition-all duration-200 ${
                                                refreshingBookmarks
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : isDarkMode 
                                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                                            }`}
                                            title={refreshingBookmarks ? "Refreshing..." : "Refresh bookmarks"}
                                            aria-label={refreshingBookmarks ? "Refreshing bookmarks" : "Refresh bookmarks"}
                                        >
                                            {refreshingBookmarks ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {bookmarkedMessages.length === 0 ? (
                                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-8`}>No bookmarked messages in this session</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {bookmarkedMessages.map((bookmark, idx) => (
                                                <div key={idx} className={`p-3 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg`}>
                                                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                                                        {new Date(bookmark.timestamp).toLocaleString()}
                                                    </div>
                                                    <div className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2 line-clamp-3`}>
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
                                                                const currentSessionId = getOrCreateSessionId();
                                                                toggleBookmark(bookmark.messageIndex || 0, { content: bookmark.content, timestamp: bookmark.timestamp });
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
                                        <button onClick={() => setShowBookmarks(false)} className={`px-3 py-1.5 text-sm rounded bg-gradient-to-r ${themeColors.primary} text-white hover:opacity-90`}>Close</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chat History Modal */}
                        {showHistory && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-96 max-w-full max-h-[80vh] flex flex-col`}>
                                    {/* Fixed Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                        <h4 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                                    
                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto p-4">
                                    {chatSessions.length === 0 ? (
                                        <div className="text-center py-8 space-y-3">
                                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No chats yet</p>
                                            <button
                                                onClick={async () => { await createNewSession(); await loadChatSessions(); setShowHistory(false); }}
                                                className="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                            >
                                                Create First Chat
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {chatSessions.map((session, idx) => {
                                                const isActiveSession = session.sessionId === getOrCreateSessionId();
                                                return (
                                                <div
                                                    key={session.sessionId || idx}
                                                    className={`p-3 border rounded-lg transition-all duration-300 ${
                                                        isActiveSession 
                                                            ? `${isDarkMode ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-400'}` 
                                                            : `${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1 w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-1 dark:border-gray-600 dark:ring-offset-gray-800"
                                                            style={{
                                                                accentColor: '#2563eb', // Blue color for the checkmark
                                                                backgroundColor: 'transparent' // Remove background highlighting
                                                            }}
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
                                                            <div className={`text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                                {session.name?.trim() ? session.name : `New chat ${idx + 1}`}
                                                                {isActiveSession && (
                                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'} font-medium`}>
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {new Date(session.lastMessageAt).toLocaleString()}
                                                            </div>
                                                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
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
                                                                data-chat-options-dropdown
                                                            >
                                                                ⋯
                                                            </button>
                                                            {openHistoryMenuSessionId === session.sessionId && (
                                                            <div className={`absolute right-0 top-6 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded shadow-lg z-10 w-36`} data-chat-options-dropdown>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteTargetSessionId(session.sessionId);
                                                                        setShowDeleteSingleModal(true);
                                                                    }}
                                                                    className={`block w-full text-left px-3 py-2 text-sm ${isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-800 hover:bg-gray-100'}`}
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
                                                                            toast.error('Failed to save chat');
                                                                        }
                                                                    }}
                                                                    className={`block w-full text-left px-3 py-2 text-sm ${isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-800 hover:bg-gray-100'}`}
                                                                >
                                                                    Save chat
                                                                </button>
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        setRenameTargetSessionId(session.sessionId);
                                                                        // Fetch current name from backend to ensure it's up-to-date
                                                                        const currentName = await fetchSessionName(session.sessionId);
                                                                        setRenameInput(currentName || '');
                                                                        setShowRenameModal(true);
                                                                    }}
                                                                    className={`block w-full text-left px-3 py-2 text-sm ${isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-800 hover:bg-gray-100'}`}
                                                                >
                                                                    Rename
                                                                </button>
                                                            </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    </div>
                                    
                                    {/* Fixed Footer */}
                                    <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                                        <div>
                                            {selectedHistoryIds.length > 0 && (
                                                    <button
                                                        onClick={() => setShowDeleteSelectedModal(true)}
                                                    className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
                                                    >
                                                    Delete Selected ({selectedHistoryIds.length})
                                                    </button>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => { setShowHistory(false); setOpenHistoryMenuSessionId(null); }} 
                                            className={`px-4 py-2 text-sm rounded bg-gradient-to-r ${themeColors.primary} text-white hover:opacity-90 transition-all duration-200`}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Clear confirmation modal */}
                        {showConfirmClear && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-5 w-80`}>
                                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Clear chat?</h4>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>This will remove your conversation here. This action cannot be undone.</p>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowConfirmClear(false)} className={`px-3 py-1.5 text-sm rounded border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Cancel</button>
                                        <button onClick={() => { setShowConfirmClear(false); handleClearChatHistory(); }} className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700">Clear</button>
                                    </div>
                                </div>
                            </div>
                        )}

        {/* Delete All Chats Modal */}
        {showDeleteAllModal && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-5 w-80`}>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Delete all chats?</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>This cannot be undone.</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowDeleteAllModal(false)} className={`px-3 py-1.5 text-sm rounded border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Cancel</button>
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
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-5 w-80`}>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Delete selected chats?</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>This cannot be undone.</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowDeleteSelectedModal(false)} className={`px-3 py-1.5 text-sm rounded border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Cancel</button>
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
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-5 w-80`}>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Delete this chat?</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>This cannot be undone.</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowDeleteSingleModal(false)} className={`px-3 py-1.5 text-sm rounded border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Cancel</button>
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
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-5 w-96 max-w-full`}>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Rename chat</h4>
                    <input
                        type="text"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded mb-4`}
                        placeholder="Enter chat name"
                        maxLength={80}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setShowRenameModal(false); setRenameTargetSessionId(null); }} className={`px-3 py-1.5 text-sm rounded border ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Cancel</button>
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
                        }} className={`px-3 py-1.5 text-sm rounded bg-gradient-to-r ${themeColors.primary} text-white hover:opacity-90`}>Save</button>
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
                            {rateLimitInfo.role === 'public' 
                                ? "You've used all 5 free prompts! Sign in to enjoy unlimited access to our AI assistant and unlock premium features like chat history, message ratings, and more."
                                : `You've reached your rate limit! Sign in to enjoy higher limits and premium features like chat history, message ratings, and more.`
                            }
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

        {/* Sign-in Overlay for Public Users when Prompts Reach Zero */}
        {!currentUser && rateLimitInfo.remaining <= 0 && showSignInOverlay && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className={`max-w-md mx-4 p-6 rounded-2xl shadow-2xl border-2 border-dashed ${isDarkMode ? 'bg-gray-800/95 border-gray-600' : 'bg-white/95 border-blue-200'} transition-all duration-300`}>
                    <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                            <svg className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Sign in to unlock full chatbot features
                        </h3>
                        <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Get access to advanced AI settings, voice input, file uploads, chat history, and much more!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => {
                                    // Close chatbot and redirect to sign-in
                                    setIsOpen(false);
                                    navigate('/sign-in');
                                }}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${isDarkMode 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                } hover:shadow-lg hover:scale-105`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => {
                                    // Close chatbot and redirect to sign-up
                                    setIsOpen(false);
                                    navigate('/sign-up');
                                }}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${isDarkMode 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                                } hover:shadow-lg hover:scale-105`}
                            >
                                Create Account
                            </button>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => setShowSignInOverlay(false)}
                                className={`text-xs ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
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
                <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl w-[500px] max-w-full max-h-[80vh] flex flex-col`}>
                    {/* Fixed Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Settings & Themes
                        </h3>
                        <button
                            onClick={() => setShowSettings(false)}
                            className={`text-gray-500 hover:text-gray-700 ${isDarkMode ? 'hover:text-gray-300' : ''}`}
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                    
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                    
                    <div className="space-y-6">
                        {/* Theme Selection */}
                        <div>
                            <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Theme Color
                            </label>
                            <div className="grid grid-cols-5 gap-3">
                                {['blue', 'green', 'purple', 'orange', 'red', 'indigo', 'teal', 'pink', 'yellow', 'cyan'].map((theme) => (
                                    <button
                                        key={theme}
                                        onClick={() => {
                                            setSelectedTheme(theme);
                                            setUserSetting('gemini_theme', theme);
                                        }}
                                        className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                                            selectedTheme === theme ? 'border-gray-400 scale-110' : 'border-gray-200 hover:scale-105'
                                        } ${
                                            theme === 'blue' ? 'bg-gradient-to-br from-blue-500 to-purple-500' :
                                            theme === 'green' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                                            theme === 'purple' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                                            theme === 'orange' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                                            theme === 'red' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                                            theme === 'indigo' ? 'bg-gradient-to-br from-indigo-500 to-blue-500' :
                                            theme === 'teal' ? 'bg-gradient-to-br from-teal-500 to-cyan-500' :
                                            theme === 'pink' ? 'bg-gradient-to-br from-pink-500 to-rose-500' :
                                            theme === 'yellow' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                            'bg-gradient-to-br from-cyan-500 to-blue-500'
                                        }`}
                                        title={theme.charAt(0).toUpperCase() + theme.slice(1)}
                                    />
                                ))}
                                {/* Custom Theme Button */}
                                <button
                                    onClick={() => setShowCustomThemePicker(!showCustomThemePicker)}
                                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                                        selectedTheme === 'custom' ? 'border-gray-400 scale-110' : 'border-gray-200 hover:scale-105'
                                    } ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center justify-center`}
                                    title="Custom Theme"
                                >
                                    <FaPalette size={16} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                                </button>
                            </div>
                            
                            {/* Custom Theme Picker */}
                            {showCustomThemePicker && (
                                <div className={`mt-4 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Create Custom Theme
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Primary Color
                                            </label>
                                            <select 
                                                className={`w-full p-2 rounded border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                                onChange={(e) => {
                                                    const primary = e.target.value;
                                                    const secondary = customTheme?.secondaryColor || 'purple';
                                                    createCustomTheme(primary, secondary);
                                                }}
                                            >
                                                {['blue', 'green', 'purple', 'orange', 'red', 'indigo', 'teal', 'pink', 'yellow', 'cyan'].map(color => (
                                                    <option key={color} value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Secondary Color
                                            </label>
                                            <select 
                                                className={`w-full p-2 rounded border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                                onChange={(e) => {
                                                    const secondary = e.target.value;
                                                    const primary = customTheme?.primaryColor || 'blue';
                                                    createCustomTheme(primary, secondary);
                                                }}
                                            >
                                                {['blue', 'green', 'purple', 'orange', 'red', 'indigo', 'teal', 'pink', 'yellow', 'cyan'].map(color => (
                                                    <option key={color} value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Display Settings */}
                        <div>
                            <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Display Settings
                            </h4>
                            <div className="space-y-4">
                                {/* Dark Mode Toggle */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Dark Mode
                                    </span>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={getToggleSwitchClasses(isDarkMode)}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Font Size */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Font Size
                                    </span>
                                    <select
                                        value={fontSize}
                                        onChange={(e) => updateFontSize(e.target.value)}
                                        className={`px-3 py-1 rounded border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                    </select>
                                </div>

                                {/* Message Density */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Message Density
                                    </span>
                                    <select
                                        value={messageDensity}
                                        onChange={(e) => updateMessageDensity(e.target.value)}
                                        className={`px-3 py-1 rounded border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="compact">Compact</option>
                                        <option value="comfortable">Comfortable</option>
                                        <option value="spacious">Spacious</option>
                                    </select>
                                </div>

                                {/* Auto Scroll */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Auto Scroll to New Messages
                                    </span>
                                    <button
                                        onClick={() => updateAutoScroll(!autoScroll)}
                                        className={getToggleSwitchClasses(autoScroll)}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            autoScroll ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Show Timestamps */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Show Message Timestamps
                                    </span>
                                    <button
                                        onClick={() => updateShowTimestamps(!showTimestamps)}
                                        className={getToggleSwitchClasses(showTimestamps)}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            showTimestamps ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* AI Settings - Only for logged-in users */}
                        {currentUser && (
                            <div>
                                <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    AI Response Settings
                                </h4>
                            <div className="space-y-4">
                                {/* Response Length */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Response Length
                                    </span>
                                    <select
                                        value={aiResponseLength}
                                        onChange={(e) => updateAiResponseLength(e.target.value)}
                                        className={`px-3 py-1 rounded border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="short">Short</option>
                                        <option value="medium">Medium</option>
                                        <option value="long">Long</option>
                                    </select>
                                </div>

                                {/* Creativity Level */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Creativity Level
                                    </span>
                                    <select
                                        value={aiCreativity}
                                        onChange={(e) => updateAiCreativity(e.target.value)}
                                        className={`px-3 py-1 rounded border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="conservative">Conservative</option>
                                        <option value="balanced">Balanced</option>
                                        <option value="creative">Creative</option>
                                    </select>
                                </div>

                                {/* Response Tone */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Response Tone
                                    </span>
                                    <select
                                        value={tone}
                                        onChange={(e) => { setTone(e.target.value); localStorage.setItem('gemini_tone', e.target.value); }}
                                        className={`px-3 py-1 rounded border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="neutral">Neutral</option>
                                        <option value="friendly">Friendly</option>
                                        <option value="formal">Formal</option>
                                        <option value="concise">Concise</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Notification Settings - Only for logged-in users */}
                        {currentUser && (
                            <div>
                                <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Notifications & Sounds
                                </h4>
                            <div className="space-y-4">
                                {/* Sound Enabled */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Enable Sounds
                                    </span>
                                    <button
                                        onClick={() => updateSoundEnabled(!soundEnabled)}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Typing Sounds */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Typing Sounds
                                    </span>
                                    <button
                                        onClick={() => updateTypingSounds(!typingSounds)}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            typingSounds ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            typingSounds ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Privacy Settings - Only for logged-in users */}
                        {currentUser && (
                            <div>
                                <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Privacy & Data
                                </h4>
                            <div className="space-y-4">
                                {/* Data Retention */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Data Retention (days)
                                    </span>
                                    <select
                                        value={dataRetention}
                                        onChange={(e) => updateDataRetention(e.target.value)}
                                        className={`px-3 py-1 rounded border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="7">7 days</option>
                                        <option value="30">30 days</option>
                                        <option value="90">90 days</option>
                                        <option value="365">1 year</option>
                                        <option value="0">Forever</option>
                                    </select>
                                </div>

                                {/* Analytics */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Analytics
                                    </span>
                                    <button
                                        onClick={() => updateEnableAnalytics(!enableAnalytics)}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            enableAnalytics ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            enableAnalytics ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Error Reporting */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Error Reporting
                                    </span>
                                    <button
                                        onClick={() => updateEnableErrorReporting(!enableErrorReporting)}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            enableErrorReporting ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            enableErrorReporting ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Advanced Settings - Only for logged-in users */}
                        {currentUser && (
                            <div>
                                <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Advanced Settings
                                </h4>
                            <div className="space-y-4">
                                {/* Auto Save */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Auto Save
                                    </span>
                                    <button
                                        onClick={() => updateAutoSave(!autoSave)}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            autoSave ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            autoSave ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Message Limit */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Message Limit
                                    </span>
                                    <select
                                        value={messageLimit}
                                        onChange={(e) => updateMessageLimit(e.target.value)}
                                        className={`px-3 py-1 rounded border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="50">50 messages</option>
                                        <option value="100">100 messages</option>
                                        <option value="200">200 messages</option>
                                        <option value="500">500 messages</option>
                                        <option value="unlimited">Unlimited</option>
                                    </select>
                                </div>

                                {/* Enable Markdown */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Enable Markdown
                                    </span>
                                    <button
                                        onClick={() => updateEnableMarkdown(!enableMarkdown)}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            enableMarkdown ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            enableMarkdown ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Code Highlighting */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Code Highlighting
                                    </span>
                                    <button
                                        onClick={() => updateEnableCodeHighlighting(!enableCodeHighlighting)}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            enableCodeHighlighting ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            enableCodeHighlighting ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Accessibility Settings - Only for logged-in users */}
                        {currentUser && (
                            <div>
                                <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Accessibility
                                </h4>
                            <div className="space-y-4">
                                {/* High Contrast */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        High Contrast
                                    </span>
                                    <button
                                        onClick={() => updateHighContrast(!highContrast)}
                                        className={getToggleSwitchClasses(highContrast)}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            highContrast ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Reduced Motion */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Reduced Motion
                                    </span>
                                    <button
                                        onClick={() => updateReducedMotion(!reducedMotion)}
                                        className={getToggleSwitchClasses(reducedMotion)}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            reducedMotion ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Screen Reader Support */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Screen Reader Support
                                    </span>
                                    <button
                                        onClick={() => updateScreenReaderSupport(!screenReaderSupport)}
                                        className={getToggleSwitchClasses(screenReaderSupport)}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            screenReaderSupport ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Large Text */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Large Text
                                    </span>
                                    <button
                                        onClick={() => updateLargeText(!largeText)}
                                        className={getToggleSwitchClasses(largeText)}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            largeText ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Advanced AI Settings - Only for logged-in users */}
                        {currentUser && (
                            <div>
                                <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Advanced AI Settings
                                </h4>
                            <div className="space-y-4">
                                {/* Temperature */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Temperature: {temperature}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1.0"
                                        step="0.1"
                                        value={temperature}
                                        onChange={(e) => updateTemperature(e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            accentColor: '#2563eb' // Blue color for the range slider
                                        }}
                                    />
                                </div>

                                {/* Top P */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Top P: {topP}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1.0"
                                        step="0.1"
                                        value={topP}
                                        onChange={(e) => updateTopP(e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            accentColor: '#2563eb' // Blue color for the range slider
                                        }}
                                    />
                                </div>

                                {/* Context Window */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Context Window: {contextWindow} messages
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        step="5"
                                        value={contextWindow}
                                        onChange={(e) => updateContextWindow(e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            accentColor: '#2563eb' // Blue color for the range slider
                                        }}
                                    />
                                </div>

                                {/* Enable Streaming */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Enable Streaming
                                    </span>
                                    <button
                                        onClick={() => updateEnableStreaming(!enableStreaming)}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            enableStreaming ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            enableStreaming ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Smart Suggestions Toggle - Only for logged-in users */}
                        {currentUser && (
                        <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Smart Suggestions
                            </span>
                            <button
                                onClick={() => {
                                    const newValue = !showSmartSuggestions;
                                    setShowSmartSuggestions(newValue);
                                    localStorage.setItem('gemini_smart_suggestions', newValue.toString());
                                }}
                                className={getToggleSwitchClasses(showSmartSuggestions)}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                    showSmartSuggestions ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </div>
                        )}

                        {/* Login Required Message for Public Users */}
                        {!currentUser && (
                            <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                                        <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                                            Advanced Settings Available
                                        </h4>
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                            Sign in to access AI settings, notifications, privacy controls, and more advanced features.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
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
                        <FaMicrophone size={32} className={`mx-auto mb-2 ${isRecording ? 'text-red-500 animate-pulse' : themeColors.accent}`} />
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Voice Input
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Click to start recording, click again to stop
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Powered by OpenAI Whisper AI
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            Note: Rate limits may apply for frequent use
                        </p>
                    </div>
                    
                    <div className="space-y-3">
                        <button
                            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all duration-200 ${
                                isRecording 
                                    ? 'bg-red-500 animate-pulse' 
                                    : `bg-gradient-to-r ${themeColors.primary} hover:opacity-90`
                            }`}
                        >
                            {isRecording ? <FaStop size={24} className="text-white" /> : <FaMicrophone size={24} className="text-white" />}
                        </button>
                        
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isRecording ? `Recording... ${recordingDuration}s` : 'Click to start recording'}
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

        {/* Audio Preview Modal */}
        {showAudioPreview && recordedAudioUrl && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 rounded-2xl">
                <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-xl p-6 w-80 max-w-full text-center`}>
                    <div className="mb-4">
                        <FaMicrophone size={32} className="mx-auto text-green-500 mb-2" />
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Audio Preview
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Review your recording
                        </p>
                    </div>
                    
                    <div className="space-y-3">
                        <audio 
                            controls 
                            className="w-full"
                            onError={(e) => {
                                console.warn('Audio playback error, but continuing with upload');
                                // Don't show error toast, just log it
                            }}
                            onLoadStart={() => console.log('Audio loading started')}
                            onCanPlay={() => console.log('Audio can play')}
                            onLoadedMetadata={() => console.log('Audio metadata loaded')}
                        >
                            <source src={recordedAudioUrl} type={recordedAudioType} />
                            <source src={recordedAudioUrl} type="audio/webm" />
                            <source src={recordedAudioUrl} type="audio/wav" />
                            <source src={recordedAudioUrl} type="audio/mp4" />
                            <source src={recordedAudioUrl} type="audio/ogg" />
                            Your browser does not support the audio element.
                        </audio>
                        
                        {uploadingAudio && (
                            <div className="mb-3">
                                <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    Uploading and transcribing audio...
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex gap-2 justify-center flex-wrap">
                            <button
                                onClick={uploadingAudio ? cancelAudioUpload : handleSendRecordedAudio}
                                className={`px-4 py-2 ${uploadingAudio ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors flex items-center gap-2`}
                            >
                                {uploadingAudio ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cancel
                                    </>
                                ) : (
                                    <>
                                        <FaMicrophone size={14} />
                                        Transcribe & Send
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    // Send as text message about audio
                                    setInputMessage('I recorded an audio message but had trouble uploading it. Please help me with my question.');
                                    
                                    // Close audio preview and cleanup
                                    setShowAudioPreview(false);
                                    if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
                                        URL.revokeObjectURL(recordedAudioUrl);
                                    }
                                    setRecordedAudioUrl(null);
                                    setRecordedAudioFile(null);
                                    setAudioChunks([]);
                                    recordingChunksRef.current = [];
                                    
                                    // Auto-submit the message
                                    setTimeout(() => {
                                        handleSubmit(new Event('submit'));
                                    }, 100);
                                }}
                                disabled={uploadingAudio}
                                className={`px-4 py-2 bg-gradient-to-r ${themeColors.primary} hover:opacity-90 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2`}
                            >
                                <FaFileAlt size={14} />
                                Send as Text
                            </button>
                            <button
                                onClick={() => {
                                    // Cleanup blob URL before clearing state
                                    if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
                                        URL.revokeObjectURL(recordedAudioUrl);
                                    }
                                    setShowAudioPreview(false);
                                    setRecordedAudioUrl(null);
                                    setRecordedAudioFile(null);
                                    setAudioChunks([]);
                                    recordingChunksRef.current = [];
                                }}
                                disabled={uploadingAudio}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                            >
                                Record Again
                            </button>
                        </div>
                    </div>
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
                        {uploadingFile && (
                            <div className="mb-4">
                                <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    Uploading files...
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <FaUpload size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Drag & drop files here or click to browse
                            </p>
                            <input
                                type="file"
                                multiple
                                accept="image/*,audio/*,video/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                disabled={uploadingFile}
                            />
                            <label
                                htmlFor="file-upload"
                                className={`mt-2 inline-block px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                                    uploadingFile 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : `bg-gradient-to-r ${themeColors.primary} hover:opacity-90`
                                } text-white`}
                            >
                                {uploadingFile ? 'Uploading...' : 'Choose Files'}
                            </label>
                        </div>
                        
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <p>Supported: Images, Audio, Video, Documents (PDF, Word, Excel, Text). Max 10MB per file.</p>
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
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${themeColors.accent.replace('text-', 'focus:ring-').replace('-600', '-500')} ${
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
                                                onClick={() => handleSearchResultClick(message)}
                                                className={`p-2 rounded border cursor-pointer transition-all duration-200 ${
                                                    isDarkMode 
                                                        ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500' 
                                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                                    {message.role === 'user' ? 'You' : 'Gemini'} • {new Date(message.timestamp).toLocaleString()}
                                                </div>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{message.content.substring(0, 100)}...</div>
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
                
                @keyframes floatingDateFadeIn {
                  from { 
                    opacity: 0; 
                    transform: translateY(-8px) scale(0.92); 
                  }
                  to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                  }
                }
                @keyframes floatingDateFadeOut {
                  from { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                  }
                  to { 
                    opacity: 0; 
                    transform: translateY(4px) scale(0.96); 
                  }
                }
                .animate-floatingDateFadeIn {
                  animation: floatingDateFadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
                }
                .animate-floatingDateFadeOut {
                  animation: floatingDateFadeOut 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
                }
                
                @keyframes slideDown {
                  0% {
                    opacity: 0;
                    transform: translateY(-10px) scale(0.95);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }
                .animate-slideDown {
                  animation: slideDown 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
                }
                
                /* Accessibility Styles */
                .high-contrast {
                    filter: contrast(150%) brightness(1.2);
                }
                .high-contrast .w-12.h-6.rounded-full {
                    background-color: #6b7280 !important; /* Use darker gray for disabled toggles in high contrast */
                }
                .high-contrast .w-12.h-6.rounded-full.bg-blue-600 {
                    background-color: #1d4ed8 !important; /* Ensure enabled toggles remain blue */
                }
                .reduced-motion * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    transform: none !important;
                }
                .reduced-motion .w-12.h-6.rounded-full {
                    transition-duration: 0.2s !important; /* Allow toggle color transitions */
                }
                .reduced-motion .w-12.h-6.rounded-full.bg-gray-300 {
                    background-color: #d1d5db !important; /* Ensure disabled toggles stay gray in reduced motion */
                }
                .reduced-motion .w-12.h-6.rounded-full.bg-gray-600 {
                    background-color: #4b5563 !important; /* Ensure disabled toggles stay dark gray in reduced motion + high contrast */
                }
                .reduced-motion .animate-pulse,
                .reduced-motion .animate-spin,
                .reduced-motion .animate-fadeIn,
                .reduced-motion .animate-slideDown,
                .reduced-motion .animate-slideUp {
                    animation: none !important;
                }
                .reduced-motion .hover\\:scale-110:hover {
                    transform: none !important;
                }
                .large-text {
                    font-size: 1.2em !important;
                }
                .large-text .text-sm {
                    font-size: 1em !important;
                }
                .large-text .text-base {
                    font-size: 1.3em !important;
                }
        .screen-reader-support [role="button"],
        .screen-reader-support button,
        .screen-reader-support input,
        .screen-reader-support select,
        .screen-reader-support textarea {
                    outline: 2px solid #0066cc !important;
                    outline-offset: 2px !important;
                }
        .screen-reader-support [role="button"]:focus,
        .screen-reader-support button:focus,
        .screen-reader-support input:focus,
        .screen-reader-support select:focus,
        .screen-reader-support textarea:focus {
                    outline: 3px solid #0066cc !important;
                    outline-offset: 3px !important;
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3) !important;
        }
                .screen-reader-support .sr-only {
                    position: absolute !important;
                    width: 1px !important;
                    height: 1px !important;
                    padding: 0 !important;
                    margin: -1px !important;
                    overflow: hidden !important;
                    clip: rect(0, 0, 0, 0) !important;
                    white-space: nowrap !important;
                    border: 0 !important;
                }
                
                /* Ensure proper text color inheritance in message bubbles */
                .bg-gray-100.text-gray-800 * {
                    color: inherit !important;
                }
                .bg-gray-100.text-gray-800 span {
                    color: #1f2937 !important; /* text-gray-800 */
                }
                .bg-gray-100.text-gray-800 p {
                    color: #1f2937 !important; /* text-gray-800 */
                }
                .bg-gray-100.text-gray-800 div {
                    color: #1f2937 !important; /* text-gray-800 */
                }
                
                /* Ensure links maintain their blue color in light mode */
                .bg-gray-100.text-gray-800 a {
                    color: #2563eb !important; /* text-blue-600 */
                }
                .bg-gray-100.text-gray-800 a:hover {
                    color: #1d4ed8 !important; /* text-blue-800 */
                }
                
                /* Dark mode text color inheritance */
                .bg-gray-800.text-gray-100 * {
                    color: inherit !important;
                }
                .bg-gray-800.text-gray-100 span {
                    color: #f3f4f6 !important; /* text-gray-100 */
                }
                .bg-gray-800.text-gray-100 p {
                    color: #f3f4f6 !important; /* text-gray-100 */
                }
                .bg-gray-800.text-gray-100 div {
                    color: #f3f4f6 !important; /* text-gray-100 */
                }
                
                /* Ensure links maintain their blue color in dark mode */
                .bg-gray-800.text-gray-100 a {
                    color: #2563eb !important; /* text-blue-600 */
                }
                .bg-gray-800.text-gray-100 a:hover {
                    color: #1d4ed8 !important; /* text-blue-800 */
                }
                
                /* Ensure rating buttons maintain their colors in light mode */
                .bg-gray-100.text-gray-800 button.text-green-600,
                .bg-gray-100.text-gray-800 button.text-red-600,
                .bg-gray-100.text-gray-800 button.text-gray-500 {
                    color: inherit !important;
                }
                .bg-gray-100.text-gray-800 button.text-green-600 {
                    color: #16a34a !important; /* text-green-600 */
                }
                .bg-gray-100.text-gray-800 button.text-red-600 {
                    color: #dc2626 !important; /* text-red-600 */
                }
                .bg-gray-100.text-gray-800 button.text-gray-500 {
                    color: #6b7280 !important; /* text-gray-500 */
                }
                
                /* Ensure error messages maintain their red color in light mode */
                .bg-red-50.text-red-900,
                .bg-red-50.text-red-900 p,
                .bg-red-50.text-red-900 div,
                .bg-red-50.text-red-900 span {
                    color: #7f1d1d !important; /* text-red-900 */
                }
                
                /* Ensure rating buttons maintain their colors in dark mode */
                .bg-gray-800.text-gray-100 button.text-green-600,
                .bg-gray-800.text-gray-100 button.text-red-600,
                .bg-gray-800.text-gray-100 button.text-gray-500 {
                    color: inherit !important;
                }
                .bg-gray-800.text-gray-100 button.text-green-600 {
                    color: #16a34a !important; /* text-green-600 */
                }
                .bg-gray-800.text-gray-100 button.text-red-600 {
                    color: #dc2626 !important; /* text-red-600 */
                }
                .bg-gray-800.text-gray-100 button.text-gray-500 {
                    color: #6b7280 !important; /* text-gray-500 */
                }
                
                /* Ensure error messages maintain their red color in dark mode */
                .bg-red-900\/20.text-red-300,
                .bg-red-900\/20.text-red-300 p,
                .bg-red-900\/20.text-red-300 div,
                .bg-red-900\/20.text-red-300 span {
                    color: #fca5a5 !important; /* text-red-300 */
                }
                
                /* Ensure bookmark icons maintain their colors in light mode */
                .bg-gray-100.text-gray-800 button .text-yellow-500 {
                    color: #eab308 !important; /* text-yellow-500 */
                }
                .bg-gray-100.text-gray-800 button .text-gray-500 {
                    color: #6b7280 !important; /* text-gray-500 */
                }
                
                /* Ensure bookmark icons maintain their colors in dark mode */
                .bg-gray-800.text-gray-100 button .text-yellow-500 {
                    color: #eab308 !important; /* text-yellow-500 */
                }
                .bg-gray-800.text-gray-100 button .text-gray-500 {
                    color: #6b7280 !important; /* text-gray-500 */
                }
        
        /* Code highlighting styles */
        .code-block {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        
        .code-block pre {
            margin: 0;
            padding: 0;
            background: transparent;
            border: none;
        }
        
        .code-block code {
            font-family: inherit;
            font-size: inherit;
            background: transparent;
            padding: 0;
            border: none;
        }
        
        /* Disable line highlighting effects from Prism.js */
        .code-block pre,
        .code-block code,
        .code-block .token {
            background: transparent !important;
            background-color: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
            border: none !important;
            outline: none !important;
        }
        
        /* Remove any line highlighting or selection effects */
        .code-block pre::selection,
        .code-block code::selection,
        .code-block .token::selection {
            background: transparent !important;
        }
        
        .code-block pre::-moz-selection,
        .code-block code::-moz-selection,
        .code-block .token::-moz-selection {
            background: transparent !important;
        }
        
        /* Disable any Prism.js line highlighting */
        .code-block .line-highlight,
        .code-block .line-numbers .line-highlight,
        .code-block pre[data-line] .line-highlight {
            display: none !important;
        }
        
        /* Remove any additional visual artifacts and hover effects */
        .code-block pre:hover,
        .code-block code:hover,
        .code-block .token:hover,
        .code-block:hover,
        .code-block pre:hover *,
        .code-block code:hover *,
        .code-block .token:hover * {
            background: transparent !important;
            background-color: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
            border: none !important;
            outline: none !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
        }
        
        /* Disable any Prism.js hover effects */
        .code-block pre:hover .token,
        .code-block code:hover .token,
        .code-block .token:hover {
            background: transparent !important;
            background-color: transparent !important;
            color: inherit !important;
        }
        
        /* Disable any pseudo-element hover effects */
        .code-block pre:hover::before,
        .code-block pre:hover::after,
        .code-block code:hover::before,
        .code-block code:hover::after,
        .code-block .token:hover::before,
        .code-block .token:hover::after {
            display: none !important;
            content: none !important;
        }
        
        /* Ensure no line numbers or line highlighting */
        .code-block .line-numbers,
        .code-block .line-numbers-rows,
        .code-block .line-numbers-rows > span {
            display: none !important;
        }
        
        /* Remove any focus or active states that might cause highlighting */
        .code-block pre:focus,
        .code-block code:focus,
        .code-block .token:focus,
        .code-block pre:active,
        .code-block code:active,
        .code-block .token:active,
        .code-block pre:focus:hover,
        .code-block code:focus:hover,
        .code-block .token:focus:hover,
        .code-block pre:active:hover,
        .code-block code:active:hover,
        .code-block .token:active:hover {
            background: transparent !important;
            background-color: transparent !important;
            outline: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
            border: none !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
        }
        
        /* Disable any mouse event related effects */
        .code-block pre:focus-within,
        .code-block code:focus-within,
        .code-block .token:focus-within {
            background: transparent !important;
            background-color: transparent !important;
            outline: none !important;
        }
        
        /* Disable any potential overlay effects */
        .code-block pre::selection,
        .code-block code::selection,
        .code-block .token::selection,
        .code-block pre::-moz-selection,
        .code-block code::-moz-selection,
        .code-block .token::-moz-selection {
            background: transparent !important;
            color: inherit !important;
        }
        
        /* Disable any potential highlighting from parent elements */
        .code-block:hover pre,
        .code-block:hover code,
        .code-block:hover .token {
            background: transparent !important;
            background-color: transparent !important;
        }
        
        /* Completely disable any white strip or overlay effects */
        .code-block * {
            background: transparent !important;
            background-color: transparent !important;
        }
        
        .code-block pre.bg-gray-900 * {
            background: transparent !important;
            background-color: transparent !important;
        }
        
        .code-block pre.bg-gray-800 * {
            background: transparent !important;
            background-color: transparent !important;
        }
        
        .code-block pre.bg-gray-100 * {
            background: transparent !important;
            background-color: transparent !important;
        }
        
        /* Disable any potential white overlay from Prism.js */
        .code-block .token::before,
        .code-block .token::after,
        .code-block pre::before,
        .code-block pre::after,
        .code-block code::before,
        .code-block code::after {
            display: none !important;
            content: none !important;
            background: transparent !important;
            background-color: transparent !important;
        }
        
        /* Enhanced code block styling for better visibility - only when code highlighting is enabled */
        .code-block pre.bg-gray-900 {
            background: #1a1a1a !important;
            color: #e5e5e5 !important;
        }
        
        .dark .code-block pre.bg-gray-800 {
            background: #1a1a1a !important;
            color: #e5e5e5 !important;
        }
        
        /* Light mode code blocks without highlighting should use light background */
        .code-block pre.bg-gray-100 {
            background: #f3f4f6 !important; /* bg-gray-100 */
            color: #1f2937 !important; /* text-gray-800 */
        }
        
        /* Dark mode code blocks without highlighting should use dark background */
        .code-block pre.bg-gray-800 {
            background: #1f2937 !important; /* bg-gray-800 */
            color: #f3f4f6 !important; /* text-gray-100 */
        }
        
        /* Ensure inline code elements have proper contrast in all scenarios */
        code.bg-gray-100 {
            background: #f3f4f6 !important; /* bg-gray-100 */
            color: #1f2937 !important; /* text-gray-800 */
        }
        
        code.bg-gray-800 {
            background: #1f2937 !important; /* bg-gray-800 */
            color: #f3f4f6 !important; /* text-gray-100 */
        }
        
        /* Override any Prism.js or other CSS that might affect inline code */
        .bg-gray-100 code {
            background: #f3f4f6 !important; /* bg-gray-100 */
            color: #1f2937 !important; /* text-gray-800 */
        }
        
        .bg-gray-800 code {
            background: #1f2937 !important; /* bg-gray-800 */
            color: #f3f4f6 !important; /* text-gray-100 */
        }
        
        /* Ensure all inline code elements have proper contrast regardless of context */
        code {
            background: #f3f4f6 !important; /* bg-gray-100 for light mode */
            color: #1f2937 !important; /* text-gray-800 for light mode */
        }
        
        /* Dark mode inline code */
        .dark code {
            background: #1f2937 !important; /* bg-gray-800 for dark mode */
            color: #f3f4f6 !important; /* text-gray-100 for dark mode */
        }
        
        /* Override any Prism.js token styling that might affect inline code */
        code.token {
            background: #f3f4f6 !important; /* bg-gray-100 for light mode */
            color: #1f2937 !important; /* text-gray-800 for light mode */
        }
        
        .dark code.token {
            background: #1f2937 !important; /* bg-gray-800 for dark mode */
            color: #f3f4f6 !important; /* text-gray-100 for dark mode */
        }
        
        /* Prism.js syntax highlighting overrides for better contrast - only when highlighting is enabled */
        .code-block pre.bg-gray-900 .token.comment,
        .code-block pre.bg-gray-900 .token.prolog,
        .code-block pre.bg-gray-900 .token.doctype,
        .code-block pre.bg-gray-900 .token.cdata {
            color: #6a9955 !important;
        }
        
        .code-block pre.bg-gray-900 .token.punctuation {
            color: #d4d4d4 !important;
        }
        
        .code-block pre.bg-gray-900 .token.property,
        .code-block pre.bg-gray-900 .token.tag,
        .code-block pre.bg-gray-900 .token.boolean,
        .code-block pre.bg-gray-900 .token.number,
        .code-block pre.bg-gray-900 .token.constant,
        .code-block pre.bg-gray-900 .token.symbol,
        .code-block pre.bg-gray-900 .token.deleted {
            color: #b5cea8 !important;
        }
        
        .code-block pre.bg-gray-900 .token.selector,
        .code-block pre.bg-gray-900 .token.attr-name,
        .code-block pre.bg-gray-900 .token.string,
        .code-block pre.bg-gray-900 .token.char,
        .code-block pre.bg-gray-900 .token.builtin,
        .code-block pre.bg-gray-900 .token.inserted {
            color: #ce9178 !important;
        }
        
        .code-block pre.bg-gray-900 .token.operator,
        .code-block pre.bg-gray-900 .token.entity,
        .code-block pre.bg-gray-900 .token.url,
        .code-block pre.bg-gray-900 .language-css .token.string,
        .code-block pre.bg-gray-900 .style .token.string {
            color: #d4d4d4 !important;
        }
        
        .code-block pre.bg-gray-900 .token.atrule,
        .code-block pre.bg-gray-900 .token.attr-value,
        .code-block pre.bg-gray-900 .token.keyword {
            color: #569cd6 !important;
        }
        
        .code-block pre.bg-gray-900 .token.function,
        .code-block pre.bg-gray-900 .token.class-name {
            color: #dcdcaa !important;
        }
        
        .code-block pre.bg-gray-900 .token.regex,
        .code-block pre.bg-gray-900 .token.important,
        .code-block pre.bg-gray-900 .token.variable {
            color: #d16969 !important;
                }
                `}
            </style>
        </>
    );
};

export default GeminiChatbox;


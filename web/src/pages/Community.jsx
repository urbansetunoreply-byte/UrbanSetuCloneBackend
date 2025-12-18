import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUsers, FaMapMarkerAlt, FaBullhorn, FaShieldAlt,
    FaStore, FaComment, FaHeart, FaShare, FaPlus, FaSearch,
    FaCalendarAlt, FaEllipsisH, FaTimes, FaImage, FaArrowRight, FaLock, FaFlag
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { usePageTitle } from '../hooks/usePageTitle';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Community() {
    usePageTitle("Community Hub - Neighborhood Forum");
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();

    // Keyframes for inline styles
    const styles = `
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
        animation: fadeInUp 0.5s ease-out forwards;
        opacity: 0;
    }
    `;

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false
    });

    // Reply State
    const [replyingTo, setReplyingTo] = useState(null); // { postId, commentId }
    const [replyText, setReplyText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState({}); // { commentId: boolean }
    const [activeTab, setActiveTab] = useState('All');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        activeMembers: 0,
        dailyPosts: 0,
        eventsThisWeek: 0,
        trendingTopics: []
    });
    const [expandedComments, setExpandedComments] = useState({});
    const [commentText, setCommentText] = useState({});

    // Create Post State
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        category: 'General',
        location: {
            city: '',
            neighborhood: ''
        }
    });
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const categories = [
        { id: 'All', icon: FaUsers, label: 'All Posts' },
        { id: 'General', icon: FaComment, label: 'General' },
        { id: 'Neighborhood', icon: FaMapMarkerAlt, label: 'Neighborhood' },
        { id: 'Events', icon: FaCalendarAlt, label: 'Events' },
        { id: 'Safety', icon: FaShieldAlt, label: 'Safety' },
        { id: 'Marketplace', icon: FaStore, label: 'Marketplace' },
    ];

    useEffect(() => {
        fetchPosts();
        fetchStats();
    }, [activeTab, searchTerm]); // Added searchTerm to dependency array

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (activeTab !== 'All') params.append('category', activeTab);
            if (searchTerm) params.append('searchTerm', searchTerm);
            // Auto-filter by user's location if available (optional enhancement)

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum?${params.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setPosts(data.posts);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
            toast.error('Failed to load community posts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 2) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/search/suggestions?q=${searchTerm}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(data);
                        setShowSuggestions(true);
                    }
                } catch (error) {
                    console.error(error);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSearchSelect = (term) => {
        setSearchTerm(term);
        setShowSuggestions(false);
        // Trigger fetch immediately
        fetchPosts();
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleLike = async (postId) => {
        if (!currentUser) return navigate('/sign-in');

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/like/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // Include credentials for authentication if needed (though backend checks verifyToken likely via cookie or header)
                    // If using Authorization header:
                    // 'Authorization': `Bearer ${currentUser.token}` 
                },
                // If using cookies, ensure credentials: 'include'
                credentials: 'include'
            });

            if (res.ok) {
                const updatedPost = await res.json();
                // Merge with existing author to prevent avatar disappearance if backend doesn't populate
                setPosts(posts.map(post => post._id === postId ? { ...updatedPost, author: post.author, comments: post.comments } : post));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteComment = (postId, commentId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Comment',
            message: 'Are you sure you want to delete this comment?',
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/${postId}/${commentId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    if (res.ok) {
                        setPosts(posts.map(post => {
                            if (post._id === postId) {
                                return {
                                    ...post,
                                    comments: post.comments.filter(c => c._id !== commentId)
                                };
                            }
                            return post;
                        }));
                        toast.success('Comment deleted');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to delete comment');
                }
            }
        });
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!currentUser) return navigate('/sign-in');

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Important: Include credentials for authentication (cookies)
                credentials: 'include',
                body: JSON.stringify(newPost),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Failed to create post');
                return;
            }

            toast.success('Post created successfully!');
            setShowCreateModal(false);
            setNewPost({ title: '', content: '', category: 'General', location: { city: '', neighborhood: '' } });
            fetchPosts(); // Refresh feed
            fetchStats(); // Update stats
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong');
        }
    };
    const handleDeletePost = (postId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Discussion',
            message: 'Are you sure you want to delete this discussion? This action cannot be undone.',
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/${postId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    if (res.ok) {
                        setPosts(posts.filter(p => p._id !== postId));
                        toast.success('Post deleted successfully');
                        fetchStats();
                    } else {
                        toast.error('Failed to delete post');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Error deleting post');
                }
            }
        });
    };

    const handleAddReply = async (e, postId, commentId) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/${postId}/${commentId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: replyText })
            });

            if (res.ok) {
                const newReply = await res.json();
                setPosts(posts.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            comments: post.comments.map(c => {
                                if (c._id === commentId) {
                                    return {
                                        ...c,
                                        replies: [...(c.replies || []), newReply]
                                    };
                                }
                                return c;
                            })
                        };
                    }
                    return post;
                }));
                setReplyText('');
                setReplyingTo(null);
                setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
                toast.success('Reply added');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to add reply');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to add reply');
        }
    };

    const handleDeleteReply = (postId, commentId, replyId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Reply',
            message: 'Are you sure you want to delete this reply?',
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/${postId}/${commentId}/reply/${replyId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    if (res.ok) {
                        setPosts(posts.map(post => {
                            if (post._id === postId) {
                                return {
                                    ...post,
                                    comments: post.comments.map(c => {
                                        if (c._id === commentId) {
                                            return {
                                                ...c,
                                                replies: c.replies.filter(r => r._id !== replyId)
                                            };
                                        }
                                        return c;
                                    })
                                };
                            }
                            return post;
                        }));
                        toast.success('Reply deleted');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to delete reply');
                }
            }
        });
    };

    const handleShare = (post) => {
        const shareData = {
            title: post.title,
            text: `Check out this interesting discussion on UrbanSetu!\n\n${post.title}\n"${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"\n\nJoin the conversation here:`,
            url: window.location.href,
        };
        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
            toast.success('Link copied to clipboard!');
        }
    };


    const toggleComments = (postId) => {
        setExpandedComments(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const handleReportPost = async (postId) => {
        const reason = prompt("Why are you reporting this post?");
        if (!reason) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/report/${postId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                toast.success('Post reported');
            } else {
                toast.error('Failed to report');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddComment = async (e, postId) => {
        e.preventDefault();
        const content = commentText[postId];
        if (!content || !content.trim()) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/${postId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                const newComment = await res.json();
                setPosts(posts.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            comments: [...post.comments, newComment]
                        };
                    }
                    return post;
                }));
                setCommentText(prev => ({ ...prev, [postId]: '' }));
                toast.success('Comment added');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to add comment');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to add comment');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12 font-sans">
            <style>{styles}</style>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Neighborhood Community Hub</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Connect with your neighbors, discuss local events, share safety alerts, and build a better community together.
                    </p>
                    <div className="w-24 h-1 bg-blue-600 mx-auto mt-6 rounded-full opacity-20"></div>
                </div>

                {/* Controls & Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    {/* Categories */}
                    <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto hide-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${activeTab === cat.id
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                <cat.icon className="text-sm" />
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search discussions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => searchTerm.length > 2 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-lg mt-1 z-50 border border-gray-100 overflow-hidden">
                                    {suggestions.map((s, i) => (
                                        <div
                                            key={i}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 truncate"
                                            onClick={() => handleSearchSelect(s.title)}
                                        >
                                            {s.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (!currentUser) {
                                    toast.error("Please sign in to post");
                                    return navigate('/sign-in');
                                }
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap"
                        >
                            <FaPlus /> Start Discussion
                        </button>
                    </div>
                </div>

                {/* Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading community discussions...</p>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                                <FaUsers className="text-6xl text-gray-200 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No posts found</h3>
                                <p className="text-gray-500 mb-6">Be the first to start a conversation in this category!</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Start Discussion
                                </button>
                            </div>
                        ) : (
                            posts.map((post, index) => (
                                <div
                                    key={post._id}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* Post Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img
                                                    src={post.author?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                    alt={post.author?.username}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                                />
                                                {post.author?.type === 'agent' && (
                                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] p-1 rounded-full border-2 border-white" title="Agent">
                                                        <FaShieldAlt />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg hover:text-blue-600 cursor-pointer transition-colors">
                                                    {post.author?.username}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                        <FaCalendarAlt className="text-gray-400" />
                                                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    {post.location?.city && (
                                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                            <FaMapMarkerAlt className="text-red-400" /> {post.location.city}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {post.isLocked && (
                                                <span className="bg-gray-100 text-gray-500 p-1.5 rounded-full" title="Locked Discussion">
                                                    <FaLock size={12} />
                                                </span>
                                            )}
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${post.category === 'Safety' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                post.category === 'Events' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                    post.category === 'Marketplace' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                        'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                {post.category}
                                            </span>
                                            {currentUser && currentUser._id !== post.author?._id && (
                                                <button
                                                    onClick={() => handleReportPost(post._id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                    title="Report Post"
                                                >
                                                    <FaFlag />
                                                </button>
                                            )}
                                            {currentUser && currentUser._id === post.author?._id && (
                                                <button
                                                    onClick={() => handleDeletePost(post._id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                    title="Delete Post"
                                                >
                                                    <FaTimes />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Post Content */}
                                    <div className="mb-6 pl-2 border-l-4 border-gray-100 hover:border-blue-100 transition-colors">
                                        <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{post.title}</h2>
                                        <p className="text-gray-600 whitespace-pre-line leading-relaxed">{post.content}</p>
                                        {/* Placeholder for optional post image if any */}
                                        {/* {post.images && post.images.length > 0 && (...)} */}
                                    </div>

                                    {/* Post Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-6 w-full">
                                            <button
                                                onClick={() => handleLike(post._id)}
                                                className={`group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${currentUser && post.likes.includes(currentUser._id)
                                                    ? 'bg-red-50 text-red-500'
                                                    : 'text-gray-500 hover:bg-red-50 hover:text-red-500'
                                                    }`}
                                            >
                                                <FaHeart className={`text-lg transform group-hover:scale-110 transition-transform ${currentUser && post.likes.includes(currentUser._id) ? 'fill-current' : ''}`} />
                                                <span className="font-medium">{post.likes.length || 0}</span>
                                            </button>

                                            <button
                                                onClick={() => toggleComments(post._id)}
                                                className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                            >
                                                <FaComment className="text-lg transform group-hover:scale-110 transition-transform" />
                                                <span className="font-medium">{post.comments?.length || 0}</span>
                                            </button>

                                            <button
                                                onClick={() => handleShare(post)}
                                                className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all ml-auto sm:ml-0"
                                            >
                                                <FaShare className="text-lg transform group-hover:scale-110 transition-transform" />
                                                <span className="hidden sm:inline font-medium">Share</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    {expandedComments[post._id] && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                                            <div className="space-y-4 mb-4">
                                                {post.comments && post.comments.length > 0 ? (
                                                    post.comments.map((comment, idx) => (
                                                        <div key={idx} className="flex gap-3 relative group/comment">
                                                            <div className="flex-shrink-0">
                                                                <img
                                                                    src={comment.user?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                                    alt="User"
                                                                    className="w-8 h-8 rounded-full object-cover mt-1"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="bg-gray-50 rounded-2xl rounded-tl-none p-3 pr-8 relative">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="font-semibold text-sm">{comment.user?.username}</span>
                                                                        <span className="text-xs text-gray-500 mr-4">{new Date(comment.createdAt || Date.now()).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700">{comment.content}</p>

                                                                    {/* Actions */}
                                                                    <div className="flex items-center gap-4 mt-2">
                                                                        <button
                                                                            onClick={() => setReplyingTo({ postId: post._id, commentId: comment._id })}
                                                                            className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                                                                        >
                                                                            Reply
                                                                        </button>
                                                                        {comment.replies && comment.replies.length > 0 && (
                                                                            <button
                                                                                onClick={() => setExpandedReplies(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))}
                                                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                                            >
                                                                                {expandedReplies[comment._id] ? <FaTimes size={10} /> : <FaComment size={10} />}
                                                                                {comment.replies.length} Replies
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {currentUser && (currentUser._id === comment.user?._id || currentUser.role === 'admin' || currentUser.role === 'rootadmin') && (
                                                                        <button
                                                                            onClick={() => handleDeleteComment(post._id, comment._id)}
                                                                            className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover/comment:opacity-100"
                                                                            title="Delete Comment"
                                                                        >
                                                                            <FaTimes className="text-xs" />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Reply Input */}
                                                                {replyingTo?.commentId === comment._id && (
                                                                    <div className="mt-2 flex gap-2 animate-fade-in pl-2">
                                                                        <img
                                                                            src={currentUser?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                                            className="w-6 h-6 rounded-full object-cover"
                                                                        />
                                                                        <form onSubmit={(e) => handleAddReply(e, post._id, comment._id)} className="flex-1 flex gap-2">
                                                                            <input
                                                                                type="text"
                                                                                autoFocus
                                                                                value={replyText}
                                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                                placeholder="Add a reply..."
                                                                                className="flex-1 bg-white border-b-2 border-gray-200 focus:border-blue-500 outline-none text-sm py-1 px-2"
                                                                            />
                                                                            <div className="flex gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                                                    className="text-xs text-gray-500 px-2 hover:bg-gray-100 rounded"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                                <button
                                                                                    type="submit"
                                                                                    disabled={!replyText.trim()}
                                                                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full disabled:opacity-50"
                                                                                >
                                                                                    Reply
                                                                                </button>
                                                                            </div>
                                                                        </form>
                                                                    </div>
                                                                )}

                                                                {/* Nested Replies */}
                                                                {expandedReplies[comment._id] && comment.replies && (
                                                                    <div className="mt-2 space-y-3 pl-4 border-l-2 border-gray-100 ml-2">
                                                                        {comment.replies.map((reply, rIdx) => (
                                                                            <div key={rIdx} className="flex gap-2 relative group/reply">
                                                                                <img
                                                                                    src={reply.user?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                                                    className="w-6 h-6 rounded-full object-cover mt-1"
                                                                                />
                                                                                <div className="flex-1">
                                                                                    <div className="bg-gray-50/50 p-2 rounded-lg relative">
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            <span className="text-xs font-bold text-gray-800">{reply.user?.username}</span>
                                                                                            <span className="text-[10px] text-gray-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                                                        </div>
                                                                                        <p className="text-xs text-gray-700">{reply.content}</p>

                                                                                        {currentUser && (currentUser._id === reply.user?._id || currentUser.role === 'admin' || currentUser.role === 'rootadmin') && (
                                                                                            <button
                                                                                                onClick={() => handleDeleteReply(post._id, comment._id, reply._id)}
                                                                                                className="absolute right-1 top-1 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover/reply:opacity-100"
                                                                                            >
                                                                                                <FaTimes size={10} />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-gray-500 text-sm py-2">No comments yet. Be the first to share your thoughts!</p>
                                                )}
                                            </div>

                                            {currentUser && (
                                                <form onSubmit={(e) => handleAddComment(e, post._id)} className="flex gap-2">
                                                    <img
                                                        src={currentUser.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                        alt="Current User"
                                                    />
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Write a comment..."
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            value={commentText[post._id] || ''}
                                                            onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                                                        />
                                                        <button
                                                            type="submit"
                                                            disabled={!commentText[post._id]?.trim()}
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <FaArrowRight className="text-xs" />
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="hidden lg:block space-y-6">
                        {/* Community Stats */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Community Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-full text-blue-600"><FaUsers /></div>
                                        <span className="text-gray-700 font-medium">Active Members</span>
                                    </div>
                                    <span className="font-bold text-gray-900 text-lg">{stats.activeMembers}</span>
                                </div>
                                <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-full text-green-600"><FaComment /></div>
                                        <span className="text-gray-700 font-medium">Daily Posts</span>
                                    </div>
                                    <span className="font-bold text-gray-900 text-lg">{stats.dailyPosts}</span>
                                </div>
                                <div className="flex justify-between items-center bg-purple-50 p-3 rounded-lg border border-purple-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-full text-purple-600"><FaCalendarAlt /></div>
                                        <span className="text-gray-700 font-medium">Events This Week</span>
                                    </div>
                                    <span className="font-bold text-gray-900 text-lg">{stats.eventsThisWeek}</span>
                                </div>
                            </div>
                        </div>

                        {/* Trending Topics */}
                        {/* Trending Topics - Animated list */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg border border-transparent p-6 text-white overflow-hidden relative">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl -ml-10 -mb-10"></div>

                            <h3 className="text-lg font-bold mb-4 relative z-10 flex items-center gap-2">
                                <FaBullhorn className="text-yellow-300" /> Trending Topics
                            </h3>
                            <ul className="space-y-3 relative z-10">
                                {stats.trendingTopics && stats.trendingTopics.length > 0 ? (
                                    stats.trendingTopics.map((topic, index) => (
                                        <li key={topic._id} className="flex items-center cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors group">
                                            <span className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs mr-3 group-hover:scale-110 transition-transform">#{index + 1}</span>
                                            <span className="font-medium truncate">{topic.title}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-sm opacity-80 pl-2">No trending topics yet.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Post Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Start a Discussion</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newPost.title}
                                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="What's on your mind?"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={newPost.category}
                                        onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        {categories.filter(c => c.id !== 'All').map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={newPost.location.city}
                                        onChange={(e) => setNewPost({ ...newPost, location: { ...newPost.location, city: e.target.value } })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="e.g. Mumbai"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                    value={newPost.content}
                                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-32 resize-none"
                                    placeholder="Share details..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg mr-2 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-colors"
                                >
                                    Post Discussion
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDestructive={confirmModal.isDestructive}
            />
        </div>
    );
}

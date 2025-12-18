import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUsers, FaMapMarkerAlt, FaBullhorn, FaShieldAlt,
    FaStore, FaComment, FaThumbsUp, FaThumbsDown, FaShare, FaPlus, FaSearch,
    FaCalendarAlt, FaEllipsisH, FaTimes, FaImage, FaArrowRight, FaLock, FaFlag, FaExclamationTriangle, FaEdit
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { usePageTitle } from '../hooks/usePageTitle';
import ConfirmationModal from '../components/ConfirmationModal';
import { socket } from '../utils/socket';

export default function AdminCommunity() {
    usePageTitle("Admin Dashboard - Community Moderation");
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();

    // Keyframes for inline styles
    const styles = `
@keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
}
.animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
}
.animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
}
`;

    const [posts, setPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false
    });

    // New state for suggestions
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [stats, setStats] = useState({
        activeMembers: 0,
        dailyPosts: 0,
        eventsThisWeek: 0,
        trendingTopics: []
    });

    // Property Mention State
    const [propertySuggestions, setPropertySuggestions] = useState([]);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState({ show: false, query: '', type: null, id: null });
    const [activeReplyInput, setActiveReplyInput] = useState(null); // State for nested reply input // type: 'post' | 'comment' | 'reply'
    const [mentionSearchLoading, setMentionSearchLoading] = useState(false);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

    const [expandedComments, setExpandedComments] = useState({});
    const [commentText, setCommentText] = useState({});
    const [editingContent, setEditingContent] = useState({ type: null, id: null, content: '' });
    const [editingPost, setEditingPost] = useState(null); // State for editing main post content

    // Reply State
    const [replyingTo, setReplyingTo] = useState(null); // { postId, commentId }
    const [replyText, setReplyText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState({}); // { commentId: boolean }

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

    const categories = [
        { id: 'All', icon: FaUsers, label: 'All Posts' },
        { id: 'General', icon: FaComment, label: 'General' },
        { id: 'Neighborhood', icon: FaMapMarkerAlt, label: 'Neighborhood' },
        { id: 'Events', icon: FaCalendarAlt, label: 'Events' },
        { id: 'Safety', icon: FaShieldAlt, label: 'Safety' },
        { id: 'Marketplace', icon: FaStore, label: 'Marketplace' },
        { id: 'Reported', icon: FaFlag, label: 'Reported' },
    ];

    useEffect(() => {
        fetchPosts();
        fetchStats();
    }, [activeTab, searchTerm]); // Added searchTerm to dependencies

    const fetchPosts = async () => {
        try {
            setLoading(true);
            // Auto-filter by user's location if available (optional enhancement)

            const params = new URLSearchParams();
            if (activeTab !== 'All') params.append('category', activeTab);
            if (searchTerm) params.append('searchTerm', searchTerm);

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum?${params.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setPosts(data.posts);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load community posts');
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch when tabs or search changes
    useEffect(() => {
        fetchPosts();
    }, [activeTab, searchTerm]);

    // Search Debounce & Suggestions
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

    useEffect(() => {
        // Socket listeners
        const handlePostCreated = (newPost) => {
            if (activeTab === 'All' || activeTab === newPost.category) {
                setPosts(prev => [newPost, ...prev]);
                setStats(prev => ({ ...prev, dailyPosts: prev.dailyPosts + 1 }));
            }
        };

        const handlePostDeleted = (postId) => {
            setPosts(prev => prev.filter(p => p._id !== postId));
        };

        const handlePostUpdated = (updatedPost) => {
            setPosts(prev => prev.map(p => {
                if (p._id === updatedPost._id) {
                    return {
                        ...updatedPost,
                        comments: p.comments, // Preserve comments
                        author: updatedPost.author || p.author
                    };
                }
                return p;
            }));
        };

        const handleCommentAdded = ({ postId, comment }) => {
            setPosts(prev => prev.map(post => {
                if (post._id === postId) {
                    if (post.comments.some(c => c._id === comment._id)) return post;
                    return { ...post, comments: [...post.comments, comment] };
                }
                return post;
            }));
        };

        const handleCommentDeleted = ({ postId, commentId }) => {
            setPosts(prev => prev.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        comments: post.comments.filter(c => c._id !== commentId)
                    };
                }
                return post;
            }));
        };

        const handleReplyAdded = ({ postId, commentId, reply }) => {
            setPosts(prev => prev.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        comments: post.comments.map(comment => {
                            if (comment._id === commentId) {
                                if (comment.replies && comment.replies.some(r => r._id === reply._id)) return comment;
                                return {
                                    ...comment,
                                    replies: [...(comment.replies || []), reply]
                                };
                            }
                            return comment;
                        })
                    };
                }
                return post;
            }));
        };

        const handleReplyDeleted = ({ postId, commentId, replyId }) => {
            setPosts(prev => prev.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        comments: post.comments.map(comment => {
                            if (comment._id === commentId) {
                                return {
                                    ...comment,
                                    replies: comment.replies ? comment.replies.filter(r => r._id !== replyId) : []
                                };
                            }
                            return comment;
                        })
                    };
                }
                return post;
            }));
        };

        socket.on('forum:postCreated', handlePostCreated);
        socket.on('forum:postDeleted', handlePostDeleted);
        socket.on('forum:postUpdated', handlePostUpdated);
        socket.on('forum:commentAdded', handleCommentAdded);
        socket.on('forum:commentDeleted', handleCommentDeleted);
        socket.on('forum:replyAdded', handleReplyAdded);
        socket.on('forum:replyDeleted', handleReplyDeleted);

        return () => {
            socket.off('forum:postCreated', handlePostCreated);
            socket.off('forum:postDeleted', handlePostDeleted);
            socket.off('forum:postUpdated', handlePostUpdated);
            socket.off('forum:commentAdded', handleCommentAdded);
            socket.off('forum:commentDeleted', handleCommentDeleted);
            socket.off('forum:replyAdded', handleReplyAdded);
            socket.off('forum:replyDeleted', handleReplyDeleted);
        };
    }, [activeTab]);

    const handleLike = async (postId) => {
        if (!currentUser) return navigate('/sign-in');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/like/${postId}`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (res.ok) {
                const updatedPost = await res.json();
                setPosts(posts.map(post => post._id === postId ? { ...updatedPost, author: post.author, comments: post.comments } : post));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDislike = async (postId) => {
        if (!currentUser) return navigate('/sign-in');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/dislike/${postId}`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (res.ok) {
                const updatedPost = await res.json();
                setPosts(posts.map(post => post._id === postId ? { ...updatedPost, author: post.author, comments: post.comments } : post));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCommentReaction = async (postId, commentId, reactionType) => {
        if (!currentUser) return navigate('/sign-in');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/${postId}/${commentId}/${reactionType}`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (res.ok) {
                // Optimistic/Manual update to preserve author info
                setPosts(prevPosts => prevPosts.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            comments: post.comments.map(comment => {
                                if (comment._id === commentId) {
                                    const userId = currentUser._id;
                                    let newLikes = [...(comment.likes || [])];
                                    let newDislikes = [...(comment.dislikes || [])];

                                    if (reactionType === 'like') {
                                        if (newLikes.includes(userId)) {
                                            newLikes = newLikes.filter(id => id !== userId);
                                        } else {
                                            newLikes.push(userId);
                                            newDislikes = newDislikes.filter(id => id !== userId);
                                        }
                                    } else {
                                        if (newDislikes.includes(userId)) {
                                            newDislikes = newDislikes.filter(id => id !== userId);
                                        } else {
                                            newDislikes.push(userId);
                                            newLikes = newLikes.filter(id => id !== userId);
                                        }
                                    }
                                    return { ...comment, likes: newLikes, dislikes: newDislikes };
                                }
                                return comment;
                            })
                        };
                    }
                    return post;
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleReplyReaction = async (postId, commentId, replyId, reactionType) => {
        if (!currentUser) return navigate('/sign-in');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/${postId}/${commentId}/reply/${replyId}/${reactionType}`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (res.ok) {
                // Optimistic/Manual update to preserve author info
                setPosts(prevPosts => prevPosts.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            comments: post.comments.map(comment => {
                                if (comment._id === commentId) {
                                    return {
                                        ...comment,
                                        replies: comment.replies.map(reply => {
                                            if (reply._id === replyId) {
                                                const userId = currentUser._id;
                                                let newLikes = [...(reply.likes || [])];
                                                let newDislikes = [...(reply.dislikes || [])];

                                                if (reactionType === 'like') {
                                                    if (newLikes.includes(userId)) {
                                                        newLikes = newLikes.filter(id => id !== userId);
                                                    } else {
                                                        newLikes.push(userId);
                                                        newDislikes = newDislikes.filter(id => id !== userId);
                                                    }
                                                } else {
                                                    if (newDislikes.includes(userId)) {
                                                        newDislikes = newDislikes.filter(id => id !== userId);
                                                    } else {
                                                        newDislikes.push(userId);
                                                        newLikes = newLikes.filter(id => id !== userId);
                                                    }
                                                }
                                                return { ...reply, likes: newLikes, dislikes: newDislikes };
                                            }
                                            return reply;
                                        })
                                    };
                                }
                                return comment;
                            })
                        };
                    }
                    return post;
                }));
            }
        } catch (error) {
            console.error(error);
        }
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




    const handleUpdatePost = async (e, postId) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: editingPost.content })
            });

            if (res.ok) {
                const updatedPost = await res.json();
                setPosts(posts.map(p => p._id === postId ? { ...p, ...updatedPost } : p));
                setEditingPost(null);
                toast.success('Post updated');
            } else {
                toast.error('Failed to update post');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update post');
        }
    };


    const handleDeletePost = (postId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Discussion',
            message: 'Are you sure you want to delete this discussion permanently? This action cannot be undone.',
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

    const handlePinPost = (postId, isPinned) => {
        setConfirmModal({
            isOpen: true,
            title: isPinned ? 'Unpin Discussion' : 'Pin Discussion',
            message: isPinned
                ? 'Are you sure you want to unpin this discussion? It will no longer appear at the top of the feed.'
                : 'Are you sure you want to pin this discussion? It will appear at the top of the feed for better visibility.',
            confirmText: isPinned ? 'Unpin' : 'Pin',
            isDestructive: false,
            onConfirm: async () => {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/pin/${postId}`, {
                        method: 'PUT',
                        credentials: 'include'
                    });
                    if (res.ok) {
                        const updatedPost = await res.json();
                        setPosts(posts.map(p => p._id === postId ? { ...p, isPinned: updatedPost.isPinned } : p));
                        toast.success(updatedPost.isPinned ? 'Post pinned successfully' : 'Post unpinned successfully');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to update pin status');
                }
            }
        });
    };

    const handleLockPost = (postId, isLocked) => {
        setConfirmModal({
            isOpen: true,
            title: isLocked ? 'Unlock Discussion' : 'Lock Discussion',
            message: isLocked
                ? 'Are you sure you want to unlock this discussion? Users will be able to comment and reply again.'
                : 'Are you sure you want to lock this discussion? Regular users will no longer be able to add comments or replies.',
            confirmText: isLocked ? 'Unlock' : 'Lock',
            isDestructive: !isLocked,
            onConfirm: async () => {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/lock/${postId}`, {
                        method: 'PUT',
                        credentials: 'include'
                    });
                    if (res.ok) {
                        const updatedPost = await res.json();
                        setPosts(posts.map(p => p._id === postId ? { ...p, isLocked: updatedPost.isLocked } : p));
                        toast.success(updatedPost.isLocked ? 'Post locked' : 'Post unlocked');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to update lock status');
                }
            }
        });
    };

    const toggleComments = (postId) => {
        setExpandedComments(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
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



    const handleAddReply = async (e, postId, commentId, parentReplyId = null) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/${postId}/${commentId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    content: replyText,
                    replyToUser: replyingTo?.userId,
                    parentReplyId
                })
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
                setActiveReplyInput(null);
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

    const handleUpdateComment = async (e, postId, commentId) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/${postId}/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: editingContent.content })
            });

            if (res.ok) {
                const updatedComment = await res.json();
                setPosts(posts.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            comments: post.comments.map(c => c._id === commentId ? { ...c, ...updatedComment } : c)
                        };
                    }
                    return post;
                }));
                setEditingContent({ type: null, id: null, content: '' });
                toast.success('Comment updated');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to update comment');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update comment');
        }
    };

    const handleUpdateReply = async (e, postId, commentId, replyId) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum/comment/${postId}/${commentId}/reply/${replyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: editingContent.content })
            });

            if (res.ok) {
                const updatedReply = await res.json();
                setPosts(posts.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            comments: post.comments.map(c => {
                                if (c._id === commentId) {
                                    return {
                                        ...c,
                                        replies: c.replies.map(r => r._id === replyId ? { ...r, ...updatedReply } : r)
                                    };
                                }
                                return c;
                            })
                        };
                    }
                    return post;
                }));
                setEditingContent({ type: null, id: null, content: '' });
                toast.success('Reply updated');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to update reply');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update reply');
        }
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

    // Property Mention Logic
    const searchProperties = async (query) => {
        try {
            setMentionSearchLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/property-search/search?query=${encodeURIComponent(query)}&limit=5`);
            if (res.ok) {
                const data = await res.json();
                setPropertySuggestions(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setMentionSearchLoading(false);
        }
    };

    const handleInputChange = (e, type, id = null) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        // Update state based on input type
        if (type === 'post') {
            setNewPost(prev => ({ ...prev, content: value }));
        } else if (type === 'comment') {
            setCommentText(prev => ({ ...prev, [id]: value }));
        } else if (type === 'reply') {
            setReplyText(value);
        }

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            // Check if there's no space between @ and cursor (searching for the term)
            if (!textAfterAt.includes(' ')) {
                setShowMentionSuggestions({ show: true, query: textAfterAt, type, id });
                setSelectedMentionIndex(0);
                searchProperties(textAfterAt);
                return;
            }
        }
        setShowMentionSuggestions({ show: false, query: '', type: null, id: null });
    };

    const handleMentionSelect = (property) => {
        const { query, type: contextType, id: contextId } = showMentionSuggestions;
        let currentValue = '';

        if (contextType === 'post') currentValue = newPost.content;
        else if (contextType === 'comment') currentValue = commentText[contextId] || '';
        else if (contextType === 'reply') currentValue = replyText;

        const textBeforeAt = currentValue.substring(0, currentValue.lastIndexOf('@' + query));
        const textAfterAt = currentValue.substring(currentValue.lastIndexOf('@' + query) + 1 + query.length);

        // Using formatting compatible with FormattedTextWithLinks: @[Name](ID)
        const newValue = `${textBeforeAt}@[${property.name}](${property.id}) ${textAfterAt}`;

        if (contextType === 'post') {
            setNewPost(prev => ({ ...prev, content: newValue }));
        } else if (contextType === 'comment') {
            setCommentText(prev => ({ ...prev, [contextId]: newValue }));
        } else if (contextType === 'reply') {
            setReplyText(newValue);
        }

        setShowMentionSuggestions({ show: false, query: '', type: null, id: null });
    };

    const renderMentionsPanel = (customClass = "") => {
        if (!showMentionSuggestions.show || propertySuggestions.length === 0) return null;
        return (
            <div className={`absolute z-50 w-72 bg-white shadow-2xl rounded-xl border border-gray-100 overflow-hidden animate-fade-in-up ${customClass}`}>
                <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Mention Property</span>
                    {mentionSearchLoading && <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <div className="max-h-48 overflow-y-auto">
                    {propertySuggestions.map((prop, idx) => (
                        <div
                            key={prop._id}
                            onClick={() => handleMentionSelect(prop)}
                            className={`px-4 py-3 cursor-pointer transition-all flex items-center gap-3 border-b border-gray-50 last:border-0 ${idx === selectedMentionIndex ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
                        >
                            <img src={prop.coverImage || prop.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3'} className="w-8 h-8 rounded-lg object-cover shadow-sm bg-gray-200" alt="" />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${idx === selectedMentionIndex ? 'text-white' : 'text-gray-800'}`}>{prop.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <FaMapMarkerAlt size={10} className={idx === selectedMentionIndex ? 'text-blue-200' : 'text-blue-500'} />
                                    <p className={`text-[10px] truncate ${idx === selectedMentionIndex ? 'text-blue-100' : 'text-gray-500'}`}>{prop.location?.city || 'India'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const formatContent = (content) => {
        if (!content) return '';
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }
            parts.push(
                <Link
                    key={match.index}
                    to={`/admin/listing/${match[2]}`}
                    className="text-blue-600 hover:underline font-medium bg-blue-50 px-1 rounded mx-0.5"
                    onClick={(e) => e.stopPropagation()}
                >
                    @{match[1]}
                </Link>
            );
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }
        return parts.length > 0 ? parts : content;
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12 font-sans">
            <style>{styles}</style>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Community Dashboard</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Manage community discussions, pin important announcements, and moderate content to keep the neighborhood safe.
                    </p>
                    <div className="w-24 h-1 bg-blue-600 mx-auto mt-6 rounded-full opacity-20"></div>
                </div>

                {/* Controls & Tabs */}
                <div className="flex flex-col xl:flex-row justify-between items-center mb-8 gap-4">
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
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                        <div className="relative w-full sm:w-64">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search discussions..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => searchTerm.length > 2 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => fetchPosts()}
                                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                            >
                                Search
                            </button>
                            <button
                                onClick={() => {
                                    if (!currentUser) {
                                        toast.error("Please sign in to post");
                                        return navigate('/sign-in');
                                    }
                                    setShowCreateModal(true);
                                }}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap"
                            >
                                <FaPlus /> Start Discussion
                            </button>
                        </div>
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
                                                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    {post.location?.city && (
                                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                            <FaMapMarkerAlt className="text-red-400" /> {post.location.city}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 justify-end">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${post.category === 'Safety' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                post.category === 'Events' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                    post.category === 'Marketplace' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                        'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                {post.category}
                                            </span>
                                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-full border border-gray-100">
                                                <button
                                                    onClick={() => handlePinPost(post._id, post.isPinned)}
                                                    className={`p-2 rounded-full hover:bg-white hover:shadow-sm transition-all ${post.isPinned ? 'text-blue-600' : 'text-gray-400'}`}
                                                    title={post.isPinned ? "Unpin Post" : "Pin Post"}
                                                >
                                                    <FaMapMarkerAlt className="transform rotate-45 text-sm" />
                                                </button>
                                                <button
                                                    onClick={() => handleLockPost(post._id, post.isLocked)}
                                                    className={`p-2 rounded-full hover:bg-white hover:shadow-sm transition-all ${post.isLocked ? 'text-orange-500' : 'text-gray-400'}`}
                                                    title={post.isLocked ? "Unlock Post" : "Lock Post"}
                                                >
                                                    <FaLock className="text-sm" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePost(post._id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-full transition-all"
                                                    title="Delete Post"
                                                >
                                                    <FaTimes className="text-sm" />
                                                </button>
                                                {/* Edit Button for Admin/Author */}
                                                {(currentUser && (currentUser._id === post.author?._id || currentUser.role === 'admin' || currentUser.role === 'rootadmin')) && (
                                                    <button
                                                        onClick={() => setEditingPost({ id: post._id, content: post.content })}
                                                        className="p-2 rounded-full hover:bg-blue-50 hover:text-blue-500 text-gray-400 transition-all"
                                                        title="Edit Post"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Post Content */}
                                    <div className="mb-6 pl-2 border-l-4 border-gray-100 hover:border-blue-100 transition-colors">
                                        <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{post.title}</h2>

                                        {editingPost?.id === post._id ? (
                                            <form onSubmit={(e) => handleUpdatePost(e, post._id)} className="w-full mb-2">
                                                <textarea
                                                    value={editingPost.content}
                                                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                                                    className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 min-h-[100px]"
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingPost(null)}
                                                        className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded bg-gray-100"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                                                {formatContent(post.content)}
                                                {post.isEdited && <span className="text-[10px] text-gray-400 italic font-normal ml-2">(edited)</span>}
                                            </p>
                                        )}
                                        {/* Placeholder for optional post image if any */}
                                        {/* {post.images && post.images.length > 0 && (...)} */}

                                        {/* Report Details (Admin View) */}
                                        {post.reports && post.reports.length > 0 && (
                                            <div className="mt-4 bg-red-50/50 rounded-xl p-4 border border-red-100/50">
                                                <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-2">
                                                    <FaFlag className="text-xs" />
                                                    <span>User Reports ({post.reports.length})</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {post.reports.map((report, rIdx) => (
                                                        <div key={rIdx} className="bg-white/80 p-2 rounded-lg text-xs border border-red-50 shadow-sm flex items-start gap-2">
                                                            <div className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase text-[10px]">Flag</div>
                                                            <p className="text-gray-700 leading-normal italic">"{report.reason}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Post Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="flex items-center gap-1 bg-gray-50 rounded-full px-1 border border-gray-100">
                                                <button
                                                    onClick={() => handleLike(post._id)}
                                                    className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all ${currentUser && post.likes?.includes(currentUser._id)
                                                        ? 'text-blue-600'
                                                        : 'text-gray-500 hover:text-blue-600'
                                                        }`}
                                                    title="Like"
                                                >
                                                    <FaThumbsUp className={`text-base transform group-hover:scale-110 transition-transform ${currentUser && post.likes?.includes(currentUser._id) ? 'fill-current' : ''}`} />
                                                    <span className="font-semibold text-xs">{post.likes?.length || 0}</span>
                                                </button>
                                                <div className="w-[1px] h-4 bg-gray-200"></div>
                                                <button
                                                    onClick={() => handleDislike(post._id)}
                                                    className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all ${currentUser && post.dislikes?.includes(currentUser._id)
                                                        ? 'text-red-500'
                                                        : 'text-gray-500 hover:text-red-500'
                                                        }`}
                                                    title="Dislike"
                                                >
                                                    <FaThumbsDown className={`text-base transform group-hover:scale-110 transition-transform ${currentUser && post.dislikes?.includes(currentUser._id) ? 'fill-current' : ''}`} />
                                                    <span className="font-semibold text-xs">{post.dislikes?.length || 0}</span>
                                                </button>
                                            </div>

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
                                                                        <span className="text-[10px] text-gray-500 mr-4">
                                                                            {new Date(comment.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                        </span>
                                                                    </div>
                                                                    {editingContent.id === comment._id && editingContent.type === 'comment' ? (
                                                                        <form onSubmit={(e) => handleUpdateComment(e, post._id, comment._id)} className="w-full mb-2">
                                                                            <textarea
                                                                                value={editingContent.content}
                                                                                onChange={(e) => setEditingContent({ ...editingContent, content: e.target.value })}
                                                                                className="w-full bg-white border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 min-h-[60px]"
                                                                                autoFocus
                                                                            />
                                                                            <div className="flex justify-end gap-2 mt-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setEditingContent({ type: null, id: null, content: '' })}
                                                                                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                                <button
                                                                                    type="submit"
                                                                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                                                                >
                                                                                    Save
                                                                                </button>
                                                                            </div>
                                                                        </form>
                                                                    ) : (
                                                                        <p className="text-sm text-gray-700">
                                                                            {formatContent(comment.content)}
                                                                            {comment.isEdited && <span className="text-[10px] text-gray-400 italic font-normal ml-2">(edited)</span>}
                                                                        </p>
                                                                    )}

                                                                    {/* Report Indicator */}
                                                                    {comment.reports && comment.reports.length > 0 && (
                                                                        <div className="mt-2 bg-red-50 border border-red-100 p-2 rounded text-xs text-red-600 flex items-center gap-2">
                                                                            <FaExclamationTriangle />
                                                                            Reported: {comment.reports.length} times
                                                                            <span className="text-gray-500">- Last reason: {comment.reports[comment.reports.length - 1].reason}</span>
                                                                        </div>
                                                                    )}

                                                                    {/* Actions */}
                                                                    <div className="flex items-center gap-4 mt-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <button
                                                                                onClick={() => handleCommentReaction(post._id, comment._id, 'like')}
                                                                                className={`flex items-center gap-1 text-xs font-semibold ${comment.likes?.includes(currentUser?._id) ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                                                                            >
                                                                                <FaThumbsUp /> {comment.likes?.length || 0}
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleCommentReaction(post._id, comment._id, 'dislike')}
                                                                                className={`flex items-center gap-1 text-xs font-semibold ${comment.dislikes?.includes(currentUser?._id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                                                                            >
                                                                                <FaThumbsDown /> {comment.dislikes?.length || 0}
                                                                            </button>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                setActiveReplyInput(comment._id);
                                                                                setReplyingTo({ postId: post._id, commentId: comment._id });
                                                                            }}
                                                                            className="text-xs font-semibold text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
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

                                                                    {/* Admin Edit Comment Button */}
                                                                    <button
                                                                        onClick={() => setEditingContent({ type: 'comment', id: comment._id, content: comment.content })}
                                                                        className="absolute right-8 top-2 p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                                                        title="Edit Comment (Admin)"
                                                                    >
                                                                        <FaEdit className="text-xs" />
                                                                    </button>

                                                                    {/* Admin Delete Comment Button */}
                                                                    <button
                                                                        onClick={() => handleDeleteComment(post._id, comment._id)}
                                                                        className="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                                                        title="Delete Comment (Admin)"
                                                                    >
                                                                        <FaTimes className="text-xs" />
                                                                    </button>
                                                                </div>

                                                                {/* Top level Reply Input */}
                                                                {activeReplyInput === comment._id && (
                                                                    <div className="mt-2 flex gap-2 animate-fade-in pl-2">
                                                                        <img
                                                                            src={currentUser?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                                            className="w-6 h-6 rounded-full object-cover"
                                                                        />
                                                                        <form onSubmit={(e) => handleAddReply(e, post._id, comment._id, null)} className="flex-1 flex gap-2 relative">
                                                                            {showMentionSuggestions.show && showMentionSuggestions.id === comment._id && renderMentionsPanel("bottom-full mb-2")}
                                                                            <input
                                                                                type="text"
                                                                                autoFocus
                                                                                value={replyText}
                                                                                onChange={(e) => handleInputChange(e, 'reply', comment._id)}
                                                                                placeholder="Add a reply... (Type @ to mention property)"
                                                                                className="flex-1 bg-white border-b-2 border-gray-200 focus:border-blue-500 outline-none text-sm py-1 px-2"
                                                                            />
                                                                            <div className="flex gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => { setActiveReplyInput(null); setReplyText(''); setReplyingTo(null); }}
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

                                                                {/* Infinite Recursive Replies */}
                                                                {expandedReplies[comment._id] && comment.replies && (
                                                                    <div className="mt-2 space-y-3 pl-4 border-l-2 border-gray-100 ml-2">
                                                                        {(() => {
                                                                            const renderReplies = (parentId) => {
                                                                                const currentReplies = comment.replies.filter(r => (r.parentReplyId || null) === (parentId || null));
                                                                                if (!currentReplies.length) return null;

                                                                                return currentReplies.map(reply => {
                                                                                    const subReplies = comment.replies.filter(r => r.parentReplyId === reply._id);
                                                                                    return (
                                                                                        <div key={reply._id} className="flex gap-2 relative group/reply flex-col mb-2 animate-fade-in">
                                                                                            <div className="flex gap-2">
                                                                                                <img
                                                                                                    src={reply.user?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                                                                    className="w-6 h-6 rounded-full object-cover mt-1"
                                                                                                />
                                                                                                <div className="flex-1">
                                                                                                    <div className="bg-gray-50/50 p-2 rounded-lg relative">
                                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                                            <span className="text-xs font-bold text-gray-800">{reply.user?.username}</span>
                                                                                                            <span className="text-[10px] text-gray-400">
                                                                                                                {new Date(reply.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        {editingContent.id === reply._id && editingContent.type === 'reply' ? (
                                                                                                            <form onSubmit={(e) => handleUpdateReply(e, post._id, comment._id, reply._id)} className="w-full mb-2">
                                                                                                                <textarea
                                                                                                                    value={editingContent.content}
                                                                                                                    onChange={(e) => setEditingContent({ ...editingContent, content: e.target.value })}
                                                                                                                    className="w-full bg-white border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500 min-h-[50px]"
                                                                                                                    autoFocus
                                                                                                                />
                                                                                                                <div className="flex justify-end gap-2 mt-1">
                                                                                                                    <button
                                                                                                                        type="button"
                                                                                                                        onClick={() => setEditingContent({ type: null, id: null, content: '' })}
                                                                                                                        className="text-[10px] text-gray-500 hover:text-gray-700 px-2 py-1"
                                                                                                                    >
                                                                                                                        Cancel
                                                                                                                    </button>
                                                                                                                    <button
                                                                                                                        type="submit"
                                                                                                                        className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                                                                                                    >
                                                                                                                        Save
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                            </form>
                                                                                                        ) : (
                                                                                                            <p className="text-xs text-gray-700">
                                                                                                                {formatContent(reply.content)}
                                                                                                                {reply.isEdited && <span className="text-[10px] text-gray-400 italic font-normal ml-2">(edited)</span>}
                                                                                                            </p>
                                                                                                        )}

                                                                                                        {/* Report Indicator */}
                                                                                                        {reply.reports && reply.reports.length > 0 && (
                                                                                                            <div className="mt-1 bg-red-50 border border-red-100 p-1 rounded text-[10px] text-red-600 flex items-center gap-1">
                                                                                                                <FaExclamationTriangle />
                                                                                                                Reported: {reply.reports.length}
                                                                                                                <span className="text-gray-500 truncate">- {reply.reports[reply.reports.length - 1].reason}</span>
                                                                                                            </div>
                                                                                                        )}

                                                                                                        <div className="flex items-center gap-3 mt-1.5">
                                                                                                            <button
                                                                                                                onClick={() => handleReplyReaction(post._id, comment._id, reply._id, 'like')}
                                                                                                                className={`flex items-center gap-1 text-[10px] font-semibold ${reply.likes?.includes(currentUser?._id) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                                                                                                            >
                                                                                                                <FaThumbsUp /> {reply.likes?.length || 0}
                                                                                                            </button>
                                                                                                            <button
                                                                                                                onClick={() => handleReplyReaction(post._id, comment._id, reply._id, 'dislike')}
                                                                                                                className={`flex items-center gap-1 text-[10px] font-semibold ${reply.dislikes?.includes(currentUser?._id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                                                                                            >
                                                                                                                <FaThumbsDown /> {reply.dislikes?.length || 0}
                                                                                                            </button>
                                                                                                            {/* Admin Reply Button */}
                                                                                                            <button
                                                                                                                onClick={() => {
                                                                                                                    setActiveReplyInput(reply._id);
                                                                                                                    if (reply.user) {
                                                                                                                        setReplyingTo({ postId: post._id, commentId: comment._id, userId: reply.user._id, username: reply.user.username });
                                                                                                                    }
                                                                                                                }}
                                                                                                                className="text-[10px] font-semibold text-gray-500 hover:text-blue-600 bg-gray-100/80 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors outline-none"
                                                                                                            >
                                                                                                                Reply
                                                                                                            </button>
                                                                                                            {subReplies.length > 0 && (
                                                                                                                <button
                                                                                                                    onClick={() => setExpandedReplies(prev => ({ ...prev, [reply._id]: !prev[reply._id] }))}
                                                                                                                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 outline-none"
                                                                                                                >
                                                                                                                    {expandedReplies[reply._id] ? 'Hide' : `View ${subReplies.length} Replies`}
                                                                                                                </button>
                                                                                                            )}
                                                                                                        </div>

                                                                                                        {/* Admin Edit Reply Button */}
                                                                                                        <button
                                                                                                            onClick={() => setEditingContent({ type: 'reply', id: reply._id, content: reply.content })}
                                                                                                            className="absolute right-6 top-1 p-1 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all opacity-0 group-hover/reply:opacity-100"
                                                                                                            title="Edit Reply (Admin)"
                                                                                                        >
                                                                                                            <FaEdit size={10} />
                                                                                                        </button>

                                                                                                        {/* Admin Delete Reply Button */}
                                                                                                        <button
                                                                                                            onClick={() => handleDeleteReply(post._id, comment._id, reply._id)}
                                                                                                            className="absolute right-1 top-1 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover/reply:opacity-100"
                                                                                                            title="Delete Reply (Admin)"
                                                                                                        >
                                                                                                            <FaTimes size={10} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                    {/* Reply Input for Nested Reply */}
                                                                                                    {activeReplyInput === reply._id && (
                                                                                                        <div className="mt-2 flex gap-2 animate-fade-in pl-2">
                                                                                                            <img
                                                                                                                src={currentUser?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                                                                                className="w-6 h-6 rounded-full object-cover"
                                                                                                            />
                                                                                                            <form onSubmit={(e) => handleAddReply(e, post._id, comment._id, reply._id)} className="flex-1 flex gap-2 relative">
                                                                                                                {showMentionSuggestions.show && showMentionSuggestions.id === comment._id && renderMentionsPanel("bottom-full mb-2")}
                                                                                                                <input
                                                                                                                    type="text"
                                                                                                                    autoFocus
                                                                                                                    value={replyText}
                                                                                                                    onChange={(e) => handleInputChange(e, 'reply', comment._id)}
                                                                                                                    placeholder={`Replying to ${reply.user?.username}...`}
                                                                                                                    className="flex-1 bg-white border-b-2 border-gray-200 focus:border-blue-500 outline-none text-sm py-1 px-2"
                                                                                                                />
                                                                                                                <div className="flex gap-1">
                                                                                                                    <button
                                                                                                                        type="button"
                                                                                                                        onClick={() => { setActiveReplyInput(null); setReplyText(''); setReplyingTo(null); }}
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
                                                                                                    {/* Recursion: Render replies to this reply */}
                                                                                                    {expandedReplies[reply._id] && (
                                                                                                        <div className="ml-4 border-l-2 border-gray-100 pl-2 mt-2 animate-fade-in">
                                                                                                            {renderReplies(reply._id)}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                });
                                                                            };
                                                                            return renderReplies(null);
                                                                        })()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-gray-500 text-sm py-2">No comments yet.</p>
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
                                                        {showMentionSuggestions.show && showMentionSuggestions.id === post._id && renderMentionsPanel("bottom-full mb-2")}
                                                        <input
                                                            type="text"
                                                            placeholder="Write a comment... (Type @ to mention property)"
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            value={commentText[post._id] || ''}
                                                            onChange={(e) => handleInputChange(e, 'comment', post._id)}
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
                                <div className="relative">
                                    {showMentionSuggestions.show && showMentionSuggestions.type === 'post' && renderMentionsPanel("bottom-full mb-2")}
                                    <textarea
                                        value={newPost.content}
                                        onChange={(e) => handleInputChange(e, 'post')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-32 resize-none"
                                        placeholder="Share details... (Type @ to mention property)"
                                        required
                                    />
                                </div>
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

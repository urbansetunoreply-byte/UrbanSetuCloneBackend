import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUsers, FaMapMarkerAlt, FaBullhorn, FaShieldAlt,
    FaStore, FaComment, FaHeart, FaShare, FaPlus, FaSearch,
    FaCalendarAlt, FaEllipsisH, FaTimes, FaImage
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Community() {
    usePageTitle("Community Hub - Neighborhood Forum");
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        activeMembers: 0,
        dailyPosts: 0,
        eventsThisWeek: 0
    });

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
    ];

    useEffect(() => {
        fetchPosts();
        fetchStats();
    }, [activeTab]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (activeTab !== 'All') queryParams.append('category', activeTab);
            // Auto-filter by user's location if available (optional enhancement)

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forum?${queryParams.toString()}`);
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
                setPosts(posts.map(post => post._id === postId ? updatedPost : post));
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

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Neighborhood Community Hub</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Connect with your neighbors, discuss local events, share safety alerts, and build a better community together.
                    </p>
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
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
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
                            posts.map(post => (
                                <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                    {/* Post Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={post.author?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                alt={post.author?.username}
                                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                            />
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{post.author?.username}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <FaMapMarkerAlt /> {post.location?.city || 'General'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${post.category === 'Safety' ? 'bg-red-100 text-red-700' :
                                            post.category === 'Events' ? 'bg-purple-100 text-purple-700' :
                                                post.category === 'Marketplace' ? 'bg-green-100 text-green-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {post.category}
                                        </span>
                                    </div>

                                    {/* Post Content */}
                                    <div className="mb-4">
                                        <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                                        <p className="text-gray-600 whitespace-pre-line">{post.content}</p>
                                    </div>

                                    {/* Post Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={() => handleLike(post._id)}
                                                className={`flex items-center gap-2 transition-colors ${currentUser && post.likes.includes(currentUser._id)
                                                    ? 'text-red-500'
                                                    : 'text-gray-500 hover:text-red-500'
                                                    }`}
                                            >
                                                <FaHeart className={currentUser && post.likes.includes(currentUser._id) ? 'fill-current' : ''} />
                                                <span>{post.likes.length}</span>
                                            </button>
                                            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                                                <FaComment />
                                                <span>{post.comments?.length || 0}</span>
                                            </button>
                                            <button className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors">
                                                <FaShare />
                                                <span>Share</span>
                                            </button>
                                        </div>
                                    </div>
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
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Active Members</span>
                                    <span className="font-semibold text-blue-600">{stats.activeMembers}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Daily Posts</span>
                                    <span className="font-semibold text-green-600">{stats.dailyPosts}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Events This Week</span>
                                    <span className="font-semibold text-purple-600">{stats.eventsThisWeek}</span>
                                </div>
                            </div>
                        </div>

                        {/* Trending Topics */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Trending Topics</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-3">#</span>
                                    <span className="text-gray-700 font-medium">Summer Block Party</span>
                                </li>
                                <li className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-3">#</span>
                                    <span className="text-gray-700 font-medium">New Park Opening</span>
                                </li>
                                <li className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs mr-3">#</span>
                                    <span className="text-gray-700 font-medium">Safety Watch</span>
                                </li>
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
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PublicBlogsSkeleton from '../components/skeletons/PublicBlogsSkeleton';
import { toast } from 'react-hot-toast';
import {
    Search as SearchIcon, Filter, BookOpen, Clock, Lightbulb,
    ArrowRight, ChevronLeft, ChevronRight, Mail, Star, MapPin,
    TrendingUp, GraduationCap, Home, FileText, CheckCircle, Info, X, Tag
} from 'lucide-react';

import { usePageTitle } from '../hooks/usePageTitle';
import { authenticatedFetch } from '../utils/auth';

const PublicGuides = () => {
    // Set page title
    usePageTitle("Real Estate Guides - Learning Hub");

    const [guides, setGuides] = useState([]);
    const [featuredGuides, setFeaturedGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu-pvt4.onrender.com';

    const GUIDE_CATEGORIES = [
        { name: 'All', icon: BookOpen },
        { name: 'Home Buying', icon: Home },
        { name: 'Rent', icon: CheckCircle }, // 'Rent' matches existing DB content better than 'Renting' if strictly mapped, but let's try to map generic logic if needed.
        { name: 'Home Selling', icon: TrendingUp },
        { name: 'Legal', icon: FileText },
        { name: 'Investment', icon: MapPin },
        { name: 'City Guide', icon: MapPin },
    ];

    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const { currentUser } = useSelector((state) => state.user);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);

    // Subscription OTP State
    const [subscribeStep, setSubscribeStep] = useState('INPUT_EMAIL'); // 'INPUT_EMAIL', 'VERIFY_OTP'
    const [subscribeOtp, setSubscribeOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    // Unsubscribe OTP State
    const [showOptOutModal, setShowOptOutModal] = useState(false);
    const [optOutReason, setOptOutReason] = useState('');

    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [unsubscribeStep, setUnsubscribeStep] = useState('REASON'); // 'REASON', 'VERIFY_OTP'
    const [unsubscribeOtp, setUnsubscribeOtp] = useState('');


    useEffect(() => {
        fetchFeaturedGuides();
        fetchTags();
        fetchGuides();
        if (currentUser) {
            fetchSubscriptionStatus();
            setEmail(currentUser.email); // Default to current user's email but allow editing
        } else {
            const subscribed = localStorage.getItem('newsletter_subscribed');
            if (subscribed) {
                setIsSubscribed(true);
            }
        }
    }, [currentUser]);

    // Immediate filter effects
    useEffect(() => {
        if (pagination.current === 1) {
            fetchGuides(false); // Don't show full loading for filter changes
        } else {
            setPagination(prev => ({ ...prev, current: 1 }));
        }
    }, [selectedCategory, searchTerm, selectedTags]);

    // Pagination effect
    useEffect(() => {
        fetchGuides();
    }, [pagination.current]);

    const toggleCategory = (categoryName) => {
        if (categoryName === 'All') {
            setSelectedCategory('All');
        } else {
            setSelectedCategory(categoryName);
        }
    };

    const toggleTag = (tag) => {
        if (tag === 'all') {
            setSelectedTags([]);
            return;
        }
        setSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            } else {
                return [...prev, tag];
            }
        });
    };

    const fetchSubscriptionStatus = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/subscription/my-status`, { autoRedirect: false });
            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.status) {
                    setSubscriptionStatus(data.data.status);
                } else {
                    setSubscriptionStatus('not_subscribed');
                }
            }
        } catch (error) {
            console.error('Error fetching subscription status:', error);
        }
    };

    const handleSendSubscribeOtp = async () => {
        if ((!email || !email.includes('@')) && !currentUser) {
            toast.error('Please enter a valid email address');
            return;
        }

        const emailToSubscribe = currentUser ? currentUser.email : email;
        setOtpLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/subscription/send-subscribe-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToSubscribe, source: 'guides_page' })
            });
            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                setSubscribeStep('VERIFY_OTP');
            } else {
                toast.error(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            toast.error('Failed to send OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifySubscribeOtp = async () => {
        if (!subscribeOtp) {
            toast.error('Please enter OTP');
            return;
        }

        const emailToSubscribe = currentUser ? currentUser.email : email;
        setOtpLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/subscription/verify-subscribe-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToSubscribe, otp: subscribeOtp, source: 'guides_page' })
            });
            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                localStorage.setItem('newsletter_subscribed', 'true');
                setIsSubscribed(true);
                if (currentUser) fetchSubscriptionStatus();
                setSubscribeStep('INPUT_EMAIL');
                setSubscribeOtp('');
                setEmail('');
            } else {
                toast.error(data.message || 'Invalid OTP');
            }
        } catch (error) {
            toast.error('Failed to verification');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleUnsubscribeClick = () => {
        setShowOptOutModal(true);
        setOptOutReason('');
        setUnsubscribeStep('REASON');
        setUnsubscribeOtp('');
    };

    const handleSendUnsubscribeOtp = async () => {
        setOtpLoading(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/subscription/send-unsubscribe-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.success) {
                toast.success('OTP sent for verification');
                setUnsubscribeStep('VERIFY_OTP');
            } else {
                toast.error(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            toast.error('Failed to send OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyUnsubscribeOtp = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/subscription/verify-unsubscribe-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: optOutReason, otp: unsubscribeOtp })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Unsubscribed successfully');
                setSubscriptionStatus('opted_out');
                setIsSubscribed(false);
                localStorage.removeItem('newsletter_subscribed');
                setShowOptOutModal(false);
                setOptOutReason('');
                setUnsubscribeOtp('');
                setUnsubscribeStep('REASON');
            } else {
                toast.error(data.message || 'Failed to unsubscribe');
            }
        } catch (error) {
            toast.error('Failed to unsubscribe');
        }
    };

    const fetchFeaturedGuides = async () => {
        try {
            const params = new URLSearchParams({
                published: 'true',
                type: 'guide',
                featured: 'true',
                limit: 3
            });
            const response = await authenticatedFetch(`${API_BASE_URL}/api/blogs?${params}`, { autoRedirect: false });
            if (response.ok) {
                const data = await response.json();
                setFeaturedGuides(data.data);
            }
        } catch (error) {
            console.error('Error fetching featured guides:', error);
        }
    };

    const fetchTags = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/blogs/tags`, { autoRedirect: false });
            if (response.ok) {
                const data = await response.json();
                setTags(data.data);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    const fetchGuides = async (showLoading = true) => {
        try {
            if (showLoading && guides.length === 0) setLoading(true);

            const params = new URLSearchParams({
                published: 'true',
                type: 'guide', // IMPORTANT: Filter for guides
                page: pagination.current,
                limit: 9
            });

            if (searchTerm) params.append('search', searchTerm);

            if (selectedCategory !== 'All') {
                // Map UI names to DB categories if not exact match (Assuming DB has 'Home Buying', 'Rent', etc. matches)
                params.append('category', selectedCategory);
            }

            if (selectedTags.length > 0) {
                params.append('tag', selectedTags.join(','));
            }

            const response = await authenticatedFetch(`${API_BASE_URL}/api/blogs?${params}`, { autoRedirect: false });

            if (response.ok) {
                const data = await response.json();
                setGuides(data.data);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching guides:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const truncateText = (text, maxLength) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    const calculateReadTime = (content) => {
        const wordsPerMinute = 200;
        const words = content ? content.split(/\s+/).length : 0;
        const minutes = Math.ceil(words / wordsPerMinute);
        return `${minutes} min read`;
    };

    if (loading && guides.length === 0 && featuredGuides.length === 0) {
        return <PublicBlogsSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans text-slate-800 dark:text-gray-100 transition-colors duration-300">

            {/* 1. Hero Section */}
            <div className="bg-gradient-to-b from-purple-700 to-indigo-800 text-white pt-12 pb-24 px-4 relative overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in-up">
                        <GraduationCap className="w-4 h-4 text-yellow-300" />
                        <span>UrbanSetu Academy</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight animate-fade-in-up delay-100">
                        Property <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">Guides</span>
                    </h1>

                    <p className="text-xl text-purple-100 max-w-2xl mx-auto font-light leading-relaxed mb-10 animate-fade-in-up delay-200">
                        Learn everything about buying, renting, selling, and investing in property. Expert advice, simplified for you.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto relative animate-fade-in-up delay-300">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search guides (e.g., 'RERA', 'First time buyer')..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-4 focus:ring-purple-500/50 shadow-2xl transition-all"
                        />
                    </div>
                </div>
            </div>

            <main className="flex-grow max-w-7xl mx-auto px-4 w-full -mt-16 relative z-20 pb-20">

                {/* 2. Category Tabs */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-4 mb-12 flex flex-wrap justify-center gap-2 overflow-x-auto custom-scrollbar animate-fade-in-up">
                    {GUIDE_CATEGORIES.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => toggleCategory(cat.name)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${selectedCategory === cat.name
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400'
                                }`}
                        >
                            <cat.icon className="w-4 h-4" />
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* 2.5 Tags */}
                <div className="max-w-7xl mx-auto px-4 mb-12 animate-fade-in-up delay-100">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Popular Tags</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => toggleTag('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${selectedTags.length === 0
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-purple-900/40'
                                : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                                }`}
                        >
                            All
                        </button>
                        {tags.slice(0, 15).map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${selectedTags.includes(tag)
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-purple-900/40'
                                    : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Featured Guides Section */}
                {featuredGuides.length > 0 && !searchTerm && selectedCategory === 'All' && selectedTags.length === 0 && pagination.current === 1 && (
                    <div className="mb-16 animate-fade-in-up">
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" /> Featured Collections
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {featuredGuides.map((guide, idx) => (
                                <Link to={`/blog/${guide.slug || guide._id}`} key={guide._id} className="group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer">
                                    <img
                                        src={guide.thumbnail || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80'} // Fallback 
                                        alt={guide.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 p-8 w-full">
                                        <div className="flex items-center gap-3 text-xs font-bold text-purple-300 uppercase tracking-wider mb-3">
                                            <span className="bg-purple-600/90 backdrop-blur-md px-2 py-1 rounded-md">{guide.category}</span>
                                            <span>•</span>
                                            <span>{calculateReadTime(guide.content)}</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors leading-tight">
                                            {guide.title}
                                        </h3>
                                        <p className="text-gray-300 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                            {truncateText(guide.excerpt, 100)}
                                        </p>
                                        <div className="flex items-center gap-2 text-white font-bold text-sm">
                                            Read Guide <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Filtered Guides List */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white capitalize">
                            {selectedCategory === 'All' ? 'Latest Guides' : `${selectedCategory} Guides`}
                        </h2>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {pagination.total} articles found
                        </span>
                    </div>

                    {guides.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No guides found</h3>
                            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {guides.map((guide) => (
                                <Link to={`/blog/${guide.slug || guide._id}`} key={guide._id} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-800 transition-all duration-300 group flex flex-col h-full hover:-translate-y-1">
                                    {/* Card Image */}
                                    <div className="h-56 overflow-hidden relative">
                                        <img
                                            src={guide.thumbnail || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80'}
                                            alt={guide.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400 shadow-sm">
                                                {guide.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 flex-grow flex flex-col">
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {calculateReadTime(guide.content)}</span>
                                            <span>•</span>
                                            <span>{new Date(guide.publishedAt || guide.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            {guide.title}
                                        </h3>

                                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                                            {truncateText(guide.excerpt, 120)}
                                        </p>

                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-[10px]">
                                                    {guide.author?.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">UrbanSetu Team</span>
                                            </div>
                                            <span className="text-purple-600 dark:text-purple-400 font-bold text-sm group-hover:underline">Read Guide</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center mt-12">
                            <div className="flex bg-white dark:bg-gray-800 rounded-full shadow-lg p-1.5 border border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setPagination(p => ({ ...p, current: Math.max(1, p.current - 1) }))}
                                    disabled={pagination.current === 1}
                                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-30 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="flex items-center px-4 font-bold text-sm text-gray-600 dark:text-gray-300">
                                    Page {pagination.current} of {pagination.pages}
                                </div>
                                <button
                                    onClick={() => setPagination(p => ({ ...p, current: Math.min(p.pages, p.current + 1) }))}
                                    disabled={pagination.current === pagination.pages}
                                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-30 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Newsletter / CTA */}
                <div className="mt-20 bg-gray-900 rounded-3xl p-10 md:p-16 relative overflow-hidden text-center text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-40"></div>
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <Lightbulb className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-black mb-4">Master Real Estate Investment</h2>
                        <p className="text-gray-400 mb-8 text-lg">Join 10,000+ subscribers getting our weekly deep-dive guides and market analysis.</p>

                        {currentUser && subscriptionStatus && subscriptionStatus !== 'not_subscribed' ? (
                            <div className="bg-white/10 backdrop-blur-md border border-green-500/30 rounded-2xl p-6 inline-flex flex-col items-center animate-fade-in-up">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg 
                                  ${subscriptionStatus === 'approved' ? 'bg-green-500 shadow-green-500/20' :
                                        subscriptionStatus === 'pending' ? 'bg-orange-500 shadow-orange-500/20' :
                                            subscriptionStatus === 'rejected' ? 'bg-red-500 shadow-red-500/20' :
                                                'bg-gray-500 shadow-gray-500/20'}`}>
                                    {subscriptionStatus === 'approved' ? <CheckCircle className="w-8 h-8 text-white" /> :
                                        subscriptionStatus === 'pending' ? <Clock className="w-8 h-8 text-white" /> :
                                            <Info className="w-8 h-8 text-white" />}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 capitalize">
                                    {subscriptionStatus === 'approved' ? 'Subscribed' : subscriptionStatus.replace('_', ' ')}
                                </h3>
                                <p className="text-gray-300 mb-4">
                                    {subscriptionStatus === 'pending' ? 'Your subscription is awaiting approval.' :
                                        subscriptionStatus === 'approved' ? 'You will receive updates for new guides.' :
                                            subscriptionStatus === 'rejected' ? 'Your subscription was unfortunately rejected.' :
                                                subscriptionStatus === 'revoked' ? 'Your subscription has been revoked.' :
                                                    subscriptionStatus === 'opted_out' ? 'You have opted out of emails.' : ''}
                                </p>

                                {subscriptionStatus === 'approved' && (
                                    <button
                                        onClick={handleUnsubscribeClick}
                                        className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors border border-red-400/30"
                                    >
                                        Unsubscribe
                                    </button>
                                )}
                                {subscriptionStatus === 'opted_out' && (
                                    <button
                                        onClick={handleSendSubscribeOtp}
                                        className="px-4 py-2 bg-purple-500/80 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors border border-purple-400/30"
                                    >
                                        Resubscribe
                                    </button>
                                )}
                            </div>
                        ) : isSubscribed ? (
                            <div className="bg-white/10 backdrop-blur-md border border-green-500/30 rounded-2xl p-6 inline-flex flex-col items-center animate-fade-in-up">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">You're Subscribed!</h3>
                                <p className="text-gray-300">Keep an eye on your inbox for our next guide.</p>
                            </div>
                        ) : (
                            <>
                                {subscribeStep === 'INPUT_EMAIL' ? (
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-auto"
                                        />
                                        <button
                                            onClick={handleSendSubscribeOtp}
                                            disabled={otpLoading}
                                            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-900/20 w-full sm:w-auto hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {otpLoading ? 'Sending...' : 'Subscribe'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
                                        <input
                                            type="text"
                                            placeholder="Enter OTP"
                                            value={subscribeOtp}
                                            onChange={(e) => setSubscribeOtp(e.target.value)}
                                            maxLength={6}
                                            className="px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-auto text-center tracking-widest text-xl"
                                        />
                                        <button
                                            onClick={handleVerifySubscribeOtp}
                                            disabled={otpLoading}
                                            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-900/20 w-full sm:w-auto hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {otpLoading ? 'Verifying...' : 'Verify'}
                                        </button>
                                        <button
                                            onClick={() => setSubscribeStep('INPUT_EMAIL')}
                                            className="px-4 py-4 text-white/70 hover:text-white font-medium underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

            </main>
            {/* Opt-Out Modal */}
            {showOptOutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Unsubscribe</h3>
                                <button onClick={() => setShowOptOutModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {unsubscribeStep === 'REASON'
                                    ? "We're sorry to see you go! Please let us know why you are unsubscribing (optional):"
                                    : `We've sent a verification code to your email. Please enter it below to confirm unsubscription.`}
                            </p>

                            {unsubscribeStep === 'REASON' ? (
                                <>
                                    <textarea
                                        value={optOutReason}
                                        onChange={(e) => setOptOutReason(e.target.value)}
                                        placeholder="Reason for unsubscribing..."
                                        className="w-full h-32 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white text-sm mb-4"
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setShowOptOutModal(false)}
                                            className="px-4 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSendUnsubscribeOtp}
                                            disabled={otpLoading}
                                            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70"
                                        >
                                            {otpLoading ? 'Sending...' : 'Next'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            value={unsubscribeOtp}
                                            onChange={(e) => setUnsubscribeOtp(e.target.value)}
                                            placeholder="Enter 6-digit OTP"
                                            maxLength={6}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white text-lg tracking-widest text-center"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setUnsubscribeStep('REASON')}
                                            disabled={otpLoading}
                                            className="px-4 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleVerifyUnsubscribeOtp}
                                            disabled={otpLoading}
                                            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70"
                                        >
                                            {otpLoading ? 'Verifying...' : 'Unsubscribe'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicGuides;

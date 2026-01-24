import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PublicBlogsSkeleton from '../components/skeletons/PublicBlogsSkeleton';
import { toast } from 'react-hot-toast';
import {
  Search as SearchIcon, Filter, Calendar, User, Eye, Heart, Tag,
  ArrowRight, ChevronLeft, ChevronRight, Mail, Info, Clock,
  TrendingUp, Lightbulb, Home, CheckCircle, X, BookOpen
} from 'lucide-react';

import { usePageTitle } from '../hooks/usePageTitle';
import { authenticatedFetch } from '../utils/auth';

const PublicBlogs = () => {
  // Set page title
  usePageTitle("Blogs - Real Estate Blog Portal");

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // 'pending', 'approved', 'rejected', 'revoked', 'opted_out', 'not_subscribed'

  // Subscription OTP State
  const [subscribeStep, setSubscribeStep] = useState('INPUT_EMAIL'); // 'INPUT_EMAIL', 'VERIFY_OTP'
  const [subscribeOtp, setSubscribeOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Unsubscribe OTP State
  const [showOptOutModal, setShowOptOutModal] = useState(false);
  const [optOutReason, setOptOutReason] = useState('');
  const [unsubscribeStep, setUnsubscribeStep] = useState('REASON'); // 'REASON', 'VERIFY_OTP'
  const [unsubscribeOtp, setUnsubscribeOtp] = useState('');
  const [otpError, setOtpError] = useState(''); // Error message for OTP verification

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu-pvt4.onrender.com';


  // Separate useEffect for initial load and categories/tags
  useEffect(() => {
    fetchBlogs();
    fetchCategories();
    fetchTags();

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

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }

      if (pagination.current === 1) {
        fetchBlogs(false); // Don't show loading for search
      } else {
        setPagination(prev => ({ ...prev, current: 1 }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Immediate filter effects for category and tag changes
  useEffect(() => {
    if (pagination.current === 1) {
      fetchBlogs(false); // Don't show loading for immediate filter changes
    } else {
      setPagination(prev => ({ ...prev, current: 1 }));
    }
  }, [selectedCategories, selectedTags]);

  // Pagination effect
  useEffect(() => {
    fetchBlogs();
  }, [pagination.current]);

  const toggleCategory = (category) => {
    if (category === 'all') {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
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
    // Always validate the email field, regardless of login status
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Always use the email field value, not currentUser.email
    // This allows logged-in users to subscribe with a different email
    setOtpLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/send-subscribe-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: 'blogs_page' })
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

    // Use the email field value, not currentUser.email
    setOtpLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/verify-subscribe-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otp: subscribeOtp, source: 'blogs_page' })
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
      toast.error('Failed to verify OTP');
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
    setOtpError(''); // Clear any previous errors
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
        setOtpError('');
      } else {
        const errorMsg = data.message || 'Invalid OTP. Please try again.';
        setOtpError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Failed to verify OTP. Please try again.';
      setOtpError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const fetchBlogs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams({
        published: 'true',
        page: pagination.current,
        limit: 9
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategories.length > 0) {
        params.append('category', selectedCategories.join(','));
      }
      if (selectedTags.length > 0) {
        params.append('tag', selectedTags.join(','));
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/api/blogs?${params}`, { autoRedirect: false });

      if (response.ok) {
        const data = await response.json();
        setBlogs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const params = new URLSearchParams({
        published: 'true',
        search: searchTerm,
        limit: 5
      });

      const response = await authenticatedFetch(`${API_BASE_URL}/api/blogs?${params}`, { autoRedirect: false });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/blogs/categories`, { autoRedirect: false });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchBlogs();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (loading && blogs.length === 0) {
    return <PublicBlogsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans text-slate-800 dark:text-gray-100 transition-colors duration-300">
      {/* Search Header / Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 pb-24 pt-12 px-4 shadow-lg mb-8 relative overflow-hidden">
        {/* Abstract shapes for visual interest */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white mix-blend-overlay filter blur-3xl animate-float"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-300 mix-blend-overlay filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
          <div className="absolute top-[20%] right-[30%] w-[300px] h-[300px] rounded-full bg-indigo-400 mix-blend-overlay filter blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-20 animate-slideInFromTop">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
            Real Estate <span className="text-yellow-300">Insights</span>
          </h1>
          <p className="text-blue-100 mb-4 text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Stay updated with expert analysis, market trends, and property tips to make informed decisions.
          </p>

          {/* Navigation Button */}
          <div className="mb-8 flex justify-center">
            <Link
              to="/guides"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Explore Guides
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-sm font-medium border border-white/20 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-300" /> Tips & Tricks
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-sm font-medium border border-white/20 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-300" /> Market Trends
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-sm font-medium border border-white/20 flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-300" /> Investing
            </span>
          </div>

          {/* Search Bar in Hero */}
          <div className="max-w-3xl mx-auto relative group">
            <form onSubmit={handleSearch}>
              <div className="relative search-container">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <SearchIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search articles, topics, or keywords..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="block w-full pl-12 pr-4 py-4 border-none rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-2xl transition-all text-lg relative"
                />
                <button type="submit" className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-medium transition-colors shadow-md z-10">
                  Search
                </button>

                {/* Suggestions Dropdown */}
                {showSuggestions && searchTerm.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-fade-in-up">
                    {suggestions.length > 0 ? (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {suggestions.map((suggestion) => (
                          <li key={suggestion._id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSearchTerm(suggestion.title);
                                setShowSuggestions(false);
                                setPagination(prev => ({ ...prev, current: 1 }));
                              }}
                              className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {suggestion.title}
                                </h4>
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                                  {suggestion.category}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No articles found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 w-full -mt-20 relative z-10 pb-20">

        {/* Filters Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 mb-8 animate-fade-in-up transition-colors">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Categories */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Categories</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleCategory('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${selectedCategories.length === 0
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  All
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${selectedCategories.includes(category)
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 pt-6 lg:pt-0 lg:pl-8 transition-colors">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Popular Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleTag('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${selectedTags.length === 0
                    ? 'bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-green-900/40'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                    }`}
                >
                  All
                </button>
                {tags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${selectedTags.includes(tag)
                      ? 'bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-green-900/40'
                      : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blogs Grid */}
        {blogs.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-16 text-center animate-fade-in-up transition-colors">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-6">
              <SearchIcon className="w-10 h-10 text-blue-400 dark:text-blue-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">No articles found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto transition-colors">
              We couldn't find any blog posts matching your criteria. Try different keywords or filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategories([]);
                setSelectedTags([]);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <article
                key={blog._id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-500 group flex flex-col h-full animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Thumbnail */}
                <div className="relative overflow-hidden h-56 flex-shrink-0">
                  {blog.thumbnail ? (
                    <img
                      src={blog.thumbnail}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 font-bold text-2xl">UrbanSetu</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-blue-600 shadow-lg">
                      {blog.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-grow flex flex-col">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <Link to={`/blog/${blog.slug || blog._id}`}>
                      {blog.title}
                    </Link>
                  </h2>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm flex-grow leading-relaxed transition-colors">
                    {truncateText(blog.excerpt || blog.content, 120)}
                  </p>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-auto transition-colors">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs transition-colors">
                          {blog.author?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium truncate max-w-[100px]">{blog.author?.username || 'Team'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1" title="Views">
                          <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span>{blog.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Likes">
                          <Heart className="w-4 h-4 text-red-400 dark:text-red-500" />
                          <span>{blog.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Date">
                          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags Preview */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-colors">
                            <Tag className="w-3 h-3" /> {tag}
                          </span>
                        ))}
                        {blog.tags.length > 2 && (
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-md transition-colors">+{blog.tags.length - 2}</span>
                        )}
                      </div>
                    )}

                    <Link
                      to={`/blog/${blog.slug || blog._id}`}
                      className="flex items-center justify-center w-full gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition-all duration-300 group-hover:shadow-md"
                    >
                      Read Article <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-16 flex justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg p-2 flex items-center gap-2 border border-gray-100 dark:border-gray-800 transition-colors">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                disabled={pagination.current === 1}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center px-4 font-medium text-gray-700 dark:text-gray-300 transition-colors">
                Page {pagination.current} <span className="text-gray-400 dark:text-gray-500 mx-2">/</span> {pagination.pages}
              </div>

              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                disabled={pagination.current === pagination.pages}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Newsletter CTA */}
        <div className="mt-20 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/3"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-block p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <Mail className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Get insights delivered to your inbox
            </h3>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
              Join our weekly newsletter to get the latest real estate trends, investment tips, and market analysis.
            </p>
            {currentUser && subscriptionStatus && subscriptionStatus !== 'not_subscribed' ? (
              <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 inline-flex flex-col items-center animate-fade-in-up">
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
                    subscriptionStatus === 'approved' ? 'You will receive updates for new blogs.' :
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
                    onClick={() => {
                      // Reset states to show subscription flow properly
                      setSubscriptionStatus(null);
                      setSubscribeStep('INPUT_EMAIL');
                      setEmail(currentUser?.email || '');
                      // Send OTP after resetting states
                      setTimeout(() => handleSendSubscribeOtp(), 100);
                    }}
                    className="px-4 py-2 bg-blue-500/80 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors border border-blue-400/30"
                  >
                    Resubscribe
                  </button>
                )}
              </div>
            ) : isSubscribed ? (
              <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 inline-flex flex-col items-center animate-fade-in-up">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">You're Subscribed!</h3>
                <p className="text-gray-300">Keep an eye on your inbox for our next blog post.</p>
              </div>
            ) : (
              /* Subscription Box */
              !isSubscribed && subscriptionStatus !== 'pending' && subscriptionStatus !== 'approved' && (
                <div className="bg-blue-600 dark:bg-blue-600 rounded-3xl p-8 text-center text-white mb-16 relative overflow-hidden animate-fade-in-up delay-200">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full -ml-24 -mb-24 blur-2xl"></div>

                  <div className="relative z-10 max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
                    <p className="text-blue-100 mb-8 text-lg">
                      Get the latest real estate insights, market trends, and property tips delivered straight to your inbox.
                    </p>

                    {subscribeStep === 'INPUT_EMAIL' ? (
                      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="flex-1 px-6 py-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all font-medium"
                        />
                        <button
                          onClick={handleSendSubscribeOtp}
                          disabled={otpLoading}
                          className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {otpLoading ? 'Sending...' : 'Subscribe'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto animate-fade-in">
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={subscribeOtp}
                          onChange={(e) => setSubscribeOtp(e.target.value)}
                          maxLength={6}
                          className="flex-1 px-6 py-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all font-medium text-center tracking-widest text-xl"
                        />
                        <button
                          onClick={handleVerifySubscribeOtp}
                          disabled={otpLoading}
                          className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
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
                    <p className="mt-4 text-sm text-blue-200">
                      Join 10,000+ subscribers for weekly updates. No spam, ever.
                    </p>
                  </div>
                </div>
              )
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
                    className="w-full h-32 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm mb-4"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowOptOutModal(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      disabled={otpLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendUnsubscribeOtp}
                      disabled={otpLoading}
                      className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70"
                    >
                      {otpLoading ? 'Sending OTP...' : 'Next'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <input
                      type="text"
                      value={unsubscribeOtp}
                      onChange={(e) => {
                        setUnsubscribeOtp(e.target.value);
                        setOtpError(''); // Clear error when user types
                      }}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border ${otpError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:outline-none focus:ring-2 ${otpError ? 'focus:ring-red-500' : 'focus:ring-blue-500'} text-gray-900 dark:text-white text-lg tracking-widest text-center`}
                    />
                    {otpError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <X className="w-4 h-4" />
                        {otpError}
                      </p>
                    )}
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

export default PublicBlogs;

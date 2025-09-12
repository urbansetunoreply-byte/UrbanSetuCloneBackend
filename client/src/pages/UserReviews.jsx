import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaStar, FaEdit, FaTrash, FaCheck, FaTimes, FaSync, FaChartLine, FaChartBar, FaChartPie, FaArrowUp, FaArrowDown, FaUsers, FaComments, FaExclamationTriangle, FaHome, FaFilter, FaSort, FaBars, FaEye, FaHeart, FaDownload, FaShare, FaPlus, FaTimes as FaX } from 'react-icons/fa';
import ReviewForm from '../components/ReviewForm.jsx';
import ContactSupportWrapper from '../components/ContactSupportWrapper';
import { socket } from '../utils/socket.js';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function UserReviews() {
  const { currentUser } = useSelector((state) => state.user);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [reviewToPermanentlyDelete, setReviewToPermanentlyDelete] = useState(null);
  
  // Analytics and UI state
  const [analytics, setAnalytics] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0,
    removedReviews: 0,
    averageRating: 0,
    ratingDistribution: {},
    monthlyTrends: [],
    topProperties: [],
    sentiment: {
      positive: 0,
      negative: 0,
      neutral: 0
    }
  });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('dateAdded'); // 'dateAdded', 'rating', 'property'
  const [showStats, setShowStats] = useState(false);

  // Lock body scroll when delete modal is open
  useEffect(() => {
    if (showDeleteModal || editingReview) {
      // Prevent background scroll on all devices
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showDeleteModal, editingReview]);

  useEffect(() => {
    fetchUserReviews();
  }, []);

  useEffect(() => {
    calculateAnalytics();
  }, [reviews]);

  useEffect(() => {
    const handleSocketReviewUpdate = (updatedReview) => {
      // Only update if the review belongs to the current user
      if (!currentUser || updatedReview.userId !== currentUser._id) return;
      setReviews((prevReviews) => {
        // If the review is removed (status 'removed'), update it in the list
        if (updatedReview.status === 'removed') {
          return prevReviews.map((r) =>
            r._id === updatedReview._id ? { ...r, ...updatedReview } : r
          );
        }
        // If the review is deleted (not present), remove it from the list
        if (updatedReview._deleted) {
          return prevReviews.filter((r) => r._id !== updatedReview._id);
        }
        // Otherwise, update the review in the list
        return prevReviews.map((r) =>
          r._id === updatedReview._id ? { ...r, ...updatedReview } : r
        );
      });
    };
    socket.on('reviewUpdated', handleSocketReviewUpdate);
    
    // Listen for profile updates to update user info in reviews
    const handleProfileUpdate = (profileData) => {
      setReviews(prevReviews => {
        const updated = prevReviews.map(review => {
          if (review.userId === profileData.userId) {
            return {
              ...review,
              userName: profileData.username,
              userAvatar: profileData.avatar
            };
          }
          return review;
        });
        return updated;
      });
    };
    socket.on('profileUpdated', handleProfileUpdate);

    
    return () => {
      socket.off('reviewUpdated', handleSocketReviewUpdate);
      socket.off('profileUpdated', handleProfileUpdate);

    };
  }, [currentUser]);

  // Fallback: Poll for profile updates every 30 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (!currentUser) return;
      
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/id/${currentUser._id}`);
        if (res.ok) {
          const updatedUser = await res.json();
          if (updatedUser.username !== currentUser.username || updatedUser.avatar !== currentUser.avatar) {

            setReviews(prevReviews => prevReviews.map(review => {
              if (review.userId === updatedUser._id) {
                return {
                  ...review,
                  userName: updatedUser.username,
                  userAvatar: updatedUser.avatar
                };
              }
              return review;
            }));
          }
        }
      } catch (error) {
        console.error('[UserReviews] Error polling for profile updates:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [currentUser]);

  const fetchUserReviews = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/review/user`, {
        credentials: 'include',
      });

      const data = await res.json();


      if (res.ok) {
        setReviews(data);
      } else {
        setError(data.message || 'Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    if (reviews.length === 0) {
      setAnalytics({
        totalReviews: 0,
        pendingReviews: 0,
        approvedReviews: 0,
        rejectedReviews: 0,
        removedReviews: 0,
        averageRating: 0,
        ratingDistribution: {},
        monthlyTrends: [],
        topProperties: [],
        sentiment: { positive: 0, negative: 0, neutral: 0 }
      });
      return;
    }

    // Calculate basic stats
    const totalReviews = reviews.length;
    const pendingReviews = reviews.filter(r => r.status === 'pending').length;
    const approvedReviews = reviews.filter(r => r.status === 'approved').length;
    const rejectedReviews = reviews.filter(r => r.status === 'rejected').length;
    const removedReviews = reviews.filter(r => r.status === 'removed' || r.status === 'removed_by_user').length;
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / totalReviews;

    // Calculate rating distribution
    const ratingDistribution = {};
    reviews.forEach(review => {
      const rating = review.rating || 0;
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });

    // Calculate monthly trends
    const monthlyTrends = {};
    reviews.forEach(review => {
      const month = new Date(review.createdAt).toISOString().substring(0, 7);
      monthlyTrends[month] = (monthlyTrends[month] || 0) + 1;
    });

    // Top properties by review count
    const propertyCounts = {};
    reviews.forEach(review => {
      if (review.listingId) {
        const propId = typeof review.listingId === 'object' ? review.listingId._id : review.listingId;
        const propName = typeof review.listingId === 'object' ? review.listingId.name : 'Unknown Property';
        if (!propertyCounts[propId]) {
          propertyCounts[propId] = { name: propName, count: 0, avgRating: 0, totalRating: 0 };
        }
        propertyCounts[propId].count++;
        propertyCounts[propId].totalRating += review.rating || 0;
      }
    });

    // Calculate average ratings for properties
    Object.values(propertyCounts).forEach(prop => {
      prop.avgRating = prop.totalRating / prop.count;
    });

    const topProperties = Object.values(propertyCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Simple sentiment analysis based on ratings
    const positive = reviews.filter(r => r.rating >= 4).length;
    const negative = reviews.filter(r => r.rating <= 2).length;
    const neutral = reviews.filter(r => r.rating === 3).length;

    setAnalytics({
      totalReviews,
      pendingReviews,
      approvedReviews,
      rejectedReviews,
      removedReviews,
      averageRating,
      ratingDistribution,
      monthlyTrends: Object.entries(monthlyTrends)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count })),
      topProperties,
      sentiment: { positive, negative, neutral }
    });
  };

  const handleDeleteReview = (review) => {
    if (!review || !review._id) {
      toast.error('This review cannot be deleted (missing identifier).');
      return;
    }
    if (review?.status === 'removed') {
      setReviewToPermanentlyDelete(review);
      setShowPermanentDeleteModal(true);
      return;
    }
    setReviewToDelete(review);
    setShowDeleteModal(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      if (!reviewToDelete._id) {
        toast.error('Invalid review. Please refresh and try again.');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/review/delete/${reviewToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        if (data?.updatedReview?.status === 'removed' || data?.status === 'removed') {
          setReviews(prev => prev.map(r => r._id === reviewToDelete._id ? { ...r, status: 'removed' } : r));
          toast.success('Review marked as removed');
        } else if (data?._deleted || data?.deleted || (typeof data?.message === 'string' && data.message.toLowerCase().includes('deleted'))) {
          setReviews(prev => prev.filter(review => review._id !== reviewToDelete._id));
          toast.success('Review deleted successfully');
        } else {
          setReviews(prev => prev.map(r => r._id === reviewToDelete._id ? { ...r, status: 'removed' } : r));
          toast.info('Review tagged as removed');
        }
      } else {
        toast.error(data.message || 'Failed to delete review');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setShowDeleteModal(false);
      setReviewToDelete(null);
    }
  };

  const confirmPermanentDelete = () => {
    if (!reviewToPermanentlyDelete) return;
    setReviews(prev => prev.filter(r => r._id !== reviewToPermanentlyDelete._id));
    setShowPermanentDeleteModal(false);
    setReviewToPermanentlyDelete(null);
    toast.success('Review removed from your list');
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
  };

  const handleReviewUpdated = () => {
    setEditingReview(null);
    fetchUserReviews();
    toast.success('Review updated successfully');
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchUserReviews();
      toast.success('Reviews refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh reviews');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={`text-lg ${
          index < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    // Handle null/undefined status
    if (!status) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unknown
        </span>
      );
    }

    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FaCheck },
      approved: { color: 'bg-green-100 text-green-800', icon: FaCheck },
      rejected: { color: 'bg-red-100 text-red-800', icon: FaTimes },
      removed: { color: 'bg-gray-100 text-gray-800', icon: FaTimes }
    };

    const config = statusConfig[status];
    
    // Handle unknown status
    if (!config) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    }

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Enhanced filtered and sorted reviews
  const filteredAndSortedReviews = reviews
    .filter((review) => {
      // Status filter
      if (statusFilter && review.status !== statusFilter) return false;
      // Enhanced search
      const propertyName = review.listingId?.name?.toLowerCase() || '';
      const propertyCity = review.listingId?.city?.toLowerCase() || '';
      const propertyState = review.listingId?.state?.toLowerCase() || '';
      const stars = String(review.rating);
      const comment = review.comment?.toLowerCase() || '';
      const adminNote = review.adminNote?.toLowerCase() || '';
      const date = formatDate(review.createdAt).toLowerCase();
      const q = search.toLowerCase();
      return (
        propertyName.includes(q) ||
        propertyCity.includes(q) ||
        propertyState.includes(q) ||
        stars === q ||
        comment.includes(q) ||
        adminNote.includes(q) ||
        date.includes(q) ||
        q === ''
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'property':
          const aName = a.listingId?.name || '';
          const bName = b.listingId?.name || '';
          return aName.localeCompare(bName);
        case 'dateAdded':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-2 sm:py-10 px-1 sm:px-2 md:px-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <FaStar className="text-3xl text-blue-700" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700">My Reviews</h1>
              <p className="text-sm text-gray-600">
                {filteredAndSortedReviews.length} of {reviews.length} reviews
                {analytics.totalReviews > 0 && (
                  <span className="ml-2 text-blue-600 font-semibold">
                    • Avg Rating: {analytics.averageRating.toFixed(1)} ⭐
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500'}`}
                  title="Grid View"
                >
                  <FaBars className="text-sm" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-500'}`}
                  title="List View"
                >
                  <FaBars className="rotate-90 text-sm" />
                </button>
              </div>
              
              {/* Analytics Toggle */}
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`px-2 sm:px-3 py-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                  showAnalytics ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaChartLine className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
              
              {/* Stats Toggle */}
              <button
                onClick={() => setShowStats(!showStats)}
                className={`px-2 sm:px-3 py-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                  showStats ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaChartBar className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">Stats</span>
              </button>
            </div>
            
            {/* Second row for mobile */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-2 sm:px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm disabled:opacity-50"
              >
                <FaSync className={`text-xs sm:text-sm ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              {/* Browse Properties */}
              <Link
                to="/search"
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <FaPlus className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">Write Review</span>
                <span className="sm:hidden">Review</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <FaChartLine className="text-blue-600" />
              Review Analytics
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-600">Total Reviews</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{analytics.totalReviews}</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-600">Average Rating</p>
                <p className="text-sm sm:text-2xl font-bold text-green-600">{analytics.averageRating.toFixed(1)} ⭐</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-600">Approved</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{analytics.approvedReviews}</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{analytics.pendingReviews}</p>
              </div>
            </div>
            
            {/* Sentiment Analysis */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3">Sentiment Overview</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Positive</p>
                    <p className="text-xl font-bold text-green-600">{analytics.sentiment.positive}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Neutral</p>
                    <p className="text-xl font-bold text-gray-600">{analytics.sentiment.neutral}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Negative</p>
                    <p className="text-xl font-bold text-red-600">{analytics.sentiment.negative}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3">Rating Distribution</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = analytics.ratingDistribution[rating] || 0;
                    const percentage = analytics.totalReviews > 0 ? (count / analytics.totalReviews) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 w-6">
                          <span className="text-xs font-medium">{rating}</span>
                          <FaStar className="text-yellow-400 text-xs" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        {showStats && reviews.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <FaChartBar className="text-purple-600" />
              Review Statistics
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-600">Total Reviews</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{analytics.totalReviews}</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-600">Average Rating</p>
                <p className="text-sm sm:text-2xl font-bold text-green-600">{analytics.averageRating.toFixed(1)} ⭐</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-600">Approved</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{analytics.approvedReviews}</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{analytics.pendingReviews}</p>
              </div>
            </div>
            
            {/* Top Properties */}
            {analytics.topProperties.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Most Reviewed Properties</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.topProperties.map((property, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                              #{index + 1}
                            </span>
                            <h5 className="font-semibold text-gray-800 truncate">{property.name}</h5>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <FaStar className="text-yellow-400 text-sm" />
                              <span className="text-sm text-gray-600">{property.avgRating.toFixed(1)}</span>
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{property.count} reviews</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search and Filter Controls */}
        {reviews.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by property name, city, state, review comment, admin note, or review date..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    if (e.target.value) {
                      toast.info(`Filtered by status: ${e.target.value}`);
                    } else {
                      toast.info('Showing all reviews');
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="removed">Removed</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <FaSort className="text-gray-500" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dateAdded">Date Added</option>
                  <option value="rating">Rating: High to Low</option>
                  <option value="property">Property: A to Z</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        {reviews.length === 0 ? (
          <div className="text-center py-10 sm:py-16">
            <div className="text-6xl sm:text-8xl mb-4">⭐</div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-6">Share your property experiences with the community.</p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              Browse Properties
            </Link>
          </div>
        ) : filteredAndSortedReviews.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No reviews found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6" 
            : "space-y-4 overflow-x-hidden"
          }>
            {filteredAndSortedReviews.map((review) => (
              <div key={review._id} className={`relative group ${viewMode === 'list' ? 'flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border w-full overflow-hidden' : ''}`}>
                <div className={viewMode === 'list' ? 'flex-1' : ''}>
                  <div className="border border-gray-200 rounded-lg p-3 sm:p-6 hover:shadow-md transition-shadow overflow-x-auto">
                    <div className="flex flex-col gap-2 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusBadge(review.status)}
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-600">
                            {review.rating} star{review.rating > 1 ? 's' : ''}
                          </span>
                        </div>

                        <p className="text-gray-700 mb-3 line-clamp-3">{review.comment}</p>

                        {/* Property Info */}
                        {review.listingId && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-semibold text-gray-800">
                              <a href={`/user/listing/${review.listingId && typeof review.listingId === 'object' ? review.listingId._id : review.listingId}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                {review.listingId?.name}
                              </a>
                            </h4>
                            <p className="text-sm text-gray-600">
                              {review.listingId?.city}, {review.listingId?.state}
                            </p>
                          </div>
                        )}

                        {/* Admin Note */}
                        {review.adminNote && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Admin Note:</strong> {review.adminNote}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 lg:flex-shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition shadow"
                        >
                          <FaEdit />
                          Edit
                        </button>
                        
                        <button
                          onClick={() => handleDeleteReview(review)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition shadow"
                        >
                          <FaTrash />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Watchlist Icon */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => window.location.href = '/user/watchlist'}
          className="relative group w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
          title="Open Watchlist"
        >
          <span className="w-7 h-7 text-white text-2xl">👁️</span>
          <div className="absolute bottom-full right-0 mb-3 bg-white text-gray-800 text-sm px-4 py-2 rounded-xl shadow-2xl hidden group-hover:block z-10 whitespace-nowrap border border-gray-100 transform -translate-y-1 transition-all duration-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">👁️</span>
              <span className="font-medium">Watchlist</span>
            </div>
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
          </div>
        </button>
      </div>

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-xs sm:max-w-md w-full">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">Edit Review</h2>
              <ReviewForm
                listingId={typeof editingReview.listingId === 'object' ? editingReview.listingId._id : editingReview.listingId}
                existingReview={editingReview}
                onReviewSubmitted={handleReviewUpdated}
              />
              <button
                onClick={() => setEditingReview(null)}
                className="mt-4 w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Review Confirmation Modal */}
      {showDeleteModal && reviewToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaTrash className="text-red-500" />
                Delete Review
              </h3>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this review? This action cannot be undone.
              </p>

              {/* Show review details for confirmation */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(reviewToDelete.rating)}
                  <span className="text-sm text-gray-600">
                    {reviewToDelete.rating} star{reviewToDelete.rating > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{reviewToDelete.comment}</p>
                {reviewToDelete.listingId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Property: {reviewToDelete.listingId?.name}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setReviewToDelete(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteReview}
                  className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <FaTrash size={12} />
                  Delete Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPermanentDeleteModal && reviewToPermanentlyDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaTrash className="text-red-500" />
                Remove From List
              </h3>
              <p className="text-gray-600 mb-4">
                This review is already tagged as removed. Do you want to remove it from your reviews list permanently?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowPermanentDeleteModal(false); setReviewToPermanentlyDelete(null); }}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPermanentDelete}
                  className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <FaTrash size={12} />
                  Remove Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ContactSupportWrapper />
    </div>
  );
} 
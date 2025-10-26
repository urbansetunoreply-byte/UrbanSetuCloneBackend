import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaStar, FaCheck, FaTimes, FaTrash, FaEye, FaBan, FaSort, FaSortUp, FaSortDown, FaCheckCircle, FaThumbsUp, FaReply, FaSync, FaHome, FaUser, FaChartLine, FaChartBar, FaChartPie, FaArrowUp, FaArrowDown, FaUsers, FaComments, FaExclamationTriangle, FaFlag } from 'react-icons/fa';
import { socket } from '../utils/socket';
import { toast } from 'react-toastify';
import UserAvatar from '../components/UserAvatar';
import ContactSupportWrapper from '../components/ContactSupportWrapper';
import axios from 'axios';

import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminReviews() {
  // Set page title
  usePageTitle("Review Management - Content Moderation");

  const { currentUser } = useSelector((state) => state.user);

  // Helper function to check if avatar is valid
  const isValidAvatar = (avatar) => {
    return avatar && avatar.trim() && avatar !== 'null' && avatar !== 'undefined' && avatar !== '';
  };
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [reviewToRemove, setReviewToRemove] = useState(null);
  const [removalReason, setRemovalReason] = useState('');
  const [removalNote, setRemovalNote] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [responseEdit, setResponseEdit] = useState({});
  const [responseLoading, setResponseLoading] = useState({});
  const [responseError, setResponseError] = useState({});
  const [search, setSearch] = useState('');
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0,
    removedReviews: 0,
    averageRating: 0,
    sentiment: {
      positive: 0,
      negative: 0,
      neutral: 0,
      topWords: []
    },
    recentActivity: [],
    topProperties: [],
    topUsers: [],
    ratingDistribution: {},
    monthlyTrends: [],
    responseRate: 0
  });
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Review Reports state
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [reportsFilters, setReportsFilters] = useState({
    dateFrom: '',
    dateTo: '',
    reporter: '',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')) {
      fetchReviews();
      fetchAnalytics();
    }
    // Listen for real-time review updates
    const handleSocketReviewUpdate = (updatedReview) => {
      setReviews(prev => {
        // If the review is removed or deleted, remove it from the list
        if (updatedReview.status === 'removed' || updatedReview.deleted) {
          return prev.filter(r => r._id !== updatedReview._id);
        }
        // Otherwise, update the review in place
        const exists = prev.some(r => r._id === updatedReview._id);
        if (exists) {
          return prev.map(r => r._id === updatedReview._id ? { ...r, ...updatedReview } : r);
        } else {
          return [updatedReview, ...prev];
        }
      });
    };
    socket.on('reviewUpdated', handleSocketReviewUpdate);
    
    // Listen for profile updates to update user info in reviews
    const handleProfileUpdate = (profileData) => {
      setReviews(prevReviews => prevReviews.map(review => {
        if (review.userId === profileData.userId) {
          return {
            ...review,
            userName: profileData.username,
            userAvatar: profileData.avatar
          };
        }
        return review;
      }));
    };
    socket.on('profileUpdated', handleProfileUpdate);
    
    return () => {
      socket.off('reviewUpdated', handleSocketReviewUpdate);
      socket.off('profileUpdated', handleProfileUpdate);
    };
  }, [currentUser, currentPage, selectedStatus, sortBy, sortOrder]);

  // Ensure page opens at top
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {}
  }, []);

  // Scroll lock for modals: lock body scroll when any modal is open (mobile and desktop)
  useEffect(() => {
    if (selectedReview || (showRemovalModal && reviewToRemove) || (showDeleteModal && reviewToDelete) || showReportsModal) {
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
  }, [selectedReview, showRemovalModal, reviewToRemove, showDeleteModal, reviewToDelete, showReportsModal]);

  // Fetch reports only when modal opens
  useEffect(() => {
    if (showReportsModal) {
      fetchReports();
    }
  }, [showReportsModal]);

  // Client-side filtering for immediate UI updates
  useEffect(() => {
    if (reports.length === 0) {
      setFilteredReports([]);
      return;
    }

    let filtered = [...reports];

    // Apply search filter
    if (reportsFilters.search) {
      const searchTerm = reportsFilters.search.toLowerCase();
      filtered = filtered.filter(report => 
        report.propertyName?.toLowerCase().includes(searchTerm) ||
        report.reporter?.toLowerCase().includes(searchTerm) ||
        report.reporterEmail?.toLowerCase().includes(searchTerm) ||
        report.reporterPhone?.toLowerCase().includes(searchTerm) ||
        report.category?.toLowerCase().includes(searchTerm) ||
        report.details?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply reporter filter
    if (reportsFilters.reporter) {
      const reporterTerm = reportsFilters.reporter.toLowerCase();
      filtered = filtered.filter(report => 
        report.reporter?.toLowerCase().includes(reporterTerm)
      );
    }

    // Apply date filters
    if (reportsFilters.dateFrom) {
      const fromDate = new Date(reportsFilters.dateFrom);
      filtered = filtered.filter(report => 
        new Date(report.createdAt) >= fromDate
      );
    }

    if (reportsFilters.dateTo) {
      const toDate = new Date(reportsFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include entire day
      filtered = filtered.filter(report => 
        new Date(report.createdAt) <= toDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (reportsFilters.sortBy) {
        case 'reporter':
          aValue = a.reporter || '';
          bValue = b.reporter || '';
          break;
        case 'property':
          aValue = a.propertyName || '';
          bValue = b.propertyName || '';
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (reportsFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredReports(filtered);
  }, [reports, reportsFilters]);

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 10,
        sort: 'date',
        order: 'desc'
      });
      
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      const res = await fetch(`${API_BASE_URL}/api/review/admin/all?${params}`, {
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        // Ensure latest reviews appear at top even if API doesn't sort correctly
        const sorted = Array.isArray(data.reviews) ? [...data.reviews].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)) : [];
        setReviews(sorted);
        setTotalPages(data.pages);
      } else {
        setError(data.message || 'Failed to load reviews');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Fetch review statistics
      const statsRes = await axios.get(`${API_BASE_URL}/api/review/admin/stats`, {
        withCredentials: true
      });
      
      // Fetch all reviews for analytics
      const allReviewsRes = await axios.get(`${API_BASE_URL}/api/review/admin/all?limit=1000&sort=date&order=desc`, {
        withCredentials: true
      });
      
      const allReviews = allReviewsRes.data.reviews || allReviewsRes.data || [];
      const stats = statsRes.data;

      // Calculate rating distribution
      const ratingDistribution = {};
      allReviews.forEach(review => {
        const rating = review.rating || 0;
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });

      // Calculate monthly trends
      const monthlyTrends = {};
      allReviews.forEach(review => {
        const month = new Date(review.createdAt).toISOString().substring(0, 7);
        monthlyTrends[month] = (monthlyTrends[month] || 0) + 1;
      });
      
      // Debug logging for monthly trends
      console.log('Monthly trends data:', monthlyTrends);
      console.log('Total reviews for trends:', allReviews.length);

      // Top properties by review count
      const propertyCounts = {};
      allReviews.forEach(review => {
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

      // Top users by review count
      const userCounts = {};
      allReviews.forEach(review => {
        const userId = review.userId;
        const userName = review.userName || 'Unknown User';
        if (!userCounts[userId]) {
          userCounts[userId] = { name: userName, count: 0, avgRating: 0, totalRating: 0 };
        }
        userCounts[userId].count++;
        userCounts[userId].totalRating += review.rating || 0;
      });

      Object.values(userCounts).forEach(user => {
        user.avgRating = user.totalRating / user.count;
      });

      const topUsers = Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate response rate
      const reviewsWithResponses = allReviews.filter(review => review.ownerResponse && review.ownerResponse.trim());
      const responseRate = allReviews.length > 0 ? (reviewsWithResponses.length / allReviews.length) * 100 : 0;

      // Sentiment Analysis: same logic as AdminDashboard
      const positiveWords = ['good','great','excellent','amazing','love','nice','helpful','fast','clean','spacious','recommended','recommend'];
      const negativeWords = ['bad','poor','terrible','awful','hate','dirty','small','slow','rude','noisy','not recommended','worst'];
      let pos = 0, neg = 0, neu = 0;
      const wordFreq = {};
      
      // Use only approved reviews for sentiment analysis (same as AdminDashboard)
      const approvedReviews = allReviews.filter(r => r.status === 'approved');
      approvedReviews.forEach(r => {
        const text = (r.comment || '').toLowerCase();
        if (!text.trim()) { neu++; return; }
        let score = 0;
        positiveWords.forEach(w => { if (text.includes(w)) score++; });
        negativeWords.forEach(w => { if (text.includes(w)) score--; });
        if (score > 0) pos++; else if (score < 0) neg++; else neu++;
        text.split(/[^a-zA-Z]+/).forEach(t => { if (t.length > 3) wordFreq[t] = (wordFreq[t] || 0) + 1; });
      });
      
      const topWords = Object.entries(wordFreq).sort((a,b) => b[1]-a[1]).slice(0,10).map(([word,count]) => ({ word, count }));

      setAnalytics({
        totalReviews: stats.totalReviews || allReviews.length,
        pendingReviews: stats.pendingReviews || 0,
        approvedReviews: allReviews.filter(r => r.status === 'approved').length,
        rejectedReviews: allReviews.filter(r => r.status === 'rejected').length,
        removedReviews: allReviews.filter(r => r.status === 'removed' || r.status === 'removed_by_user').length,
        averageRating: stats.averageRating || 0,
        sentiment: {
          positive: pos,
          negative: neg,
          neutral: neu,
          topWords: topWords
        },
        recentActivity: allReviews.slice(0, 10),
        topProperties,
        topUsers,
        ratingDistribution,
        monthlyTrends: Object.entries(monthlyTrends)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count })),
        responseRate
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleStatusChange = async (reviewId, newStatus, adminNote = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/review/admin/status/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, adminNote }),
      });

      const data = await res.json();

      if (res.ok) {
        setReviews(reviews.map(review => 
          review._id === reviewId ? { ...review, status: newStatus, adminNote } : review
        ));
        toast.success(`Review ${newStatus} successfully`);
      } else {
        toast.error(data.message || 'Failed to update review status');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleRemoveReview = async () => {
    if (!removalReason) {
      toast.error('Please select a removal reason');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/review/admin/remove/${reviewToRemove._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          reason: removalReason, 
          note: removalNote 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(reviews.map(review => 
          review._id === reviewToRemove._id 
            ? { ...review, status: 'removed', removalReason, removalNote } 
            : review
        ));
        setShowRemovalModal(false);
        setReviewToRemove(null);
        setRemovalReason('');
        setRemovalNote('');
        toast.success('Review removed successfully');
      } else {
        toast.error(data.message || 'Failed to remove review');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleRestoreReview = async (reviewId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/review/admin/restore/${reviewId}`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(reviews.map(r => r._id === reviewId ? { ...r, ...data.review } : r));
        toast.success('Review restored and approved');
      } else {
        toast.error(data.message || 'Failed to restore review');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleDeleteReview = () => {
    if (reviewToDelete) {
      setReviews(reviews.filter(r => r._id !== reviewToDelete._id));
      setShowDeleteModal(false);
      setReviewToDelete(null);
      toast.success('Review deleted from table successfully');
    }
  };

  const handleOwnerResponseChange = (reviewId, value) => {
    setResponseEdit((prev) => ({ ...prev, [reviewId]: value }));
  };

  const handleOwnerResponseSubmit = async (reviewId, listingOwnerId) => {
    setResponseLoading((prev) => ({ ...prev, [reviewId]: true }));
    setResponseError((prev) => ({ ...prev, [reviewId]: '' }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/review/respond/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ownerResponse: responseEdit[reviewId] }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => prev.map(r => r._id === reviewId ? { ...r, ownerResponse: responseEdit[reviewId] } : r));
        setResponseEdit((prev) => ({ ...prev, [reviewId]: '' }));
        toast.success('Owner response submitted successfully');
      } else {
        setResponseError((prev) => ({ ...prev, [reviewId]: data.message || 'Failed to submit response' }));
        toast.error(data.message || 'Failed to submit response');
      }
    } catch (error) {
      setResponseError((prev) => ({ ...prev, [reviewId]: 'Network error. Please try again.' }));
    } finally {
      setResponseLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={`text-sm ${
          index < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FaCheck },
      approved: { color: 'bg-green-100 text-green-800', icon: FaCheck },
      rejected: { color: 'bg-red-100 text-red-800', icon: FaTimes },
      removed: { color: 'bg-gray-100 text-gray-800', icon: FaBan },
      removed_by_user: { color: 'bg-orange-100 text-orange-800', icon: FaBan },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="mr-1" />
        {status === 'removed_by_user' ? 'Removed by User' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-400" />;
    return sortOrder === 'desc' ? <FaSortDown className="text-blue-600" /> : <FaSortUp className="text-blue-600" />;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
      toast.info(`Sorted by ${field} (${sortOrder === 'desc' ? 'ascending' : 'descending'})`);
    } else {
      setSortBy(field);
      setSortOrder('desc');
      toast.info(`Sorted by ${field} (descending)`);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchReviews();
      toast.success('Reviews refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh reviews');
    }
  };

  // Fetch review reports
  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      setReportsError('');
      
      const params = new URLSearchParams();
      if (reportsFilters.dateFrom) params.append('dateFrom', reportsFilters.dateFrom);
      if (reportsFilters.dateTo) params.append('dateTo', reportsFilters.dateTo);
      if (reportsFilters.reporter) params.append('reporter', reportsFilters.reporter);
      if (reportsFilters.search) params.append('search', reportsFilters.search);
      params.append('sortBy', reportsFilters.sortBy);
      params.append('sortOrder', reportsFilters.sortOrder);

      console.log('Fetching reports from:', `${API_BASE_URL}/api/notifications/reports/reviews?${params}`);
      
      const res = await fetch(`${API_BASE_URL}/api/notifications/reports/reviews?${params}`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      console.log('Reports API response:', data);
      
      if (data.success) {
        setReports(data.reports || []);
        console.log('Reports set:', data.reports?.length || 0);
        // Debug: Log first report to see what data is available
        if (data.reports && data.reports.length > 0) {
          console.log('First report data:', JSON.stringify(data.reports[0], null, 2));
        }
      } else {
        setReportsError(data.message || 'Failed to load reports');
        console.error('Reports API error:', data.message);
      }
    } catch (error) {
      setReportsError('Network error while loading reports');
      console.error('Reports fetch error:', error);
    } finally {
      setReportsLoading(false);
    }
  };

  // Enhanced filtered reviews based on search
  const filteredReviews = reviews.filter((review) => {
    const userName = review.userName?.toLowerCase() || '';
    const userEmail = review.userEmail?.toLowerCase() || '';
    const propertyName = review.listingId?.name?.toLowerCase() || '';
    const propertyCity = review.listingId?.city?.toLowerCase() || '';
    const propertyState = review.listingId?.state?.toLowerCase() || '';
    const stars = String(review.rating);
    const comment = review.comment?.toLowerCase() || '';
    const adminNote = review.adminNote?.toLowerCase() || '';
    const date = formatDate(review.createdAt).toLowerCase();
    const q = search.toLowerCase();
    return (
      userName.includes(q) ||
      userEmail.includes(q) ||
      propertyName.includes(q) ||
      propertyCity.includes(q) ||
      propertyState.includes(q) ||
      stars === q ||
      comment.includes(q) ||
      adminNote.includes(q) ||
      date.includes(q) ||
      q === ''
    );
  });

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-4 sm:py-10 px-1 sm:px-2 md:px-8 animate-fadeIn">
      <div className="max-w-full sm:max-w-3xl md:max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-2 sm:p-4 md:p-8 animate-slideUp">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-blue-700 drop-shadow animate-fade-in">Review Management</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                showAnalytics 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Toggle Analytics"
            >
              <FaChartLine />
              Analytics
            </button>
            <button
              onClick={() => {
                setShowReportsModal(true);
                fetchReports();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition shadow"
              title="View Review Reports"
            >
              <FaFlag />
              Reports
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
              title="Refresh reviews"
            >
              <FaSync className={`${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
              <FaChartBar className="text-blue-600" />
              Review Analytics & Insights
            </h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-blue-600">{analytics.totalReviews}</p>
                  </div>
                  <FaComments className="text-2xl text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{analytics.pendingReviews}</p>
                  </div>
                  <FaExclamationTriangle className="text-2xl text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.approvedReviews}</p>
                  </div>
                  <FaCheck className="text-2xl text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-purple-600">{analytics.averageRating.toFixed(1)}</p>
                  </div>
                  <FaStar className="text-2xl text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Response Rate</p>
                    <p className="text-2xl font-bold text-indigo-600">{analytics.responseRate.toFixed(1)}%</p>
                  </div>
                  <FaReply className="text-2xl text-indigo-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Removed</p>
                    <p className="text-2xl font-bold text-red-600">{analytics.removedReviews}</p>
                  </div>
                  <FaBan className="text-2xl text-red-500" />
                </div>
              </div>
            </div>

            {/* Sentiment Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaChartPie className="text-green-600" />
                  Sentiment Analysis
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Positive</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.sentiment.positive}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Neutral</p>
                    <p className="text-2xl font-bold text-gray-600">{analytics.sentiment.neutral}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Negative</p>
                    <p className="text-2xl font-bold text-red-600">{analytics.sentiment.negative}</p>
                  </div>
                </div>
                {analytics.sentiment.topWords.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Words</h4>
                    <div className="flex flex-wrap gap-2">
                      {analytics.sentiment.topWords.slice(0, 8).map((word, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {word.word} ({word.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaChartBar className="text-blue-600" />
                  Rating Distribution
                </h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = analytics.ratingDistribution[rating] || 0;
                    const percentage = analytics.totalReviews > 0 ? (count / analytics.totalReviews) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-8">
                          <span className="text-sm font-medium">{rating}</span>
                          <FaStar className="text-yellow-400 text-xs" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Properties and Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaHome className="text-purple-600" />
                  Top Reviewed Properties
                </h3>
                {analytics.topProperties.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topProperties.map((property, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 truncate">{property.name}</p>
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
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUsers className="text-indigo-600" />
                  Most Active Reviewers
                </h3>
                {analytics.topUsers.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topUsers.map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 truncate">{user.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <FaStar className="text-yellow-400 text-sm" />
                              <span className="text-sm text-gray-600">{user.avgRating.toFixed(1)} avg</span>
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{user.count} reviews</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </div>

            {/* Monthly Trends */}
            {analytics.monthlyTrends.length > 0 && (
              <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaArrowUp className="text-green-600" />
                  Monthly Review Trends
                </h3>
                <div className="flex items-end gap-2 h-32">
                  {analytics.monthlyTrends.map((trend, idx) => {
                    const maxCount = Math.max(...analytics.monthlyTrends.map(t => t.count));
                    const height = (trend.count / maxCount) * 100;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all duration-300"
                          style={{ height: `${height}%` }}
                          title={`${trend.month}: ${trend.count} reviews`}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                          {trend.month.split('-')[1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Search Box */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by user email, name, property name, city, state, stars, comment, admin note, or review date..."
            className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-1/2"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              // Removed toast.info for search typing
            }}
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 w-full">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                if (e.target.value) {
                  toast.info(`Filtered by status: ${e.target.value}`);
                } else {
                  toast.info('Showing all reviews');
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="removed">Removed</option>
            </select>
            
            <div className="flex flex-wrap items-center gap-2 w-full">
              <span className="text-sm text-gray-600">Sort:</span>
              <button
                onClick={() => handleSort('date')}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Date {getSortIcon('date')}
              </button>
              <button
                onClick={() => handleSort('rating')}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Rating {getSortIcon('rating')}
              </button>
              <button
                onClick={() => handleSort('helpful')}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Helpful {getSortIcon('helpful')}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          {/* Responsive review cards for mobile, table for desktop */}
          <div className="flex flex-col gap-4 sm:table w-full">
            {filteredReviews.map((review, idx) => (
              <div
                key={review._id}
                className={
                  `flex flex-col sm:table-row bg-white rounded-lg shadow-sm sm:shadow-none p-3 sm:p-0 border sm:border-0` +
                  (idx !== filteredReviews.length - 1 ? ' sm:border-b sm:border-gray-200' : '')
                }
                style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div className="flex flex-row items-center gap-3 sm:table-cell sm:align-top sm:w-1/4 mb-2 sm:mb-0">
                  <div className="flex items-center">
                    <UserAvatar 
                      user={{ username: review.userName, avatar: review.userAvatar }} 
                      size="w-10 h-10" 
                      textSize="text-sm"
                      showBorder={false}
                    />
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">
                          {review.userName}
                        </div>
                        {review.isVerified && (
                          <FaCheckCircle className="text-green-600 text-sm" title="Verified user" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {review.listingId?.name ? (
                          <a href={`/admin/listing/${typeof review.listingId === 'object' ? review.listingId._id : review.listingId}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                            {review.listingId.name}
                          </a>
                        ) : 'Property not found'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {review.listingId?.city}, {review.listingId?.state}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:table-cell sm:align-top sm:w-1/4 mb-2 sm:mb-0">
                  <div className="flex items-center mb-2">
                    {renderStars(review.rating)}
                    <span className="ml-2 text-sm text-gray-600">
                      {review.rating} star{review.rating > 1 ? 's' : ''}
                    </span>
                    {review.helpfulCount > 0 && (
                      <div className="flex items-center ml-4 text-sm text-gray-500">
                        <FaThumbsUp className="mr-1" />
                        {review.helpfulCount}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {review.comment}
                  </p>
                  {review.verifiedByBooking && (
                    <span className="inline-block mt-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Booked this property
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 sm:table-cell sm:align-top sm:w-1/4 mb-2 sm:mb-0">
                  <div className="mb-2">
                    {getStatusBadge(review.status)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </div>
                  {review.adminNote && (
                    <div className="text-xs text-gray-400 mt-1">
                      Note: {review.adminNote}
                    </div>
                  )}
                  {review.removalReason && (
                    <div className="text-xs text-red-600 mt-1">
                      Removed: {review.removalReason}
                    </div>
                  )}
                  {review.ownerResponse && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-sm text-blue-800 flex items-center gap-2">
                        <FaReply className="inline-block text-blue-500" />
                        <strong>Owner Response:</strong> {review.ownerResponse}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:table-cell sm:align-top sm:w-1/4 mb-2 sm:mb-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(review._id, 'approved')}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow font-semibold flex items-center gap-2"
                          title="Approve review"
                        >
                          <FaCheck /> Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(review._id, 'rejected')}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow font-semibold flex items-center gap-2"
                          title="Reject review"
                        >
                          <FaTimes /> Reject
                        </button>
                      </>
                    )}
                    {review.status === 'approved' && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setReviewToRemove(review);
                          setShowRemovalModal(true);
                        }}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all transform hover:scale-105 shadow font-semibold flex items-center gap-2"
                        title="Remove review"
                      >
                        <FaBan /> Remove
                      </button>
                    )}
                    {(review.status === 'removed' || review.status === 'removed_by_user') && (
                      <button
                        onClick={() => handleRestoreReview(review._id)}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow font-semibold flex items-center gap-2"
                        title="Restore review"
                      >
                        <FaCheck /> Restore
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow font-semibold flex items-center gap-2"
                      title="View details"
                    >
                      <FaEye /> View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewToDelete(review);
                        setShowDeleteModal(true);
                      }}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 shadow font-semibold flex items-center gap-2"
                      title="Delete from table"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                  {currentUser && review.listingId && currentUser._id === review.listingId.userRef && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center gap-1">
                        <FaReply /> Respond as Owner
                      </label>
                      <textarea
                        className="w-full border border-blue-300 rounded-md p-2 text-sm mb-2"
                        rows="2"
                        placeholder="Write a response to this review..."
                        value={responseEdit[review._id] !== undefined ? responseEdit[review._id] : (review.ownerResponse || '')}
                        onChange={e => handleOwnerResponseChange(review._id, e.target.value)}
                        disabled={responseLoading[review._id]}
                      />
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                        onClick={() => handleOwnerResponseSubmit(review._id, review.listingId.userRef)}
                        disabled={responseLoading[review._id] || !responseEdit[review._id] || responseEdit[review._id].trim() === (review.ownerResponse || '').trim()}
                      >
                        {responseLoading[review._id] ? 'Saving...' : (review.ownerResponse ? 'Update Response' : 'Add Response')}
                      </button>
                      {responseError[review._id] && (
                        <div className="text-red-600 text-xs mt-1">{responseError[review._id]}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-2">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setCurrentPage(Math.max(1, currentPage - 1));
                  toast.info(`Navigated to page ${Math.max(1, currentPage - 1)}`);
                }}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  setCurrentPage(Math.min(totalPages, currentPage + 1));
                  toast.info(`Navigated to page ${Math.min(totalPages, currentPage + 1)}`);
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-2xl mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto p-0 sm:p-0 relative animate-fadeIn">
            {/* Close button top right */}
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors z-10 shadow"
              aria-label="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            {/* Header */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-2xl px-6 py-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <UserAvatar 
                  user={{ username: selectedReview.userName, avatar: selectedReview.userAvatar }} 
                  size="w-14 h-14" 
                  textSize="text-lg"
                  showBorder={true}
                  className="border-4 border-white shadow-lg"
                />
                <div>
                  <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                    {selectedReview.userName}
                    {selectedReview.isVerified && (
                      <FaCheckCircle className="text-green-600 text-base" title="Verified user" />
                    )}
                  </h2>
                  <p className="text-xs text-gray-500">{selectedReview.userId?.email}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-col items-center">
                <span className="inline-flex items-center gap-1 text-sm text-purple-700 font-semibold">
                  <FaStar className="text-yellow-400" />
                  {selectedReview.rating} / 5
                </span>
                <div className="flex gap-1 mt-1">{renderStars(selectedReview.rating)}</div>
              </div>
            </div>
            {/* Body */}
            <div className="px-4 sm:px-8 py-4 space-y-4">
              {/* Property Info */}
              <div className="bg-blue-50 rounded-lg p-3 flex flex-col gap-1 border border-blue-100">
                <div className="font-semibold text-blue-700 flex items-center gap-2">
                  <FaHome className="text-blue-400" />
                  {selectedReview.listingId?.name || 'Property not found'}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedReview.listingId?.city}, {selectedReview.listingId?.state}
                </div>
              </div>
              {/* Status & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <h4 className="font-medium mb-1 text-gray-700">Status</h4>
                  {getStatusBadge(selectedReview.status)}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <h4 className="font-medium mb-1 text-gray-700">Date</h4>
                  <p className="text-gray-700">{formatDate(selectedReview.createdAt)}</p>
                </div>
              </div>
              {/* Comment */}
              <div>
                <h4 className="font-medium mb-1 text-gray-700">Comment</h4>
                <p className="text-gray-800 bg-gray-50 rounded-md p-3 border border-gray-100 shadow-inner">{selectedReview.comment}</p>
              </div>
              {/* Helpful Votes */}
              {selectedReview.helpfulCount > 0 && (
                <div>
                  <h4 className="font-medium mb-1 text-gray-700">Helpful Votes</h4>
                  <div className="flex items-center text-gray-700">
                    <FaThumbsUp className="mr-2 text-blue-500" />
                    {selectedReview.helpfulCount} people found this helpful
                  </div>
                </div>
              )}
              {/* Verified/Booking */}
              {selectedReview.isVerified && (
                <div className="bg-green-50 p-3 rounded-md flex items-center gap-2 border border-green-100">
                  <FaCheckCircle className="text-green-600" />
                  <span className="text-green-800 font-medium">Verified user</span>
                  {selectedReview.verifiedByBooking && (
                    <span className="ml-2 text-xs text-green-700">Booked this property</span>
                  )}
                </div>
              )}
              {/* Admin Note */}
              {selectedReview.adminNote && (
                <div>
                  <h4 className="font-medium mb-1 text-gray-700">Admin Note</h4>
                  <p className="text-gray-700 bg-yellow-50 p-3 rounded-md border border-yellow-100 shadow-inner">{selectedReview.adminNote}</p>
                </div>
              )}
              {/* Removal Details: only show if status is removed or removed_by_user */}
              {(selectedReview.status === 'removed' || selectedReview.status === 'removed_by_user') && selectedReview.removalReason && (
                <div>
                  <h4 className="font-medium mb-1 text-gray-700">Removal Details</h4>
                  <div className="bg-red-50 p-3 rounded-md border border-red-200">
                    <p className="text-red-800"><strong>Reason:</strong> {selectedReview.removalReason}</p>
                    {selectedReview.removalNote && (
                      <p className="text-red-700 mt-1"><strong>Note:</strong> {selectedReview.removalNote}</p>
                    )}
                    {selectedReview.removedAt && (
                      <p className="text-red-600 text-sm mt-1">
                        Removed on {formatDate(selectedReview.removedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Removal Modal */}
      {showRemovalModal && reviewToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-xs sm:max-w-md w-full mx-2 sm:mx-4">
            <h2 className="text-xl font-semibold mb-4">Remove Review</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove this review? This action cannot be undone.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Removal Reason *
                </label>
                <select
                  value={removalReason}
                  onChange={(e) => {
                    setRemovalReason(e.target.value);
                    if (e.target.value) {
                      toast.info(`Selected removal reason: ${e.target.value}`);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="fake">Fake review</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Note (Optional)
                </label>
                <textarea
                  value={removalNote}
                  onChange={(e) => setRemovalNote(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide additional details..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleRemoveReview}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Remove Review
              </button>
              <button
                onClick={() => {
                  setShowRemovalModal(false);
                  setReviewToRemove(null);
                  setRemovalReason('');
                  setRemovalNote('');
                  toast.info('Review removal cancelled');
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && reviewToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-xs sm:max-w-md w-full mx-2 sm:mx-4">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Delete Review</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this review from the table? This will only remove it from your current view and won't affect the actual review data.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> This action only removes the review from your current table view. The review data remains in the database.
              </p>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleDeleteReview}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete from Table
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setReviewToDelete(null);
                  toast.info('Delete action cancelled');
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Reports Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <h2 className="text-xl sm:text-2xl font-bold text-red-700 flex items-center gap-2">
                <FaFlag />
                Review Reports
              </h2>
              <button
                onClick={() => setShowReportsModal(false)}
                className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={reportsFilters.dateFrom}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={reportsFilters.dateTo}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
                  <input
                    type="text"
                    placeholder="Filter by reporter"
                    value={reportsFilters.reporter}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, reporter: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={reportsFilters.search}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={reportsFilters.sortBy}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="reporter">Sort by Reporter</option>
                    <option value="property">Sort by Property</option>
                    <option value="category">Sort by Category</option>
                  </select>
                  <select
                    value={reportsFilters.sortOrder}
                    onChange={(e) => setReportsFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setReportsFilters({
                        dateFrom: '',
                        dateTo: '',
                        reporter: '',
                        search: '',
                        sortBy: 'date',
                        sortOrder: 'desc'
                      });
                    }}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={fetchReports}
                    disabled={reportsLoading}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {reportsLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <FaSync />
                        Refresh
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Debug info */}
              <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                Debug: Loading={reportsLoading.toString()}, Error={reportsError}, Total Reports={reports.length}, Filtered={filteredReports.length}
              </div>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="ml-2 text-gray-600">Loading reports...</span>
                </div>
              ) : reportsError ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-2">{reportsError}</div>
                  <button
                    onClick={fetchReports}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-8">
                  <FaFlag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {reports.length === 0 ? 'No review reports found' : 'No reports match your filters'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {reports.length === 0 ? 'Reports will appear here when users report reviews' : 'Try adjusting your search criteria'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Showing {filteredReports.length} of {reports.length} report{reports.length !== 1 ? 's' : ''}
                  </div>
                  {filteredReports.map((report, index) => (
                    <div key={report.notificationId || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <FaFlag className="mr-1" />
                              Review Report
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(report.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium text-gray-700">Property: </span>
                              <span className="text-gray-900">{report.propertyName}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium text-gray-700">Reporter: </span>
                                <span className="text-gray-900">{report.reporter || report.reporterUsername || 'Unknown'}</span>
                              </div>
                              {report.reporterEmail && (
                                <div>
                                  <span className="font-medium text-gray-700">Email: </span>
                                  <span className="text-gray-900">{report.reporterEmail}</span>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {report.reporterPhone && (
                                <div>
                                  <span className="font-medium text-gray-700">Phone: </span>
                                  <span className="text-gray-900">{report.reporterPhone}</span>
                                </div>
                              )}
                              {report.reporterRole && (
                                <div>
                                  <span className="font-medium text-gray-700">Role: </span>
                                  <span className="text-gray-900 capitalize">{report.reporterRole}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Category: </span>
                              <span className="text-gray-900">{report.category}</span>
                            </div>
                            {report.details && (
                              <div>
                                <span className="font-medium text-gray-700">Details: </span>
                                <span className="text-gray-900">{report.details}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {report.listingId && (
                            <a
                              href={`/admin/listing/${report.listingId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition text-center"
                            >
                              View Property
                            </a>
                          )}
                          {report.reviewId && (
                            <button
                              onClick={() => {
                                // You could implement a function to view the specific review
                                toast.info('Review ID: ' + report.reviewId);
                              }}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition"
                            >
                              View Review
                            </button>
                          )}
                          {report.reporterEmail && (
                            <a
                              href={`mailto:${report.reporterEmail}`}
                              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition text-center"
                            >
                              Email Reporter
                            </a>
                          )}
                          {report.reporterPhone && (
                            <a
                              href={`tel:${report.reporterPhone}`}
                              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition text-center"
                            >
                              Call Reporter
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ContactSupportWrapper />
    </div>
  );
} 
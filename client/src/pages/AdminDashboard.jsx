import React, { useEffect, useState } from "react";
import ListingItem from "../components/ListingItem";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaHome, 
  FaStar, 
  FaChartLine, 
  FaEye,
  FaHeart,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaTrash,
  FaLock
} from "react-icons/fa";
import GeminiAIWrapper from "../components/GeminiAIWrapper";
import { toast } from 'react-toastify';
import ContactSupportWrapper from '../components/ContactSupportWrapper';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminDashboard() {
  const { currentUser } = useSelector((state) => state.user);
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Enhanced analytics state
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalListings: 0,
    totalReviews: 0,
    pendingReviews: 0,
    averageRating: 0,
    recentActivity: [],
    topProperties: [],
    topCities: [],
    recentListings: [],
    userGrowth: [],
    listingStats: {
      sale: 0,
      rent: 0,
      offer: 0
    },
    priceStats: {
      min: 0,
      max: 0,
      avg: 0,
      discountedCount: 0
    },
    bedroomsDistribution: {},
    marketInsights: {
      monthlyAvgPrices: [],
      demandByCity: []
    },
    performance: {
      topOwnersByRating: []
    },
    sentiment: {
      positive: 0,
      negative: 0,
      neutral: 0,
      topWords: []
    },
    userBehavior: {
      popularFilters: [],
      dropoffs: []
    }
  });

  // Booking statistics state
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    accepted: 0,
    pending: 0,
    rejected: 0
  });
  const [fraudTimeline, setFraudTimeline] = useState([]);

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [pendingDelete, setPendingDelete] = useState({ id: null, ownerId: null });
  const [fraudStats, setFraudStats] = useState({ suspiciousListings: 0, suspectedFakeReviews: 0, lastScan: null });

  // Lock body scroll when deletion modals are open on dashboard
  useEffect(() => {
    const shouldLock = showReasonModal || showPasswordModal;
    if (shouldLock) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showReasonModal, showPasswordModal]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchOfferListings(),
          fetchRentListings(),
          fetchSaleListings(),
          fetchAppointmentCount(),
          fetchBookingStats(),
          fetchAnalytics()
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const fetchOfferListings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/get?offer=true&limit=6`);
      const data = await res.json();
      setOfferListings(data);
    } catch (error) {
      console.error("Error fetching offer listings", error);
    }
  };

  const fetchRentListings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/get?type=rent&limit=6`);
      const data = await res.json();
      setRentListings(data);
    } catch (error) {
      console.error("Error fetching rent listings", error);
    }
  };

  const fetchSaleListings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/get?type=sale&limit=6`);
      const data = await res.json();
      setSaleListings(data);
    } catch (error) {
      console.error("Error fetching sale listings", error);
    }
  };

  const fetchAppointmentCount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAppointmentCount(data.length);
      }
    } catch (error) {
      console.error('Failed to fetch appointment count:', error);
    }
  };

  const fetchBookingStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/stats`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setBookingStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch booking stats:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Fetch user statistics
      const usersRes = await fetch(`${API_BASE_URL}/api/admin/management/users`, { credentials: 'include' });
      const adminsRes = await fetch(`${API_BASE_URL}/api/admin/management/admins`, { credentials: 'include' });
      // Fetch review statistics
      const reviewsRes = await fetch(`${API_BASE_URL}/api/review/admin/stats`, { credentials: 'include' });
      const reviewsAllRes = await fetch(`${API_BASE_URL}/api/review/admin/all?status=approved&limit=1000&sort=date&order=desc`, { credentials: 'include' });
      // Fetch listing statistics
      const listingsRes = await fetch(`${API_BASE_URL}/api/listing/get?limit=10000`, { credentials: 'include' });
      const fraudRes = await fetch(`${API_BASE_URL}/api/ai/fraud/stats`);

      let usersData = [];
      let adminsData = [];
      let reviewsData = { totalReviews: 0, pendingReviews: 0, averageRating: 0 };
      let allApprovedReviews = [];
      let listingsData = [];

      if (usersRes.ok) usersData = await usersRes.json();
      if (adminsRes.ok) adminsData = await adminsRes.json();
      if (reviewsRes.ok) reviewsData = await reviewsRes.json();
      if (reviewsAllRes.ok) {
        const temp = await reviewsAllRes.json();
        allApprovedReviews = temp.reviews || temp; // depending on API shape
      }
      if (listingsRes.ok) listingsData = await listingsRes.json();
      let fraudData = fraudRes.ok ? await fraudRes.json() : { suspiciousListings: 0, suspectedFakeReviews: 0, lastScan: null };

      const listingStats = {
        sale: listingsData.filter(l => l.type === 'sale').length,
        rent: listingsData.filter(l => l.type === 'rent').length,
        offer: listingsData.filter(l => l.offer).length
      };

      const topProperties = listingsData
        .filter(l => l.averageRating > 0)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

      // Top cities by listing count
      const cityCounts = listingsData.reduce((acc, l) => {
        const key = `${l.city || 'Unknown'}, ${l.state || ''}`.trim();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      const topCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({ city, count }));

      // Recent listings by createdAt (fallback to id ordering)
      const recentListings = [...listingsData]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6);

      // Market Insights: monthly average prices and demand by city (counts)
      const monthlyMap = {};
      listingsData.forEach(l => {
        const dt = new Date(l.createdAt || l.updatedAt || Date.now());
        const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
        const price = (l.offer && l.discountPrice) ? l.discountPrice : l.regularPrice;
        if (!price) return;
        if (!monthlyMap[key]) monthlyMap[key] = { sum: 0, count: 0 };
        monthlyMap[key].sum += price;
        monthlyMap[key].count += 1;
      });
      const monthlyAvgPrices = Object.entries(monthlyMap)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, avg: Math.round(v.sum / v.count) }));

      const demandByCity = Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 10);

      // Performance: top owners by average rating across their listings
      const ownerMap = {};
      listingsData.forEach(l => {
        const ownerId = (l.userRef && (l.userRef._id || l.userRef)) || 'unknown';
        if (!ownerMap[ownerId]) ownerMap[ownerId] = { totalRating: 0, count: 0, ownerId, ownerName: '', listings: 0 };
        if (typeof l.averageRating === 'number' && l.reviewCount > 0) {
          ownerMap[ownerId].totalRating += l.averageRating;
          ownerMap[ownerId].count += 1;
        }
        ownerMap[ownerId].listings += 1;
      });
      const userIdToName = {};
      (usersData || []).forEach(u => {
        const id = u._id || u.id;
        if (id) userIdToName[id] = u.username || u.name || u.email || '';
      });

      const topOwnersByRating = Object.values(ownerMap)
        .filter(o => o.count > 0)
        .map(o => ({ 
          ...o, 
          avgRating: Math.round((o.totalRating / o.count) * 10) / 10,
          ownerName: userIdToName[o.ownerId] || o.ownerId
        }))
        .sort((a,b) => b.avgRating - a.avgRating)
        .slice(0, 5);

      // Sentiment Analysis: simple rule-based scoring over review comments
      const positiveWords = ['good','great','excellent','amazing','love','nice','helpful','fast','clean','spacious','recommended','recommend'];
      const negativeWords = ['bad','poor','terrible','awful','hate','dirty','small','slow','rude','noisy','not recommended','worst'];
      let pos = 0, neg = 0, neu = 0;
      const wordFreq = {};
      (allApprovedReviews || []).forEach(r => {
        const text = (r.comment || '').toLowerCase();
        if (!text.trim()) { neu++; return; }
        let score = 0;
        positiveWords.forEach(w => { if (text.includes(w)) score++; });
        negativeWords.forEach(w => { if (text.includes(w)) score--; });
        if (score > 0) pos++; else if (score < 0) neg++; else neu++;
        text.split(/[^a-zA-Z]+/).forEach(t => { if (t.length > 3) wordFreq[t] = (wordFreq[t] || 0) + 1; });
      });
      const topWords = Object.entries(wordFreq).sort((a,b) => b[1]-a[1]).slice(0,10).map(([word,count]) => ({ word, count }));

      // User Behavior (lightweight): read optional localStorage keys if present
      let popularFilters = [];
      let dropoffs = [];
      try {
        const filterData = JSON.parse(localStorage.getItem('search_filter_usage') || '[]');
        popularFilters = Array.isArray(filterData) ? filterData : [];
        const dropData = JSON.parse(localStorage.getItem('funnel_dropoffs') || '[]');
        dropoffs = Array.isArray(dropData) ? dropData : [];
      } catch(_) {}

      // Price stats and distributions
      const prices = listingsData.map(l => (l.offer && l.discountPrice) ? l.discountPrice : l.regularPrice).filter(Boolean);
      const priceStats = prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        discountedCount: listingsData.filter(l => l.offer && l.discountPrice && l.regularPrice && l.discountPrice < l.regularPrice).length
      } : { min: 0, max: 0, avg: 0, discountedCount: 0 };

      const bedroomsDistribution = listingsData.reduce((acc, l) => {
        const key = l.bedrooms || 0;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      // Compute suspected fake reviews locally to improve accuracy
      // Heuristics: identical text across accounts, simple flood checks in last 3 days
      try {
        const reviewsArr = Array.isArray(allApprovedReviews) ? allApprovedReviews : (allApprovedReviews.reviews || []);
        const textCount = new Map();
        reviewsArr.forEach(r => {
          const t = (r.comment || '').trim().toLowerCase();
          if (!t) return; textCount.set(t, (textCount.get(t)||0)+1);
        });
        const repetitiveSet = new Set(Array.from(textCount.entries()).filter(([,c]) => c >= 2).map(([t]) => t));
        const suspiciousReviewPhrases = ['scam','fraud',"don't book",'best deal','don\'t miss','very cheap'];
        const threeDaysAgo = Date.now() - 3*24*60*60*1000;
        const byListing = new Map();
        reviewsArr.forEach(r => {
          const lid = (r.listingId && (r.listingId._id || r.listingId)) || r.listingId;
          const created = new Date(r.createdAt || 0).getTime();
          const entry = { rating: r.rating || 0, created };
          if (!byListing.has(lid)) byListing.set(lid, []);
          byListing.get(lid).push(entry);
        });
        let floodCount = 0;
        byListing.forEach(arr => {
          const recent = arr.filter(x => x.created >= threeDaysAgo);
          const fiveStar = recent.filter(x => x.rating >= 5).length;
          const oneStar = recent.filter(x => x.rating <= 1).length;
          if (fiveStar >= 6 || oneStar >= 6) floodCount += Math.max(fiveStar, oneStar);
        });
        const repetitiveReviews = reviewsArr.filter(r => repetitiveSet.has((r.comment||'').trim().toLowerCase()));
        const suspiciousLang = reviewsArr.filter(r => suspiciousReviewPhrases.some(p => ((r.comment||'').toLowerCase().includes(p))));
        const computedFakeReviews = Math.max(repetitiveReviews.length + suspiciousLang.length, floodCount);
        if (computedFakeReviews > (fraudData.suspectedFakeReviews || 0)) {
          fraudData = { ...fraudData, suspectedFakeReviews: computedFakeReviews };
        }
      } catch (_) {}

      // Compute suspicious listings locally (strict low-price proxy)
      try {
        const pricesAll = listingsData.map(l => (l.offer && l.discountPrice) ? l.discountPrice : l.regularPrice).filter(Boolean);
        const meanAll = pricesAll.length ? pricesAll.reduce((a,b)=>a+b,0)/pricesAll.length : 0;
        const varianceAll = pricesAll.length ? pricesAll.reduce((a,b)=>a+Math.pow(b-meanAll,2),0)/pricesAll.length : 0;
        const stdAll = Math.sqrt(varianceAll) || 1;
        const upperAll = meanAll + 3*stdAll; const lowerAll = Math.max(0, meanAll - 3*stdAll);
        const localSuspicious = listingsData.filter(l => {
          const p = (l.offer && l.discountPrice) ? l.discountPrice : l.regularPrice;
          if (!p) return false;
          if (p > upperAll || p < lowerAll) return true;
          if (p < 100000) return true; // Below 1 lakh
          if (p <= 1000) return true; // Below 1000
          return false;
        }).length;
        if (localSuspicious > (fraudData.suspiciousListings || 0)) {
          fraudData = { ...fraudData, suspiciousListings: localSuspicious };
        }
      } catch(_) {}

      // Build simple monthly fraud timeline using review floods and duplicates as proxies
      try {
        const monthKey = (d) => {
          const dt = new Date(d||Date.now());
          return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
        };
        const timeline = {};
        (allApprovedReviews || []).forEach(r => {
          const key = monthKey(r.createdAt);
          const t = (r.comment||'').toLowerCase();
          const suspicious = t.includes('scam') || t.includes('fraud');
          if (suspicious) timeline[key] = (timeline[key]||0)+1;
        });
        const series = Object.entries(timeline).sort(([a],[b])=>a.localeCompare(b)).map(([month,count])=>({ month, count }));
        setFraudTimeline(series);
      } catch(_) {}

      setAnalytics({
        totalUsers: usersData.length,
        totalAdmins: adminsData.length,
        totalListings: listingsData.length,
        totalReviews: reviewsData.totalReviews,
        pendingReviews: reviewsData.pendingReviews,
        averageRating: reviewsData.averageRating,
        listingStats,
        topProperties,
        topCities,
        recentListings,
        recentActivity: [],
        userGrowth: [],
        priceStats,
        bedroomsDistribution,
        marketInsights: { monthlyAvgPrices, demandByCity },
        performance: { topOwnersByRating },
        sentiment: { positive: pos, negative: neg, neutral: neu, topWords },
        userBehavior: { popularFilters, dropoffs }
      });

      setFraudStats(fraudData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleDeleteListing = (listingId, listingOwnerId) => {
    setPendingDelete({ id: listingId, ownerId: listingOwnerId });
    setDeleteReason("");
    setDeleteError("");
    setShowReasonModal(true);
  };

  const handleReasonSubmit = (e) => {
    e.preventDefault();
    if (!deleteReason.trim()) {
      setDeleteError("Reason is required");
      return;
    }
    setShowReasonModal(false);
    setDeleteError("");
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError("Password is required");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      // Verify password
      const verifyRes = await fetch(`${API_BASE_URL}/api/user/verify-password/${currentUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!verifyRes.ok) {
        setDeleteError("Incorrect password. Property not deleted.");
        setDeleteLoading(false);
        return;
      }
      // Proceed to delete
      const res = await fetch(`${API_BASE_URL}/api/listing/delete/${pendingDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setOfferListings((prev) => prev.filter((l) => l._id !== pendingDelete.id));
        setRentListings((prev) => prev.filter((l) => l._id !== pendingDelete.id));
        setSaleListings((prev) => prev.filter((l) => l._id !== pendingDelete.id));
        setShowPasswordModal(false);
        toast.success(data.message || 'Listing deleted successfully.');
        fetchAnalytics();
      } else {
        setDeleteError(data.message || 'Failed to delete listing.');
      }
    } catch (err) {
      setDeleteError('An error occurred. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6 animate-fade-in-down bg-white rounded-xl shadow-lg p-8 mt-10">
        <div className="text-left w-full md:w-auto flex flex-col items-start">
          <h2 className="text-4xl font-extrabold text-blue-700 animate-fade-in mb-2 drop-shadow">Welcome, Admin!</h2>
          <p className="mt-2 text-lg text-blue-600 animate-fade-in delay-200">Manage all properties and appointments from your dashboard.</p>
        </div>
        <div className="w-full md:w-auto flex justify-end">
          <Link to="/admin/appointments">
            <div className="relative">
              {appointmentCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold z-10">
                  {appointmentCount > 99 ? '99+' : appointmentCount}
                </span>
              )}
              <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2 mt-4 md:mt-0">
                <FaCalendarAlt className="text-2xl drop-shadow-lg animate-pulse" />
                <span className="tracking-wide">Appointments</span>
              </button>
            </div>
          </Link>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Analytics Overview</h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.totalUsers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUsers className="text-2xl text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Admins: {analytics.totalAdmins}</p>
            </div>
          </div>

          {/* Properties Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-3xl font-bold text-green-600">{analytics.totalListings}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaHome className="text-2xl text-green-600" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-gray-500">For Sale: {analytics.listingStats.sale}</p>
              <p className="text-sm text-gray-500">For Rent: {analytics.listingStats.rent}</p>
              <p className="text-sm text-gray-500">Offers: {analytics.listingStats.offer}</p>
            </div>
          </div>

          {/* Reviews Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reviews</p>
                <p className="text-3xl font-bold text-yellow-600">{analytics.totalReviews}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaStar className="text-2xl text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-gray-500">Avg Rating: {analytics.averageRating.toFixed(1)} ⭐</p>
              <p className="text-sm text-orange-500">Pending: {analytics.pendingReviews}</p>
            </div>
          </div>

          {/* Appointments Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Appointments</p>
                <p className="text-3xl font-bold text-purple-600">{bookingStats.total}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FaCalendarAlt className="text-2xl text-purple-600" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-green-600">Accepted: {bookingStats.accepted}</p>
              <p className="text-sm text-orange-500">Pending: {bookingStats.pending}</p>
              <p className="text-sm text-red-500">Rejected: {bookingStats.rejected}</p>
            </div>
          </div>
          {/* Fraud Detection Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow relative group" onClick={() => navigate('/admin/fraudmanagement')} role="button" title="Manage fraud detections">
            <div className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-600">Fraud Watch</p>
                <p className="text-sm text-gray-500">Last Scan: {fraudStats.lastScan ? new Date(fraudStats.lastScan).toLocaleString() : 'N/A'}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FaExclamationTriangle className="text-2xl text-red-600" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-gray-700">Suspicious Listings: <span className="font-bold text-red-600">{fraudStats.suspiciousListings}</span></p>
              <p className="text-sm text-gray-700">Suspected Fake Reviews: <span className="font-bold text-red-600">{fraudStats.suspectedFakeReviews}</span></p>
            </div>
            {/* Hover/Click Popover */}
            <div className="hidden group-hover:block absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
              <p className="text-xs text-gray-600">Details</p>
              <ul className="mt-1 text-sm text-gray-800 space-y-1">
                <li>Suspicious Listings: <span className="font-semibold text-red-600">{fraudStats.suspiciousListings}</span></li>
                <li>Suspected Fake Reviews: <span className="font-semibold text-red-600">{fraudStats.suspectedFakeReviews}</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Price Statistics and Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><FaChartLine className="text-green-600 mr-2" /> Price Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Min</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 break-all">₹{analytics.priceStats.min.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700 break-all">₹{analytics.priceStats.avg.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Max</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 break-all">₹{analytics.priceStats.max.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600"><span className="font-semibold text-green-700">{analytics.priceStats.discountedCount}</span> listings currently on discount</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><FaChartLine className="text-purple-600 mr-2" /> Bedrooms Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(analytics.bedroomsDistribution).sort((a,b)=>Number(a[0])-Number(b[0])).map(([beds, count]) => (
                <div key={beds} className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">{beds} bed{Number(beds) === 1 ? '' : 's'}</p>
                  <p className="text-xl font-bold text-purple-700">{count}</p>
                  {/* Simple bar viz */}
                  <div className="h-2 bg-gray-100 rounded mt-2">
                    <div className="h-2 bg-purple-500 rounded" style={{ width: `${Math.min(100, Math.round((count / Math.max(1, analytics.totalListings)) * 100))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fraud Activity Timeline */}
        {fraudTimeline.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><FaExclamationTriangle className="text-red-600 mr-2" /> Fraud Activity (monthly)</h3>
            <div className="mt-3 flex items-end gap-1 h-20">
              {fraudTimeline.map((pt, i, arr) => {
                const max = Math.max(...arr.map(x => x.count || 1));
                const h = Math.max(2, Math.round((pt.count / (max || 1)) * 56));
                return (
                  <div key={pt.month} className="flex flex-col items-center" title={`${pt.month}: ${pt.count}`}>
                    <div className="w-3 bg-red-500 rounded-t" style={{ height: `${h}px` }} />
                    <div className="mt-1 text-[10px] text-gray-500 rotate-0">{pt.month.split('-')[1]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Market Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><FaChartLine className="text-blue-600 mr-2" /> Market Price Trends</h3>
            {analytics.marketInsights.monthlyAvgPrices.length === 0 ? (
              <p className="text-sm text-gray-500">Not enough data yet.</p>
            ) : (
              <div className="space-y-2">
                {analytics.marketInsights.monthlyAvgPrices.map(mp => (
                  <div key={mp.month} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{mp.month}</span>
                    <span className="font-semibold text-gray-800">₹{mp.avg.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                {/* Inline spark-bar */}
                <div className="mt-3 flex items-end gap-1 h-20">
                  {analytics.marketInsights.monthlyAvgPrices.map((mp, i, arr) => {
                    const max = Math.max(...arr.map(x => x.avg || 1));
                    const h = Math.max(2, Math.round((mp.avg / (max || 1)) * 56));
                    return (
                      <div key={mp.month} className="flex flex-col items-center" title={`${mp.month}: ₹${mp.avg.toLocaleString('en-IN')}`}>
                        <div className="w-3 bg-blue-500 rounded-t" style={{ height: `${h}px` }} />
                        <div className="mt-1 text-[10px] text-gray-500 rotate-0">{mp.month.split('-')[1]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><FaChartLine className="text-indigo-600 mr-2" /> Demand by City</h3>
            {analytics.marketInsights.demandByCity.length === 0 ? (
              <p className="text-sm text-gray-500">Not enough data yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analytics.marketInsights.demandByCity.map((d, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{d.city}</span>
                    <span className="text-base font-bold text-indigo-700">{d.count}</span>
                  </div>
                ))}
                {/* Pie chart of top 5 demand */}
                <div className="col-span-1 md:col-span-2 flex items-center justify-center mt-2">
                  {(() => {
                    const total = analytics.marketInsights.demandByCity.slice(0,5).reduce((s,x)=>s+x.count,0) || 1;
                    let acc = 0;
                    const segments = analytics.marketInsights.demandByCity.slice(0,5).map((x, i) => {
                      const start = acc / total * 360; acc += x.count; const end = acc / total * 360;
                      const colors = ['#6366f1','#8b5cf6','#06b6d4','#22c55e','#f59e0b'];
                      return `${colors[i%colors.length]} ${start}deg ${end}deg`;
                    }).join(',');
                    return (
                      <div className="flex flex-col items-center">
                        <div className="w-28 h-28 rounded-full" style={{ background: `conic-gradient(${segments})` }} />
                        <div className="mt-2 space-y-1">
                          {analytics.marketInsights.demandByCity.slice(0,5).map((x,i)=>{
                            const colors = ['#6366f1','#8b5cf6','#06b6d4','#22c55e','#f59e0b'];
                            const pct = Math.round((x.count/total)*100);
                            return (
                              <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: colors[i%colors.length] }} />
                                <span>{x.city}</span>
                                <span className="text-gray-500">({pct}% - {x.count})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance & Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><FaChartLine className="text-rose-600 mr-2" /> Top Owners by Rating</h3>
            {analytics.performance.topOwnersByRating.length === 0 ? (
              <p className="text-sm text-gray-500">Not enough data yet.</p>
            ) : (
              <div className="space-y-2">
                {analytics.performance.topOwnersByRating.map((o, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{o.ownerName}</span>
                    <span className="font-semibold text-gray-800">{o.avgRating} ⭐ ({o.listings} listings)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><FaStar className="text-yellow-500 mr-2" /> Review Sentiment</h3>
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
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Common Words</h4>
                <div className="flex flex-wrap gap-2">
                  {analytics.sentiment.topWords.map((w, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{w.word} ({w.count})</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 w-full text-left"
            onClick={() => navigate('/admin/management')}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUsers className="text-2xl text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Manage Users</h3>
                <p className="text-sm text-gray-600">View and manage user accounts</p>
              </div>
            </div>
          </button>
          <Link to="/admin/reviews" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaStar className="text-2xl text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Review Management</h3>
                <p className="text-sm text-gray-600">Approve and manage reviews</p>
                {analytics.pendingReviews > 0 && (
                  <span className="inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded-full mt-1">
                    {analytics.pendingReviews} pending
                  </span>
                )}
              </div>
            </div>
          </Link>
          <Link to="/admin/explore" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FaHome className="text-2xl text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">All Properties</h3>
                <p className="text-sm text-gray-600">Browse and manage listings</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Top Rated Properties */}
        {analytics.topProperties.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaStar className="text-yellow-500 mr-2" />
              Top Rated Properties
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics.topProperties.map((property) => (
                <div key={property._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 truncate">{property.name}</h4>
                    <span className="text-sm text-yellow-600 font-semibold">
                      {property.averageRating.toFixed(1)} ⭐
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{property.city}, {property.state}</p>
                  <p className="text-sm text-gray-500">
                    {property.reviewCount} review{property.reviewCount !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        

        {/* Recent Listings */}
        {analytics.recentListings.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaEye className="text-purple-500 mr-2" />
              Recently Added Listings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {analytics.recentListings.map((l) => (
                <div key={l._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 truncate">{l.name}</h4>
                    <span className="text-xs text-gray-500">{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{l.city}, {l.state}</p>
                  <p className="text-sm text-gray-500">Type: {l.type}{l.offer ? ' • Offer' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Listings Section */}
      <div className="max-w-6xl w-full mx-auto px-2 sm:px-4 md:px-8 py-8 overflow-x-hidden">
        {/* Offer Listings */}
        {offerListings.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700 animate-slide-in-left">🔥 Exclusive Offers</h2>
              <Link to="/admin/explore?offer=true" className="text-blue-600 hover:underline">View All Offers</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {offerListings.map((listing) => (
                <div className="transition-transform duration-300 hover:scale-105 hover:shadow-xl" key={listing._id}>
                  <ListingItem listing={listing} onDelete={() => handleDeleteListing(listing._id, listing.userRef)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rent Listings */}
        {rentListings.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700 animate-slide-in-left delay-200">🏡 Homes for Rent</h2>
              <Link to="/admin/explore?type=rent" className="text-blue-600 hover:underline">View All Rentals</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {rentListings.map((listing) => (
                <div className="transition-transform duration-300 hover:scale-105 hover:shadow-xl" key={listing._id}>
                  <ListingItem listing={listing} onDelete={() => handleDeleteListing(listing._id, listing.userRef)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sale Listings */}
        {saleListings.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700 animate-slide-in-left delay-400">🏠 Homes for Sale</h2>
              <Link to="/admin/explore?type=sale" className="text-blue-600 hover:underline">View All Sales</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {saleListings.map((listing) => (
                <div className="transition-transform duration-300 hover:scale-105 hover:shadow-xl" key={listing._id}>
                  <ListingItem listing={listing} onDelete={() => handleDeleteListing(listing._id, listing.userRef)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <GeminiAIWrapper />
      <ContactSupportWrapper />

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form onSubmit={handleReasonSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col gap-4">
            <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2"><FaTrash /> Reason for Deletion</h3>
            <textarea
              className="border rounded p-2 w-full"
              placeholder="Enter reason for deleting this property"
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              rows={3}
              autoFocus
            />
            {deleteError && <div className="text-red-600 text-sm">{deleteError}</div>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowReasonModal(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-red-600 text-white font-semibold">Next</button>
            </div>
          </form>
        </div>
      )}
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form onSubmit={handlePasswordSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col gap-4">
            <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2"><FaLock /> Confirm Password</h3>
            <input
              type="password"
              className="border rounded p-2 w-full"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              autoFocus
            />
            {deleteError && <div className="text-red-600 text-sm">{deleteError}</div>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-700 text-white font-semibold" disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Confirm & Delete'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaSync, FaSearch, FaFilter, FaHistory, FaGlobe, FaDesktop, FaUser,
  FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaFileAlt,
  FaChartLine, FaMapMarkerAlt, FaFileExport, FaTrash, FaFingerprint, FaTimes, FaCalendarAlt
} from 'react-icons/fa';

import { usePageTitle } from '../hooks/usePageTitle';
import AdminSessionAuditLogsSkeleton from '../components/skeletons/AdminSessionAuditLogsSkeleton';

const SessionAuditLogs = () => {
  // Set page title
  usePageTitle("Session Audit Logs - Security History");

  const { currentUser } = useSelector((state) => state.user);

  // Tab state
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' or 'visitors'

  // Audit logs state
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef(null);
  const [isClearing, setIsClearing] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    isSuspicious: '',
    userId: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showAuditStats, setShowAuditStats] = useState(false);
  const [showVisitorStatsToggle, setShowVisitorStatsToggle] = useState(false);

  // Modal states
  const [showClearModal, setShowClearModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOption, setExportOption] = useState('all'); // 'all' or 'range'
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Visitors state
  const [visitors, setVisitors] = useState([]);
  const [allVisitors, setAllVisitors] = useState([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [visitorsPage, setVisitorsPage] = useState(1);
  const [visitorsTotalPages, setVisitorsTotalPages] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [visitorStats, setVisitorStats] = useState({
    totalVisitors: 0,
    todayCount: 0,
    dailyStats: [],
    deviceStats: [],
    locationStats: []
  });
  const [visitorFilters, setVisitorFilters] = useState({
    dateRange: 'today',
    device: 'all',
    location: 'all',
    search: '',
    analytics: 'any',
    marketing: 'any',
    functional: 'any'
  });
  const [showVisitorFilters, setShowVisitorFilters] = useState(false);

  const getVisitorActiveFiltersCount = () => {
    let count = 0;
    if (visitorFilters.dateRange && visitorFilters.dateRange !== 'today') count++;
    if (visitorFilters.device && visitorFilters.device !== 'all') count++;
    if (visitorFilters.location && visitorFilters.location !== 'all') count++;
    if (visitorFilters.search) count++;
    if (visitorFilters.analytics !== 'any') count++;
    if (visitorFilters.marketing !== 'any') count++;
    if (visitorFilters.functional !== 'any') count++;
    return count;
  };

  const getVisitorEntryValue = (entry) => {
    if (!entry) return 0;
    return entry.count ?? entry.total ?? entry.visits ?? entry.value ?? 0;
  };

  const formatVisitorDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const visitorInsights = useMemo(() => {
    const dailyRaw = Array.isArray(visitorStats?.dailyStats) ? visitorStats.dailyStats : [];
    const deviceStats = Array.isArray(visitorStats?.deviceStats) ? visitorStats.deviceStats : [];
    const locationStats = Array.isArray(visitorStats?.locationStats) ? visitorStats.locationStats : [];

    // Fill gaps for last 30 days to ensure accurate trend/avg calculation
    const daysWindow = 30; // Matching the query default
    const filledDaily = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const statsMap = new Map();
    dailyRaw.forEach(item => {
      const d = new Date(item.date || item._id);
      d.setHours(0, 0, 0, 0);
      statsMap.set(d.getTime(), getVisitorEntryValue(item));
    });

    for (let i = daysWindow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const val = statsMap.get(d.getTime()) || 0;
      filledDaily.push({ date: d, count: val, value: val }); // standardized format
    }

    const totalWindow = filledDaily.reduce((sum, entry) => sum + entry.count, 0);

    // Calculate 7-day stats
    const last7 = filledDaily.slice(-7);
    const last7Total = last7.reduce((sum, entry) => sum + entry.count, 0);

    // Calculate previous 7-day stats for trend
    const prev7 = filledDaily.slice(-14, -7);
    const prev7Total = prev7.reduce((sum, entry) => sum + entry.count, 0);

    const trendPercentage = prev7Total > 0 ? ((last7Total - prev7Total) / prev7Total) * 100 : (last7Total > 0 ? 100 : 0);

    // Avg Daily: Total / Window (30) ensures we count zero-days
    const avgDaily = totalWindow / daysWindow;

    const peakEntry = filledDaily.reduce((max, entry) => {
      if (!max) return entry;
      return entry.count > max.count ? entry : max;
    }, filledDaily[0]);

    const topDevice = deviceStats.reduce((max, entry) => {
      if (!max) return entry;
      return (entry.count || 0) > (max.count || 0) ? entry : max;
    }, null);

    const topLocation = locationStats.reduce((max, entry) => {
      if (!max) return entry;
      return (entry.count || 0) > (max.count || 0) ? entry : max;
    }, null);

    const summaryPoints = [];
    if (trendPercentage !== null) {
      const direction = trendPercentage >= 0 ? 'up' : 'down';
      summaryPoints.push(`Traffic is ${direction} ${Math.abs(trendPercentage).toFixed(1)}% compared to the previous week.`);
    }
    if (avgDaily > 0) {
      summaryPoints.push(`Average daily visitors: ${avgDaily < 1 ? avgDaily.toFixed(1) : Math.round(avgDaily).toLocaleString('en-IN')}.`);
    }
    if (peakEntry && peakEntry.count > 0) {
      summaryPoints.push(`Peak traffic on ${formatVisitorDate(peakEntry.date)} with ${peakEntry.count} visits.`);
    }
    if (topDevice) {
      summaryPoints.push(`Most visitors use ${topDevice.device || topDevice.name || 'Unknown'} devices (${topDevice.count || 0}).`);
    }
    if (topLocation) {
      summaryPoints.push(`Top region: ${topLocation.location || topLocation.city || 'Unknown'} (${topLocation.count || 0} visits).`);
    }

    return {
      avgDaily,
      last7Total,
      trendPercentage,
      peakEntry,
      topDevice,
      topLocation,
      summaryPoints,
      topDevices: deviceStats.slice(0, 4),
      topLocations: locationStats.slice(0, 4),
      // Expose filledDaily for charts if needed
      chartData: filledDaily.map(d => ({ date: formatVisitorDate(d.date), count: d.count }))
    };
  }, [visitorStats]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery) {
      setIsSearching(true);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchLogs().finally(() => setIsSearching(false));
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchLogs();
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [currentPage, filters, filterDateRange, filterRole]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 50
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.isSuspicious !== '') params.append('isSuspicious', filters.isSuspicious);
      if (filters.userId) params.append('userId', filters.userId);
      if (searchQuery) params.append('search', searchQuery);
      if (filterDateRange !== 'all') params.append('dateRange', filterDateRange);
      if (filterRole !== 'all') params.append('role', filterRole);

      const controller = new AbortController();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/session-management/admin/audit-logs?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setLogs(data.logs);
        setTotalLogs(data.total);
        setLastUpdated(new Date());
      } else {
        toast.error(data.message || 'Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch visitor statistics
  const fetchVisitorStats = async () => {
    try {
      const params = new URLSearchParams({
        days: 30, // Get last 30 days for trend graph regardless of date filter (or should match? Backend now handles it)
        dateRange: visitorFilters.dateRange,
        device: visitorFilters.device,
        location: visitorFilters.location,
        search: visitorFilters.search,
        analytics: visitorFilters.analytics,
        marketing: visitorFilters.marketing,
        functional: visitorFilters.functional
      });

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/visitors/stats?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setVisitorStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
    }
  };

  // Fetch visitors list
  const fetchVisitors = async (opts = { manual: false }) => {
    if (opts.manual) setVisitorsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 1000, // Fetch all visitors, pagination will be done client-side
        dateRange: visitorFilters.dateRange,
        device: visitorFilters.device,
        location: visitorFilters.location,
        search: visitorFilters.search,
        analytics: visitorFilters.analytics,
        marketing: visitorFilters.marketing,
        functional: visitorFilters.functional
      });

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/visitors/all?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setAllVisitors(data.visitors || []);
        setTotalVisitors(data.total);
        setVisitorsPage(1); // Reset to first page when filters change
        setLastUpdated(new Date());
      } else {
        toast.error(data.message || 'Failed to fetch visitors');
      }
    } catch (error) {
      console.error('Error fetching visitors:', error);
      toast.error('Failed to fetch visitors');
    } finally {
      if (opts.manual) setVisitorsLoading(false);
    }
  };

  // Effect to fetch visitors when tab changes
  useEffect(() => {
    if (activeTab === 'visitors') {
      fetchVisitorStats();
      fetchVisitors();
    }
  }, [activeTab, visitorFilters]);

  // Pagination effect for visitors
  useEffect(() => {
    const itemsPerPage = 10;
    const totalPages = Math.ceil(allVisitors.length / itemsPerPage);
    setVisitorsTotalPages(totalPages);

    const startIndex = (visitorsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageVisitors = allVisitors.slice(startIndex, endIndex);
    setVisitors(currentPageVisitors);
  }, [allVisitors, visitorsPage]);

  // Effect to restart auto-refresh when switching tabs
  useEffect(() => {
    if (autoRefresh && autoRefreshRef.current) {
      // Clear existing interval
      clearInterval(autoRefreshRef.current);
      // Start new interval with current tab's refresh function
      autoRefreshRef.current = setInterval(() => { refreshCurrentTab(); }, 30000);
    }
  }, [activeTab, autoRefresh]);

  const refreshCurrentTab = () => {
    if (activeTab === 'audit') {
      fetchLogs();
    } else if (activeTab === 'visitors') {
      fetchVisitorStats();
      fetchVisitors({ manual: true });
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh((prev) => {
      const next = !prev;
      if (next) {
        autoRefreshRef.current = setInterval(() => { refreshCurrentTab(); }, 30000);
      } else if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
      return next;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };



  const resetFilters = () => {
    setFilters({ action: '', isSuspicious: '', userId: '' });
    setSearchQuery('');
    setFilterDateRange('all');
    setFilterRole('all');
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.action) count++;
    if (filters.isSuspicious !== '') count++;
    if (filters.userId) count++;
    if (searchQuery) count++;
    if (filterDateRange !== 'all') count++;
    if (filterRole !== 'all') count++;
    return count;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'rootadmin':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  if (loading) {
    return <AdminSessionAuditLogsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Background Animations */}
      <style>
        {`
            @keyframes blob {
                0% { transform: translate(0px, 0px) scale(1); }
                33% { transform: translate(30px, -50px) scale(1.1); }
                66% { transform: translate(-20px, 20px) scale(0.9); }
                100% { transform: translate(0px, 0px) scale(1); }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-blob { animation: blob 7s infinite; }
            .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
            .animate-fade-in-delay { animation: fadeIn 0.6s ease-out 0.2s forwards; opacity: 0; }
        `}
      </style>

      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10 animate-fade-in">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 mb-8 animate-fade-in relative overflow-hidden group hover:shadow-2xl transition-shadow duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-bl-full -mr-16 -mt-16 opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                Session Audit & Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Comprehensive security logs and visitor traffic analysis
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700/50 p-1 border border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => {
                    if (activeTab === 'audit') {
                      setLoading(true);
                      fetchLogs();
                    } else {
                      setVisitorsLoading(true);
                      fetchVisitorStats();
                      fetchVisitors({ manual: true });
                    }
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all focus:outline-none"
                  title={activeTab === 'audit' ? 'Refresh logs' : 'Refresh visitors'}
                >
                  <FaSync className={`mr-2 ${loading || visitorsLoading ? 'animate-spin text-blue-600' : 'text-gray-500 dark:text-gray-400'}`} />
                  Refresh
                </button>
                <div className="w-px bg-gray-200 dark:bg-gray-600 my-1 mx-1"></div>
                <button
                  onClick={toggleAutoRefresh}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all focus:outline-none ${autoRefresh ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 shadow-sm' : 'text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm'}`}
                  title="Auto refresh every 30s"
                >
                  <span className={`mr-2 h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {autoRefresh ? 'Auto: On' : 'Auto: Off'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm text-sm font-medium rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title={`Export ${activeTab === 'audit' ? 'audit logs' : 'visitor data'} as CSV`}
                >
                  <FaFileExport className="mr-2" />
                  Export
                </button>

                {activeTab === 'audit' && currentUser?.role === 'rootadmin' && (
                  <button
                    onClick={() => setShowClearModal(true)}
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 shadow-sm text-sm font-medium rounded-lg bg-white dark:bg-gray-700 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-700 transition-colors ${isClearing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Clear all audit logs"
                    disabled={isClearing}
                  >
                    <FaTrash className={`mr-2 ${isClearing ? 'animate-pulse' : ''}`} />
                    {isClearing ? 'Clearing...' : 'Clear All'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        {/* Tab Switcher */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 mb-8 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto transition-colors duration-200">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <FaHistory className={activeTab === 'audit' ? 'text-blue-100' : 'text-gray-400'} />
            <span>Audit Logs</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ml-1 ${activeTab === 'audit' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {totalLogs}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'visitors'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <FaGlobe className={activeTab === 'visitors' ? 'text-purple-100' : 'text-gray-400'} />
            <span>Public Visitors</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ml-1 ${activeTab === 'visitors' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {visitorStats.todayCount}
            </span>
          </button>
        </div>

        {/* Audit Logs Tab Content */}
        {activeTab === 'audit' && (
          <>
            {/* Stats Toggle and Search/Filters */}
            <div className="mb-4">
              <button onClick={() => setShowAuditStats(!showAuditStats)} className={`px-3 py-2 rounded-md text-sm ${showAuditStats ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                Toggle Stats
              </button>
            </div>
            {showAuditStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800 flex items-center gap-4">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-full shadow-sm text-green-500 dark:text-green-400">
                    <FaCheckCircle className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider">Successful Logins</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">{logs.filter(l => l.action === 'login').length}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-red-100 dark:border-red-800 flex items-center gap-4">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-full shadow-sm text-red-500 dark:text-red-400">
                    <FaExclamationTriangle className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider">Suspicious Events</p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100">{logs.filter(l => l.isSuspicious).length}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800 flex items-center gap-4">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-full shadow-sm text-purple-500 dark:text-purple-400">
                    <FaShieldAlt className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider">Admin Actions</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{logs.filter(l => l.role === 'admin' || l.role === 'rootadmin').length}</p>
                  </div>
                </div>
              </div>
            )}
            {/* Search and Filters */}
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8 animate-fade-in-delay transition-colors duration-200">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isSearching ? (
                      <FaSync className="animate-spin text-blue-500" />
                    ) : (
                      <FaSearch className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Search by username, email, device, IP, location, or details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-600 rounded-xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FaHistory className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg focus:outline-none transition-all ${hasActiveFilters
                    ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm'
                    }`}
                >
                  <FaFilter className={`mr-2 ${hasActiveFilters ? 'text-blue-600' : 'text-gray-400'}`} />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                  {hasActiveFilters && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-blue-600 text-white">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>
                <div className="flex items-center space-x-4">
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium hover:underline transition-all"
                    >
                      Clear All Filters
                    </button>
                  )}
                  <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {logs.length} logs found
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {/* Action Filter */}
                  <div>
                    <label htmlFor="action-filter" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Action
                    </label>
                    <select
                      id="action-filter"
                      value={filters.action}
                      onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                      className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="">All Actions</option>
                      <option value="login">Login</option>
                      <option value="logout">Logout</option>
                      <option value="suspicious_login">Suspicious Login</option>
                      <option value="forced_logout">Forced Logout</option>
                      <option value="session_expired">Session Expired</option>
                      <option value="session_cleaned">Session Cleaned</option>
                    </select>
                  </div>

                  {/* Role Filter */}
                  <div>
                    <label htmlFor="role-filter" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      id="role-filter"
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="all">All Roles</option>
                      <option value="user">Users</option>
                      <option value="admin">Admins</option>
                      <option value="rootadmin">Root Admins</option>
                    </select>
                  </div>

                  {/* Suspicious Activity Filter */}
                  <div>
                    <label htmlFor="suspicious-filter" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Suspicious Activity
                    </label>
                    <select
                      id="suspicious-filter"
                      value={filters.isSuspicious}
                      onChange={(e) => setFilters({ ...filters, isSuspicious: e.target.value })}
                      className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="">All</option>
                      <option value="true">Suspicious Only</option>
                      <option value="false">Normal Only</option>
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label htmlFor="date-filter" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Date Range
                    </label>
                    <select
                      id="date-filter"
                      value={filterDateRange}
                      onChange={(e) => setFilterDateRange(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="all">All Time</option>
                      <option value="1h">Last Hour</option>
                      <option value="24h">Last 24 Hours</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                    </select>
                  </div>

                  {/* User ID Filter */}
                  <div>
                    <label htmlFor="user-filter" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      User ID
                    </label>
                    <input
                      type="text"
                      id="user-filter"
                      value={filters.userId}
                      onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                      className="block w-full pl-3 pr-3 py-2.5 text-sm border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                      placeholder="Enter user ID"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Audit Logs Table */}
            {logs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center animate-fade-in-delay-2 transition-colors duration-200">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                  <FaHistory className="text-3xl text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No audit logs found</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  We couldn't find any log data matching your current filters. Try adjusting your search criteria or date range.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-8 animate-fade-in-delay-2 transition-colors duration-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                    <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Browser & Device
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          IP & Location
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                      {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <FaHistory className="text-gray-400 dark:text-gray-500" />
                              {formatDate(log.timestamp)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-700 dark:text-blue-300 shadow-sm">
                                  <span className="text-sm font-bold">
                                    {log.userId?.username?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {log.userId?.username || 'Unknown User'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {log.userId?.email || 'N/A'}
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${getRoleBadgeColor(log.role)}`}>
                                  {log.role}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${log.action === 'login' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                              log.action === 'logout' ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600' :
                                log.action === 'suspicious_login' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                                  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                              }`}>
                              {log.action === 'login' && <FaCheckCircle />}
                              {log.action === 'suspicious_login' && <FaExclamationTriangle />}
                              {log.action.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-start gap-2">
                              <FaDesktop className="mt-1 text-gray-400 dark:text-gray-500" />
                              <div className="font-medium break-words max-w-[150px] text-gray-700 dark:text-gray-300">
                                {log.device || 'Unknown Device'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-mono text-xs bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 w-fit text-gray-700 dark:text-gray-300">
                                <FaGlobe className="text-gray-400 dark:text-gray-500" />
                                {log.ip}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pl-1">
                                <FaMapMarkerAlt className="text-gray-400 dark:text-gray-500" />
                                {log.location || 'Unknown'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                            <div className="max-w-xs space-y-1">
                              <div className="truncate text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <FaFileAlt className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                {log.additionalInfo || 'N/A'}
                              </div>
                              {log.suspiciousReason && (
                                <div className="text-red-600 dark:text-red-400 text-xs mt-1 bg-red-50 dark:bg-red-900/20 p-1.5 rounded border border-red-100 dark:border-red-800 flex items-start gap-1">
                                  <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                                  <span>{log.suspiciousReason}</span>
                                </div>
                              )}
                              {log.performedBy && (
                                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 bg-gray-50 dark:bg-gray-700 p-1 rounded inline-block">
                                  By: {log.performedBy.username}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.isSuspicious ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 shadow-sm animate-pulse">
                                <FaShieldAlt />
                                Suspicious
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 shadow-sm">
                                <FaCheckCircle />
                                Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalLogs > 50 && (
              <div className="bg-white dark:bg-gray-800 px-6 py-4 flex items-center justify-between mt-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 animate-fade-in-delay-3 transition-colors duration-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-blue-200 dark:border-blue-800 text-sm font-medium rounded-lg text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={logs.length < 50}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-blue-200 dark:border-blue-800 text-sm font-medium rounded-lg text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-md border border-gray-200 dark:border-gray-600">
                      Showing page <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span> of{' '}
                      <span className="font-bold text-gray-900 dark:text-white">{Math.ceil(totalLogs / 50)}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900 transition-colors"
                      >
                        <span className="sr-only">Previous</span>
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={logs.length < 50}
                        className="relative inline-flex items-center px-4 py-2 rounded-r-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900 transition-colors"
                      >
                        <span className="sr-only">Next</span>
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {/* Security Summary */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-delay-3 h-full">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform duration-300 h-full">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-3 text-green-600 dark:text-green-400">
                  <FaCheckCircle className="text-3xl" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Normal Activities</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{logs.filter(log => !log.isSuspicious).length}</p>
                <div className="w-16 h-1 bg-green-500 rounded-full mt-3"></div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform duration-300 h-full">
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-3 text-red-600 dark:text-red-400 animate-pulse">
                  <FaExclamationTriangle className="text-3xl" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Suspicious Activities</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{logs.filter(log => log.isSuspicious).length}</p>
                <div className="w-16 h-1 bg-red-500 rounded-full mt-3"></div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform duration-300 h-full">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-3 text-blue-600 dark:text-blue-400">
                  <FaShieldAlt className="text-3xl" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Total Log Events</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{totalLogs}</p>
                <div className="w-16 h-1 bg-blue-500 rounded-full mt-3"></div>
              </div>
            </div>
          </>
        )}

        {/* Visitors Tab Content */}
        {activeTab === 'visitors' && (
          <>
            {/* Visitor Statistics Cards + Quick Range */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 group hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                    <FaGlobe className="text-2xl" />
                  </div>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">Today</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Daily Visitors</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{visitorStats.todayCount}</h3>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 group hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <FaChartLine className="text-2xl" />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">All Time</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Visitors</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{visitorStats.totalVisitors}</h3>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 group hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                    <FaDesktop className="text-2xl" />
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Device Types</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{visitorStats.deviceStats.length}</h3>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 group hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                    <FaMapMarkerAlt className="text-2xl" />
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Locations</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{visitorStats.locationStats.length}</h3>
              </div>
            </div>

            {/* Visitor Filters (toggle like audit section) - placed below cards */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8 animate-fade-in-delay transition-colors duration-200">
              <div className="flex items-center justify-between mb-0">
                <button onClick={() => setShowVisitorStatsToggle(!showVisitorStatsToggle)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${showVisitorStatsToggle ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  {showVisitorStatsToggle ? 'Hide Stats' : 'Show Advanced Stats'}
                </button>
                <button
                  onClick={() => setShowVisitorFilters(!showVisitorFilters)}
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg focus:outline-none transition-all ${getVisitorActiveFiltersCount() > 0
                    ? 'border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm'
                    }`}
                >
                  <FaFilter className={`mr-2 ${getVisitorActiveFiltersCount() > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  {showVisitorFilters ? 'Hide Filters' : 'Show Filters'}
                  {getVisitorActiveFiltersCount() > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-purple-600 text-white">
                      {getVisitorActiveFiltersCount()}
                    </span>
                  )}
                </button>
              </div>

              {showVisitorStatsToggle && (
                <div className="mt-8 space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
                      <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-widest">Today</p>
                      <p className="text-4xl font-extrabold text-purple-900 dark:text-purple-100 mt-2">{visitorStats.todayCount}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-widest">Visitors</p>
                      <p className="text-4xl font-extrabold text-blue-900 dark:text-blue-100 mt-2">{visitorStats.totalVisitors}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-widest">Unique Devices</p>
                      <p className="text-4xl font-extrabold text-green-900 dark:text-green-100 mt-2">{visitorStats.deviceStats?.length || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-100 dark:border-gray-600 shadow-sm">
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">7-Day Visitors</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{(visitorInsights.last7Total || 0).toLocaleString('en-IN')}</p>
                      <div className="h-1 w-full bg-indigo-100 dark:bg-indigo-900 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-100 dark:border-gray-600 shadow-sm">
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Avg Daily Traffic</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{Math.round(visitorInsights.avgDaily || 0).toLocaleString('en-IN')}</p>
                      <div className="h-1 w-full bg-teal-100 dark:bg-teal-900 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-100 dark:border-gray-600 shadow-sm">
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Traffic Trend</p>
                      <div className="flex items-center gap-2 mt-1">
                        {visitorInsights.trendPercentage !== null ? (
                          <span className={`text-2xl font-bold ${visitorInsights.trendPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {visitorInsights.trendPercentage >= 0 ? '▲' : '▼'} {Math.abs(visitorInsights.trendPercentage).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-2xl font-bold text-gray-400">N/A</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">vs previous 7 days</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 p-6">
                      <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <FaDesktop className="text-gray-400 dark:text-gray-500" /> Top Devices
                      </h4>
                      <div className="space-y-4">
                        {visitorInsights.topDevices.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No data available</p>
                        ) : visitorInsights.topDevices.map((device) => {
                          const topValue = visitorInsights.topDevices[0]?.count || 1;
                          const percentage = topValue ? Math.round((device.count / topValue) * 100) : 0;
                          return (
                            <div key={device.device} className="group">
                              <div className="flex items-center justify-between text-sm mb-1.5">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{device.device}</span>
                                <span className="text-gray-900 dark:text-white font-bold bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-md">{device.count}</span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-500 group-hover:bg-purple-600" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 p-6">
                      <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400 dark:text-gray-500" /> Top Locations
                      </h4>
                      <div className="space-y-4">
                        {visitorInsights.topLocations.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No data available</p>
                        ) : visitorInsights.topLocations.map((location) => {
                          const topValue = visitorInsights.topLocations[0]?.count || 1;
                          const percentage = topValue ? Math.round((location.count / topValue) * 100) : 0;
                          return (
                            <div key={location.location} className="group">
                              <div className="flex items-center justify-between text-sm mb-1.5">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{location.location}</span>
                                <span className="text-gray-900 dark:text-white font-bold bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-md">{location.count}</span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-pink-500 h-2.5 rounded-full transition-all duration-500 group-hover:bg-pink-600" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {getVisitorActiveFiltersCount() > 0 && (
                <div className="flex justify-end mt-4 animate-fade-in">
                  <button
                    onClick={() => setVisitorFilters({ dateRange: 'today', device: 'all', location: 'all', search: '', analytics: 'any', marketing: 'any', functional: 'any' })}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-1 hover:underline"
                  >
                    <FaSync className="text-xs" /> Clear All Filters
                  </button>
                </div>
              )}

              {showVisitorFilters && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 animate-fade-in">
                  {/* Quick Date Range */}
                  <div className="col-span-1 lg:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'today', label: 'Today' },
                        { key: 'yesterday', label: 'Yesterday' },
                        { key: '7days', label: 'Last 7' },
                        { key: '30days', label: 'Last 30' },
                        { key: 'all', label: 'All' }
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => { setVisitorsPage(1); setVisitorFilters(v => ({ ...v, dateRange: opt.key })); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${visitorFilters.dateRange === opt.key ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Consent Filters */}
                  {[
                    { key: 'analytics', label: 'Analytics' },
                    { key: 'marketing', label: 'Marketing' },
                    { key: 'functional', label: 'Functional' }
                  ].map((c) => (
                    <div key={c.key}>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{c.label}</label>
                      <select
                        value={visitorFilters[c.key]}
                        onChange={(e) => { setVisitorsPage(1); setVisitorFilters(v => ({ ...v, [c.key]: e.target.value })); }}
                        className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                      >
                        <option value="any">Any</option>
                        <option value="true">Allowed</option>
                        <option value="false">Disallowed</option>
                      </select>
                    </div>
                  ))}

                  {/* Device */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Device</label>
                    <select
                      value={visitorFilters.device}
                      onChange={(e) => { setVisitorsPage(1); setVisitorFilters(v => ({ ...v, device: e.target.value })); }}
                      className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="all">All Devices</option>
                      {(visitorStats.deviceStats || []).map(d => (
                        <option key={d.device} value={d.device}>{d.device} ({d.count})</option>
                      ))}
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Location</label>
                    <select
                      value={visitorFilters.location}
                      onChange={(e) => { setVisitorsPage(1); setVisitorFilters(v => ({ ...v, location: e.target.value })); }}
                      className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    >
                      <option value="all">All Locations</option>
                      {(visitorStats.locationStats || []).map(l => (
                        <option key={l.location} value={l.location}>{l.location} ({l.count})</option>
                      ))}
                    </select>
                  </div>

                  {/* Search */}
                  <div className="col-span-1 lg:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Search</label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={visitorFilters.search}
                        onChange={(e) => { setVisitorsPage(1); setVisitorFilters(v => ({ ...v, search: e.target.value })); }}
                        className="block w-full pl-10 pr-3 py-2.5 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                        placeholder="Search IP, device, location..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Visitors Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-delay-2 transition-colors duration-200">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                  <FaGlobe />
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Visitor Activity Log</h2>
              </div>

              {visitorsLoading ? (
                <div className="px-6 py-16 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading visitors data...</p>
                </div>
              ) : visitors.length === 0 ? (
                <div className="px-6 py-16 text-center bg-gray-50/50 dark:bg-gray-700/50">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                    <FaGlobe className="text-3xl text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No visitors found</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    We couldn't find any visitor data matching your current filters. Try adjusting your search criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                    <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Browser
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Operating System
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Device Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Cookie Consent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                      {visitors.map((visitor) => (
                        <tr key={visitor._id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/20 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <FaHistory className="text-gray-400 dark:text-gray-500" />
                              {new Date(visitor.timestamp).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800 dark:text-white">
                                {visitor.browser || 'Unknown'}
                              </span>
                              {visitor.browserVersion && (
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 font-mono">
                                  v{visitor.browserVersion}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              {visitor.os?.includes('Windows') ? <span className="text-blue-500 dark:text-blue-400 font-bold">Win</span> :
                                visitor.os?.includes('Mac') ? <span className="text-gray-800 dark:text-gray-200 font-bold">Mac</span> :
                                  visitor.os?.includes('Android') ? <span className="text-green-500 dark:text-green-400 font-bold">Android</span> :
                                    visitor.os?.includes('iOS') ? <span className="text-gray-800 dark:text-gray-200 font-bold">iOS</span> : visitor.os || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${visitor.deviceType === 'Mobile' ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                              visitor.deviceType === 'Tablet' ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                                'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600'
                              }`}>
                              {visitor.deviceType === 'Mobile' ? <FaGlobe className="text-xs" /> :
                                visitor.deviceType === 'Tablet' ? <FaGlobe className="text-xs" /> : <FaDesktop className="text-xs" />}
                              {visitor.deviceType || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/50">
                            {visitor.ip}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              <FaMapMarkerAlt className="text-red-400" />
                              {visitor.location || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {(visitor.source?.includes('render') || visitor.source?.includes('onrender')) ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Render
                              </span>
                            ) : (visitor.source?.includes('vercel')) ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-black text-white dark:bg-white dark:text-black border border-gray-800">
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 1155 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M577.344 0L1154.69 1000H0L577.344 0Z" /></svg>
                                Vercel
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                {visitor.source || 'N/A'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5 flex-wrap">
                              {visitor.cookiePreferences?.analytics && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                  ANA
                                </span>
                              )}
                              {visitor.cookiePreferences?.marketing && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                                  MKT
                                </span>
                              )}
                              {visitor.cookiePreferences?.functional && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                  FUN
                                </span>
                              )}
                              {!visitor.cookiePreferences?.analytics &&
                                !visitor.cookiePreferences?.marketing &&
                                !visitor.cookiePreferences?.functional && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                                    Required
                                  </span>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination for Visitors */}
            {allVisitors.length > 10 && visitorsTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-delay-3 transition-colors duration-200">
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                  Page <span className="font-bold text-gray-800 dark:text-white">{visitorsPage}</span> of <span className="font-bold text-gray-800 dark:text-white">{visitorsTotalPages}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setVisitorsPage(Math.max(1, visitorsPage - 1));
                      toast.info(`Navigated to page ${Math.max(1, visitorsPage - 1)}`);
                    }}
                    disabled={visitorsPage === 1}
                    className="px-5 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      setVisitorsPage(Math.min(visitorsTotalPages, visitorsPage + 1));
                      toast.info(`Navigated to page ${Math.min(visitorsTotalPages, visitorsPage + 1)}`);
                    }}
                    disabled={visitorsPage === visitorsTotalPages}
                    className="px-5 py-2.5 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md shadow-purple-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Clear Logs Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <FaTrash className="text-xl text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Clear All Audit Logs
              </h3>
              <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to permanently delete all session audit logs? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setIsClearing(true);
                      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/session-management/admin/audit-logs`, {
                        method: 'DELETE',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const data = await res.json();
                      if (!res.ok || !data.success) {
                        throw new Error(data.message || `Failed with status ${res.status}`);
                      }
                      toast.success(data.message || 'Audit logs cleared');
                      setLogs([]);
                      setTotalLogs(0);
                      setLastUpdated(new Date());
                      setShowClearModal(false);
                    } catch (err) {
                      console.error('Failed to clear audit logs', err);
                      toast.error(err.message || 'Failed to clear audit logs');
                    } finally {
                      setIsClearing(false);
                    }
                  }}
                  disabled={isClearing}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  {isClearing ? <FaSync className="animate-spin mr-2" /> : null}
                  {isClearing ? 'Clearing...' : 'Yes, Delete All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <FaFileExport className="text-xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Export {activeTab === 'audit' ? 'Logs' : 'Visitors'}
                  </h3>
                </div>
                <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <FaTimes />
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <input
                    type="radio"
                    name="exportOption"
                    value="all"
                    checked={exportOption === 'all'}
                    onChange={() => setExportOption('all')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">Export All {activeTab === 'audit' ? 'Logs' : 'Visitors'}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Download complete history of all {activeTab === 'audit' ? 'sessions' : 'visits'}</span>
                  </div>
                </label>

                <label className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="exportOption"
                      value="range"
                      checked={exportOption === 'range'}
                      onChange={() => setExportOption('range')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 w-full">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">Export Date Range</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mb-3">Download logs for a specific period</span>

                    {exportOption === 'range' && (
                      <div className="grid grid-cols-2 gap-3 mt-2 animate-fade-in">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={exportStartDate}
                            onChange={(e) => setExportStartDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                          <input
                            type="date"
                            value={exportEndDate}
                            onChange={(e) => setExportEndDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setIsExporting(true);
                      // Construct params
                      const params = new URLSearchParams({
                        limit: 100000,
                      });

                      if (exportOption === 'range') {
                        if (!exportStartDate || !exportEndDate) {
                          toast.error('Please select both start and end dates');
                          setIsExporting(false);
                          return;
                        }
                        params.append('startDate', exportStartDate);
                        params.append('endDate', exportEndDate);
                      } else {
                        // Explicitly set dateRange to 'all' to override backend defaults (e.g. visitors defaults to 'today')
                        params.append('dateRange', 'all');
                      }

                      const endpoint = activeTab === 'audit'
                        ? `${import.meta.env.VITE_API_BASE_URL || ''}/api/session-management/admin/audit-logs`
                        : `${import.meta.env.VITE_API_BASE_URL || ''}/api/visitors/all`;

                      const res = await fetch(`${endpoint}?${params}`, {
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                      });

                      if (!res.ok) throw new Error(`Failed to fetch ${activeTab}`);

                      const data = await res.json();
                      if (!data.success) throw new Error(data.message);

                      let exportData = [];
                      let filenamePrefix = '';
                      let csvContent = '';

                      if (activeTab === 'audit') {
                        exportData = data.logs || [];
                        filenamePrefix = 'session-logs';
                        // Generate CSV for Audit Logs
                        const rows = exportData.map(l => ({
                          timestamp: new Date(l.timestamp).toISOString(),
                          user: l.userId?.username || '',
                          email: l.userId?.email || '',
                          role: l.role || '',
                          action: l.action,
                          ip: l.ip,
                          location: l.location || '',
                          device: l.device || '',
                          suspicious: l.isSuspicious ? 'yes' : 'no'
                        }));
                        const header = ['timestamp', 'user', 'email', 'role', 'action', 'ip', 'location', 'device', 'suspicious'];
                        csvContent = [header.join(','), ...rows.map(r => header.map(h => (String(r[h] || '').replaceAll('"', '""'))).map(s => `"${s}"`).join(','))].join('\n');
                      } else {
                        exportData = data.visitors || [];
                        filenamePrefix = 'visitor-logs';
                        // Generate CSV for Visitor Logs
                        const rows = exportData.map(v => ({
                          timestamp: new Date(v.timestamp).toISOString(),
                          browser: v.browser || '',
                          version: v.browserVersion || '',
                          os: v.os || '',
                          deviceType: v.deviceType || '',
                          ip: v.ip,
                          location: v.location || '',
                          source: v.source || '',
                          analytics: v.cookiePreferences?.analytics ? 'yes' : 'no'
                        }));
                        const header = ['timestamp', 'browser', 'version', 'os', 'deviceType', 'ip', 'location', 'source', 'analytics_consent'];
                        csvContent = [header.join(','), ...rows.map(r => header.map(h => (String(r[h] || '').replaceAll('"', '""'))).map(s => `"${s}"`).join(','))].join('\n');
                      }

                      if (exportData.length === 0) {
                        toast.info('No data found to export');
                        setIsExporting(false);
                        return;
                      }

                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `${filenamePrefix}-${exportOption}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                      URL.revokeObjectURL(url);

                      setShowExportModal(false);
                      toast.success(`Exported ${exportData.length} records successfully`);
                    } catch (err) {
                      console.error('Export failed', err);
                      toast.error('Export failed: ' + err.message);
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  disabled={isExporting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  {isExporting ? <FaSync className="animate-spin mr-2" /> : <FaFileExport className="mr-2" />}
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SessionAuditLogs;
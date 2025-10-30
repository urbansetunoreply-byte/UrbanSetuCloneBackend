import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { usePageTitle } from '../hooks/usePageTitle';
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
  
  // Visitors state
  const [visitors, setVisitors] = useState([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [visitorsPage, setVisitorsPage] = useState(1);
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
    search: ''
  });

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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/visitors/stats?days=30`, {
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
  const fetchVisitors = async () => {
    setVisitorsLoading(true);
    try {
      const params = new URLSearchParams({
        page: visitorsPage,
        limit: 50,
        dateRange: visitorFilters.dateRange,
        device: visitorFilters.device,
        location: visitorFilters.location,
        search: visitorFilters.search
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
        setVisitors(data.visitors);
        setTotalVisitors(data.total);
        setLastUpdated(new Date());
      } else {
        toast.error(data.message || 'Failed to fetch visitors');
      }
    } catch (error) {
      console.error('Error fetching visitors:', error);
      toast.error('Failed to fetch visitors');
    } finally {
      setVisitorsLoading(false);
    }
  };

  // Effect to fetch visitors when tab changes
  useEffect(() => {
    if (activeTab === 'visitors') {
      fetchVisitorStats();
      fetchVisitors();
    }
  }, [activeTab, visitorsPage, visitorFilters]);

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
      fetchVisitors();
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
    return new Date(dateString).toLocaleString();
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'logout':
        return 'bg-blue-100 text-blue-800';
      case 'suspicious_login':
        return 'bg-red-100 text-red-800';
      case 'forced_logout':
        return 'bg-orange-100 text-orange-800';
      case 'session_expired':
        return 'bg-gray-100 text-gray-800';
      case 'session_cleaned':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Session Monitoring</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Monitor session activities and track public visitors
              </p>
            </div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => { 
                    if (activeTab === 'audit') {
                      setLoading(true);
                    } else {
                      setVisitorsLoading(true);
                    }
                    refreshCurrentTab(); 
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title={activeTab === 'audit' ? 'Refresh logs' : 'Refresh visitors'}
                >
                  <svg className="h-4 w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 10-3.879 6.804" />
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={toggleAutoRefresh}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border ${autoRefresh ? 'border-green-300 text-green-700' : 'border-gray-300 text-gray-700'} shadow-sm text-sm leading-4 font-medium rounded-md bg-white hover:bg-gray-50`}
                  title="Auto refresh every 30s"
                >
                  <svg className={`h-4 w-4 sm:mr-2 ${autoRefresh ? 'text-green-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">{autoRefresh ? 'Auto: On' : 'Auto: Off'}</span>
                </button>
                {currentUser?.role === 'rootadmin' && (
                  <button
                    onClick={async () => {
                      const confirmed = window.confirm('This will permanently delete all session audit logs. Continue?');
                      if (!confirmed) return;
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
                      } catch (err) {
                        console.error('Failed to clear audit logs', err);
                        toast.error(err.message || 'Failed to clear audit logs');
                      } finally {
                        setIsClearing(false);
                      }
                    }}
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-red-300 text-red-700 shadow-sm text-sm leading-4 font-medium rounded-md bg-white hover:bg-red-50 ${isClearing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Clear all audit logs"
                    disabled={isClearing}
                  >
                    <svg className="h-4 w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0h10" />
                    </svg>
                    <span className="hidden sm:inline">{isClearing ? 'Clearing...' : 'Clear All Logs'}</span>
                  </button>
                )}
              </div>
              <div className="text-center sm:text-right">
                <p className="text-sm text-gray-500">Total Logs</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalLogs}</p>
                {lastUpdated && (
                  <p className="text-xs text-gray-400 mt-1">Updated {lastUpdated.toLocaleTimeString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Session Audit Logs</span>
                {activeTab === 'audit' && (
                  <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                    {totalLogs}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('visitors')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'visitors'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Public Visitors</span>
                {activeTab === 'visitors' && (
                  <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                    {visitorStats.todayCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Audit Logs Tab Content */}
        {activeTab === 'audit' && (
          <>
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isSearching ? (
                  <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              <input
                type="text"
                placeholder="Search by username, email, device, IP, location, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                hasActiveFilters 
                  ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>
            <div className="flex items-center space-x-4">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All Filters
                </button>
              )}
              <div className="text-sm text-gray-500">
                Page {currentPage} • {logs.length} logs shown
                {totalLogs > 0 && ` of ${totalLogs} total`}
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
              {/* Action Filter */}
              <div>
                <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700">
                  Action
                </label>
                <select
                  id="action-filter"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role-filter"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Users</option>
                  <option value="admin">Admins</option>
                  <option value="rootadmin">Root Admins</option>
                </select>
              </div>

              {/* Suspicious Activity Filter */}
              <div>
                <label htmlFor="suspicious-filter" className="block text-sm font-medium text-gray-700">
                  Suspicious Activity
                </label>
                <select
                  id="suspicious-filter"
                  value={filters.isSuspicious}
                  onChange={(e) => setFilters({ ...filters, isSuspicious: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All</option>
                  <option value="true">Suspicious Only</option>
                  <option value="false">Normal Only</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">
                  Date Range
                </label>
                <select
                  id="date-filter"
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <input
                  type="text"
                  id="user-filter"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter user ID"
                />
              </div>
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Audit Logs</h2>
          </div>

          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
              <p className="mt-1 text-sm text-gray-500">No logs found for the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device & IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {log.userId?.username?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {log.userId?.username || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.userId?.email || 'N/A'}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(log.role)}`}>
                              {log.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                          {log.action.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{log.device}</div>
                          <div className="text-gray-500">{log.ip}</div>
                          <div className="text-gray-500">{log.location || 'Unknown'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          <div className="truncate">{log.additionalInfo || 'N/A'}</div>
                          {log.suspiciousReason && (
                            <div className="text-red-600 text-xs mt-1">
                              Reason: {log.suspiciousReason}
                            </div>
                          )}
                          {log.performedBy && (
                            <div className="text-gray-500 text-xs mt-1">
                              Performed by: {log.performedBy.username}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.isSuspicious ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                            Suspicious
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalLogs > 50 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-sm">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={logs.length < 50}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{Math.ceil(totalLogs / 50)}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={logs.length < 50}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Security Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Normal Activities</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {logs.filter(log => !log.isSuspicious).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Suspicious Activities</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {logs.filter(log => log.isSuspicious).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Logs</p>
                <p className="text-2xl font-semibold text-gray-900">{totalLogs}</p>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Visitors Tab Content */}
        {activeTab === 'visitors' && (
          <>
            {/* Visitor Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Today's Visitors</p>
                    <p className="text-2xl font-semibold text-gray-900">{visitorStats.todayCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Visitors</p>
                    <p className="text-2xl font-semibold text-gray-900">{visitorStats.totalVisitors}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Device Types</p>
                    <p className="text-2xl font-semibold text-gray-900">{visitorStats.deviceStats.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Locations</p>
                    <p className="text-2xl font-semibold text-gray-900">{visitorStats.locationStats.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visitors Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Visitor Activity</h2>
              </div>

              {visitorsLoading ? (
                <div className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading visitors...</p>
                </div>
              ) : visitors.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No visitors found</h3>
                  <p className="mt-1 text-sm text-gray-500">No visitor data available for the selected period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Device
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cookie Consent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visitors.map((visitor) => (
                        <tr key={visitor._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(visitor.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {visitor.device}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {visitor.ip}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {visitor.location || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-1">
                              {visitor.cookiePreferences?.analytics && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Analytics
                                </span>
                              )}
                              {visitor.cookiePreferences?.marketing && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Marketing
                                </span>
                              )}
                              {visitor.cookiePreferences?.functional && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  Functional
                                </span>
                              )}
                              {!visitor.cookiePreferences?.analytics && 
                               !visitor.cookiePreferences?.marketing && 
                               !visitor.cookiePreferences?.functional && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  Necessary Only
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
            {totalVisitors > 50 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-sm">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{visitorsPage}</span> of{' '}
                      <span className="font-medium">{Math.ceil(totalVisitors / 50)}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setVisitorsPage(Math.max(1, visitorsPage - 1))}
                        disabled={visitorsPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setVisitorsPage(visitorsPage + 1)}
                        disabled={visitors.length < 50}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SessionAuditLogs;
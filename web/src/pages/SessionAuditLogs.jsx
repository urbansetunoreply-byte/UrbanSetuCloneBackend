import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { usePageTitle } from '../hooks/usePageTitle';
const SessionAuditLogs = () => {
  // Set page title
  usePageTitle("Session Audit Logs - Security History");
  
  const { currentUser } = useSelector((state) => state.user);
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

  useEffect(() => {
    fetchLogs();
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [currentPage, filters]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 50
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.isSuspicious !== '') params.append('isSuspicious', filters.isSuspicious);
      if (filters.userId) params.append('userId', filters.userId);

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

  const toggleAutoRefresh = () => {
    setAutoRefresh((prev) => {
      const next = !prev;
      if (next) {
        autoRefreshRef.current = setInterval(() => { fetchLogs(); }, 30000);
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Session Audit Logs</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Monitor all session-related activities and security events
              </p>
            </div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => { setLoading(true); fetchLogs(); }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Refresh logs"
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ action: '', isSuspicious: '', userId: '' })}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
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
      </div>
    </div>
  );
};

export default SessionAuditLogs;
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const SessionManagement = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingSession, setRevokingSession] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef(null);
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [forceLogoutReason, setForceLogoutReason] = useState('');
  const [showForceLogoutModal, setShowForceLogoutModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [filterRole, currentPage]);

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        role: filterRole
      });

      const controller = new AbortController();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/session-management/admin/all-sessions?${params}`, {
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
        setSessions(data.sessions);
        setTotalSessions(data.total);
        setLastUpdated(new Date());
      } else {
        toast.error(data.message || 'Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh((prev) => {
      const next = !prev;
      if (next) {
        autoRefreshRef.current = setInterval(() => { fetchSessions(); }, 30000);
      } else if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
      return next;
    });
  };

  const forceLogoutSession = async (sessionId, userId, reason) => {
    setRevokingSession(sessionId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/session-management/admin/force-logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          sessionId, 
          reason: reason || 'Admin action' 
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Session force logged out successfully');
        // If the admin is forcing logout of their own current session, ensure local logout
        const currentSessionId = document.cookie.split('; ').find(r => r.startsWith('session_id='))?.split('=')[1];
        if (currentSessionId && currentSessionId === sessionId) {
          try { localStorage.removeItem('accessToken'); } catch (_) {}
          document.cookie = 'access_token=; Max-Age=0; path=/; SameSite=None; Secure';
          document.cookie = 'refresh_token=; Max-Age=0; path=/; SameSite=None; Secure';
          document.cookie = 'session_id=; Max-Age=0; path=/; SameSite=None; Secure';
          window.location.href = '/sign-in?error=forced_logout';
          return;
        }
        fetchSessions(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to force logout session');
      }
    } catch (error) {
      console.error('Error force logging out session:', error);
      toast.error('Failed to force logout session');
    } finally {
      setRevokingSession(null);
      setShowForceLogoutModal(false);
      setSelectedSession(null);
      setForceLogoutReason('');
    }
  };

  const forceLogoutAllUserSessions = async (userId, reason) => {
    if (!window.confirm('Are you sure you want to log out all sessions for this user?')) {
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/session-management/admin/force-logout-all`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          reason: reason || 'Admin action' 
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchSessions(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to force logout all sessions');
      }
    } catch (error) {
      console.error('Error force logging out all sessions:', error);
      toast.error('Failed to force logout all sessions');
    }
  };

  const openForceLogoutModal = (session) => {
    setSelectedSession(session);
    setShowForceLogoutModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getDeviceIcon = (device) => {
    if (device.includes('Mobile') || device.includes('Android')) {
      return '📱';
    } else if (device.includes('iPhone') || device.includes('iPad')) {
      return '📱';
    } else if (device.includes('Windows')) {
      return '💻';
    } else if (device.includes('Mac')) {
      return '💻';
    } else if (device.includes('Linux')) {
      return '🖥️';
    } else {
      return '💻';
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
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage user sessions across the platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => { setLoading(true); fetchSessions(); }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Refresh sessions"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 10-3.879 6.804" />
                </svg>
                Refresh
              </button>
              <button
                onClick={toggleAutoRefresh}
                className={`inline-flex items-center px-3 py-2 border ${autoRefresh ? 'border-green-300 text-green-700' : 'border-gray-300 text-gray-700'} shadow-sm text-sm leading-4 font-medium rounded-md bg-white hover:bg-gray-50`}
                title="Auto refresh every 30s"
              >
                <svg className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {autoRefresh ? 'Auto: On' : 'Auto: Off'}
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Active Sessions</p>
                <p className="text-2xl font-bold text-blue-600">{totalSessions}</p>
                {lastUpdated && (
                  <p className="text-xs text-gray-400 mt-1">Updated {lastUpdated.toLocaleTimeString()}</p>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
                Filter by Role
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
            <div className="flex-1"></div>
            <div className="text-sm text-gray-500">
              Page {currentPage} • {sessions.length} sessions shown
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Active Sessions</h2>
          </div>

          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active sessions</h3>
              <p className="mt-1 text-sm text-gray-500">No sessions found for the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
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
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.sessionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {session.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {session.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {session.email}
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(session.role)}`}>
                              {session.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getDeviceIcon(session.device)}</span>
                          <span className="text-sm text-gray-900">{session.device}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.ip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(session.lastActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openForceLogoutModal(session)}
                            disabled={revokingSession === session.sessionId}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {revokingSession === session.sessionId ? 'Logging out...' : 'Force Logout'}
                          </button>
                          <button
                            onClick={() => forceLogoutAllUserSessions(session.userId, 'Admin action')}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Logout All
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalSessions > 20 && (
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
                disabled={sessions.length < 20}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{Math.ceil(totalSessions / 20)}</span>
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
                    disabled={sessions.length < 20}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Force Logout Modal */}
      {showForceLogoutModal && selectedSession && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Force Logout Session</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  User: <strong>{selectedSession.username}</strong> ({selectedSession.email})
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Device: {selectedSession.device}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  IP: {selectedSession.ip}
                </p>
              </div>
              <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  id="reason"
                  value={forceLogoutReason}
                  onChange={(e) => setForceLogoutReason(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter reason for force logout"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowForceLogoutModal(false);
                    setSelectedSession(null);
                    setForceLogoutReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => forceLogoutSession(selectedSession.sessionId, selectedSession.userId, forceLogoutReason)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Force Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const DeviceManagement = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingSession, setRevokingSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/session-management/my-sessions`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setSessions(data.sessions);
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

  const revokeSession = async (sessionId) => {
    setRevokingSession(sessionId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/session-management/revoke-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Session revoked successfully');
        fetchSessions(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to revoke session');
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      toast.error('Failed to revoke session');
    } finally {
      setRevokingSession(null);
    }
  };

  const revokeAllSessions = async () => {
    if (!window.confirm('Are you sure you want to log out all devices? This will log you out of all sessions except the current one.')) {
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/session-management/revoke-all-sessions`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchSessions(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to revoke sessions');
      }
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      toast.error('Failed to revoke all sessions');
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
              <p className="text-gray-600 mt-1">
                Manage your active login sessions and devices
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
              <div className="text-right">
                <p className="text-sm text-gray-500">Active Sessions</p>
                <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Session Limit Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                You can have up to <strong>5 active sessions</strong> at a time. 
                If you exceed this limit, the oldest sessions will be automatically logged out.
              </p>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Active Sessions</h2>
              {sessions.length > 1 && (
                <button
                  onClick={revokeAllSessions}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout All Others
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active sessions</h3>
                <p className="mt-1 text-sm text-gray-500">You don't have any active sessions right now.</p>
              </div>
            ) : (
              sessions.map((session, index) => (
                <div key={session.sessionId} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{getDeviceIcon(session.device)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {session.device} {session.isCurrent && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                This Device
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <p>IP Address: {session.ip}</p>
                          <p>Location: {session.location}</p>
                          <p>Last Active: {formatDate(session.lastActive)}</p>
                          <p>Login Time: {formatDate(session.loginTime)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {!session.isCurrent && (
                        <button
                          onClick={() => revokeSession(session.sessionId)}
                          disabled={revokingSession === session.sessionId}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {revokingSession === session.sessionId ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Revoking...
                            </>
                          ) : (
                            'Revoke'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.491 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Security Tips</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Regularly review your active sessions and revoke any you don't recognize</li>
                  <li>Always log out from shared or public computers</li>
                  <li>If you notice suspicious activity, change your password immediately</li>
                  <li>Consider using a password manager for better security</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceManagement;
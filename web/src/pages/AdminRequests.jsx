import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ContactSupportWrapper from "../components/ContactSupportWrapper";
import { toast } from 'react-toastify';

import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminRequests = () => {
  // Set page title
  usePageTitle("Admin Requests - Approval Management");
  
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for currentUser to be loaded
    if (!currentUser) {
      return;
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin' && !currentUser.isDefaultAdmin) {
      navigate('/sign-in');
      return;
    }

    fetchAllRequests();
  }, [currentUser, navigate]);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/all-requests`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch requests');
      }
      
      setAllRequests(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/approve/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          currentUserId: currentUser._id,
          rootAdminPassword: 'Salendra@2004' // Root admin password
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to approve request');
      }
      
      // Update the request in the list
      setAllRequests(prev => prev.map(request => 
        request._id === userId 
          ? { ...request, adminApprovalStatus: 'approved', role: 'admin' }
          : request
      ));
      
      // Show success message
      toast.success('Admin request approved successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleReject = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reject/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          currentUserId: currentUser._id,
          rootAdminPassword: 'Salendra@2004' // Root admin password
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reject request');
      }
      
      // Update the request in the list
      setAllRequests(prev => prev.map(request => 
        request._id === userId 
          ? { ...request, adminApprovalStatus: 'rejected', role: 'user' }
          : request
      ));
      
      // Show success message
      toast.success('Admin request rejected successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleReapprove = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reapprove/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          currentUserId: currentUser._id,
          rootAdminPassword: 'Salendra@2004' // Root admin password
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reapprove request');
      }
      
      // Update the request in the list
      setAllRequests(prev => prev.map(request => 
        request._id === userId 
          ? { ...request, adminApprovalStatus: 'approved', role: 'admin' }
          : request
      ));
      
      // Show success message
      toast.success('Admin request reapproved successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter requests based on selected filter
  const filteredRequests = allRequests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'pending') return request.adminApprovalStatus === 'pending';
    if (filter === 'approved') return request.adminApprovalStatus === 'approved';
    if (filter === 'rejected') return request.adminApprovalStatus === 'rejected';
    return true;
  });

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get action buttons based on status
  const getActionButtons = (request) => {
    if (request.adminApprovalStatus === 'pending') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleApprove(request._id)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>✓</span>
            <span>Approve</span>
          </button>
          <button
            onClick={() => handleReject(request._id)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>✕</span>
            <span>Reject</span>
          </button>
        </div>
      );
    } else if (request.adminApprovalStatus === 'rejected') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleReapprove(request._id)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>↻</span>
            <span>Re-approve</span>
          </button>
        </div>
      );
    } else if (request.adminApprovalStatus === 'approved') {
      return (
        <div className="flex items-center text-green-600 font-medium">
          <span className="mr-2">✓</span>
          <span>Approved</span>
        </div>
      );
    }
    return null;
  };

  // Show loading while currentUser is not loaded
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin requests...</p>
        </div>
      </div>
    );
  }



  // Show access denied for non-default admins
  if (!(currentUser.isDefaultAdmin || currentUser.role === 'rootadmin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center py-12">
              <div className="text-red-500 text-6xl mb-4">🚫</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600">Only the default admin or root admin can approve new admin requests.</p>
              <p className="text-sm text-gray-500 mt-2">Current user: {currentUser.email}</p>
              <div className="flex justify-center mt-6">
                <button 
                  onClick={() => navigate('/admin')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2 text-base mx-auto"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Requests</h1>
                <p className="text-gray-600 mt-2">Manage pending admin approval requests (Root Admin Only)</p>
                <p className="text-sm text-green-600 mt-1">Welcome, {currentUser.email} (Root Admin)</p>
              </div>
              <div className="flex gap-2">
                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
                  {allRequests.filter(r => r.adminApprovalStatus === 'pending').length} Pending
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-medium">
                  {allRequests.filter(r => r.adminApprovalStatus === 'approved').length} Approved
                </div>
                <div className="bg-red-100 text-red-800 px-3 py-2 rounded-full text-sm font-medium">
                  {allRequests.filter(r => r.adminApprovalStatus === 'rejected').length} Rejected
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'all', label: 'All Requests', count: allRequests.length },
                { key: 'pending', label: 'Pending', count: allRequests.filter(r => r.adminApprovalStatus === 'pending').length },
                { key: 'approved', label: 'Approved', count: allRequests.filter(r => r.adminApprovalStatus === 'approved').length },
                { key: 'rejected', label: 'Rejected', count: allRequests.filter(r => r.adminApprovalStatus === 'rejected').length }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filter === key
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {filter === 'all' ? 'No Admin Requests' : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Requests`}
                </h3>
                <p className="text-gray-600">
                  {filter === 'all' 
                    ? 'No admin requests have been submitted yet.' 
                    : `No admin requests with ${filter} status found.`
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRequests.map((request) => (
                  <div key={request._id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex flex-col h-full">
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{request.username}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(request.adminApprovalStatus)}`}>
                            {request.adminApprovalStatus}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="truncate"><strong>Email:</strong> {request.email}</p>
                          <p><strong>Mobile:</strong> {request.mobileNumber || 'Not provided'}</p>
                          <p><strong>Role:</strong> {request.role}</p>
                          <p><strong>Requested:</strong> {formatDate(request.adminRequestDate || request.createdAt)}</p>
                          {request.adminApprovalDate && (
                            <p><strong>Processed:</strong> {formatDate(request.adminApprovalDate)}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {getActionButtons(request)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ContactSupportWrapper />
    </>
  );
};

export default AdminRequests; 
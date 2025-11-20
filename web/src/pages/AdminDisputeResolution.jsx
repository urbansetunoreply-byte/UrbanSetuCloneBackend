import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaExclamationTriangle, FaSearch, FaFilter, FaTimes, FaFileAlt, FaComments, FaCheckCircle, FaClock, FaGavel, FaUser, FaPaperclip, FaImage, FaVideo, FaFile, FaDownload, FaEdit, FaBan, FaEye } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';
import DisputeDetail from '../components/dispute/DisputeDetail';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DISPUTE_CATEGORIES = {
  payment_issue: 'Payment Issue',
  property_maintenance: 'Property Maintenance',
  behavior: 'Behavior',
  contract_violation: 'Contract Violation',
  damage_assessment: 'Damage Assessment',
  early_termination: 'Early Termination',
  other: 'Other'
};

const DISPUTE_STATUS = {
  open: 'Open',
  under_review: 'Under Review',
  resolved: 'Resolved',
  closed: 'Closed',
  escalated: 'Escalated'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export default function AdminDisputeResolution() {
  usePageTitle("Admin - Dispute Resolution - UrbanSetu");

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showDisputeDetail, setShowDisputeDetail] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    search: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }
    
    // Check if user is admin or rootadmin
    if (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin') {
      toast.error('Access denied. Admin access required.');
      navigate('/user');
      return;
    }
    
    fetchDisputes();
  }, [currentUser, filters.status, filters.category, filters.priority]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters.category !== 'all') {
        params.set('category', filters.category);
      }

      const res = await fetch(`${API_BASE_URL}/api/rental/disputes?${params.toString()}`, {
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDisputes(data.disputes || []);
      } else {
        toast.error(data.message || 'Failed to fetch disputes');
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const fetchDispute = async (disputeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rental/disputes/${disputeId}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.dispute;
      }
      return null;
    } catch (error) {
      console.error('Error fetching dispute:', error);
      return null;
    }
  };

  const handleViewDispute = async (dispute) => {
    const fullDispute = await fetchDispute(dispute._id);
    if (fullDispute) {
      setSelectedDispute(fullDispute);
      setShowDisputeDetail(true);
    }
  };

  const handleDisputeUpdated = () => {
    fetchDisputes();
    if (selectedDispute) {
      fetchDispute(selectedDispute._id).then(dispute => {
        if (dispute) {
          setSelectedDispute(dispute);
        }
      });
    }
  };

  const handleUpdateStatus = async (disputeId, status, priority, escalationReason) => {
    try {
      setUpdatingStatus(true);
      const res = await fetch(`${API_BASE_URL}/api/rental/disputes/${disputeId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          priority,
          escalationReason
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Dispute status updated');
        handleDisputeUpdated();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResolveDispute = async (disputeId, resolution, resolutionNotes) => {
    try {
      setResolving(true);
      const res = await fetch(`${API_BASE_URL}/api/rental/disputes/${disputeId}/resolve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution,
          resolutionNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Dispute resolved');
        handleDisputeUpdated();
      } else {
        toast.error(data.message || 'Failed to resolve dispute');
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = filters.search === '' || 
      dispute.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      dispute.disputeId?.toLowerCase().includes(filters.search.toLowerCase()) ||
      dispute.raisedBy?.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
      dispute.raisedAgainst?.username?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesPriority = filters.priority === 'all' || dispute.priority === filters.priority;
    
    return matchesSearch && matchesPriority;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'escalated':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    return DISPUTE_STATUS[status] || status?.replace('_', ' ').toUpperCase() || 'UNKNOWN';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaClock className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaGavel className="text-blue-600" />
                Admin - Dispute Resolution
              </h1>
              <p className="text-gray-600 mt-2">Manage and resolve all rental disputes</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search disputes..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {Object.entries(DISPUTE_STATUS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {Object.entries(DISPUTE_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Total Disputes</p>
            <p className="text-2xl font-bold text-gray-800">{disputes.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Open</p>
            <p className="text-2xl font-bold text-blue-600">
              {disputes.filter(d => d.status === 'open').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Under Review</p>
            <p className="text-2xl font-bold text-yellow-600">
              {disputes.filter(d => d.status === 'under_review').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-600">
              {disputes.filter(d => d.status === 'resolved').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Escalated</p>
            <p className="text-2xl font-bold text-red-600">
              {disputes.filter(d => d.status === 'escalated').length}
            </p>
          </div>
        </div>

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Disputes Found</h3>
            <p className="text-gray-500">
              {filters.status !== 'all' || filters.category !== 'all' || filters.priority !== 'all' || filters.search !== ''
                ? 'Try adjusting your filters'
                : 'No disputes have been raised yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <div
                key={dispute._id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getStatusColor(dispute.status)}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FaGavel className="text-2xl text-blue-600" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {dispute.title}
                        </h3>
                        <p className="text-sm text-gray-600 font-mono">
                          {dispute.disputeId}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Category</p>
                        <p className="font-semibold">
                          {DISPUTE_CATEGORIES[dispute.category] || dispute.category}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Status</p>
                        <p className="font-semibold">{getStatusLabel(dispute.status)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Priority</p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${PRIORITY_COLORS[dispute.priority] || PRIORITY_COLORS.low}`}>
                          {dispute.priority?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Raised By</p>
                        <p className="font-semibold">
                          {dispute.raisedBy?.username || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                      <p className="mb-1">
                        <strong>Against:</strong> {dispute.raisedAgainst?.username || 'Unknown'}
                      </p>
                      <p>
                        <strong>Created:</strong> {new Date(dispute.createdAt).toLocaleString('en-GB')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewDispute(dispute)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <FaEye /> View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dispute Detail Modal */}
        {showDisputeDetail && selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Dispute Details (Admin View)</h2>
                <button
                  onClick={() => {
                    setShowDisputeDetail(false);
                    setSelectedDispute(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>
              <DisputeDetail
                dispute={selectedDispute}
                currentUser={currentUser}
                onUpdate={handleDisputeUpdated}
                getStatusColor={getStatusColor}
                DISPUTE_CATEGORIES={DISPUTE_CATEGORIES}
                DISPUTE_STATUS={DISPUTE_STATUS}
                PRIORITY_COLORS={PRIORITY_COLORS}
                isAdmin={true}
                onUpdateStatus={handleUpdateStatus}
                onResolve={handleResolveDispute}
                updatingStatus={updatingStatus}
                resolving={resolving}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


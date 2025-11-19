import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaShieldAlt, FaCheckCircle, FaTimesCircle, FaClock, FaSearch, FaSpinner, FaFileAlt, FaUser, FaHome, FaDownload } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';
import VerificationStatus from '../components/verification/VerificationStatus';

// Verification Status Modal Component with scroll prevention
const VerificationStatusModal = ({ verification, listing, currentUser, onUpdate, onClose, STATUS_COLORS, STATUS_LABELS }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{ overflow: 'hidden' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <VerificationStatus
            verification={verification}
            listing={listing}
            currentUser={currentUser}
            onUpdate={onUpdate}
            STATUS_COLORS={STATUS_COLORS}
            STATUS_LABELS={STATUS_LABELS}
            onClose={onClose}
            isAdminView={true}
          />
        </div>
      </div>
    </div>
  );
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  verified: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200'
};

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  verified: 'Verified',
  rejected: 'Rejected'
};

export default function AdminPropertyVerification() {
  usePageTitle("Admin Property Verification - UrbanSetu");

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showVerificationStatus, setShowVerificationStatus] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin') {
      navigate('/user');
      return;
    }

    fetchAllVerifications();
  }, [currentUser, navigate, statusFilter]);

  const fetchAllVerifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/rental/verification?status=${statusFilter}&search=${searchQuery}`, {
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVerifications(data.verifications || []);
      } else {
        toast.error(data.message || 'Failed to fetch verifications');
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVerification = (verification) => {
    setSelectedVerification(verification);
    setSelectedListing(verification.listingId);
    setShowVerificationStatus(true);
  };

  const handleVerificationUpdated = () => {
    fetchAllVerifications();
    if (selectedVerification) {
      const updated = verifications.find(v => v._id === selectedVerification._id);
      if (updated) {
        setSelectedVerification(updated);
      }
    }
  };

  const filteredVerifications = verifications.filter(verification => {
    if (statusFilter !== 'all' && verification.status !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        verification.listingId?.name?.toLowerCase().includes(query) ||
        verification.listingId?.address?.toLowerCase().includes(query) ||
        verification.landlordId?.username?.toLowerCase().includes(query) ||
        verification.landlordId?.email?.toLowerCase().includes(query) ||
        verification.verificationId?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading verifications...</p>
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
                <FaShieldAlt className="text-blue-600" />
                Admin Property Verification
              </h1>
              <p className="text-gray-600 mt-2">Review and manage property verification requests</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties, landlords, verification ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchAllVerifications();
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={fetchAllVerifications}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Verifications List */}
        {filteredVerifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaShieldAlt className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Verification Requests Found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' 
                ? 'No verifications match your filters' 
                : 'No property verification requests have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVerifications.map((verification) => {
              const status = verification.status || 'pending';
              const isVerified = status === 'verified';

              return (
                <div
                  key={verification._id}
                  className="bg-white rounded-xl shadow-lg p-6 border-2 hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {verification.listingId?.name || 'Property'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
                          {STATUS_LABELS[status] || status}
                        </span>
                        {isVerified && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                            <FaCheckCircle /> Verified Badge
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{verification.listingId?.address || 'Address not available'}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-gray-400" />
                          <span>Landlord: {verification.landlordId?.username || verification.landlordId?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaFileAlt className="text-gray-400" />
                          <span>ID: {verification.verificationId || verification._id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaClock className="text-gray-400" />
                          <span>Submitted: {new Date(verification.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewVerification(verification)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <FaShieldAlt /> Review
                      </button>
                      {verification.listingId?._id && (
                        <button
                          onClick={() => navigate(`/admin/listing/${verification.listingId._id}`)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                        >
                          <FaHome /> View Listing
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Verification Status Modal */}
        {showVerificationStatus && selectedVerification && selectedListing && (
          <VerificationStatusModal
            verification={selectedVerification}
            listing={selectedListing}
            currentUser={currentUser}
            onUpdate={handleVerificationUpdated}
            onClose={() => {
              setShowVerificationStatus(false);
              setSelectedVerification(null);
              setSelectedListing(null);
            }}
            STATUS_COLORS={STATUS_COLORS}
            STATUS_LABELS={STATUS_LABELS}
          />
        )}
      </div>
    </div>
  );
}


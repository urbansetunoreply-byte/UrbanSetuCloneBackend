import React, { useState, useEffect } from 'react';
import { FaPhone, FaVideo, FaTimes, FaClock, FaCheckCircle, FaTimesCircle, FaUser, FaSpinner, FaTrash, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CallHistoryModal = ({ appointmentId, isOpen, onClose, currentUser, isAdmin = false }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteSingleModal, setShowDeleteSingleModal] = useState(false);
  const [callToDelete, setCallToDelete] = useState(null);

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchCallHistory();
    } else {
      setCalls([]);
      setError(null);
    }
  }, [isOpen, appointmentId]);

  const fetchCallHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/calls/history/${appointmentId}`,
        { withCredentials: true }
      );
      if (response.data.calls) {
        setCalls(response.data.calls);
      }
    } catch (err) {
      console.error('Error fetching call history:', err);
      setError(err.response?.data?.message || 'Failed to fetch call history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = () => {
    // Local deletion - remove all calls from view (for users only)
    setCalls([]);
    toast.success('All call history removed from your view');
    setShowDeleteAllModal(false);
  };

  const handleDeleteSingle = () => {
    if (!callToDelete) return;
    // Local deletion - remove single call from view (for users only)
    setCalls(prev => prev.filter(call => 
      (call._id || call.callId) !== (callToDelete._id || callToDelete.callId)
    ));
    toast.success('Call history removed from your view');
    setShowDeleteSingleModal(false);
    setCallToDelete(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ended':
      case 'accepted':
        return <FaCheckCircle className="text-green-500" />;
      case 'rejected':
      case 'missed':
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" />;
      case 'ringing':
      case 'initiated':
        return <FaClock className="text-yellow-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ended':
        return 'Ended';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'missed':
        return 'Missed';
      case 'cancelled':
        return 'Cancelled';
      case 'ringing':
        return 'Ringing';
      case 'initiated':
        return 'Initiated';
      default:
        return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {isAdmin ? (
              <>
                <FaVideo className="text-lg" />
                Call History (Admin View)
              </>
            ) : (
              <>
                <FaPhone className="text-lg" />
                Call History
              </>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {/* Refresh Button (for both users and admins) */}
            <button
              onClick={fetchCallHistory}
              disabled={loading}
              className="text-white hover:text-gray-200 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <FaSync className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {/* Delete All Button (users only) */}
            {!isAdmin && calls.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="text-white hover:text-red-200 bg-white/10 hover:bg-red-500/20 rounded-full p-2 transition-colors"
                title="Delete all call history"
              >
                <FaTrash className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
              title="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-blue-600 text-3xl mr-3" />
              <span className="text-gray-600">Loading call history...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaTimesCircle className="text-red-500 text-4xl mx-auto mb-2" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchCallHistory}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : calls.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaPhone className="text-gray-400 text-5xl mx-auto mb-3" />
                <p className="text-gray-600 font-medium text-lg">No call history found</p>
                <p className="text-gray-500 text-sm mt-1">Calls made in this chat will appear here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => {
                const isCaller = call.callerId?._id === currentUser?._id || call.callerId === currentUser?._id;
                const callerName = typeof call.callerId === 'object' ? call.callerId?.username : 'Unknown';
                const receiverName = typeof call.receiverId === 'object' ? call.receiverId?.username : 'Unknown';
                
                return (
                  <div
                    key={call._id || call.callId}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Call Type Icon */}
                        <div className={`mt-1 p-2 rounded-full ${
                          call.callType === 'video' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {call.callType === 'video' ? (
                            <FaVideo className={`text-lg ${call.callType === 'video' ? 'text-blue-600' : 'text-green-600'}`} />
                          ) : (
                            <FaPhone className="text-lg text-green-600" />
                          )}
                        </div>

                        {/* Call Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-800">
                              {isAdmin 
                                ? `${callerName} → ${receiverName}`
                                : isCaller 
                                  ? `You called ${receiverName}`
                                  : `${callerName} called you`
                              }
                            </span>
                            <span className="text-xs text-gray-500">
                              {call.callType === 'video' ? 'Video' : 'Audio'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                            <div className="flex items-center gap-1">
                              <FaClock className="text-xs" />
                              <span>{formatDate(call.startTime || call.createdAt)}</span>
                            </div>
                            {call.duration > 0 && (
                              <div className="flex items-center gap-1">
                                <span>Duration: {formatDuration(call.duration)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              {getStatusIcon(call.status)}
                              <span className={`
                                ${call.status === 'ended' || call.status === 'accepted' ? 'text-green-600' : ''}
                                ${call.status === 'rejected' || call.status === 'missed' || call.status === 'cancelled' ? 'text-red-600' : ''}
                                ${call.status === 'ringing' || call.status === 'initiated' ? 'text-yellow-600' : ''}
                                font-medium
                              `}>
                                {getStatusText(call.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Delete Button (users only) */}
                      {!isAdmin && (
                        <button
                          onClick={() => {
                            setCallToDelete(call);
                            setShowDeleteSingleModal(true);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-colors ml-2 flex-shrink-0"
                          title="Delete this call history"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete All Confirmation Modal */}
        {showDeleteAllModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaTrash className="text-red-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete All Call History</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Are you sure you want to delete all call history from your view? This action will only remove the calls from your view and will not affect the other party or the database records.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FaTrash size={14} />
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Single Call Confirmation Modal */}
        {showDeleteSingleModal && callToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaTrash className="text-red-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Call History</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Are you sure you want to delete this call history from your view? This action will only remove the call from your view and will not affect the other party or the database records.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteSingleModal(false);
                      setCallToDelete(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSingle}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FaTrash size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total calls: <strong>{calls.length}</strong></span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FaVideo className="text-blue-600" />
                <span>Video: {calls.filter(c => c.callType === 'video').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaPhone className="text-green-600" />
                <span>Audio: {calls.filter(c => c.callType === 'audio').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallHistoryModal;


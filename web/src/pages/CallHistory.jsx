import React, { useState, useEffect } from 'react';
import { FaPhone, FaVideo, FaClock, FaCheckCircle, FaTimesCircle, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';
import { usePageTitle } from '../hooks/usePageTitle';

const CallHistory = () => {
  // Set page title
  usePageTitle("Call History");
  const [calls, setCalls] = useState([]);
  const [allCalls, setAllCalls] = useState([]); // Store all calls for pagination
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, audio, video, missed
  const [appointmentFilter, setAppointmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteSingleModal, setShowDeleteSingleModal] = useState(false);
  const [callToDelete, setCallToDelete] = useState(null);
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCallHistory();
  }, [filter, appointmentFilter]);

  useEffect(() => {
    // Apply pagination when allCalls or currentPage changes
    applyPagination();
  }, [allCalls, currentPage]);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (appointmentFilter) params.append('appointmentId', appointmentFilter);
      params.append('limit', '1000'); // Fetch all calls for client-side pagination
      params.append('page', '1');

      const response = await fetch(`${API_BASE_URL}/api/calls/history?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        let filteredCalls = data.calls || [];
        
        if (filter === 'audio') {
          filteredCalls = filteredCalls.filter(call => call.callType === 'audio');
        } else if (filter === 'video') {
          filteredCalls = filteredCalls.filter(call => call.callType === 'video');
        } else if (filter === 'missed') {
          filteredCalls = filteredCalls.filter(call => call.status === 'missed');
        }
        
        setAllCalls(filteredCalls);
        setCurrentPage(1); // Reset to first page when filter changes
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyPagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCalls = allCalls.slice(startIndex, endIndex);
    setCalls(paginatedCalls);
  };

  const totalPages = Math.ceil(allCalls.length / itemsPerPage);

  const handleDeleteAll = () => {
    // Local deletion - remove all calls from view (for users only)
    setAllCalls([]);
    setCalls([]);
    toast.success('All call history removed from your view');
    setShowDeleteAllModal(false);
  };

  const handleDeleteSingle = () => {
    if (!callToDelete) return;
    // Local deletion - remove single call from view (for users only)
    setAllCalls(prev => prev.filter(call => 
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
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
      case 'ended':
        return <FaCheckCircle className="text-green-500" />;
      case 'missed':
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Call History</h1>
          {/* Delete All Button (users only) */}
          {allCalls.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg px-4 py-2 transition-colors flex items-center gap-2"
              title="Delete all call history"
            >
              <FaTrash className="w-5 h-5" />
              Delete All
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded transition-colors ${
                  filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('audio')}
                className={`px-4 py-2 rounded transition-colors ${
                  filter === 'audio' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Audio
              </button>
              <button
                onClick={() => setFilter('video')}
                className={`px-4 py-2 rounded transition-colors ${
                  filter === 'video' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Video
              </button>
              <button
                onClick={() => setFilter('missed')}
                className={`px-4 py-2 rounded transition-colors ${
                  filter === 'missed' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Missed
              </button>
            </div>
          </div>
        </div>

        {/* Call List */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">Loading call history...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No call history found.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {calls.map((call) => (
                <div key={call._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                    {/* Call Type Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      call.callType === 'video' ? 'bg-blue-500' : 'bg-green-500'
                    } text-white`}>
                      {call.callType === 'video' ? <FaVideo className="text-xl" /> : <FaPhone className="text-xl" />}
                    </div>
                    
                    {/* Call Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {call.callerId?.username || 'Unknown'} → {call.receiverId?.username || 'Unknown'}
                        </h3>
                        {getStatusIcon(call.status)}
                      </div>
                      <p className="text-gray-600 text-sm">
                        {call.appointmentId?.propertyName || 'N/A'}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{formatDate(call.startTime)}</span>
                        {call.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <FaClock /> {formatDuration(call.duration)}
                          </span>
                        )}
                        <span className="capitalize">{getStatusText(call.status)}</span>
                      </div>
                    </div>
                    {/* Delete Button (users only) */}
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
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-2">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setCurrentPage(Math.max(1, currentPage - 1));
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage(Math.min(totalPages, currentPage + 1));
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

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
      </div>
    </div>
  );
};

export default CallHistory;


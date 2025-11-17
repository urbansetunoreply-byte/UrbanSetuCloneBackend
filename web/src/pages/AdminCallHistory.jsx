import React, { useState, useEffect } from 'react';
import { FaPhone, FaVideo, FaClock, FaCheckCircle, FaTimesCircle, FaFilter } from 'react-icons/fa';
import { API_BASE_URL } from '../config/api';

const AdminCallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [allCalls, setAllCalls] = useState([]); // Store all calls for pagination
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    callType: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [stats, setStats] = useState({
    total: 0,
    audio: 0,
    video: 0,
    missed: 0,
    averageDuration: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAllCallHistory();
  }, [filters]);

  useEffect(() => {
    // Apply pagination when allCalls or currentPage changes
    applyPagination();
  }, [allCalls, currentPage]);

  const fetchAllCallHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.callType !== 'all') params.append('callType', filters.callType);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('limit', '1000'); // Fetch all calls for client-side pagination

      const response = await fetch(`${API_BASE_URL}/api/calls/admin/history?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAllCalls(data.calls || []);
        setStats(data.stats || {
          total: 0,
          audio: 0,
          video: 0,
          missed: 0,
          averageDuration: 0
        });
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin - Call History</h1>
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Calls</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Audio Calls</p>
            <p className="text-2xl font-bold text-green-600">{stats.audio}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Video Calls</p>
            <p className="text-2xl font-bold text-blue-600">{stats.video}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Missed Calls</p>
            <p className="text-2xl font-bold text-red-600">{stats.missed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={filters.callType}
              onChange={(e) => setFilters({ ...filters, callType: e.target.value })}
              className="px-4 py-2 border rounded"
            >
              <option value="all">All Types</option>
              <option value="audio">Audio Only</option>
              <option value="video">Video</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded"
            >
              <option value="all">All Status</option>
              <option value="ended">Ended</option>
              <option value="missed">Missed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Call List Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Call Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receiver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">No calls found</td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {call.callType === 'video' ? (
                        <FaVideo className="text-blue-500" />
                      ) : (
                        <FaPhone className="text-green-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{call.callerId?.username || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{call.receiverId?.username || 'N/A'}</td>
                    <td className="px-6 py-4">{call.appointmentId?.propertyName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(call.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {call.duration > 0 ? formatDuration(call.duration) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        call.status === 'ended' ? 'bg-green-100 text-green-800' :
                        call.status === 'missed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
      </div>
    </div>
  );
};

export default AdminCallHistory;


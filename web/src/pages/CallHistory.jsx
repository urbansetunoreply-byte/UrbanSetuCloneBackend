import React, { useState, useEffect } from 'react';
import { FaPhone, FaVideo, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { API_BASE_URL } from '../config/api';

const CallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, audio, video, missed
  const [appointmentFilter, setAppointmentFilter] = useState('');

  useEffect(() => {
    fetchCallHistory();
  }, [filter, appointmentFilter]);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (appointmentFilter) params.append('appointmentId', appointmentFilter);
      params.append('limit', '50');
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
        
        setCalls(filteredCalls);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold mb-6">Call History</h1>
        
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
          <div className="space-y-4">
            {calls.map((call) => (
              <div key={call._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistory;


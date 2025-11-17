import React from 'react';
import { FaPhone, FaVideo, FaTimes } from 'react-icons/fa';

const IncomingCallModal = ({ call, onAccept, onReject }) => {
  if (!call) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl p-8 text-center max-w-md w-full mx-4 animate-pulse">
        <div className="mb-6">
          <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
            call.callType === 'video' ? 'bg-blue-500' : 'bg-green-500'
          } animate-bounce`}>
            {call.callType === 'video' ? (
              <FaVideo className="text-white text-4xl" />
            ) : (
              <FaPhone className="text-white text-4xl" />
            )}
          </div>
          <h3 className="text-2xl font-bold mb-2">{call.callerName || 'Incoming Call'}</h3>
          <p className="text-gray-600">
            {call.callType === 'video' ? 'Video' : 'Audio'} Call
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onReject}
            className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            title="Reject"
          >
            <FaTimes className="text-2xl" />
          </button>
          <button
            onClick={onAccept}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-colors shadow-lg ${
              call.callType === 'video' ? 'bg-blue-500' : 'bg-green-500'
            }`}
            title="Accept"
          >
            <FaPhone className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;


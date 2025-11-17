import React, { useEffect, useState } from 'react';
import { FaPhone, FaVideo, FaTimes } from 'react-icons/fa';

const IncomingCallModal = ({ call, onAccept, onReject }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (call) {
      setIsVisible(true);
      setRinging(true);
    } else {
      setIsVisible(false);
      setRinging(false);
    }
  }, [call]);

  if (!call || !isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] transition-opacity duration-300"
      style={{ animation: 'fadeIn 0.3s ease-in' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes ring {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
      
      <div 
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 text-center max-w-md w-full mx-4 shadow-2xl"
        style={{ animation: 'slideUp 0.4s ease-out' }}
      >
        <div className="mb-8 relative">
          {/* Pulsing ring effect */}
          {ringing && (
            <>
              <div 
                className={`absolute inset-0 w-32 h-32 rounded-full mx-auto ${
                  call.callType === 'video' ? 'bg-blue-500' : 'bg-green-500'
                } opacity-20`}
                style={{ 
                  animation: 'pulse-ring 2s ease-out infinite',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: '-16px'
                }}
              />
              <div 
                className={`absolute inset-0 w-32 h-32 rounded-full mx-auto ${
                  call.callType === 'video' ? 'bg-blue-500' : 'bg-green-500'
                } opacity-10`}
                style={{ 
                  animation: 'pulse-ring 2s ease-out infinite 0.5s',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: '-16px'
                }}
              />
            </>
          )}
          
          <div 
            className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center relative z-10 ${
              call.callType === 'video' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-green-500 to-green-600'
            } shadow-xl`}
            style={{ animation: ringing ? 'ring 1s ease-in-out infinite' : 'none' }}
          >
            {call.callType === 'video' ? (
              <FaVideo className="text-white text-5xl" />
            ) : (
              <FaPhone className="text-white text-5xl" />
            )}
          </div>
          
          <h3 className="text-3xl font-bold mb-2 text-gray-800">{call.callerName || 'Incoming Call'}</h3>
          <p className="text-gray-600 text-lg">
            {call.callType === 'video' ? 'Video' : 'Audio'} Call
          </p>
        </div>
        
        <div className="flex gap-6 justify-center">
          <button
            onClick={onReject}
            className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 transform"
            title="Reject"
          >
            <FaTimes className="text-3xl" />
          </button>
          <button
            onClick={onAccept}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 transform ${
              call.callType === 'video' 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            }`}
            title="Accept"
          >
            <FaPhone className="text-3xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;


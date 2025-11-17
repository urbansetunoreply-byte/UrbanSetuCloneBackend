import React, { useEffect, useState } from 'react';
import { FaPhone, FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';

const ActiveCallModal = ({ 
  callType, 
  otherPartyName,
  isMuted,
  isVideoEnabled,
  callDuration,
  localVideoRef,
  remoteVideoRef,
  onToggleMute,
  onToggleVideo,
  onEndCall
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black flex flex-col z-[9999] transition-opacity duration-300"
      style={{ animation: 'fadeIn 0.3s ease-in' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      {/* Remote Video/Audio */}
      <div className="flex-1 relative">
        {callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FaPhone className="text-6xl" />
              </div>
              <h3 className="text-3xl font-bold mb-2">{otherPartyName || 'Calling...'}</h3>
              <p className="text-xl">{formatDuration(callDuration)}</p>
            </div>
          </div>
        )}
        
        {/* Local Video (Picture-in-Picture) */}
        {callType === 'video' && (
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <FaVideoSlash className="text-white text-2xl" />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Call Controls */}
      <div 
        className="bg-black bg-opacity-70 backdrop-blur-sm p-6"
        style={{ animation: 'slideIn 0.4s ease-out' }}
      >
        <div className="flex items-center justify-center gap-6">
          {/* Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            } text-white shadow-xl hover:scale-110 active:scale-95 transform`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <FaMicrophoneSlash className="text-2xl" /> : <FaMicrophone className="text-2xl" />}
          </button>
          
          {/* Video On/Off (only for video calls) */}
          {callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
              } text-white shadow-xl hover:scale-110 active:scale-95 transform`}
              title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
            >
              {isVideoEnabled ? <FaVideo className="text-2xl" /> : <FaVideoSlash className="text-2xl" />}
            </button>
          )}
          
          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 transform"
            title="End Call"
          >
            <FaPhone className="text-2xl rotate-[135deg]" />
          </button>
        </div>
        
        {/* Call Duration for audio calls */}
        {callType === 'audio' && (
          <div className="text-center mt-6 text-white">
            <p className="text-2xl font-semibold">{formatDuration(callDuration)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveCallModal;


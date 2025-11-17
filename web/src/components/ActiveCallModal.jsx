import React from 'react';
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
    <div className="fixed inset-0 bg-black flex flex-col z-[9999]">
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
      <div className="bg-black bg-opacity-50 p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            } text-white shadow-lg`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <FaMicrophoneSlash className="text-xl" /> : <FaMicrophone className="text-xl" />}
          </button>
          
          {/* Video On/Off (only for video calls) */}
          {callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
              } text-white shadow-lg`}
              title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
            >
              {isVideoEnabled ? <FaVideo className="text-xl" /> : <FaVideoSlash className="text-xl" />}
            </button>
          )}
          
          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            title="End Call"
          >
            <FaPhone className="text-xl rotate-[135deg]" />
          </button>
        </div>
        
        {/* Call Duration for audio calls */}
        {callType === 'audio' && (
          <div className="text-center mt-4 text-white">
            <p className="text-lg">{formatDuration(callDuration)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveCallModal;


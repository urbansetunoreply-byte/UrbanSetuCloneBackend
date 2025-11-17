import React, { useEffect, useState, useRef } from 'react';
import { FaPhone, FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaSync } from 'react-icons/fa';
import UserAvatar from './UserAvatar';

const ActiveCallModal = ({ 
  callType, 
  otherPartyName,
  otherPartyData, // Add other party data for avatar
  isMuted,
  isVideoEnabled,
  remoteIsMuted,
  remoteVideoEnabled,
  callDuration,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
  availableCameras,
  currentCameraId,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onSwitchCamera
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [videoSwapped, setVideoSwapped] = useState(false); // Track if local/remote videos are swapped
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Show controls on mouse movement and auto-hide after 3 seconds of inactivity
  useEffect(() => {
    if (callType === 'video') {
      const handleMouseMove = () => {
        setControlsVisible(true);
        // Clear existing timeout
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        // Hide controls after 3 seconds of inactivity
        controlsTimeoutRef.current = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      };

      const container = containerRef.current;
      if (container) {
        container.addEventListener('mousemove', handleMouseMove);
        return () => {
          container.removeEventListener('mousemove', handleMouseMove);
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
        };
      }
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [callType]);

  // Show controls when clicking on video
  const handleVideoClick = () => {
    if (callType === 'video') {
      setControlsVisible(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      // Hide again after 3 seconds
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  };

  // Handle local video click to swap views
  const handleLocalVideoClick = (e) => {
    e.stopPropagation();
    if (callType === 'video') {
      setVideoSwapped(!videoSwapped);
      setControlsVisible(true);
      // Hide again after 3 seconds
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  };

  const formatDuration = (seconds) => {
    // Ensure non-negative duration (handle edge cases and clock skew)
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
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
      <div className="flex-1 relative" onClick={handleVideoClick}>
        {callType === 'video' ? (
          <>
            {/* Main video (swappable between local and remote) */}
            {videoSwapped ? (
              // Local video in big view (when swapped)
              <>
                <video
                  key="local-large"
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover cursor-pointer"
                  onLoadedMetadata={(e) => {
                    e.target.play().catch(err => console.error('Error playing local video:', err));
                  }}
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center cursor-pointer">
                    <div className="text-center text-white">
                      <FaVideoSlash className="text-6xl mb-4 mx-auto opacity-50" />
                      <p className="text-xl">You</p>
                      <p className="text-sm text-gray-400 mt-2">Video is off</p>
                    </div>
                  </div>
                )}
                {/* Local video label in big view */}
                <div className="absolute bottom-24 left-4 bg-black bg-opacity-70 rounded-full px-4 py-2 z-20">
                  <p className="text-white text-sm font-medium">You</p>
                </div>
              </>
            ) : (
              // Remote video in big view (default)
              <>
                <video
                  key="remote-large"
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover cursor-pointer"
                  onLoadedMetadata={(e) => {
                    e.target.play().catch(err => console.error('Error playing remote video:', err));
                  }}
                />
                {/* Remote video off indicator */}
                {!remoteVideoEnabled && (
                  <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center cursor-pointer">
                    <div className="text-center text-white">
                      <FaVideoSlash className="text-6xl mb-4 mx-auto opacity-50" />
                      <p className="text-xl">{otherPartyName || 'Caller'}</p>
                      <p className="text-sm text-gray-400 mt-2">Video is off</p>
                    </div>
                  </div>
                )}
                {/* Remote video label - show name or fallback */}
                <div className="absolute bottom-24 left-4 bg-black bg-opacity-70 rounded-full px-4 py-2 z-20">
                  <p className="text-white text-sm font-medium">{otherPartyName || 'Caller'}</p>
                </div>
              </>
            )}
            {/* Remote mute indicator */}
            {remoteIsMuted && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-full px-4 py-2 flex items-center gap-2 z-20">
                <FaMicrophoneSlash className="text-white text-lg" />
                <span className="text-white text-sm">{otherPartyName || 'Caller'} is muted</span>
              </div>
            )}
            {/* Timer for video calls */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 rounded-full px-4 py-2 z-20">
              <p className="text-white text-lg font-semibold">{formatDuration(callDuration)}</p>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {/* Hidden audio element for remote audio stream */}
            <audio
              ref={remoteAudioRef}
              autoPlay
              playsInline
              className="hidden"
            />
            <div className="text-center text-white">
              {otherPartyData ? (
                <UserAvatar 
                  user={{ username: otherPartyData.username, avatar: otherPartyData.avatar }} 
                  size="w-32 h-32" 
                  textSize="text-4xl"
                  showBorder={true}
                  className="border-4 border-white shadow-2xl mx-auto mb-4"
                />
              ) : (
                <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FaPhone className="text-6xl" />
                </div>
              )}
              <h3 className="text-3xl font-bold mb-2">{otherPartyName || 'Loading...'}</h3>
              <p className="text-xl">{formatDuration(callDuration)}</p>
              {/* Remote mute indicator for audio calls */}
              {remoteIsMuted && (
                <div className="mt-4 flex items-center justify-center gap-2 bg-black bg-opacity-50 rounded-full px-4 py-2">
                  <FaMicrophoneSlash className="text-white" />
                  <span className="text-sm">{otherPartyName || 'Caller'} is muted</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Local Video (Picture-in-Picture) - Shows remote when swapped, local when not swapped */}
        {callType === 'video' && (
          <div 
            className="absolute bottom-24 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-black z-20 cursor-pointer hover:border-blue-400 transition-all" 
            onClick={handleLocalVideoClick}
            title="Click to swap video views"
          >
            {videoSwapped ? (
              // Remote video in mini view (when swapped)
              <>
                <video
                  key="remote-small"
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={(e) => {
                    e.target.play().catch(err => console.error('Error playing remote video:', err));
                  }}
                />
                {!remoteVideoEnabled && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <FaVideoSlash className="text-white text-xl" />
                  </div>
                )}
                {/* Remote video label in mini view */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 rounded-full px-3 py-1">
                  <p className="text-white text-xs font-medium">{otherPartyName || 'Caller'}</p>
                </div>
              </>
            ) : (
              // Local video in mini view (default)
              <>
                <video
                  key="local-small"
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={(e) => {
                    e.target.play().catch(err => console.error('Error playing local video:', err));
                  }}
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <FaVideoSlash className="text-white text-xl" />
                  </div>
                )}
                {/* Local video label */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 rounded-full px-3 py-1">
                  <p className="text-white text-xs font-medium">You</p>
                </div>
              </>
            )}
            {/* Camera switch button (only show on local video) */}
            {!videoSwapped && availableCameras && availableCameras.length > 1 && (
              <div className="absolute top-2 right-2 z-30">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCameraMenu(!showCameraMenu);
                  }}
                  className="bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white transition-all"
                  title="Switch camera"
                >
                  <FaSync className="text-sm" />
                </button>
                {/* Camera selection menu - positioned above button to avoid going off-screen */}
                {showCameraMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-95 rounded-lg shadow-xl min-w-[220px] max-w-[280px] z-50 border border-white border-opacity-20">
                    <div className="py-2">
                      <div className="px-3 py-2 border-b border-white border-opacity-10">
                        <p className="text-xs font-semibold text-white text-opacity-80 uppercase tracking-wide">Select Camera</p>
                      </div>
                      {availableCameras.map((camera) => (
                        <button
                          key={camera.deviceId}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSwitchCamera(camera.deviceId);
                            setShowCameraMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm text-white hover:bg-white hover:bg-opacity-20 transition-colors ${
                            currentCameraId === camera.deviceId ? 'bg-white bg-opacity-20 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {currentCameraId === camera.deviceId && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <span className={currentCameraId === camera.deviceId ? '' : 'pl-4'}>
                              {camera.label || `Camera ${camera.deviceId.substring(0, 8)}`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Call Controls */}
      <div 
        className={`bg-black bg-opacity-70 backdrop-blur-sm p-6 transition-opacity duration-300 ${
          callType === 'video' && !controlsVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ animation: 'slideIn 0.4s ease-out' }}
        onClick={(e) => e.stopPropagation()}
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
        
        {/* Call Duration for video calls (also shown at top) */}
        {callType === 'video' && (
          <div className="text-center mt-4 text-white">
            <p className="text-lg font-semibold">{formatDuration(callDuration)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveCallModal;

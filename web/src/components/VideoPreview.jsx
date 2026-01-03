import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress
} from 'react-icons/fa';

const VideoPreview = ({ isOpen, onClose, videos = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex || 0);
      document.body.style.overflow = 'hidden';
      // Reset state on open
      setIsPlaying(true); // Attempt autoplay
      setProgress(0);
      setShowControls(true);
    } else {
      document.body.style.overflow = '';
      setIsPlaying(false);
    }
    return () => {
      document.body.style.overflow = '';
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isOpen, initialIndex]);

  // Handle auto-hide controls
  useEffect(() => {
    if (!isOpen) return;

    const resetControlsTimeout = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

      // Auto-hide after 3 seconds if playing
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    const handleActivity = () => resetControlsTimeout();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Initial trigger
    resetControlsTimeout();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isOpen, isPlaying]);

  // Play/Pause effect
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => {
          console.log("Autoplay blocked or waiting for interaction", e);
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  if (!isOpen || !videos || videos.length === 0) return null;

  const handleVideoError = () => {
    toast.error("Unable to play video. The format might not be supported.");
    setIsPlaying(false);
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 1;
      setProgress((current / total) * 100);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const seekTime = (e.target.value / 100) * (videoRef.current?.duration || 0);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
    setProgress(e.target.value);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[9999] flex items-center justify-center group"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 text-white hover:text-red-400 z-50 bg-black bg-opacity-50 rounded-full p-3 transition-all duration-300 hover:bg-opacity-90 hover:scale-110 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
      >
        <FaTimes size={20} />
      </button>

      {/* Navigation */}
      {videos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev > 0 ? prev - 1 : videos.length - 1); }}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-300 z-50 bg-black bg-opacity-50 rounded-full p-4 transition-all duration-300 hover:bg-opacity-90 hover:scale-110 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
          >
            <FaChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev < videos.length - 1 ? prev + 1 : 0); }}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-300 z-50 bg-black bg-opacity-50 rounded-full p-4 transition-all duration-300 hover:bg-opacity-90 hover:scale-110 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
              }`}
          >
            <FaChevronRight size={24} />
          </button>
        </>
      )}

      {/* Video Container */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          key={currentIndex}
          src={videos[currentIndex]}
          className="max-w-full max-h-full object-contain"
          playsInline
          onError={handleVideoError}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => { setIsPlaying(false); setShowControls(true); }}
        />
      </div>

      {/* Custom Control Bar */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-6 py-6 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        }`}>
        {/* Progress Bar */}
        <div
          className="w-full h-1.5 bg-gray-600 rounded-full mb-4 cursor-pointer relative group/slider"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            if (videoRef.current) {
              videoRef.current.currentTime = pos * videoRef.current.duration;
              setProgress(pos * 100);
            }
          }}
        >
          <div
            className=" absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
          {/* Draggable Thumb (Visual Only in this simplified version, using click mostly) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover/slider:opacity-100 transition-opacity"
            style={{ left: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
            </button>

            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors">
                {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
              </button>
            </div>

            <span className="text-white/80 text-sm font-medium">
              {formatTime(videoRef.current?.currentTime)} / {formatTime(videoRef.current?.duration)}
            </span>
          </div>

          <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
            {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;

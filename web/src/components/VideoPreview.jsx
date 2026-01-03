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
  FaCompress,
  FaSearchPlus,
  FaSearchMinus,
  FaUndo,
  FaDownload,
  FaCog,
  FaTachometerAlt,
  FaSpinner
} from 'react-icons/fa';

const VideoPreview = ({ isOpen, onClose, videos = [], initialIndex = 0 }) => {
  // Playback States
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  // View States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Transform States
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [videoDims, setVideoDims] = useState(null);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex || 0);
      document.body.style.overflow = 'hidden';
      // Reset states
      setIsLoading(true);
      setIsPlaying(true);
      setProgress(0);
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setVideoDims(null); // Reset dims
      setPlaybackRate(1);
      setShowControls(true);
      setShowSettings(false);
    } else {
      document.body.style.overflow = '';
      setIsPlaying(false);
    }
    return () => {
      document.body.style.overflow = '';
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [isOpen, initialIndex]);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input (though unlikey here)
      if (e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case ' ': // Space - Play/Pause
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight': // Forward 5s or Next video
          if (scale === 1 && videos.length > 1 && e.ctrlKey) {
            setCurrentIndex(prev => prev < videos.length - 1 ? prev + 1 : 0);
          } else if (videoRef.current) {
            videoRef.current.currentTime += 5;
          }
          break;
        case 'ArrowLeft': // Rewind 5s or Prev video
          if (scale === 1 && videos.length > 1 && e.ctrlKey) {
            setCurrentIndex(prev => prev > 0 ? prev - 1 : videos.length - 1);
          } else if (videoRef.current) {
            videoRef.current.currentTime -= 5;
          }
          break;
        case 'ArrowUp': // Volume Up or Pan Up
          if (scale > 1) {
            setPosition(p => ({ ...p, y: p.y + 20 }));
          } else {
            setVolume(v => Math.min(v + 0.1, 1));
          }
          break;
        case 'ArrowDown': // Volume Down or Pan Down
          if (scale > 1) {
            setPosition(p => ({ ...p, y: p.y - 20 }));
          } else {
            setVolume(v => Math.max(v - 0.1, 0));
          }
          break;
        case '+': // Zoom In
        case '=':
          handleZoomIn();
          break;
        case '-': // Zoom Out
          handleZoomOut();
          break;
        case '0': // Reset
          handleReset();
          break;
        case 'f': // Fullscreen
          toggleFullscreen();
          break;
        case 'Escape':
          onClose();
          break;
      }
      setShowControls(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale, videos.length]);

  // Volume Effect
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      setIsMuted(volume === 0);
    }
  }, [volume]);

  // Calculate Video Dimensions
  const updateVideoDims = () => {
    if (videoRef.current && videoRef.current.videoWidth) {
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;
      const sw = window.innerWidth;
      const sh = window.innerHeight;

      const scaleFactor = Math.min(sw / vw, sh / vh);

      setVideoDims({
        width: vw * scaleFactor,
        height: vh * scaleFactor
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateVideoDims);
    return () => window.removeEventListener('resize', updateVideoDims);
  }, []);

  // Activity Monitor (Auto-hide controls)
  useEffect(() => {
    if (!isOpen) return;
    const resetControls = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isPlaying && !showSettings && !isDragging) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
      }
    };

    // Listeners
    window.addEventListener('mousemove', resetControls);
    window.addEventListener('click', resetControls);
    window.addEventListener('keydown', resetControls);

    resetControls();

    return () => {
      window.removeEventListener('mousemove', resetControls);
      window.removeEventListener('click', resetControls);
      window.removeEventListener('keydown', resetControls);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isOpen, isPlaying, showSettings, isDragging]);

  // Playback effect
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
      if (isPlaying) {
        videoRef.current.play().catch(e => {
          console.warn("Autoplay interrupted", e);
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex, playbackRate]);

  if (!isOpen || !videos || videos.length === 0) return null;

  // Handlers
  const handleVideoError = () => {
    toast.error("Unable to play video.");
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

  const toggleMute = (e) => {
    e.stopPropagation();
    if (isMuted) {
      setVolume(1);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const toggleFullscreen = (e) => {
    e?.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    const url = videos[currentIndex];
    const filename = `video-${currentIndex + 1}.mp4`;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started");
    } catch (err) {
      // Fallback for CORS or other issues
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.info("Opened video for download");
    }
  };

  // Zoom & Pan Handlers
  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setScale(s => Math.min(s * 1.5, 5)); // Max 5x zoom
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setScale(s => Math.max(s / 1.5, 1)); // Min 1x
    if (scale <= 1.5) setPosition({ x: 0, y: 0 }); // Reset pos if zoomed out
  };

  const handleRotate = (e) => {
    e?.stopPropagation();
    setRotation(r => r + 90);
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setPlaybackRate(1);
  };

  const toggleSpeed = (e) => {
    e?.stopPropagation();
    const speeds = [0.5, 1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
    toast.info(`Playback speed: ${speeds[nextIdx]}x`, { autoClose: 1000 });
  };

  // Drag Logic
  const handleMouseDown = (e) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      className="fixed inset-0 bg-black z-[9999] flex items-center justify-center select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Controls (Close, Title?) */}
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 text-white hover:text-red-400 z-50 bg-black/50 backdrop-blur rounded-full p-3 transition-all duration-300 hover:bg-black/80 hover:scale-110 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
      >
        <FaTimes size={20} />
      </button>

      {/* Navigation */}
      {videos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev > 0 ? prev - 1 : videos.length - 1); }}
            className={`absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-blue-300 z-40 bg-black/50 backdrop-blur rounded-full p-4 hover:bg-black/80 hover:scale-110 transition-all duration-300 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
          >
            <FaChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev < videos.length - 1 ? prev + 1 : 0); }}
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-blue-300 z-40 bg-black/50 backdrop-blur rounded-full p-4 hover:bg-black/80 hover:scale-110 transition-all duration-300 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
              }`}
          >
            <FaChevronRight size={24} />
          </button>
        </>
      )}

      {/* Video Viewport */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
        onMouseDown={handleMouseDown}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full">
              <FaSpinner className="text-white animate-spin text-4xl" />
            </div>
          </div>
        )}

        {/* Big Play Button Overlay */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-full shadow-lg">
              <FaPlay className="text-white text-4xl ml-1 opacity-80" />
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          key={currentIndex}
          src={videos[currentIndex]}
          className={`shadow-xl transition-transform duration-100 ${isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-pointer'}`}
          playsInline
          preload="auto"
          autoPlay
          onLoadedMetadata={updateVideoDims}
          onLoadStart={() => setIsLoading(true)}
          onWaiting={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onCanPlay={() => setIsLoading(false)}
          onPlaying={() => setIsLoading(false)}
          onError={handleVideoError}
          onTimeUpdate={handleTimeUpdate}
          onClick={(e) => {
            e.stopPropagation(); // Stop propagation to background
            if (!isDragging) togglePlay(e);
          }}
          onEnded={() => { setIsPlaying(false); setShowControls(true); }}
          style={{
            width: videoDims ? videoDims.width : 'auto',
            height: videoDims ? videoDims.height : 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          draggable={false}
        />
      </div>

      {/* Bottom Controls Bar */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent px-4 pb-4 pt-10 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        }`}>
        <div className="w-full space-y-3">
          {/* Progress Bar */}
          <div
            className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer relative group/slider"
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
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover/slider:opacity-100 transition-opacity"
              style={{ left: `${progress}%` }}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="hover:text-blue-400 transition-transform active:scale-95">
                {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
              </button>

              <div className="flex items-center gap-2 group/vol relative">
                <button onClick={toggleMute} className="hover:text-blue-400">
                  {isMuted || volume === 0 ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
                </button>
                {/* Hidden volume slider could go here */}
              </div>

              <span className="text-xs font-mono opacity-80 select-none">
                {formatTime(videoRef.current?.currentTime)} / {formatTime(videoRef.current?.duration)}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Zoom Controls */}
              <div className="flex items-center bg-white/10 rounded-lg px-2 py-1 gap-2">
                <button onClick={handleZoomIn} title="Zoom In" className="hover:text-blue-400 text-sm"><FaSearchPlus /></button>
                <button onClick={handleZoomOut} title="Zoom Out" className="hover:text-blue-400 text-sm"><FaSearchMinus /></button>
                <button onClick={handleRotate} title="Rotate" className="hover:text-blue-400 text-sm"><FaUndo /></button>
                <button onClick={handleReset} title="Reset" className="hover:text-blue-400 text-xs font-bold px-1">1x</button>
              </div>

              <button onClick={toggleSpeed} title="Playback Speed" className="hover:text-blue-400 flex items-center gap-1 text-sm font-medium min-w-[3em]">
                <FaTachometerAlt size={14} /> {playbackRate}x
              </button>

              <button onClick={handleDownload} title="Download" className="hover:text-blue-400">
                <FaDownload size={18} />
              </button>

              <button onClick={toggleFullscreen} title="Fullscreen" className="hover:text-blue-400">
                {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;

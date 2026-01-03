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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Transform States
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [zoomMessage, setZoomMessage] = useState(null);
  const zoomTimeoutRef = useRef(null);
  const [seekFeedback, setSeekFeedback] = useState(null); // 'forward' | 'rewind' | null
  const lastTapRef = useRef(0);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const singleClickTimeoutRef = useRef(null);
  const speedTimeoutRef = useRef(null);
  const originalSpeedRef = useRef(1);
  const isSpeedingRef = useRef(false);
  const ignoreClickRef = useRef(false);
  const justClickedRef = useRef(false);
  const isTouchRef = useRef(false);
  const touchStartRef = useRef({ time: 0, x: 0, y: 0 });

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
      setPlaybackRate(1);
      setShowControls(true);
      setShowSettings(false);
      setShowCloseConfirm(false);
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

      switch (e.key.toLowerCase()) {
        case ' ': // Space - Play/Pause
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm': // Mute
          setVolume(v => {
            const newV = v === 0 ? 1 : 0;
            showFeedback(newV === 0 ? "Muted" : "Unmuted");
            return newV;
          });
          break;
        case 'ArrowRight': // Forward 10s or Next video
        case 'l': // +10s
          if (scale === 1 && videos.length > 1 && e.ctrlKey) {
            setCurrentIndex(prev => prev < videos.length - 1 ? prev + 1 : 0);
          } else if (videoRef.current) {
            videoRef.current.currentTime += 10;
          }
          break;
        case 'ArrowLeft': // Rewind 10s or Prev video
        case 'j': // -10s
          if (scale === 1 && videos.length > 1 && e.ctrlKey) {
            setCurrentIndex(prev => prev > 0 ? prev - 1 : videos.length - 1);
          } else if (videoRef.current) {
            videoRef.current.currentTime -= 10;
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
        case 'escape':
          // If in fullscreen, let browser exit (or we force exit) but DO NOT show modal
          if (document.fullscreenElement) {
            return;
          }
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
          setShowCloseConfirm(true);
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

  // Fullscreen Sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Feedback Toast Helper
  const showFeedback = (msg) => {
    setZoomMessage(msg);
    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = setTimeout(() => setZoomMessage(null), 1500);
  };

  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      if (singleClickTimeoutRef.current) clearTimeout(singleClickTimeoutRef.current);
    };
  }, []);

  // Double Tap Seek Logic
  const handleSeek = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      setSeekFeedback(seconds > 0 ? 'forward' : 'rewind');
      setTimeout(() => setSeekFeedback(null), 800);
    }
  };

  const handleVideoAreaClick = (e) => {
    // Check if we should ignore click (due to long press speed interaction)
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }

    // Block mousemove activity detection for a short while (prevents emulated mousemove from reopening controls)
    justClickedRef.current = true;
    setTimeout(() => justClickedRef.current = false, 500);

    // Detect Double Tap
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;

    if (timeDiff < 300 && timeDiff > 0) {
      // It's a double tap!
      if (singleClickTimeoutRef.current) clearTimeout(singleClickTimeoutRef.current);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      if (x > width * 0.65) {
        // Right side (last 35%) -> Forward 10s
        handleSeek(10);
      } else if (x < width * 0.35) {
        // Left side (first 35%) -> Rewind 10s
        handleSeek(-10);
      }
    } else {
      // Potential Single Tap - Toggle Controls
      if (singleClickTimeoutRef.current) clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = setTimeout(() => {
        if (!isDragging && scale === 1) setShowControls(prev => !prev);
      }, 300);
    }

    lastTapRef.current = now;
  };

  // Activity Monitor (User Input - Keydown Only)
  useEffect(() => {
    if (!isOpen) return;

    const handleActivity = () => {
      setShowControls(true);
    };

    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isOpen]);

  // Auto-Hide Controls Logic
  useEffect(() => {
    if (showControls && isPlaying && !showSettings && !isDragging) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    } else {
      // If paused or dragging, clear timeout (keep controls visible)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, isPlaying, showSettings, isDragging]);

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
      showFeedback("Unmuted");
    } else {
      setVolume(0);
      showFeedback("Muted");
    }
  };

  const toggleFullscreen = (e) => {
    e?.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
      showFeedback("Fullscreen");
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      showFeedback("Exit Fullscreen");
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    const url = videos[currentIndex];
    const filename = `video-${currentIndex + 1}.mp4`;

    showFeedback("Downloading...");

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
    } catch (err) {
      // Fallback
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    const newScale = Math.min(scale * 1.5, 5);
    setScale(newScale);
    showFeedback(`${Math.round(newScale * 100)}%`);
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    let newScale = Math.max(scale / 1.5, 1);
    // Snap to 1 if close
    if (newScale < 1.1) newScale = 1;

    setScale(newScale);
    showFeedback(`${Math.round(newScale * 100)}%`);

    if (newScale <= 1.5) setPosition({ x: 0, y: 0 }); // Reset pos if zoomed out
  };

  const handleRotate = (e) => {
    e?.stopPropagation();
    setRotation(r => {
      const newR = r + 90;
      showFeedback(`${newR}°`);
      return newR;
    });
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setPlaybackRate(1);
    showFeedback("Reset");
  };

  const toggleSpeed = (e) => {
    e?.stopPropagation();
    const speeds = [0.5, 1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
    showFeedback(`${speeds[nextIdx]}x Speed`);
  };

  const handleCloseRequest = (e) => {
    e?.stopPropagation();

    // If in fullscreen, exit fullscreen first
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.warn(err));
      // Listener will update state
      return;
    }

    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowCloseConfirm(true);
  };

  const confirmClose = (e) => {
    e?.stopPropagation();
    setShowCloseConfirm(false);
    onClose();
  };

  const cancelClose = (e) => {
    e?.stopPropagation();
    setShowCloseConfirm(false);
  };

  // Drag & Speed Logic
  const handleMouseDown = (e) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    } else {
      // Speed Logic (Long Press)
      originalSpeedRef.current = playbackRate;
      speedTimeoutRef.current = setTimeout(() => {
        isSpeedingRef.current = true;
        setPlaybackRate(2.0);
        showFeedback("2x Speed");
      }, 500);
    }
  };

  const handleMouseMove = (e) => {
    // Activity Monitor (Desktop)
    if (!justClickedRef.current && !isTouchRef.current) {
      setShowControls(true);
    }

    if (isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    if (speedTimeoutRef.current) clearTimeout(speedTimeoutRef.current);

    if (isSpeedingRef.current) {
      // Revert speed
      setPlaybackRate(originalSpeedRef.current);
      isSpeedingRef.current = false;
      ignoreClickRef.current = true; // Prevent click from toggling controls
      showFeedback(`${originalSpeedRef.current}x Speed`); // Optional confirmation
    }

    setIsDragging(false);
  };

  // Touch Logic
  const handleTouchStart = (e) => {
    isTouchRef.current = true;
    if (speedTimeoutRef.current) clearTimeout(speedTimeoutRef.current);
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
      } else {
        touchStartRef.current = { time: Date.now(), x: touch.clientX, y: touch.clientY };
        originalSpeedRef.current = playbackRate;
        speedTimeoutRef.current = setTimeout(() => {
          isSpeedingRef.current = true;
          setPlaybackRate(2.0);
          showFeedback("2x Speed");
          ignoreClickRef.current = true;
        }, 500);
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (isDragging && scale > 1) {
        e.preventDefault();
        setPosition({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
      } else if (speedTimeoutRef.current && !isSpeedingRef.current) {
        const dist = Math.abs(touch.clientX - touchStartRef.current.x) + Math.abs(touch.clientY - touchStartRef.current.y);
        if (dist > 10) {
          clearTimeout(speedTimeoutRef.current);
          speedTimeoutRef.current = null;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (speedTimeoutRef.current) clearTimeout(speedTimeoutRef.current);
    if (isSpeedingRef.current) {
      setPlaybackRate(originalSpeedRef.current);
      isSpeedingRef.current = false;
      showFeedback(`${originalSpeedRef.current}x Speed`);
    }
    setIsDragging(false);
    setTimeout(() => { isTouchRef.current = false; }, 500);
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
      className="fixed inset-0 bg-black z-[9999] flex items-center justify-center select-none touch-none"
      onContextMenu={(e) => e.preventDefault()}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Controls (Close, Title?) */}
      <button
        onClick={handleCloseRequest}
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
        className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black group"
        onMouseDown={handleMouseDown}
        onClick={handleVideoAreaClick}
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
          className={`w-full h-full object-contain transition-transform duration-100 ${isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-pointer'}`}
          playsInline
          preload="auto"
          autoPlay
          onLoadStart={() => setIsLoading(true)}
          onWaiting={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onCanPlay={() => setIsLoading(false)}
          onPlaying={() => setIsLoading(false)}
          onError={handleVideoError}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => { setIsPlaying(false); setShowControls(true); }}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          draggable={false}
        />

        {/* Seek Feedback Overlays */}
        {seekFeedback === 'rewind' && (
          <div className="absolute left-10 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center text-white bg-black/50 p-6 rounded-full animate-ping-once backdrop-blur-sm">
            <FaUndo className="text-3xl mb-1" />
            <span className="font-bold text-sm">-10s</span>
          </div>
        )}
        {seekFeedback === 'forward' && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center text-white bg-black/50 p-6 rounded-full animate-ping-once backdrop-blur-sm">
            <FaUndo className="text-3xl mb-1 transform scale-x-[-1]" />
            <span className="font-bold text-sm">+10s</span>
          </div>
        )}

        {/* Central Play/Pause Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay(e);
            }}
            className={`pointer-events-auto transform transition-all duration-300 bg-black/60 backdrop-blur-sm p-6 rounded-full text-white hover:scale-110 shadow-2xl ${
              // Show if (paused AND NOT loaded) OR (playing AND controls visible AND NOT loading)
              // Actually, simply: Hide if loading. Show if Paused. Show if Playing & Controls Visible.
              (isLoading) ? 'opacity-0 scale-90 pointer-events-none' :
                (!isPlaying || showControls)
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-90 pointer-events-none'
              }`}
          >
            {isPlaying && !isLoading ? (
              <FaPause className="text-4xl" />
            ) : (
              <FaPlay className="text-4xl pl-2" />
            )}
          </button>
        </div>

        {/* Zoom Indicator Toast */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none transition-opacity duration-300 ${zoomMessage ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-black/70 backdrop-blur-md text-white text-3xl font-bold px-6 py-4 rounded-xl shadow-2xl">
            {zoomMessage}
          </div>
        </div>
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
                {isPlaying && !isLoading ? <FaPause size={20} /> : <FaPlay size={20} />}
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

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div
          className="absolute inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={cancelClose}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform scale-100 transition-all border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Close Video?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to close the video player?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmClose}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-red-500/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;

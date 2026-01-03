import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const VideoPreview = ({ isOpen, onClose, videos = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex || 0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  if (!isOpen || !videos || videos.length === 0) return null;

  const handleVideoError = () => {
    toast.error("Unable to play video. The format might not be supported.");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-red-400 z-10 bg-black bg-opacity-70 rounded-full p-3 transition-all duration-300 hover:bg-opacity-90 hover:scale-110"
        aria-label="Close"
      >
        <FaTimes size={20} />
      </button>

      {/* Navigation */}
      {videos.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : videos.length - 1)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-300 z-10 bg-black bg-opacity-70 rounded-full p-4 transition-all duration-300 hover:bg-opacity-90 hover:scale-110"
            aria-label="Previous"
          >
            <FaChevronLeft size={24} />
          </button>
          <button
            onClick={() => setCurrentIndex(prev => prev < videos.length - 1 ? prev + 1 : 0)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-300 z-10 bg-black bg-opacity-70 rounded-full p-4 transition-all duration-300 hover:bg-opacity-90 hover:scale-110"
            aria-label="Next"
          >
            <FaChevronRight size={24} />
          </button>
        </>
      )}

      {/* Video Container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <video
          key={currentIndex}
          src={videos[currentIndex]}
          className="max-w-full max-h-full object-contain rounded shadow-2xl"
          controls
          autoPlay
          playsInline
          onError={handleVideoError}
          style={{ maxHeight: '90vh' }}
        />
      </div>
    </div>
  );
};

export default VideoPreview;

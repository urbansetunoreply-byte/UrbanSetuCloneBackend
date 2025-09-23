import React, { useEffect } from 'react';

const VideoPreview = ({ isOpen, onClose, videos = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex || 0);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-red-400 z-10 bg-black bg-opacity-70 rounded-full p-3 transition-all duration-300 hover:bg-opacity-90 hover:scale-110"
        aria-label="Close"
      >
        ✕
      </button>
      {videos.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : videos.length - 1)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-300 z-10 bg-black bg-opacity-70 rounded-full p-4 transition-all duration-300 hover:bg-opacity-90 hover:scale-110"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentIndex(prev => prev < videos.length - 1 ? prev + 1 : 0)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-300 z-10 bg-black bg-opacity-70 rounded-full p-4 transition-all duration-300 hover:bg-opacity-90 hover:scale-110"
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}
      <div className="relative max-w-full max-h-full w-full h-full flex items-center justify-center p-4">
        <video
          key={currentIndex}
          src={videos[currentIndex]}
          className="w-full h-full max-h-[90vh] object-contain rounded"
          controls
          autoPlay
        />
      </div>
    </div>
  );
};

export default VideoPreview;


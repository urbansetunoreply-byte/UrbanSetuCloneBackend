import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaTimes, FaCamera, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const SimpleCamera = ({ isOpen, onClose, onCapture }) => {
  const [cameraFacingMode, setCameraFacingMode] = useState('user');
  const [cameraError, setCameraError] = useState(null);
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
  
  const cameraStreamRef = useRef(null);
  const cameraVideoRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      
      const constraints = { video: { facingMode: cameraFacingMode } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      setCameraError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Camera not available or permission denied');
      toast.error('Camera not available or permission denied');
    }
  }, [cameraFacingMode]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!cameraVideoRef.current) return;
    
    const canvas = document.createElement('canvas');
    const video = cameraVideoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedPhotoBlob(blob);
        setCapturedPhotoUrl(URL.createObjectURL(blob));
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const switchCamera = useCallback(() => {
    setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const retakePhoto = useCallback(() => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoBlob(null);
    setCapturedPhotoUrl(null);
    startCamera();
  }, [capturedPhotoUrl, startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedPhotoBlob && onCapture) {
      const file = new File([capturedPhotoBlob], `camera-photo-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      onCapture(file);
    }
    onClose();
  }, [capturedPhotoBlob, onCapture, onClose]);

  useEffect(() => {
    if (isOpen && !capturedPhotoBlob) {
      startCamera();
    }
    return () => {
      if (!isOpen) {
        stopCamera();
        if (capturedPhotoUrl) {
          URL.revokeObjectURL(capturedPhotoUrl);
        }
      }
    };
  }, [isOpen, startCamera, stopCamera, capturedPhotoBlob, capturedPhotoUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Camera</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          {cameraError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : capturedPhotoBlob ? (
            <div className="text-center">
              <img
                src={capturedPhotoUrl}
                alt="Captured"
                className="w-full max-h-64 object-contain rounded mb-4"
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={retakePhoto}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
                >
                  <FaSyncAlt className="w-4 h-4" />
                  Retake
                </button>
                <button
                  onClick={confirmPhoto}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                >
                  <FaCamera className="w-4 h-4" />
                  Use Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                className="w-full max-h-64 object-cover rounded mb-4"
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={switchCamera}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
                >
                  <FaSyncAlt className="w-4 h-4" />
                  Switch Camera
                </button>
                <button
                  onClick={capturePhoto}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                >
                  <FaCamera className="w-4 h-4" />
                  Capture
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleCamera;

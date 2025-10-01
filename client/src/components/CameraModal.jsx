import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const CameraModal = ({ isOpen, onClose }) => {
  const [cameraFacingMode, setCameraFacingMode] = useState('user');
  const cameraStreamRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);

  // Camera functions
  const startCamera = useCallback(async () => {
    console.log('Starting camera with facing mode:', cameraFacingMode);
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      const constraints = { video: { facingMode: cameraFacingMode } };
      console.log('Requesting camera access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', stream);
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await new Promise(r => setTimeout(r, 100));
        await cameraVideoRef.current.play().catch(() => {});
        console.log('Camera video element updated');
      }
      setCameraError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Camera not available or permission denied. Try switching camera or attach from gallery.');
    }
  }, [cameraFacingMode]);

  const switchCamera = () => {
    setCameraFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    setTimeout(() => startCamera(), 50);
  };

  const capturePhoto = async () => {
    try {
      const video = cameraVideoRef.current;
      if (!video) return;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) return;
      
      try { video.pause(); } catch (_) {}
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
      setCapturedPhotoBlob(blob);
      const url = URL.createObjectURL(blob);
      setCapturedPhotoUrl(url);
    } catch (err) {
      console.error('Capture error:', err);
      setCameraError('Failed to capture photo');
    }
  };

  const retryCapturedPhoto = () => {
    if (capturedPhotoUrl) URL.revokeObjectURL(capturedPhotoUrl);
    setCapturedPhotoUrl(null);
    setCapturedPhotoBlob(null);
    setCameraError(null);
    setTimeout(() => startCamera(), 50);
  };

  const confirmCapturedPhoto = () => {
    if (!capturedPhotoBlob) return;
    const file = new File([capturedPhotoBlob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
    // This would be passed back to parent component
    console.log('Photo captured:', file);
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (capturedPhotoUrl) {
        URL.revokeObjectURL(capturedPhotoUrl);
      }
    };
  }, [capturedPhotoUrl]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedPhotoBlob) {
      startCamera();
    }
    return () => {
      if (!isOpen && cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [isOpen, startCamera, capturedPhotoBlob]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-medium text-gray-700">Camera</span>
          <button
            onClick={() => {
              onClose();
              setCameraError(null);
              if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach(t => t.stop());
              }
              if (capturedPhotoUrl) {
                URL.revokeObjectURL(capturedPhotoUrl);
              }
              setCapturedPhotoUrl(null);
              setCapturedPhotoBlob(null);
            }}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 bg-black rounded-lg overflow-hidden flex items-center justify-center">
            {!capturedPhotoUrl ? (
              <video ref={cameraVideoRef} className="w-full h-full object-contain bg-black" autoPlay playsInline muted />
            ) : (
              <img src={capturedPhotoUrl} alt="Captured" className="w-full h-full object-contain bg-black" />
            )}
          </div>
          <div className="col-span-1 flex flex-col gap-3">
            {!capturedPhotoUrl ? (
              <>
                <button onClick={capturePhoto} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Capture</button>
                <button onClick={switchCamera} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Switch Camera</button>
                <button 
                  onClick={() => {
                    onClose();
                    setCameraError(null);
                    if (cameraStreamRef.current) {
                      cameraStreamRef.current.getTracks().forEach(t => t.stop());
                    }
                  }} 
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Cancel
                </button>
                {cameraError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{cameraError}</div>
                )}
                <div className="text-xs text-gray-500">Preview will open after capture where you can add captions and send.</div>
              </>
            ) : (
              <>
                <button onClick={confirmCapturedPhoto} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">OK</button>
                <button onClick={retryCapturedPhoto} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Retry</button>
                <button 
                  onClick={() => {
                    onClose();
                    setCameraError(null);
                    if (cameraStreamRef.current) {
                      cameraStreamRef.current.getTracks().forEach(t => t.stop());
                    }
                    if (capturedPhotoUrl) {
                      URL.revokeObjectURL(capturedPhotoUrl);
                    }
                    setCapturedPhotoUrl(null);
                    setCapturedPhotoBlob(null);
                  }} 
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Cancel
                </button>
                <div className="text-xs text-gray-500">Tap OK to open preview and add caption.</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;

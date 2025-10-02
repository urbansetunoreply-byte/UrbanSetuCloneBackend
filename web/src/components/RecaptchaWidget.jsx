import React, { useRef, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { getCurrentCaptchaConfig, validateCaptchaConfig } from '../config/recaptcha';

const RecaptchaWidget = ({ 
  onVerify, 
  onExpire, 
  onError, 
  disabled = false,
  className = "",
  size = "normal",
  theme = "light"
}) => {
  const recaptchaRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  const config = getCurrentCaptchaConfig();
  
  useEffect(() => {
    // Validate configuration on mount
    if (!validateCaptchaConfig()) {
      setError('reCAPTCHA configuration is missing. Please contact support.');
      return;
    }
    
    setIsLoaded(true);
  }, []);
  
  const handleVerify = (token) => {
    if (token) {
      setError(null);
      onVerify(token);
    }
  };
  
  const handleExpire = () => {
    setError('reCAPTCHA expired. Please verify again.');
    onExpire?.();
  };
  
  const handleError = (error) => {
    console.error('reCAPTCHA Error:', error);
    setError('reCAPTCHA verification failed. Please try again.');
    onError?.(error);
  };
  
  const reset = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };
  
  // Expose reset method to parent
  React.useImperativeHandle(recaptchaRef, () => ({
    reset
  }));
  
  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading reCAPTCHA...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setIsLoaded(false);
            setTimeout(() => setIsLoaded(true), 100);
          }}
          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (config === getCurrentCaptchaConfig() && config.SITE_KEY) {
    return (
      <div className={className}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={config.SITE_KEY}
          onChange={handleVerify}
          onExpired={handleExpire}
          onErrored={handleError}
          size={size}
          theme={theme}
          disabled={disabled}
          {...config.OPTIONS}
        />
      </div>
    );
  }
  
  return null;
};

export default RecaptchaWidget;

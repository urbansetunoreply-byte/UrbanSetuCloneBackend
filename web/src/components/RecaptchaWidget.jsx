import React, { useRef, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { getCurrentCaptchaConfig, validateCaptchaConfig } from '../config/recaptcha';

const RecaptchaWidget = ({
  onVerify,
  onExpire,
  onError,
  disabled = false,
  className = "",
  size = "normal"
}) => {
  const recaptchaRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [activeTheme, setActiveTheme] = useState('light');

  const config = getCurrentCaptchaConfig();

  // Helper to determine the effective theme
  const getEffectiveTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    if (savedTheme === 'dark') return 'dark';
    if (savedTheme === 'light') return 'light';
    // Handle 'system'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  useEffect(() => {
    // Validate configuration on mount
    if (!validateCaptchaConfig()) {
      setError('reCAPTCHA configuration is missing. Please contact support.');
      return;
    }

    // Set initial theme
    setActiveTheme(getEffectiveTheme());

    // Listen for theme changes from ThemeToggle
    const handleThemeChange = (e) => {
      const newTheme = e.detail.theme;
      if (newTheme === 'dark') {
        setActiveTheme('dark');
      } else if (newTheme === 'light') {
        setActiveTheme('light');
      } else {
        // System preference
        setActiveTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      }
    };

    // Also listen for system preference changes if theme is set to 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      const savedTheme = localStorage.getItem('theme') || 'system';
      if (savedTheme === 'system') {
        setActiveTheme(e.matches ? 'dark' : 'light');
      }
    };

    window.addEventListener('theme-change', handleThemeChange);
    mediaQuery.addEventListener('change', handleSystemChange);

    setIsLoaded(true);

    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
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
      <div className={`flex items-center justify-center p-4 ${className} dark:bg-gray-800 transition-colors`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading reCAPTCHA...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setIsLoaded(false);
            setTimeout(() => setIsLoaded(true), 100);
          }}
          className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (config === getCurrentCaptchaConfig() && config.SITE_KEY) {
    return (
      <div className={`${className} transition-opacity duration-300`} key={activeTheme}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={config.SITE_KEY}
          onChange={handleVerify}
          onExpired={handleExpire}
          onErrored={handleError}
          size={size}
          theme={activeTheme}
          disabled={disabled}
          {...config.OPTIONS}
        />
      </div>
    );
  }

  return null;
};

export default RecaptchaWidget;

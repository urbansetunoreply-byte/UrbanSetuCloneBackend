import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCookie, FaTimes, FaCog, FaCheck, FaTimes as FaX } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show consent banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500); // Increased delay for better opening animation
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const savedPreferences = JSON.parse(cookieConsent);
      setPreferences(savedPreferences);
    }
  }, []);

  // Independent visitor tracking: count visitor once per day even without consent
  useEffect(() => {
    const trackIfNeeded = async () => {
      try {
        const todayKey = `visitor_tracked_${new Date().toISOString().slice(0,10)}`;
        if (localStorage.getItem(todayKey) === '1') return;
        // Fire-and-forget minimal tracking with necessary-only defaults
        await fetch(`${API_BASE_URL}/api/visitors/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cookiePreferences: { necessary: true, analytics: false, marketing: false, functional: false },
            referrer: document.referrer || 'Direct',
            page: window.location.pathname
          })
        });
        localStorage.setItem(todayKey, '1');
        // Let other components refresh counts
        window.dispatchEvent(new CustomEvent('visitorTracked'));
      } catch (_) {}
    };
    trackIfNeeded();
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showSettings) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Cleanup function
      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showSettings]);

  // Listen for custom event to open cookie settings from footer
  useEffect(() => {
    const handleOpenCookieSettings = () => {
      setShowSettings(true);
    };

    window.addEventListener('openCookieSettings', handleOpenCookieSettings);
    
    return () => {
      window.removeEventListener('openCookieSettings', handleOpenCookieSettings);
    };
  }, []);

  // Track visitor with cookie preferences
  const trackVisitor = async (preferences) => {
    try {
      await fetch(`${API_BASE_URL}/api/visitors/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cookiePreferences: preferences,
          referrer: document.referrer || 'Direct',
          page: window.location.pathname
        })
      });
      
      // Notify other components that a visitor was tracked
      window.dispatchEvent(new CustomEvent('visitorTracked'));
    } catch (error) {
      console.error('Failed to track visitor:', error);
      // Don't block user experience if tracking fails
    }
  };

  const handleAcceptAll = async () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    
    // Track visitor
    await trackVisitor(allAccepted);
    
    closeBanner();
    
    // Notify other components about the consent update
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: { consent: allAccepted } 
    }));
    
    // Initialize analytics and other services
    initializeServices(allAccepted);
  };

  const handleRejectAll = async () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    setPreferences(onlyNecessary);
    localStorage.setItem('cookieConsent', JSON.stringify(onlyNecessary));
    
    // Track visitor
    await trackVisitor(onlyNecessary);
    
    closeBanner();
    
    // Notify other components about the consent update
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: { consent: onlyNecessary } 
    }));
  };

  const handleSavePreferences = async () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    
    // Track visitor
    await trackVisitor(preferences);
    
    closeBanner();
    
    // Notify other components about the consent update
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: { consent: preferences } 
    }));
    
    // Initialize services based on preferences
    initializeServices(preferences);
  };

  const closeBanner = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setShowSettings(false);
      setIsClosing(false);
    }, 300); // Animation duration
  };

  const handlePreferenceChange = (category) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const initializeServices = (prefs) => {
    // Initialize Google Analytics if analytics is enabled
    if (prefs.analytics) {
      // Add your Google Analytics initialization code here
      console.log('Analytics cookies enabled');
    }

    // Initialize marketing tools if marketing is enabled
    if (prefs.marketing) {
      // Add your marketing tools initialization code here
      console.log('Marketing cookies enabled');
    }

    // Initialize functional services if functional is enabled
    if (prefs.functional) {
      // Add your functional services initialization code here
      console.log('Functional cookies enabled');
    }
  };

  const openSettings = () => {
    setShowSettings(true);
    // Don't close the main banner immediately, let user see the transition
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  // Render only when banner visible or settings modal explicitly opened
  if (!isVisible && !showSettings) return null;

  return (
    <>
      {/* Main Consent Banner */}
      {!showSettings && isVisible && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl transition-all duration-300 ${
          isClosing 
            ? 'opacity-0 translate-y-full' 
            : 'opacity-100 translate-y-0'
        }`}>
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              {/* Cookie Icon and Title */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="p-2 bg-amber-100 rounded-full">
                  <FaCookie className="text-2xl text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">We use cookies</h3>
                  <p className="text-sm text-gray-600">to enhance your experience and analyze our traffic</p>
                </div>
              </div>

              {/* Description */}
              <div className="flex-1 text-sm text-gray-700">
                <p>
                  We use cookies to personalize content and ads, provide social media features, 
                  and analyze our traffic. We also share information about your use of our site 
                  with our social media, advertising, and analytics partners.
                </p>
                <p className="mt-2">
                  <Link 
                    to="/cookie-policy" 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Learn more about our cookie policy
                  </Link>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <button
                  onClick={openSettings}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FaCog className="text-sm" />
                  Manage
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={closeSettings}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <FaCookie className="text-xl text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Cookie Preferences</h2>
              </div>
              <button
                onClick={closeSettings}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <p className="text-sm text-gray-600">
                We use different types of cookies to optimize your experience on our platform. 
                You can choose which categories you'd like to allow.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <Link 
                  to="/cookie-policy" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Read our detailed cookie policy
                </Link>
              </p>

              {/* Cookie Categories */}
              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Necessary Cookies</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        These cookies are essential for the website to function properly. 
                        They cannot be disabled.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                        <FaCheck className="text-white text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Analytics Cookies</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        These cookies help us understand how visitors interact with our website 
                        by collecting and reporting information anonymously.
                      </p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('analytics')}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                        preferences.analytics 
                          ? 'bg-blue-500 justify-end' 
                          : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full mx-1" />
                    </button>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Marketing Cookies</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        These cookies are used to track visitors across websites to display 
                        relevant and engaging advertisements.
                      </p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('marketing')}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                        preferences.marketing 
                          ? 'bg-blue-500 justify-end' 
                          : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full mx-1" />
                    </button>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Functional Cookies</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        These cookies enable enhanced functionality and personalization, 
                        such as remembering your preferences.
                      </p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('functional')}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                        preferences.functional 
                          ? 'bg-blue-500 justify-end' 
                          : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full mx-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleRejectAll}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex-1"
                >
                  Save Preferences
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Settings, Check, Shield, BarChart, FileText, ChevronRight } from 'lucide-react';

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
      }, 1000);
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
        const todayKey = `visitor_tracked_${new Date().toISOString().slice(0, 10)}`;
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
      } catch (_) { }
    };
    trackIfNeeded();
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showSettings) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
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
        <BannerWrapper isClosing={isClosing}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg transform -rotate-12">
                  <Cookie className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">We value your privacy</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                <Link to="/cookie-policy" className="text-blue-600 hover:text-blue-700 font-semibold ml-1 inline-flex items-center gap-0.5 group">
                  Read Policy <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto min-w-fit">
              <button
                onClick={openSettings}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" /> Manage
              </button>
              <button
                onClick={handleRejectAll}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              >
                Accept All
              </button>
            </div>
          </div>
        </BannerWrapper>
      )}

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeSettings}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-zoom-in-up border border-gray-100">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Cookie Preferences</h2>
              </div>
              <button
                onClick={closeSettings}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-8">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-gray-600 leading-relaxed text-sm">
                  When you visit our website, we store cookies on your browser to collect information. The information collected might relate to you, your preferences or your device, and is mostly used to make the site work as you expect it to and to provide a more personalized web experience.
                </p>
              </div>

              {/* Cookie Categories */}
              <div className="space-y-4">
                {/* Necessary Cookies */}
                <PreferenceToggle
                  title="Necessary Cookies"
                  description="Essential for the website's core functionality. These cannot be disabled."
                  icon={<Shield className="w-5 h-5 text-green-600" />}
                  isEnabled={preferences.necessary}
                  isLocked={true}
                  onChange={() => { }}
                />

                {/* Analytics Cookies */}
                <PreferenceToggle
                  title="Analytics Cookies"
                  description="Help us improve our website by collecting and reporting information on its usage."
                  icon={<BarChart className="w-5 h-5 text-blue-600" />}
                  isEnabled={preferences.analytics}
                  onChange={() => handlePreferenceChange('analytics')}
                />

                {/* Marketing Cookies */}
                <PreferenceToggle
                  title="Marketing Cookies"
                  description="Used to track visitors across websites to allow publishers to display relevant ads."
                  icon={<FileText className="w-5 h-5 text-purple-600" />}
                  isEnabled={preferences.marketing}
                  onChange={() => handlePreferenceChange('marketing')}
                />

                {/* Functional Cookies */}
                <PreferenceToggle
                  title="Functional Cookies"
                  description="Allow the website to remember choices you make (such as your user name, language or the region you are in)."
                  icon={<Settings className="w-5 h-5 text-orange-600" />}
                  isEnabled={preferences.functional}
                  onChange={() => handlePreferenceChange('functional')}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 p-6 flex flex-col md:flex-row gap-4">
              <button
                onClick={handleRejectAll}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors md:flex-1"
              >
                Reject All
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors md:flex-[2] shadow-lg shadow-blue-600/20"
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors md:flex-1 shadow-lg shadow-green-600/20"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper Components
const BannerWrapper = ({ children, isClosing }) => (
  <div className={`fixed bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-[90] bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-2xl rounded-2xl p-6 transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isClosing ? 'opacity-0 translate-y-20 scale-95' : 'opacity-100 translate-y-0 scale-100'
    }`}>
    {children}
  </div>
);

const PreferenceToggle = ({ title, description, icon, isEnabled, isLocked, onChange }) => (
  <div className="group border border-gray-100 hover:border-blue-100 bg-white p-5 rounded-2xl transition-all duration-200 hover:shadow-md">
    <div className="flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${isEnabled ? 'bg-blue-50' : 'bg-gray-50'} transition-colors`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{title}</h3>
          <button
            onClick={onChange}
            disabled={isLocked}
            className={`relative w-12 h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'
              } ${isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

export default CookieConsent;
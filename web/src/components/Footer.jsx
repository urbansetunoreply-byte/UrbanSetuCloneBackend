import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaHome, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCookie, FaShieldAlt, FaFileContract, FaTimes, FaCog, FaCheck, FaEye } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Footer = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dailyVisitorCount, setDailyVisitorCount] = useState(0);

  // Fetch daily visitor count
  useEffect(() => {
    const fetchDailyVisitorCount = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/visitors/count/daily`);
        const data = await res.json();
        if (data.success) {
          setDailyVisitorCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch daily visitor count:', error);
      }
    };

    fetchDailyVisitorCount();

    // Refresh count every 5 minutes
    const interval = setInterval(fetchDailyVisitorCount, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if user has already made a cookie choice
    const checkCookieConsent = () => {
      const cookieConsent = localStorage.getItem('cookieConsent');
      if (!cookieConsent) {
        // Show cookie banner in footer if no choice has been made
        setShowCookieBanner(true);
      } else {
        // Hide banner if consent has been given
        setShowCookieBanner(false);
      }
    };

    // Initial check
    checkCookieConsent();

    // Listen for localStorage changes
    const handleStorageChange = (e) => {
      if (e.key === 'cookieConsent') {
        checkCookieConsent();
      }
    };

    // Listen for custom events from CookieConsent component
    const handleCookieConsentUpdated = () => {
      checkCookieConsent();
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cookieConsentUpdated', handleCookieConsentUpdated);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cookieConsentUpdated', handleCookieConsentUpdated);
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
      // Refresh visitor count after tracking
      const res = await fetch(`${API_BASE_URL}/api/visitors/count/daily`);
      const data = await res.json();
      if (data.success) {
        setDailyVisitorCount(data.count);
      }
    } catch (error) {
      console.error('Failed to track visitor:', error);
    }
  };

  const handleAcceptAll = async () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    
    // Track visitor
    await trackVisitor(allAccepted);
    
    // Notify other components about the consent update
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: { consent: allAccepted } 
    }));
    
    closeBanner();
  };

  const handleRejectAll = async () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    localStorage.setItem('cookieConsent', JSON.stringify(onlyNecessary));
    
    // Track visitor
    await trackVisitor(onlyNecessary);
    
    // Notify other components about the consent update
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: { consent: onlyNecessary } 
    }));
    
    closeBanner();
  };

  const handleManage = () => {
    // Trigger the main cookie consent modal
    window.dispatchEvent(new CustomEvent('openCookieSettings'));
    // Don't close footer banner immediately - let it close when user makes a choice
  };

  const closeBanner = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowCookieBanner(false);
      setIsClosing(false);
    }, 300); // Animation duration
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className={`bg-amber-600 border-b border-amber-500 transition-all duration-300 ${isClosing ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}`}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Cookie Icon and Message */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="p-1 bg-amber-100 rounded-full">
                  <FaCookie className="text-lg text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    We use cookies to enhance your experience
                  </p>
                  <p className="text-xs text-amber-100">
                    By continuing to use our site, you agree to our use of cookies.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <button
                  onClick={handleManage}
                  className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-white hover:bg-amber-50 rounded-md transition-colors flex items-center gap-1"
                >
                  <FaCog className="text-xs" />
                  Manage
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-white hover:bg-amber-50 rounded-md transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-md transition-colors flex items-center gap-1"
                >
                  <FaCheck className="text-xs" />
                  Accept All
                </button>
                <button
                  onClick={closeBanner}
                  className="p-1.5 text-amber-200 hover:text-white hover:bg-amber-700 rounded-md transition-colors"
                  title="Close"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <FaHome className="text-xl text-gray-900" />
              </div>
              <h3 className="text-xl font-bold">UrbanSetu</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Your trusted partner in finding the perfect property. 
              We make real estate simple, smart, and secure.
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <FaPhone className="text-yellow-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-yellow-400" />
                <span>info@urbansetu.com</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-yellow-400" />
                <span>123 Real Estate Ave, City, State 12345</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Search Properties
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/user/create-listing" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  List Property
                </Link>
              </li>
              <li>
                <Link to="/user/appointment" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link to="/user/ai" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link to="/user/route-planner" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Route Planner
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Privacy */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal & Privacy</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <FaFileContract className="text-xs" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <FaShieldAlt className="text-xs" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to={
                    currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                      ? "/admin/cookie-policy"
                      : currentUser
                      ? "/user/cookie-policy"
                      : "/cookie-policy"
                  } 
                  className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-2"
                >
                  <FaCookie className="text-xs" />
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-600">
                <FaEye className="text-blue-400" />
                <span className="text-gray-300">
                  Today's Visitors: <span className="font-semibold text-blue-400">{dailyVisitorCount}</span>
                </span>
              </div>
              <span>Made with ❤️ for real estate</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
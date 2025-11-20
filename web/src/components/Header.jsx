import React, { useEffect, useState, useRef } from "react";
import { FaSearch, FaHome, FaInfoCircle, FaCompass, FaPlus, FaList, FaHeart, FaMoneyCheckAlt, FaCalendarAlt, FaSignOutAlt, FaStar, FaBars, FaTimes, FaTrash, FaTools, FaRoute, FaDownload, FaMobile, FaBookOpen, FaQuestionCircle } from "react-icons/fa";
import UserAvatar from "./UserAvatar";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { signoutUserSuccess } from "../redux/user/userSlice.js";
import NotificationBell from "./NotificationBell.jsx";
import { persistor } from '../redux/store';
import { reconnectSocket, socket } from "../utils/socket";
import { toast } from 'react-toastify';
import { downloadAndroidApp, isAndroidDevice, isMobileDevice, getDownloadMessage, getDownloadButtonText } from '../utils/androidDownload';
import { useSignout } from '../hooks/useSignout';
import SearchSuggestions from './SearchSuggestions';
import { LogIn } from "lucide-react";
import { UserPlus, LogOut } from "lucide-react";

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signout, isSigningOut } = useSignout();
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setFadeIn(true);
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get("searchTerm");
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [location.search]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      // Save previous body styles
      const prevOverflow = document.body.style.overflow;
      const prevPosition = document.body.style.position;
      const prevWidth = document.body.style.width;
      const prevTop = document.body.style.top;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.classList.add('mobile-menu-open');
      
      // Cleanup function
      return () => {
        const scrollY = document.body.style.top;
        document.body.style.overflow = prevOverflow;
        document.body.style.position = prevPosition;
        document.body.style.width = prevWidth;
        document.body.style.top = prevTop;
        document.body.classList.remove('mobile-menu-open');
        
        // Restore scroll position
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      };
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.classList.remove('mobile-menu-open');
    };
  }, [mobileMenuOpen]);

  // Function to get header gradient based on current route
  const getHeaderGradient = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);

    // List of known routes (prefixes)
    const knownRoutes = [
      "/sign-in", "/sign-up", "/forgot-password", "/about", "/search", "/oauth",
      "/user", "/user/home", "/user/about", "/user/search", "/user/profile", "/user/create-listing", "/user/update-listing", "/user/listing", "/user/wishlist", "/user/appointment", "/user/my-appointments", "/user/my-listings", "/user/change-password",
      "/admin", "/admin/appointments", "/admin/about", "/admin/explore", "/admin/create-listing", "/admin/listings", "/admin/my-listings", "/admin/update-listing", "/admin/profile", "/admin/change-password", "/admin/requests", "/admin/listing", "/admin/appointmentlisting",
      "/listing"
    ];
    // If not a known route, use default blue-purple (404)
    if (!knownRoutes.some(r => path === r || path.startsWith(r + "/") || path === r.replace(/\/$/, ""))) {
      return 'bg-gradient-to-r from-blue-700 to-purple-700';
    }
    // Check if we're on the reset password step (step=2)
    if (path === '/forgot-password' && searchParams.get('step') === '2') {
      return 'bg-gradient-to-r from-green-600 to-green-700'; // Green for reset password step
    }
    switch (path) {
      case '/sign-in':
        return 'bg-gradient-to-r from-blue-600 to-blue-700'; // Blue for sign-in
      case '/sign-up':
        return 'bg-gradient-to-r from-green-600 to-green-700'; // Green for sign-up
      case '/forgot-password':
        return 'bg-gradient-to-r from-red-600 to-red-700'; // Red for forgot-password verification step
      case '/change-password':
      case '/user/change-password':
        return 'bg-gradient-to-r from-blue-600 to-blue-700'; // Blue for change-password
      default:
        return 'bg-gradient-to-r from-blue-700 to-purple-700'; // Default blue-purple
    }
  };

  // Function to get search button color based on current route
  const getSearchButtonColor = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);

    // List of known routes (prefixes)
    const knownRoutes = [
      "/sign-in", "/sign-up", "/forgot-password", "/about", "/search", "/oauth",
      "/user", "/user/home", "/user/about", "/user/search", "/user/profile", "/user/create-listing", "/user/update-listing", "/user/listing", "/user/wishlist", "/user/appointment", "/user/my-appointments", "/user/my-listings", "/user/change-password",
      "/admin", "/admin/appointments", "/admin/about", "/admin/explore", "/admin/create-listing", "/admin/listings", "/admin/my-listings", "/admin/update-listing", "/admin/profile", "/admin/change-password", "/admin/requests", "/admin/listing", "/admin/appointmentlisting",
      "/listing"
    ];
    // If not a known route, use default blue (404)
    if (!knownRoutes.some(r => path === r || path.startsWith(r + "/") || path === r.replace(/\/$/, ""))) {
      return 'bg-blue-500 hover:bg-blue-600';
    }
    // Check if we're on the reset password step (step=2)
    if (path === '/forgot-password' && searchParams.get('step') === '2') {
      return 'bg-green-500 hover:bg-green-600'; // Green for reset password step
    }
    switch (path) {
      case '/sign-in':
        return 'bg-blue-500 hover:bg-blue-600'; // Blue for sign-in
      case '/sign-up':
        return 'bg-green-500 hover:bg-green-600'; // Green for sign-up
      case '/forgot-password':
        return 'bg-red-500 hover:bg-red-600'; // Red for forgot-password verification step
      case '/change-password':
      case '/user/change-password':
        return 'bg-blue-500 hover:bg-blue-600'; // Blue for change-password
      default:
        return 'bg-blue-500 hover:bg-blue-600'; // Default blue
    }
  };

  // Function to get search focus ring color based on current route
  const getSearchFocusRingColor = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);

    // Check if we're on the reset password step (step=2)
    if (path === '/forgot-password' && searchParams.get('step') === '2') {
      return 'focus-within:ring-green-500'; // Green for reset password step
    }
    switch (path) {
      case '/sign-up':
        return 'focus-within:ring-green-500'; // Green for sign-up
      case '/forgot-password':
        return 'focus-within:ring-red-500'; // Red for forgot-password verification step
      default:
        return 'focus-within:ring-blue-500'; // Default blue
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set("searchTerm", searchTerm);
    const searchQuery = urlParams.toString();
    
    // Redirect to user explore page if user is logged in, otherwise to public search
    if (currentUser) {
      navigate(`/user/search?${searchQuery}`);
    } else {
      navigate(`/search?${searchQuery}`);
    }
    // Close mobile menu if open
    setMobileMenuOpen(false);
    setShowSuggestions(false);
    // Clear the search term after navigation
    setSearchTerm("");
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.displayText);
    setShowSuggestions(false);
    
    // Navigate to the property listing
    navigate(`/listing/${suggestion.id}`);
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSearchInputFocus = () => {
    if (searchTerm.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSignout = async () => {
    await signout({
      showToast: true,
      navigateTo: "/",
      delay: 0
    });
  };

  return (
    <>
      {/* Signout Loading Modal */}
      {isSigningOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            <p className="text-lg font-semibold text-gray-800">Signing out...</p>
          </div>
        </div>
      )}
    <header className={`relative ${getHeaderGradient()} shadow-xl border-b border-white/20 sticky top-0 z-50 transition-all duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* Top Bar */}
      <div className="bg-black/10 border-b border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1 text-sm text-white/80">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <FaHome className="text-yellow-400" />
                <span>Premium Real Estate Platform</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4">
                <span>📞 +1 (555) 123-4567</span>
                <span>✉️ info@urbansetu.com</span>
                {/* Android App Download Button */}
                <button
                  onClick={async () => {
                    const result = await downloadAndroidApp();
                    if (result.success) {
                      toast.success(result.message);
                    } else {
                      toast.error(result.message);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
                  title="Download Android App"
                >
                  <FaDownload className="text-xs" />
                  <span>Download App</span>
                </button>
              </div>
              {/* Mobile auth links when logged out */}
              {!currentUser && (
                <div className="md:hidden flex items-center gap-3">
                  <Link to="/sign-up" className="flex items-center gap-1 text-white/80 hover:text-white text-sm" title="Sign Up">
                    <UserPlus className="text-xs" />
                  </Link>
                  <span className="text-white/40">|</span>
                  <Link to="/sign-in" className="flex items-center gap-1 text-white/80 hover:text-white text-sm" title="Sign In">
                    <LogIn className="text-xs rotate-180" />
                  </Link>
                </div>
              )}
              {/* Mobile signout button for logged-in users */}
              {currentUser && (
                <button
                  onClick={handleSignout}
                  className="md:hidden flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm"
                  title="Sign Out"
                >
                  <LogOut className="text-xs" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* Logo/Title - Left Aligned */}
          <Link to={location.pathname.startsWith('/user') ? '/user' : '/'} className="flex-shrink-0 group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <FaHome className="text-xl sm:text-2xl text-yellow-400 drop-shadow-lg" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                  <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    Urban
                  </span>
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent ml-1">
                    Setu
                  </span>
                </h1>
                <p className="text-xs text-white/70 font-medium tracking-wider uppercase">
                  Real Estate Excellence
                </p>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation - Right Side */}
          <nav className="hidden lg:flex items-center space-x-2">
            <UserNavLinks signout={signout} />
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              className="p-2 text-white hover:text-yellow-300 focus:outline-none transition-all duration-300 hover:bg-white/10 rounded-lg"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open navigation menu"
            >
              <div className={`transition-transform duration-300 ${mobileMenuOpen ? 'animate-hamburger-to-x' : 'animate-x-to-hamburger'}`}>
                {mobileMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
              </div>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-md animate-mobile-backdrop-in"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="relative ml-auto w-80 max-w-sm h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out animate-mobile-menu-in">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className={`${getHeaderGradient()} p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Menu</h2>
                    <button
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </div>
                </div>
                
                {/* Search */}
                <div className="p-6 border-b border-gray-200 relative">
                  <form onSubmit={handleSubmit} className={`flex items-center bg-gray-50 rounded-xl overflow-hidden focus-within:ring-2 ${getSearchFocusRingColor()} focus-within:bg-white transition-all`}>
                    <input
                      type="text"
                      placeholder="Search properties..."
                      value={searchTerm}
                      onChange={handleSearchInputChange}
                      onFocus={handleSearchInputFocus}
                      onBlur={handleSearchInputBlur}
                      className="px-4 py-3 outline-none w-full text-gray-800 bg-transparent"
                    />
                    <button className={`${getSearchButtonColor()} text-white p-3 transition-colors`} type="submit">
                      <FaSearch />
                    </button>
                  </form>
                  
                  <SearchSuggestions
                    searchTerm={searchTerm}
                    onSuggestionClick={handleSuggestionClick}
                    onClose={() => setShowSuggestions(false)}
                    isVisible={showSuggestions}
                    className="mt-1"
                  />
                </div>
                
                {/* Android App Download - Mobile */}
                <div className="p-6 border-b border-gray-200">
                  <button
                    onClick={async () => {
                      const result = await downloadAndroidApp();
                      if (result.success) {
                        toast.success(result.message);
                      } else {
                        toast.error(result.message);
                      }
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
                  >
                    <FaDownload className="text-lg" />
                    <span>{getDownloadButtonText()}</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Download our Android app for the best mobile experience!
                  </p>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto p-6">
                  <UserNavLinks mobile onNavigate={() => setMobileMenuOpen(false)} signout={signout} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}

function UserNavLinks({ mobile = false, onNavigate, signout }) {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set("searchTerm", searchTerm);
    const searchQuery = urlParams.toString();
    if (currentUser) {
      navigate(`/user/search?${searchQuery}`);
    } else {
      navigate(`/search?${searchQuery}`);
    }
    if (onNavigate) onNavigate();
    setSearchTerm("");
    setSearchOpen(false);
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSearchInputFocus = () => {
    if (searchTerm.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.displayText);
    setShowSuggestions(false);
    
    // Navigate to the property listing
    navigate(`/listing/${suggestion.id}`);
  };

  const handleSignout = async () => {
    if (signout) {
      await signout({
        showToast: true,
        navigateTo: "/",
        delay: 0
      });
    }
  };

  

  return (
    <ul className={`${mobile ? 'flex flex-col gap-1' : 'flex items-center space-x-1'}`}>
      {/* Desktop Search */}
      {!mobile && (
        <li className="flex items-center">
          {!searchOpen ? (
            <button
              className="p-2 text-white hover:text-yellow-300 focus:outline-none transition-all duration-300 hover:bg-white/10 rounded-lg"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <FaSearch className="text-base" />
            </button>
          ) : (
            <div className="relative">
              <form
                onSubmit={handleSubmit}
                className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-yellow-300 focus-within:bg-white/20 transition-all duration-300 w-48"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchInputFocus}
                  onBlur={handleSearchInputBlur}
                  className="px-3 py-2 outline-none w-full text-white placeholder-white/70 bg-transparent text-sm"
                />
                <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 p-2 transition-colors" type="submit">
                  <FaSearch className="text-sm" />
                </button>
              </form>
              
              <SearchSuggestions
                searchTerm={searchTerm}
                onSuggestionClick={handleSuggestionClick}
                onClose={() => setShowSuggestions(false)}
                isVisible={showSuggestions}
                className="mt-1 w-64"
              />
            </div>
          )}
        </li>
      )}
      
      {/* Navigation Links */}
      <Link to={location.pathname.startsWith('/user') ? '/user' : '/'} onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
          <FaHome className={`${mobile ? 'text-lg text-blue-500' : 'text-base text-blue-500'}`} /> 
          <span>Home</span>
        </li>
      </Link>
      
      <Link to="/about" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in-delay-1' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
          <FaInfoCircle className={`${mobile ? 'text-lg text-green-500' : 'text-base text-green-500'}`} /> 
          <span>About</span>
        </li>
      </Link>
      
      {/* Public-only navigation links */}
      {!currentUser && (
        <>
          <Link to="/blogs" onClick={onNavigate}>
            <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in-delay-1' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
              <FaBookOpen className={`${mobile ? 'text-lg text-blue-500' : 'text-base text-blue-500'}`} /> 
              <span>Blogs</span>
            </li>
          </Link>
          
          <Link to="/faqs" onClick={onNavigate}>
            <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in-delay-1' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
              <FaQuestionCircle className={`${mobile ? 'text-lg text-orange-500' : 'text-base text-orange-500'}`} /> 
              <span>FAQs</span>
            </li>
          </Link>
        </>
      )}
      
      <Link to="/search" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in-delay-2' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
          <FaCompass className={`${mobile ? 'text-lg text-purple-500' : 'text-base text-purple-500'}`} /> 
          <span>Explore</span>
        </li>
      </Link>

      {/* Movers, Services and Route Planner removed */}
      
      {currentUser && (
        <>
          <Link to="/user/create-listing" onClick={onNavigate}>
            <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
              <FaPlus className={`${mobile ? 'text-lg text-orange-500' : 'text-base text-orange-500'}`} /> 
              <span>Add Property</span>
            </li>
          </Link>
          
          <Link to="/user/my-listings" onClick={onNavigate}>
            <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in-delay-1' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
              <FaList className={`${mobile ? 'text-lg text-indigo-500' : 'text-base text-indigo-500'}`} /> 
              <span>My Listings</span>
            </li>
          </Link>
          
          <Link to="/user/wishlist" onClick={onNavigate}>
            <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in-delay-2' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
              <FaHeart className={`${mobile ? 'text-lg text-red-500' : 'text-base text-red-500'}`} /> 
              <span>Wish List</span>
            </li>
          </Link>
          
          <Link to="/user/my-appointments" onClick={onNavigate}>
            <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in-delay-3' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
              <FaCalendarAlt className={`${mobile ? 'text-lg text-teal-500' : 'text-base text-teal-500'}`} /> 
              <span>My Appointments</span>
            </li>
          </Link>
        </>
      )}
      
      {currentUser ? (
        <>
          <li className={`${mobile ? 'flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium' : 'flex items-center relative'}`}>
            <NotificationBell mobile={mobile} />
          </li>
          
          <li 
            className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium cursor-pointer animate-mobile-item-in' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`} 
            onClick={() => { handleSignout(); if (onNavigate) onNavigate(); }}
          >
            <LogOut className={`${mobile ? 'text-lg text-red-500' : 'text-base text-red-500'}`} /> 
            <span>Sign Out</span>
          </li>
          
          {/* Profile avatar for desktop/tablet */}
          {!mobile && (
            <li>
              <div
                className="cursor-pointer transition-transform duration-300 hover:scale-110"
                onClick={() => {
                  if (currentUser.role === 'admin' || currentUser.role === 'rootadmin') {
                    navigate('/admin/profile');
                  } else {
                    navigate('/user/profile');
                  }
                  if (onNavigate) onNavigate();
                }}
                title="Profile"
              >
                <UserAvatar 
                  user={currentUser} 
                  size="h-7 w-7" 
                  textSize="text-xs"
                  showBorder={true}
                />
              </div>
            </li>
          )}
          
          {/* Profile for mobile */}
          {mobile && (
            <li>
              <div
                className="cursor-pointer transition-transform duration-300 hover:scale-110 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center gap-3 text-gray-700 font-medium"
                onClick={() => { navigate("/user/profile"); if (onNavigate) onNavigate(); }}
                title="Profile"
              >
                <UserAvatar 
                  user={currentUser} 
                  size="h-7 w-7" 
                  textSize="text-xs"
                  showBorder={true}
                />
                <span>Profile</span>
              </div>
            </li>
          )}
        </>
      ) : (
        <>
          <Link to="/sign-up" onClick={onNavigate}>
            <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
              <UserPlus className={`${mobile ? 'text-lg text-green-500' : 'text-base text-green-500'}`} /> 
              <span>Get Started</span>
            </li>
          </Link>
          
          <Link to="/sign-in" onClick={onNavigate}>
            <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium animate-mobile-item-in' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
              <LogIn className={`${mobile ? 'text-lg text-blue-500' : 'text-base text-blue-500'}`} /> 
              <span>Sign In</span>
            </li>
          </Link>
        </>
      )}
    </ul>
  );
}
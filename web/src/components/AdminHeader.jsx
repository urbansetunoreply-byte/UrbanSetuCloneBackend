import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { signoutUserStart, signoutUserSuccess, signoutUserFailure } from "../redux/user/userSlice";
import { FaHome, FaCalendarAlt, FaPlus, FaSignOutAlt, FaSearch, FaUserCheck, FaList, FaInfoCircle, FaCompass, FaBars, FaTimes, FaUser, FaTools, FaUsers } from "react-icons/fa";
import UserAvatar from "./UserAvatar";
import NotificationBell from "./NotificationBell.jsx";
import { persistor } from '../redux/store';
import { reconnectSocket } from "../utils/socket";
import { toast } from 'react-toastify';
import { LogOut } from "lucide-react";
import { useSignout } from '../hooks/useSignout';
import SearchSuggestions from './SearchSuggestions';
import ThemeToggle from "./ThemeToggle.jsx";
import SeasonalEffects from './SeasonalEffects';
import { useSeasonalTheme } from "../hooks/useSeasonalTheme";

export default function AdminHeader() {
  const theme = useSeasonalTheme();
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signout } = useSignout();

  // NEW: For desktop search icon expansion
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setFadeIn(true);
    // Only fetch pending count and appointment count for approved admin
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin') && currentUser.adminApprovalStatus === 'approved') {
      fetchPendingCount();
      fetchAppointmentCount();
    }
  }, [currentUser]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true);
      } else if (window.scrollY < 15) {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      case '/admin/change-password':
        return 'bg-gradient-to-r from-blue-700 to-purple-700'; // Default blue-purple
      default:
        return 'bg-gradient-to-r from-blue-700 to-purple-700'; // Default blue-purple
    }
  };

  // Function to get search button color based on current route
  const getSearchButtonColor = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);

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
      case '/admin/change-password':
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

  const fetchPendingCount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pending-requests`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.length);
      }
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
    }
  };

  const fetchAppointmentCount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAppointmentCount(data.length);
      }
    } catch (error) {
      console.error('Failed to fetch appointment count:', error);
    }
  };

  const handleSignout = async () => {
    await signout({
      showToast: true,
      navigateTo: "/",
      delay: 0
    });
  };

  // Unified search handler for both desktop and mobile
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/admin/explore?searchTerm=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setShowSuggestions(false);
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

  return (
    <>
      <header className={`relative ${getHeaderGradient()} shadow-xl border-b border-white/20 sticky top-0 z-50 transition-all duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* Admin Top Bar */}
        <div className={`bg-black/20 border-b border-white/10 transition-all duration-500 ease-in-out overflow-hidden ${scrolled ? 'max-h-0 opacity-0' : 'max-h-[60px] py-1 opacity-100'}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-1 text-sm text-white/80">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <FaUserCheck className="text-yellow-400" />
                  <span>Admin Control Panel</span>
                </span>
                {currentUser && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {currentUser.role === 'rootadmin' ? 'Super Admin' : 'Administrator'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-4">
                  <span>🛡️ Secure Admin Access</span>
                  <span>📊 Real-time Analytics</span>
                </div>
                {/* Mobile signout button for admin users */}
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

        {/* Main Admin Header */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            {/* Admin Logo/Title */}
            <Link to="/admin" className="flex-shrink-0 group relative">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <FaUserCheck className={`text-xl sm:text-2xl drop-shadow-lg ${theme?.id === 'christmas' ? 'text-green-500' : 'text-yellow-400'}`} />
                  </div>
                  <div className={`absolute -inset-1 bg-gradient-to-r ${theme?.textGradient ? theme.textGradient.replace('bg-clip-text text-transparent', '') : 'from-yellow-400 to-orange-500'} rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>

                  {/* Seasonal Logo Interaction */}
                  {theme?.logoDecoration === 'santa-hat' && (
                    <span className="absolute -top-3 -right-2 text-2xl filter drop-shadow-md animate-bounce" style={{ animationDuration: '3s' }}>🎅</span>
                  )}
                  {theme?.logoDecoration === 'party-hat' && (
                    <span className="absolute -top-4 -right-2 text-xl filter drop-shadow-md rotate-12">🎉</span>
                  )}
                  {theme?.logoDecoration === 'kite' && (
                    <span className="absolute -top-4 -right-3 text-xl filter drop-shadow-md -rotate-12">🪁</span>
                  )}
                  {theme?.logoDecoration === 'flag' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🇮🇳</span>
                  )}
                  {theme?.logoDecoration === 'heart' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md animate-pulse">❤️</span>
                  )}
                  {theme?.logoDecoration === 'pumpkin' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🎃</span>
                  )}
                  {theme?.logoDecoration === 'colors' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md animate-spin-slow">🎨</span>
                  )}
                  {theme?.logoDecoration === 'mango' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🥭</span>
                  )}
                  {theme?.logoDecoration === 'moon' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🌙</span>
                  )}
                  {theme?.logoDecoration === 'bow' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md -rotate-45">🏹</span>
                  )}
                  {theme?.logoDecoration === 'rakhi' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🧵</span>
                  )}
                  {theme?.logoDecoration === 'modak' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🥟</span>
                  )}
                  {theme?.logoDecoration === 'flower' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md animate-spin" style={{ animationDuration: '8s' }}>🌺</span>
                  )}
                  {theme?.logoDecoration === 'marigold' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🌼</span>
                  )}
                  {theme?.logoDecoration === 'diya' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md animate-pulse">🪔</span>
                  )}
                  {theme?.logoDecoration === 'snow-cap' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">❄️</span>
                  )}
                  {/* Extended Festival Decorations */}
                  {theme?.logoDecoration === 'clover' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">☘️</span>
                  )}
                  {theme?.logoDecoration === 'leaf' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🌱</span>
                  )}
                  {theme?.logoDecoration === 'glasses' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">👓</span>
                  )}
                  {theme?.logoDecoration === 'turkey' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🦃</span>
                  )}
                  {theme?.logoDecoration === 'dragon' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🐉</span>
                  )}
                  {theme?.logoDecoration === 'trident' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🔱</span>
                  )}
                  {theme?.logoDecoration === 'mace' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🙏</span>
                  )}
                  {theme?.logoDecoration === 'cross' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">✝️</span>
                  )}
                  {theme?.logoDecoration === 'egg' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🥚</span>
                  )}
                  {theme?.logoDecoration === 'lantern' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🕌</span>
                  )}
                  {theme?.logoDecoration === 'chariot' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🎡</span>
                  )}
                  {theme?.logoDecoration === 'flute' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🪈</span>
                  )}
                  {theme?.logoDecoration === 'torch' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🔥</span>
                  )}
                  {theme?.logoDecoration === 'atom' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md animate-spin-slow">⚛️</span>
                  )}
                  {theme?.logoDecoration === 'lotus' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🪷</span>
                  )}
                  {theme?.logoDecoration === 'book' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">📚</span>
                  )}
                  {theme?.logoDecoration === 'balloon' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md animate-bounce">🎈</span>
                  )}
                  {theme?.logoDecoration === 'building' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🏗️</span>
                  )}
                  {theme?.logoDecoration === 'rocket' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md animate-pulse">🚀</span>
                  )}
                  {theme?.logoDecoration === 'bonfire' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md animate-pulse">🔥</span>
                  )}
                  {theme?.logoDecoration === 'peace' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">☮️</span>
                  )}
                  {theme?.logoDecoration === 'harvest' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">🌾</span>
                  )}
                  {theme?.logoDecoration === 'tie' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">👔</span>
                  )}
                  {theme?.logoDecoration === 'khanda' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">☬</span>
                  )}
                  {theme?.logoDecoration === 'gudi' && (
                    <span className="absolute -top-4 -right-3 text-xl filter drop-shadow-md -rotate-12">🪁</span>
                  )}
                  {theme?.logoDecoration === 'sun' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md animate-spin-slow">☀️</span>
                  )}
                  {theme?.logoDecoration === 'venus' && (
                    <span className="absolute -top-3 -right-2 text-xl filter drop-shadow-md">♀️</span>
                  )}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg flex items-center">
                    {theme ? (
                      <span className={`${theme.textGradient} bg-clip-text text-transparent`}>
                        AdminPanel
                      </span>
                    ) : (
                      <>
                        <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                          Admin
                        </span>
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent ml-1">
                          Panel
                        </span>
                      </>
                    )}
                  </h1>
                  <p className="text-xs text-white/70 font-medium tracking-wider uppercase flex items-center gap-1">
                    Management Dashboard {theme?.secondaryIcon && <span className="opacity-80">{theme.secondaryIcon}</span>}
                  </p>
                </div>
              </div>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              {/* Desktop Search */}
              <div className="flex items-center">
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
                      onSubmit={handleSearch}
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
              </div>

              {/* Admin Navigation Links */}
              <AdminNavLinks
                pendingCount={pendingCount}
                handleSignout={handleSignout}
                currentUser={currentUser}
              />
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
              <div className="relative ml-auto w-80 max-w-sm h-full bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out animate-mobile-menu-in overflow-hidden">
                <SeasonalEffects />
                <div className="flex flex-col h-full relative z-10">
                  {/* Header */}
                  <div className={`${getHeaderGradient()} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">Admin Menu</h2>
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
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 relative">
                    <form onSubmit={handleSearch} className={`flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden focus-within:ring-2 ${getSearchFocusRingColor()} focus-within:bg-white dark:focus-within:bg-gray-700 transition-all`}>
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

                  {/* Navigation Links */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <AdminNavLinks mobile onNavigate={() => setMobileMenuOpen(false)} pendingCount={pendingCount} handleSignout={handleSignout} currentUser={currentUser} />
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

function AdminNavLinks({ mobile = false, onNavigate, pendingCount, handleSignout, currentUser }) {
  const navigate = useNavigate();
  return (
    <ul className={`${mobile ? 'flex flex-col gap-1' : 'flex items-center space-x-1'}`}>
      {/* Admin Navigation Links */}
      <Link to="/admin" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-gray-700 dark:text-gray-200 font-medium animate-mobile-item-in' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
          <FaHome className={`${mobile ? 'text-lg text-blue-500' : 'text-base text-blue-500'}`} />
          <span>Dashboard</span>
        </li>
      </Link>

      <Link to="/admin/create-listing" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-gray-700 dark:text-gray-200 font-medium animate-mobile-item-in-delay-1' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
          <FaPlus className={`${mobile ? 'text-lg text-green-500' : 'text-base text-green-500'}`} />
          <span>Add Property</span>
        </li>
      </Link>

      <Link to="/admin/listings" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-gray-700 dark:text-gray-200 font-medium animate-mobile-item-in-delay-2' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
          <FaList className={`${mobile ? 'text-lg text-purple-500' : 'text-base text-purple-500'}`} />
          <span>All Listings</span>
        </li>
      </Link>

      {/* Movers removed; Services now includes movers section */}
      <Link to="/admin/services" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-gray-700 dark:text-gray-200 font-medium animate-mobile-item-in-delay-3' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
          <FaTools className={`${mobile ? 'text-lg text-purple-600' : 'text-base text-purple-600'}`} />
          <span>Services</span>
        </li>
      </Link>

      {currentUser && currentUser.role === 'rootadmin' && currentUser.adminApprovalStatus === 'approved' && (
        <Link to="/admin/requests" onClick={onNavigate}>
          <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-gray-700 dark:text-gray-200 font-medium relative animate-mobile-item-in' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base relative flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
            <FaUserCheck className={`${mobile ? 'text-lg text-orange-500' : 'text-base text-orange-500'}`} />
            <span>Requests</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </li>
        </Link>
      )}

      <Link to="/admin/community" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-gray-700 dark:text-gray-200 font-medium animate-mobile-item-in-delay-1' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
          <FaUsers className={`${mobile ? 'text-lg text-pink-500' : 'text-base text-pink-500'}`} />
          <span>Community</span>
        </li>
      </Link>

      <Link to="/admin/explore" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-gray-700 dark:text-gray-200 font-medium animate-mobile-item-in-delay-2' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}>
          <FaCompass className={`${mobile ? 'text-lg text-teal-500' : 'text-base text-teal-500'}`} />
          <span>Explore</span>
        </li>
      </Link>

      <li className={`${mobile ? 'mt-2 mb-2 px-1' : 'flex items-center'}`}>
        <ThemeToggle mobile={mobile} />
      </li>

      <li className={`${mobile ? 'flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-gray-700 dark:text-gray-200 font-medium' : 'flex items-center'}`}>
        <NotificationBell mobile={mobile} />
      </li>

      <li
        className={`${mobile ? 'flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-gray-700 dark:text-gray-200 font-medium cursor-pointer animate-mobile-item-in' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium text-base cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10'}`}
        onClick={() => { handleSignout(); if (onNavigate) onNavigate(); }}
      >
        <LogOut className={`${mobile ? 'text-lg text-red-500' : 'text-base text-red-500'}`} />
        <span>Sign Out</span>
      </li>

      {/* Profile avatar for desktop/tablet */}
      {currentUser && !mobile && (
        <li>
          <div
            className="cursor-pointer transition-transform duration-300 hover:scale-110"
            onClick={() => { navigate("/admin/profile"); if (onNavigate) onNavigate(); }}
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
      {currentUser && mobile && (
        <li>
          <div
            className="cursor-pointer transition-transform duration-300 hover:scale-110 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium"
            onClick={() => { navigate("/admin/profile"); if (onNavigate) onNavigate(); }}
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
    </ul>
  );
} 
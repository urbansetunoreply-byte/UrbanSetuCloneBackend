import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { signoutUserStart, signoutUserSuccess, signoutUserFailure } from "../redux/user/userSlice";
import { FaHome, FaCalendarAlt, FaPlus, FaSignOutAlt, FaSearch, FaUserCheck, FaList, FaInfoCircle, FaCompass, FaBars, FaTimes, FaUser, FaTruckMoving, FaTools } from "react-icons/fa";
import UserAvatar from "./UserAvatar";
import NotificationBell from "./NotificationBell.jsx";
import { persistor } from '../redux/store';
import { reconnectSocket } from "../utils/socket";
import { toast } from 'react-toastify';

export default function AdminHeader() {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // NEW: For desktop search icon expansion
  const [searchOpen, setSearchOpen] = useState(false);
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
        return 'bg-gradient-to-r from-blue-600 to-blue-700'; // Blue for change-password
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
    try {
      dispatch(signoutUserStart());
      const res = await fetch(`${API_BASE_URL}/api/auth/signout`, { credentials: 'include' });
      const data = await res.json();
      if (data.success === false) {
        dispatch(signoutUserFailure(data.message));
      } else {
        dispatch(signoutUserSuccess());
        await persistor.purge();
        reconnectSocket();
        localStorage.removeItem('accessToken');
        document.cookie = 'access_token=; Max-Age=0; path=/; domain=' + window.location.hostname + '; secure; samesite=None';
        toast.info("You have been signed out.");
        navigate("/sign-in");
      }
    } catch (error) {
      dispatch(signoutUserFailure(error.message));
    }
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
  };

  return (
    <header className={`relative ${getHeaderGradient()} shadow-xl border-b border-white/20 sticky top-0 z-50 transition-all duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* Admin Top Bar */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-sm text-white/80">
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
            <div className="hidden md:flex items-center gap-4">
              <span>🛡️ Secure Admin Access</span>
              <span>📊 Real-time Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Admin Logo/Title */}
          <Link to="/admin" className="flex-shrink-0 group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <FaUserCheck className="text-2xl sm:text-3xl text-yellow-400 drop-shadow-lg" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                  <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    Admin
                  </span>
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent ml-2">
                    Panel
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-white/70 font-medium tracking-wider uppercase">
                  Management Dashboard
                </p>
              </div>
            </div>
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {/* Desktop Search */}
            <div className="flex items-center">
              {!searchOpen ? (
                <button
                  className="p-3 text-white hover:text-yellow-300 focus:outline-none transition-all duration-300 hover:bg-white/10 rounded-xl border border-white/20"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                >
                  <FaSearch className="text-lg" />
                </button>
              ) : (
                <form
                  onSubmit={handleSearch}
                  className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-yellow-300 focus-within:bg-white/20 transition-all duration-300 w-64"
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => setSearchOpen(false)}
                    className="px-4 py-3 outline-none w-full text-white placeholder-white/70 bg-transparent"
                  />
                  <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 p-3 transition-colors" type="submit">
                    <FaSearch />
                  </button>
                </form>
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
              className="p-3 text-white hover:text-yellow-300 focus:outline-none transition-all duration-300 hover:bg-white/10 rounded-xl border border-white/20"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open navigation menu"
            >
              <div className={`transition-transform duration-300 ${mobileMenuOpen ? 'animate-hamburger-to-x' : 'animate-x-to-hamburger'}`}>
                {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
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
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="relative ml-auto w-80 max-w-sm h-full bg-white shadow-2xl">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
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
                <div className="p-6 border-b border-gray-200">
                  <form onSubmit={handleSearch} className="flex items-center bg-gray-50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                    <input
                      type="text"
                      placeholder="Search properties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-3 outline-none w-full text-gray-800 bg-transparent"
                    />
                    <button className="bg-blue-500 hover:bg-blue-600 text-white p-3 transition-colors" type="submit">
                      <FaSearch />
                    </button>
                  </form>
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
  );
}

function AdminNavLinks({ mobile = false, onNavigate, pendingCount, handleSignout, currentUser }) {
  const navigate = useNavigate();
  return (
    <ul className={`${mobile ? 'flex flex-col gap-1' : 'flex items-center space-x-6'}`}>
      {/* Admin Navigation Links */}
      <Link to="/admin" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium'}`}>
          <FaHome className={`${mobile ? 'text-xl text-blue-500' : 'text-lg'}`} /> 
          <span>Dashboard</span>
        </li>
      </Link>
      
      <Link to="/admin/create-listing" onClick={onNavigate}>
        <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-1 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-green-300 transition-all duration-200 flex items-center gap-2'}`}>
          <FaPlus className="text-xl text-green-500" /> 
          <span>Add Property</span>
        </li>
      </Link>
      
      <Link to="/admin/listings" onClick={onNavigate}>
        <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-2 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-purple-300 transition-all duration-200 flex items-center gap-2'}`}>
          <FaList className="text-xl text-purple-500" /> 
          <span>All Listings</span>
        </li>
      </Link>

      {/* New: Movers and Services management links */}
      <Link to="/admin/movers" onClick={onNavigate}>
        <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-3 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-blue-300 transition-all duration-200 flex items-center gap-2'}`}>
          <FaTruckMoving className="text-xl text-blue-500" />
          <span>Movers</span>
        </li>
      </Link>
      <Link to="/admin/services" onClick={onNavigate}>
        <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-3 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-purple-300 transition-all duration-200 flex items-center gap-2'}`}>
          <FaTools className="text-xl text-purple-600" />
          <span>Services</span>
        </li>
      </Link>
      
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin') && currentUser.adminApprovalStatus === 'approved' && (
        <Link to="/admin/requests" onClick={onNavigate}>
          <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-3 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium relative' : 'hover:text-orange-300 transition-all duration-200 flex items-center gap-2 relative'}`}>
            <FaUserCheck className="text-xl text-orange-500" /> 
            <span>Requests</span>
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </li>
        </Link>
      )}
      
      <Link to="/admin/about" onClick={onNavigate}>
        <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-4 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-indigo-300 transition-all duration-200 flex items-center gap-2'}`}>
          <FaInfoCircle className="text-xl text-indigo-500" /> 
          <span>About</span>
        </li>
      </Link>
      
      <Link to="/admin/explore" onClick={onNavigate}>
        <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-5 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-teal-300 transition-all duration-200 flex items-center gap-2'}`}>
          <FaCompass className="text-xl text-teal-500" /> 
          <span>Explore</span>
        </li>
      </Link>
      
      <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-1 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'flex items-center'}`}>
        <NotificationBell mobile={mobile} />
      </li>
      
      <li 
        className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-2 p-4 rounded-xl hover:bg-red-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium cursor-pointer' : 'flex items-center cursor-pointer'}`}
        onClick={() => { handleSignout(); if (onNavigate) onNavigate(); }}
      >
        <FaSignOutAlt className={`text-xl ${mobile ? 'text-red-500' : ''}`} /> 
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
              size="h-8 w-8" 
              textSize="text-xs"
              showBorder={true}
            />
          </div>
        </li>
      )}
      
      {/* Profile for mobile */}
      {currentUser && mobile && (
        <li className="mobile-menu-item animate-menu-item-in-delay-3">
          <div
            className="cursor-pointer transition-transform duration-300 hover:scale-110 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium"
            onClick={() => { navigate("/admin/profile"); if (onNavigate) onNavigate(); }}
            title="Profile"
          >
            <UserAvatar 
              user={currentUser} 
              size="h-8 w-8" 
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

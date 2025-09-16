import React, { useEffect, useState, useRef } from "react";
import { FaSearch, FaHome, FaInfoCircle, FaCompass, FaPlus, FaList, FaHeart, FaCalendarAlt, FaUser, FaSignOutAlt, FaStar, FaBars, FaTimes, FaTrash, FaTruckMoving, FaTools, FaRoute } from "react-icons/fa";
import UserAvatar from "./UserAvatar";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { signoutUserSuccess } from "../redux/user/userSlice.js";
import NotificationBell from "./NotificationBell.jsx";
import { persistor } from '../redux/store';
import { reconnectSocket } from "../utils/socket";
import { toast } from 'react-toastify';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
    // Clear the search term after navigation
    setSearchTerm("");
  };

  return (
    <header className={`relative ${getHeaderGradient()} shadow-xl border-b border-white/20 sticky top-0 z-50 transition-all duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* Top Bar */}
      <div className="bg-black/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-sm text-white/80">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <FaHome className="text-yellow-400" />
                <span>Premium Real Estate Platform</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span>📞 +1 (555) 123-4567</span>
              <span>✉️ info@urbansetu.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Title */}
          <Link to={location.pathname.startsWith('/user') ? '/user' : '/'} className="flex-shrink-0 group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <FaHome className="text-2xl sm:text-3xl text-yellow-400 drop-shadow-lg" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                  <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    Urban
                  </span>
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent ml-2">
                    Setu
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-white/70 font-medium tracking-wider uppercase">
                  Real Estate Excellence
                </p>
              </div>
            </div>
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <UserNavLinks />
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
                <div className="p-6 border-b border-gray-200">
                  <form onSubmit={handleSubmit} className="flex items-center bg-gray-50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
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
                  <UserNavLinks mobile onNavigate={() => setMobileMenuOpen(false)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function UserNavLinks({ mobile = false, onNavigate }) {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleSignout = async () => {
    try {
      const res = await fetch("/api/auth/signout", { method: "GET", credentials: "include" });
      const data = await res.json();
      if (data.success === false) {
        console.log(data.message);
        return;
      }
      dispatch(signoutUserSuccess());
      await persistor.purge();
      reconnectSocket();
      localStorage.removeItem('accessToken');
      document.cookie = 'access_token=; Max-Age=0; path=/; domain=' + window.location.hostname + '; secure; samesite=None';
      toast.info("You have been signed out.");
      navigate("/sign-in");
    } catch (error) {
      console.log(error.message);
      dispatch(signoutUserSuccess());
      await persistor.purge();
      reconnectSocket();
      localStorage.removeItem('accessToken');
      document.cookie = 'access_token=; Max-Age=0; path=/; domain=' + window.location.hostname + '; secure; samesite=None';
      toast.info("You have been signed out.");
      navigate("/sign-in");
    }
  };

  

  return (
    <ul className={`${mobile ? 'flex flex-col gap-1' : 'flex items-center space-x-6'}`}>
      {/* Desktop Search */}
      {!mobile && (
        <li className="flex items-center">
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
              onSubmit={handleSubmit}
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
        </li>
      )}
      
      
      
      {/* Navigation Links */}
      <Link to={location.pathname.startsWith('/user') ? '/user' : '/'} onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium'}`}>
          <FaHome className={`${mobile ? 'text-xl text-blue-500' : 'text-lg'}`} /> 
          <span>Home</span>
        </li>
      </Link>
      
      <Link to="/about" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium'}`}>
          <FaInfoCircle className={`${mobile ? 'text-xl text-green-500' : 'text-lg'}`} /> 
          <span>About</span>
        </li>
      </Link>
      
      <Link to="/search" onClick={onNavigate}>
        <li className={`${mobile ? 'flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 text-gray-700 font-medium' : 'text-white hover:text-yellow-300 transition-colors duration-300 font-medium'}`}>
          <FaCompass className={`${mobile ? 'text-xl text-purple-500' : 'text-lg'}`} /> 
          <span>Explore</span>
        </li>
      </Link>

      {/* Services quick links for mobile */}
      {currentUser && mobile && (
        <>
          <Link to="/user/movers" onClick={onNavigate}>
            <li className={`mobile-menu-item animate-menu-item-in-delay-3 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium`}>
              <FaTruckMoving className="text-xl text-blue-500" />
              <span>Movers</span>
            </li>
          </Link>
          <Link to="/user/services" onClick={onNavigate}>
            <li className={`mobile-menu-item animate-menu-item-in-delay-4 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium`}>
              <FaTools className="text-xl text-purple-600" />
              <span>Services</span>
            </li>
          </Link>
          <Link to="/user/route-planner" onClick={onNavigate}>
            <li className={`mobile-menu-item animate-menu-item-in-delay-5 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium`}>
              <FaRoute className="text-xl text-green-600" />
              <span>Route Planner</span>
            </li>
          </Link>
        </>
      )}
      {/* Services quick links */}
      {currentUser && !mobile && (
        <>
          <Link to="/user/movers" onClick={onNavigate}>
            <li className="hover:text-yellow-300 hover:scale-110 flex items-center gap-2 transition-all">
              <FaTruckMoving className="text-sm text-blue-500" />
              <span>Movers</span>
            </li>
          </Link>
          <Link to="/user/services" onClick={onNavigate}>
            <li className="hover:text-yellow-300 hover:scale-110 flex items-center gap-2 transition-all">
              <FaTools className="text-sm text-purple-600" />
              <span>Services</span>
            </li>
          </Link>
          <Link to="/user/route-planner" onClick={onNavigate}>
            <li className="hover:text-yellow-300 hover:scale-110 flex items-center gap-2 transition-all">
              <FaRoute className="text-sm text-green-600" />
              <span>Route</span>
            </li>
          </Link>
        </>
      )}
      
      {currentUser && (
        <>
          <Link to="/user/create-listing" onClick={onNavigate}>
            <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-3 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-yellow-300 hover:scale-110 flex items-center gap-1 transition-all'}`}>
              <FaPlus className="text-xl text-orange-500" /> 
              <span>Add Property</span>
            </li>
          </Link>
          
          <Link to="/user/my-listings" onClick={onNavigate}>
            <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-4 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-yellow-300 hover:scale-110 flex items-center gap-1 transition-all'}`}>
              <FaList className="text-xl text-indigo-500" /> 
              <span>My Listings</span>
            </li>
          </Link>
          
          <Link to="/user/wishlist" onClick={onNavigate}>
            <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-5 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-yellow-300 hover:scale-110 flex items-center gap-1 transition-all'}`}>
              <FaHeart className="text-xl text-red-500" /> 
              <span>Wish List</span>
            </li>
          </Link>
          
          <Link to="/user/my-appointments" onClick={onNavigate}>
            <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-6 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-yellow-300 hover:scale-110 flex items-center gap-1 transition-all'}`}>
              <FaCalendarAlt className="text-xl text-teal-500" /> 
              <span>My Appointments</span>
            </li>
          </Link>
        </>
      )}
      
      {currentUser ? (
        <>
          <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-1 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'flex items-center relative'}`}>
            <NotificationBell mobile={mobile} />
          </li>
          
          <li 
            className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-2 p-4 rounded-xl hover:bg-red-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium cursor-pointer' : 'hover:text-yellow-300 hover:scale-110 flex items-center gap-1 cursor-pointer transition-all'}`} 
            onClick={() => { handleSignout(); if (onNavigate) onNavigate(); }}
          >
            <FaSignOutAlt className={`text-xl ${mobile ? 'text-red-500' : ''}`} /> 
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
                  size="h-8 w-8" 
                  textSize="text-xs"
                  showBorder={true}
                />
              </div>
            </li>
          )}
          
          {/* Profile for mobile */}
          {mobile && (
            <li className="mobile-menu-item animate-menu-item-in-delay-3">
              <div
                className="cursor-pointer transition-transform duration-300 hover:scale-110 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium"
                onClick={() => { navigate("/user/profile"); if (onNavigate) onNavigate(); }}
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
        </>
      ) : (
        <Link to="/sign-in" onClick={onNavigate}>
          <li className={`mobile-menu-item ${mobile ? 'animate-menu-item-in-delay-1 p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 text-lg font-medium' : 'hover:text-yellow-300 hover:scale-110 flex items-center gap-1 transition-all'}`}>
            <FaUser className="text-xl text-blue-500" /> 
            <span>Sign In</span>
          </li>
        </Link>
      )}
    </ul>
  );
}

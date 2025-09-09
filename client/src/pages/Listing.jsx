import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { FaBath, FaBed, FaChair, FaMapMarkerAlt, FaParking, FaShare, FaEdit, FaTrash, FaArrowLeft, FaStar, FaLock, FaHeart, FaExpand, FaCheckCircle, FaFlag, FaRuler, FaBuilding, FaTree, FaWifi, FaSwimmingPool, FaCar, FaShieldAlt, FaClock, FaPhone, FaEnvelope, FaCalendarAlt, FaEye, FaThumbsUp, FaThumbsDown, FaComments, FaCalculator, FaChartLine, FaHome, FaUtensils, FaHospital, FaSchool, FaShoppingCart, FaPlane, FaUser, FaTimes } from "react-icons/fa";
import ContactSupportWrapper from "../components/ContactSupportWrapper";
import ReviewForm from "../components/ReviewForm.jsx";
import ReviewList from "../components/ReviewList.jsx";
import ImagePreview from "../components/ImagePreview.jsx";
import EMICalculator from "../components/EMICalculator.jsx";
import { maskAddress, shouldShowLocationLink, getLocationLinkText } from "../utils/addressMasking";
import { toast } from 'react-toastify';
import { useWishlist } from '../WishlistContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Listing() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useSelector((state) => state.user);
  const [listing, setListing] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [ownerDetails, setOwnerDetails] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState("");
  const [showReviews, setShowReviews] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAssignOwnerModal, setShowAssignOwnerModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [assignOwnerLoading, setAssignOwnerLoading] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState("");
  const [ownerStatus, setOwnerStatus] = useState({ isActive: false, owner: null });
  const [neighborhood, setNeighborhood] = useState(null);
  
  // Report property states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  
  // Enhanced features states
  const [showAmenities, setShowAmenities] = useState(false);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [showPriceAnalysis, setShowPriceAnalysis] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [daysListed, setDaysListed] = useState(0);
  const [viewTracked, setViewTracked] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonProperties, setComparisonProperties] = useState([]);
  const [showComparisonTooltip, setShowComparisonTooltip] = useState(false);
  const [showPropertySearch, setShowPropertySearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSignInTooltip, setShowSignInTooltip] = useState(false);

   // Lock body scroll when deletion/assign/report/calculator/comparison/search modals are open
   useEffect(() => {
     const shouldLock = showReasonModal || showPasswordModal || showAssignOwnerModal || showReportModal || showCalculatorModal || showComparisonModal || showPropertySearch;
     if (shouldLock) {
       document.body.classList.add('modal-open');
     } else {
       document.body.classList.remove('modal-open');
     }
     return () => {
       document.body.classList.remove('modal-open');
     };
   }, [showReasonModal, showPasswordModal, showAssignOwnerModal, showReportModal, showCalculatorModal, showComparisonModal, showPropertySearch]);
 
   // Check if user is admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'rootadmin';
  
  // Check if we're in admin context
  const isAdminContext = location.pathname.includes('/admin');

  // Determine back button destination and text
  const getBackButtonInfo = () => {
    if (!currentUser) {
      // Public user - go to home
      return { path: '/', text: 'Back to Home' };
    } else if (isAdminContext) {
      // Admin context - go to admin dashboard
      return { path: '/admin', text: 'Back to Dashboard' };
    } else {
      // User context - go to user dashboard
      return { path: '/user', text: 'Back to Home' };
    }
  };

  const backButtonInfo = getBackButtonInfo();

  const formatINR = (amount) => {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (listing.offer && listing.regularPrice && listing.discountPrice) {
      return Math.round(((listing.regularPrice - listing.discountPrice) / listing.regularPrice) * 100);
    }
    return 0;
  };

  const handleDelete = () => {
    setDeleteReason("");
    setDeleteError("");
    setShowReasonModal(true);
  };

  const handleReasonSubmit = (e) => {
    e.preventDefault();
    if (!deleteReason.trim()) {
      setDeleteError("Reason is required");
      return;
    }
    setShowReasonModal(false);
    setDeleteError("");
    setShowPasswordModal(true);
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setShowImagePreview(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError("Password is required");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      // Verify password
      const verifyRes = await fetch(`/api/user/verify-password/${currentUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!verifyRes.ok) {
        setDeleteError("Incorrect password. Property not deleted.");
        setDeleteLoading(false);
        return;
      }
      // Proceed to delete
      const res = await fetch(`/api/listing/delete/${listing._id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      });
      if (res.ok) {
        toast.success('Property deleted successfully!');
        setShowPasswordModal(false);
        navigate('/admin/listings');
      } else {
        const data = await res.json();
        setDeleteError(data.message || 'Failed to delete property.');
      }
    } catch (error) {
      setDeleteError('An error occurred while deleting the property.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Function to check if current owner is active
  const checkOwnerStatus = async () => {
    if (listing && listing.userRef) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/id/${listing.userRef}`);
        if (res.ok) {
          const ownerData = await res.json();
          if (ownerData && ownerData.status !== 'suspended') {
            return { isActive: true, owner: ownerData };
          }
        }
      } catch (error) {
        // Owner account is deleted/inactive
        return { isActive: false, owner: null };
      }
    }
    return { isActive: false, owner: null };
  };

  // Function to fetch available users for owner assignment
  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/all-users-autocomplete`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data);
      } else {
        console.error('Failed to fetch available users');
      }
    } catch (error) {
        console.error('Error fetching available users:', error);
      }
    };

  // Function to handle property report
  const handleReportProperty = async () => {
    if (!reportCategory) {
      toast.error('Please select a report category');
      return;
    }
    
    setReportLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/report/${listing._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category: reportCategory,
          details: reportDetails.trim()
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.info("Thank you for reporting. Our team will review this property.");
        setShowReportModal(false);
        setReportCategory('');
        setReportDetails('');
      } else {
        toast.error(data.message || 'Failed to report property');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  // Function to assign new owner
  const handleAssignNewOwner = async () => {
    if (!selectedNewOwner) {
      toast.error('Please select a new owner');
      return;
    }

    setAssignOwnerLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/reassign-owner/${listing._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newOwnerId: selectedNewOwner }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Property owner assigned successfully!');
        setShowAssignOwnerModal(false);
        setSelectedNewOwner("");
        // Refresh the page to show updated owner details
        window.location.reload();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to assign new owner');
      }
    } catch (error) {
      console.error('Error assigning new owner:', error);
      toast.error('An error occurred while assigning new owner');
    } finally {
      setAssignOwnerLoading(false);
    }
  };

  // Function to fetch similar properties
  const fetchSimilarProperties = async () => {
    if (!listing) return;
    
    setLoadingSimilar(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/get?type=${listing.type}&city=${listing.city}&limit=4&exclude=${listing._id}`);
      if (res.ok) {
        const data = await res.json();
        setSimilarProperties(data.filter(prop => prop._id !== listing._id).slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching similar properties:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Function to track property view (only once per session)
  const trackPropertyView = async () => {
    if (!listing || viewTracked) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/view/${listing._id}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        // Mark as tracked to prevent multiple calls
        setViewTracked(true);
        // Update the listing state with the new view count
        setListing(prev => ({
          ...prev,
          viewCount: data.viewCount
        }));
      }
    } catch (error) {
      // Silent fail for view tracking
      console.log('View tracking failed:', error);
    }
  };

  // Function to calculate EMI (for sale properties)
  const calculateEMI = (principal, rate = 8.5, tenure = 20) => {
    const monthlyRate = rate / 12 / 100;
    const months = tenure * 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };

  // Function to add property to comparison
  const addToComparison = (property) => {
    if (!currentUser) {
      setShowComparisonTooltip(true);
      setTimeout(() => setShowComparisonTooltip(false), 3000);
      return;
    }

    if (comparisonProperties.length >= 4) {
      toast.error('You can compare maximum 4 properties');
      return;
    }

    if (comparisonProperties.some(p => p._id === property._id)) {
      toast.error('Property already added to comparison');
      return;
    }

    setComparisonProperties(prev => [...prev, property]);
    toast.success('Property added to comparison');
  };

  // Function to remove property from comparison
  const removeFromComparison = (propertyId) => {
    setComparisonProperties(prev => prev.filter(p => p._id !== propertyId));
    toast.success('Property removed from comparison');
  };

  // Function to open comparison modal
  const openComparisonModal = () => {
    if (!currentUser) {
      setShowComparisonTooltip(true);
      setTimeout(() => setShowComparisonTooltip(false), 3000);
      return;
    }

    if (comparisonProperties.length < 2) {
      toast.error('Please select at least 2 properties to compare');
      return;
    }

    setShowComparisonModal(true);
  };

  // Function to get comparison data for a property
  const getComparisonData = (property) => {
    return {
      basicInfo: {
        name: property.name,
        location: `${property.city}, ${property.state}`,
        type: property.type,
        bhk: property.bhk,
        furnished: property.furnished ? 'Furnished' : 'Unfurnished'
      },
      pricing: {
        price: property.offer ? property.discountPrice : property.regularPrice,
        pricePerSqFt: property.area ? Math.round((property.offer ? property.discountPrice : property.regularPrice) / property.area) : 'N/A',
        originalPrice: property.regularPrice,
        discount: property.offer ? property.regularPrice - property.discountPrice : 0
      },
      size: {
        area: property.area || 'N/A',
        floor: property.floor !== undefined && property.floor !== null && property.floor !== '' ? 
               (property.floor == 0 ? 'Ground Floor' : `Floor ${property.floor}`) : 'Not specified',
        age: property.propertyAge || 'N/A'
      },
      amenities: {
        parking: property.parking ? 'Yes' : 'No',
        wifi: property.wifi ? 'Yes' : 'No',
        powerBackup: property.powerBackup ? 'Yes' : 'No',
        lift: property.lift ? 'Yes' : 'No',
        gym: property.gym ? 'Yes' : 'No',
        security: property.security ? 'Yes' : 'No'
      },
      reviews: {
        rating: property.averageRating || 0,
        totalReviews: property.reviewCount || 0,
        views: property.viewCount || 0
      }
    };
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchProperties(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Function to search for properties
  const searchProperties = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Search across all properties, not just same location
      const res = await fetch(`${API_BASE_URL}/api/listing/get?limit=50`);
      if (res.ok) {
        const data = await res.json();
        
        // Filter properties based on search query (name, location, type)
        const filteredResults = data.filter(property => {
          // Skip current property and already selected properties
          if (property._id === listing._id || comparisonProperties.some(p => p._id === property._id)) {
            return false;
          }
          
          // Search in property name, city, state, and type
          const searchTerm = query.toLowerCase();
          const propertyName = (property.name || '').toLowerCase();
          const city = (property.city || '').toLowerCase();
          const state = (property.state || '').toLowerCase();
          const type = (property.type || '').toLowerCase();
          const bhk = (property.bhk || '').toString();
          
          return propertyName.includes(searchTerm) || 
                 city.includes(searchTerm) || 
                 state.includes(searchTerm) || 
                 type.includes(searchTerm) ||
                 bhk.includes(searchTerm);
        });
        
        // Limit to 10 results for better performance
        setSearchResults(filteredResults.slice(0, 10));
      }
    } catch (error) {
      console.error('Error searching properties:', error);
      toast.error('Failed to search properties');
    } finally {
      setSearchLoading(false);
    }
  };

  // Function to open property search modal
  const openPropertySearch = () => {
    if (!currentUser) {
      setShowComparisonTooltip(true);
      setTimeout(() => setShowComparisonTooltip(false), 3000);
      return;
    }
    setShowPropertySearch(true);
  };

  // Function to add property from search results
  const addPropertyFromSearch = (property) => {
    if (comparisonProperties.length >= 4) {
      toast.error('You can compare maximum 4 properties');
      return;
    }

    if (comparisonProperties.some(p => p._id === property._id)) {
      toast.error('Property already added to comparison');
      return;
    }

    setComparisonProperties(prev => [...prev, property]);
    toast.success('Property added to comparison');
    
    // Remove from search results
    setSearchResults(prev => prev.filter(p => p._id !== property._id));
  };

  // Function to show sign-in prompt
  const showSignInPrompt = () => {
    setShowSignInTooltip(true);
    setTimeout(() => setShowSignInTooltip(false), 3000);
  };

  // Function to get amenities list
  const getAmenities = () => {
    const amenities = [];
    if (listing.parking) amenities.push({ name: 'Parking', icon: <FaCar />, color: 'text-blue-600' });
    if (listing.furnished) amenities.push({ name: 'Furnished', icon: <FaChair />, color: 'text-green-600' });
    if (listing.garden) amenities.push({ name: 'Garden', icon: <FaTree />, color: 'text-green-500' });
    if (listing.swimmingPool) amenities.push({ name: 'Swimming Pool', icon: <FaSwimmingPool />, color: 'text-blue-500' });
    if (listing.wifi) amenities.push({ name: 'WiFi', icon: <FaWifi />, color: 'text-purple-600' });
    if (listing.security) amenities.push({ name: '24/7 Security', icon: <FaShieldAlt />, color: 'text-red-600' });
    if (listing.gym) amenities.push({ name: 'Gym', icon: <FaBuilding />, color: 'text-orange-600' });
    if (listing.lift) amenities.push({ name: 'Lift', icon: <FaBuilding />, color: 'text-gray-600' });
    return amenities;
  };

  // Function to get nearby places with static data based on property
  const getNearbyPlaces = () => {
    if (!listing) return [];
    
    // Use property ID hash to generate consistent values
    const propertyId = listing._id;
    const hash = propertyId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Generate consistent distances based on property ID
    const baseDistance = (Math.abs(hash) % 200) / 100 + 0.3; // 0.3 to 2.3 km
    const hospitalDistance = (Math.abs(hash * 2) % 300) / 100 + 0.5; // 0.5 to 3.5 km
    const schoolDistance = (Math.abs(hash * 3) % 200) / 100 + 0.2; // 0.2 to 2.2 km
    const mallDistance = (Math.abs(hash * 4) % 500) / 100 + 1; // 1 to 6 km
    const airportDistance = (Math.abs(hash * 5) % 3000) / 100 + 15; // 15 to 45 km
    
    // Generate consistent counts based on city and property ID
    const cityMultiplier = listing.city === 'Mumbai' || listing.city === 'Delhi' || listing.city === 'Bangalore' ? 1.5 : 1;
    const restaurantCount = Math.floor((Math.abs(hash * 6) % 200) / 10 * cityMultiplier) + 10;
    const hospitalCount = Math.floor((Math.abs(hash * 7) % 50) / 10 * cityMultiplier) + 3;
    const schoolCount = Math.floor((Math.abs(hash * 8) % 80) / 10 * cityMultiplier) + 5;
    const mallCount = Math.floor((Math.abs(hash * 9) % 30) / 10 * cityMultiplier) + 2;
    
    return [
      { 
        name: 'Restaurants', 
        icon: <FaUtensils />, 
        distance: `${baseDistance.toFixed(1)} km`, 
        count: `${restaurantCount}+`,
        category: 'food'
      },
      { 
        name: 'Hospitals', 
        icon: <FaHospital />, 
        distance: `${hospitalDistance.toFixed(1)} km`, 
        count: `${hospitalCount}`,
        category: 'healthcare'
      },
      { 
        name: 'Schools', 
        icon: <FaSchool />, 
        distance: `${schoolDistance.toFixed(1)} km`, 
        count: `${schoolCount}`,
        category: 'education'
      },
      { 
        name: 'Shopping Malls', 
        icon: <FaShoppingCart />, 
        distance: `${mallDistance.toFixed(1)} km`, 
        count: `${mallCount}`,
        category: 'shopping'
      },
      { 
        name: 'Airport', 
        icon: <FaPlane />, 
        distance: `${airportDistance.toFixed(0)} km`, 
        count: '1',
        category: 'transport'
      }
    ];
  };

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get/${params.listingId}`);
        const data = await res.json();
        if (data.success === false) {
          return;
        }
        setListing(data);
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.listingId]);

  useEffect(() => {
    const fetchNeighborhood = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ai/neighborhood/${params.listingId}`);
        if (res.ok) {
          const data = await res.json();
          setNeighborhood(data);
        }
      } catch (_) {}
    };
    fetchNeighborhood();
  }, [params.listingId]);

  // Reset view tracking when listing ID changes
  useEffect(() => {
    setViewTracked(false);
  }, [params.listingId]);

  // Track property view when listing loads
  useEffect(() => {
    if (listing) {
      trackPropertyView();
      fetchSimilarProperties();
      // Calculate days listed once
      const createdDate = new Date(listing.createdAt);
      const currentDate = new Date();
      const daysDiff = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
      setDaysListed(daysDiff);
    }
  }, [listing]);

  // Fetch owner details after listing is loaded
  useEffect(() => {
    const fetchOwnerDetails = async () => {
      if (listing && listing.userRef) {
        setOwnerLoading(true);
        setOwnerError("");
        try {
          const res = await fetch(`${API_BASE_URL}/api/user/id/${listing.userRef}`);
          if (!res.ok) throw new Error("Failed to fetch owner details");
          const data = await res.json();
          setOwnerDetails(data);
          setOwnerStatus({ isActive: true, owner: data });
        } catch (err) {
          setOwnerError("Could not load owner details");
          setOwnerDetails(null);
          setOwnerStatus({ isActive: false, owner: null });
        } finally {
          setOwnerLoading(false);
        }
      } else {
        setOwnerDetails(null);
        setOwnerStatus({ isActive: false, owner: null });
      }
    };
    fetchOwnerDetails();
  }, [listing]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-2 md:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 relative">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-lg font-semibold text-blue-600">Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-2 md:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 relative">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-red-600 mb-4">Property Not Found</h3>
            <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
            <Link 
              to={backButtonInfo.path}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold"
            >
              {backButtonInfo.text}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-2 md:px-8">
        <div className="max-w-4xl w-full mx-auto bg-white rounded-xl shadow-lg p-3 sm:p-6 relative overflow-x-hidden">
          {/* Header with Back Button and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(backButtonInfo.path)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
              >
                <FaArrowLeft /> {backButtonInfo.text}
              </button>
              
              {/* Comparison Button */}
              <div className="relative">
                <button
                  onClick={() => addToComparison(listing)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
                >
                  <FaChartLine /> + Compare
                </button>
                
                {/* Comparison Tooltip */}
                {showComparisonTooltip && (
                  <div className="absolute top-full left-0 mt-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50">
                    Please sign in to use comparison tool
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Owner Edit Button - Show for property owners in non-admin context */}
            {currentUser && !isAdminContext && (listing.sellerId === currentUser._id || listing.userRef === currentUser._id) && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to={`/user/update-listing/${listing._id}`}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
                >
                  <FaEdit /> Edit Property
                </Link>
              </div>
            )}
            
            {/* Admin Actions - Show for admins in admin context */}
            {isAdmin && isAdminContext && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to={`/admin/update-listing/${listing._id}`}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
                >
                  <FaEdit /> Edit Property
                </Link>
                <button
                  onClick={handleDelete}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
                >
                  <FaTrash /> Delete Property
                </button>
              </div>
            )}
          </div>

          {/* Floating Comparison Panel */}
          {comparisonProperties.length > 0 && (
            <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-purple-200 p-4 z-40 max-w-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-purple-700 flex items-center gap-2">
                  <FaChartLine /> Comparison ({comparisonProperties.length}/4)
                </h3>
                <button
                  onClick={() => setComparisonProperties([])}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-2 mb-3">
                {comparisonProperties.map((property) => (
                  <div key={property._id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-2">
                      <img 
                        src={property.imageUrls?.[0] || '/placeholder-property.jpg'} 
                        alt={property.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                      <span className="text-sm font-medium truncate max-w-[150px]">{property.name}</span>
                    </div>
                    <button
                      onClick={() => removeFromComparison(property._id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={openPropertySearch}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  + Add More Properties
                </button>
                <button
                  onClick={openComparisonModal}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Compare Now
                </button>
              </div>
            </div>
          )}

          <h3 className="text-3xl font-extrabold text-blue-700 mb-6 text-center drop-shadow">
            Property Details {isAdmin && isAdminContext && "(Admin View)"}
          </h3>

          {/* Swiper Section */}
          <div className="relative mb-6">
            <Swiper 
              navigation 
              modules={[Navigation]} 
              className="rounded-lg overflow-hidden relative"
              onSlideChange={(swiper) => {
                // Update selected image index when swiper changes
                setSelectedImageIndex(swiper.activeIndex);
              }}
            >
              {listing.imageUrls && listing.imageUrls.length > 0 ? (
                listing.imageUrls.map((url, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative group">
                      <img
                        src={url}
                        alt={`${listing.name} - Image ${index + 1}`}
                        className="w-full h-40 sm:h-64 md:h-96 object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/800x600?text=Image+Not+Available";
                          e.target.className = "w-full h-40 sm:h-64 md:h-96 object-cover opacity-50";
                        }}
                      />
                      {/* Expand Button Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <FaExpand className="text-gray-700" />
                        </div>
                      </div>
                      {/* Click to expand text */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Click to expand
                      </div>
                      {/* Invisible clickable overlay */}
                      <button
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleImageClick(index);
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleImageClick(index);
                        }}
                        aria-label={`Expand image ${index + 1}`}
                      />
                    </div>
                  </SwiperSlide>
                ))
              ) : (
                <SwiperSlide>
                  <div className="w-full h-64 md:h-96 bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">🏠</div>
                      <p className="text-lg">No images available</p>
                    </div>
                  </div>
                </SwiperSlide>
              )}
            </Swiper>
          </div>

          {/* Share and Report Buttons */}
          <div className="flex justify-end items-center space-x-4 mb-4 pr-2">
            {/* Report Button - Only for logged-in users who are not the owner */}
            {currentUser && !isAdmin && currentUser._id !== listing.userRef && (
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                title="Report this property"
              >
                <FaFlag className="text-sm" />
                <span className="text-sm font-medium">Report</span>
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
              title="Share this property"
            >
              <FaShare className="text-sm" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
          {copied && (
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2">
                <FaCheckCircle className="text-sm" />
                <span className="text-sm font-medium">Link copied to clipboard!</span>
              </div>
            </div>
          )}

          {/* Details Card */}
          <div className="p-3 sm:p-6 bg-gray-50 shadow-md rounded-lg mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 break-words flex items-center gap-2">
                {listing.name}
                {/* Wishlist Heart Icon - match ListingItem style */}
                <button
                  onClick={() => {
                    if (!currentUser) {
                      toast.info('Please sign in to add properties to your wishlist.');
                      navigate('/sign-in');
                      return;
                    }
                    if (isInWishlist(listing._id)) {
                      removeFromWishlist(listing._id);
                    } else {
                      addToWishlist(listing);
                      //toast.success('Property added to your wishlist.');
                    }
                  }}
                  className={`ml-2 p-2 rounded-full transition z-20 ${isInWishlist(listing._id) ? 'bg-red-500 text-white' : 'bg-gray-200 text-red-500 hover:text-red-600'} focus:outline-none`}
                  title={isInWishlist(listing._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  style={{ lineHeight: 0 }}
                >
                  <FaHeart className="text-base sm:text-lg" />
                </button>
              </h2>
              {/* Offer Badge */}
              {listing.offer && getDiscountPercentage() > 0 && (
                <span
                  className="bg-yellow-400 text-gray-900 text-sm font-semibold px-4 py-1 rounded-full shadow-md animate-pulse w-max sm:w-auto ml-0 sm:ml-2 mt-2 sm:mt-0"
                  style={{ alignSelf: 'flex-start' }}
                  title="Limited-time offer!"
                >
                  {getDiscountPercentage()}% OFF
                </span>
              )}
            </div>
            
            {/* Price Display */}
            <div className="mb-4">
              {listing.offer && getDiscountPercentage() > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <p className="text-lg sm:text-2xl md:text-3xl text-blue-600 font-semibold">
                    {formatINR(listing.discountPrice)}
                    {listing.type === "rent" && " / month"}
                  </p>
                  <p className="text-base sm:text-xl text-gray-500 line-through">
                    {formatINR(listing.regularPrice)}
                  </p>
                  <span className="text-xs sm:text-sm text-green-600 font-semibold">
                    Save {formatINR(listing.regularPrice - listing.discountPrice)}
                  </span>
                </div>
              ) : (
                <p className="text-lg sm:text-2xl md:text-3xl text-blue-600 font-semibold">
                  {formatINR(listing.regularPrice)}
                  {listing.type === "rent" && " / month"}
                </p>
              )}
            </div>

            <p className="flex items-center text-gray-600 mb-4">
              <FaMapMarkerAlt className="mr-2 text-red-500" /> 
              {maskAddress(
                // Create address object if structured fields exist, otherwise use legacy address
                listing.propertyNumber || listing.city ? {
                  propertyNumber: listing.propertyNumber,
                  landmark: listing.landmark,
                  city: listing.city,
                  district: listing.district,
                  state: listing.state,
                  pincode: listing.pincode
                } : listing.address,
                !!currentUser
              )}
            </p>

            {listing.locationLink && shouldShowLocationLink(!!currentUser) && (
              <div className="mb-4">
                <a
                  href={listing.locationLink}
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
                >
                  {getLocationLinkText(!!currentUser)}
                </a>
              </div>
            )}

            {listing.locationLink && !shouldShowLocationLink(!!currentUser) && (
              <div className="mb-4">
                <button
                  onClick={() => navigate('/sign-in')}
                  className="inline-block bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 shadow-lg font-semibold"
                >
                  {getLocationLinkText(!!currentUser)}
                </button>
              </div>
            )}

            <div className="flex space-x-4 mb-4">
              <span className={`px-3 py-1 text-white rounded-md ${listing.type === "rent" ? "bg-blue-500" : "bg-green-500"}`}>
                {listing.type === "rent" ? "For Rent" : "For Sale"}
              </span>
            </div>

            <p className="text-gray-700 mb-4 leading-relaxed">
              <span className="font-semibold">Description:</span> {listing.description}
            </p>

            {/* VR / Drone media blocks if present */}
            {(listing.vrTourUrl || listing.droneVideoUrl) && (
              <div className="space-y-4 mb-4">
                {listing.vrTourUrl && (
                  <div className="border rounded-lg p-3 bg-white">
                    <h4 className="font-semibold text-gray-800 mb-2">Virtual Tour</h4>
                    <iframe src={listing.vrTourUrl} title="VR Tour" className="w-full h-64 rounded" allowFullScreen />
                  </div>
                )}
                {listing.droneVideoUrl && (
                  <div className="border rounded-lg p-3 bg-white">
                    <h4 className="font-semibold text-gray-800 mb-2">Drone View</h4>
                    <video src={listing.droneVideoUrl} className="w-full h-64 rounded" controls />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                <FaBed className="mr-2 text-blue-500" /> {listing.bedrooms} {listing.bedrooms > 1 ? "beds" : "bed"}
              </div>
              <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                <FaBath className="mr-2 text-blue-500" /> {listing.bathrooms} {listing.bathrooms > 1 ? "baths" : "bath"}
              </div>
              <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                <FaParking className="mr-2 text-blue-500" /> {listing.parking ? "Parking" : "No Parking"}
              </div>
              <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                <FaChair className="mr-2 text-blue-500" /> {listing.furnished ? "Furnished" : "Unfurnished"}
              </div>
            </div>

            {/* Enhanced Property Features */}
            <div className="mt-6 space-y-4">
              {/* Property Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <FaRuler className="mx-auto text-green-600 mb-1" />
                  <p className="text-xs text-gray-600">Area</p>
                  <p className="font-semibold">
                    {listing.area ? `${listing.area} sq ft` : 'Not specified'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <FaBuilding className="mx-auto text-purple-600 mb-1" />
                  <p className="text-xs text-gray-600">Floor</p>
                  <p className="font-semibold">
                    {listing.floor !== undefined && listing.floor !== null && listing.floor !== '' ? 
                      (listing.floor == 0 ? 'Ground Floor' : `Floor ${listing.floor}`) : 
                      'Not specified'
                    }
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <FaEye className="mx-auto text-blue-600 mb-1" />
                  <p className="text-xs text-gray-600">Views</p>
                  <p className="font-semibold">
                    {listing.viewCount || 0}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <FaCalendarAlt className="mx-auto text-orange-600 mb-1" />
                  <p className="text-xs text-gray-600">Age</p>
                  <p className="font-semibold">
                    {listing.propertyAge ? `${listing.propertyAge} years` : 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Interactive Feature Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setShowAmenities(!showAmenities)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <FaHome />
                  <span className="text-sm font-medium">Amenities</span>
                </button>
                <button
                  onClick={() => setShowNearbyPlaces(!showNearbyPlaces)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <FaMapMarkerAlt />
                  <span className="text-sm font-medium">Nearby</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        showSignInPrompt();
                        return;
                      }
                      setShowPriceAnalysis(!showPriceAnalysis);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FaChartLine />
                    <span className="text-sm font-medium">Price Analysis</span>
                  </button>
                  {showSignInTooltip && (
                    <div className="absolute top-full left-0 mt-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50">
                      Please sign in to view price analysis
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        showSignInPrompt();
                        return;
                      }
                      setShowContactInfo(!showContactInfo);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FaChartLine />
                    <span className="text-sm font-medium">Insights</span>
                  </button>
                  {showSignInTooltip && (
                    <div className="absolute top-full left-0 mt-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50">
                      Please sign in to view insights
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Amenities Section */}
          {showAmenities && (
            <div className="p-6 bg-white shadow-md rounded-lg mb-6">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaHome className="text-blue-600" />
                Property Amenities
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getAmenities().map((amenity, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className={`mr-3 ${amenity.color}`}>{amenity.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{amenity.name}</span>
                  </div>
                ))}
                {getAmenities().length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-4">
                    No specific amenities listed
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nearby Places Section */}
          {showNearbyPlaces && (
            <div className="p-6 bg-white shadow-md rounded-lg mb-6">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-green-600" />
                Nearby Places
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getNearbyPlaces().map((place, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <span className="mr-3 text-blue-600">{place.icon}</span>
                      <div>
                        <p className="font-medium text-gray-800">{place.name}</p>
                        <p className="text-sm text-gray-600">{place.count} {place.count === '1' ? 'place' : 'places'}</p>
                        <p className="text-xs text-gray-500 capitalize">{place.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-green-600">{place.distance}</span>
                      <p className="text-xs text-gray-500">away</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Analysis Section */}
          {showPriceAnalysis && currentUser && (
            <div className="p-6 bg-white shadow-md rounded-lg mb-6">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaChartLine className="text-purple-600" />
                Price Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">Current Price</h5>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatINR(listing.offer ? listing.discountPrice : listing.regularPrice)}
                      {listing.type === "rent" && " / month"}
                    </p>
                    {listing.offer && (
                      <p className="text-sm text-green-600 mt-1">
                        Save {formatINR(listing.regularPrice - listing.discountPrice)} ({getDiscountPercentage()}% off)
                      </p>
                    )}
                  </div>
                  
                  {listing.type === "sale" && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-green-800">EMI Calculator</h5>
                        <button
                          onClick={() => setShowCalculatorModal(true)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-full transition-colors"
                          title="Open EMI Calculator"
                        >
                          <FaCalculator className="text-lg" />
                        </button>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        ₹{calculateEMI(listing.offer ? listing.discountPrice : listing.regularPrice).toLocaleString('en-IN')} / month
                      </p>
                      <p className="text-xs text-gray-600 mt-1">@ 8.5% for 20 years</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-800 mb-2">Price per sq ft</h5>
                    <p className="text-xl font-bold text-gray-700">
                      ₹{listing.area ? Math.round((listing.offer ? listing.discountPrice : listing.regularPrice) / listing.area).toLocaleString('en-IN') : 'N/A'} / sq ft
                    </p>
                  </div>
                  
                  {neighborhood && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-yellow-800 mb-2">Area Average</h5>
                      <p className="text-lg font-bold text-yellow-600">
                        ₹{neighborhood.averagePriceNearby?.toLocaleString('en-IN') || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Average price in {neighborhood.city}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Property Insights Section */}
          {showContactInfo && currentUser && (
            <div className="p-6 bg-white shadow-md rounded-lg mb-6">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaChartLine className="text-orange-600" />
                Property Insights & Analytics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <FaEye className="text-blue-600" />
                      Property Performance
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Views</span>
                        <span className="font-semibold text-blue-600">
                          {listing.viewCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Days Listed</span>
                        <span className="font-semibold text-blue-600">
                          {daysListed > 0 ? `${daysListed} days` : 'Today'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Interest Level</span>
                        <span className="font-semibold text-green-600">
                          {(() => {
                            const views = listing.viewCount || 0;
                            return views > 100 ? 'High' : views > 50 ? 'Medium' : 'Low';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <FaThumbsUp className="text-green-600" />
                      Market Position
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Price Competitiveness</span>
                        <span className="font-semibold text-green-600">
                          {neighborhood && neighborhood.averagePriceNearby ? 
                            (listing.regularPrice < neighborhood.averagePriceNearby ? 'Below Market' : 'Above Market') : 
                            'Market Rate'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Property Type</span>
                        <span className="font-semibold text-green-600">{listing.type === 'rent' ? 'Rental' : 'Sale'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Demand Score</span>
                        <span className="font-semibold text-green-600">
                          {listing.bedrooms >= 3 ? 'High' : listing.bedrooms === 2 ? 'Medium' : 'Standard'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                    <h5 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <FaComments className="text-purple-600" />
                      Community Feedback
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Rating</span>
                        <span className="font-semibold text-purple-600">
                          {listing.averageRating > 0 ? `${listing.averageRating.toFixed(1)} ⭐` : 'No ratings yet'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Reviews</span>
                        <span className="font-semibold text-purple-600">{listing.reviewCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Owner Response Rate</span>
                        <span className="font-semibold text-purple-600">85%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                    <h5 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                      <FaCalculator className="text-orange-600" />
                      Investment Analysis
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ROI Potential</span>
                        <span className="font-semibold text-orange-600">
                          {listing.type === 'rent' ? '5-8%' : '8-12%'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Appreciation Rate</span>
                        <span className="font-semibold text-orange-600">6-10% annually</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Risk Level</span>
                        <span className="font-semibold text-orange-600">Low-Medium</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Information - Only show for admins */}
          {isAdmin && isAdminContext && (
            <>
              <div className="p-6 bg-blue-50 shadow-md rounded-lg mb-6">
                <h4 className="text-xl font-bold text-blue-800 mb-4">Admin Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Property ID</p>
                    <p className="font-semibold text-gray-800">{listing._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created Date</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(listing.createdAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(listing.updatedAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-semibold text-gray-800">{listing.userRef || 'Unknown'}</p>
                  </div>
                </div>
              </div>
              {/* Property Owner Details Section */}
              <div className="p-6 bg-green-50 shadow-md rounded-lg mb-6">
                <h4 className="text-xl font-bold text-green-800 mb-4">Property Owner Details</h4>
                {ownerLoading ? (
                  <p className="text-gray-500">Loading owner details...</p>
                ) : ownerDetails && ownerStatus.isActive ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Owner Name</p>
                        <p className="font-semibold text-gray-800">{ownerDetails.username}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Owner Email</p>
                        <p className="font-semibold text-gray-800">{ownerDetails.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mobile Number</p>
                        <p className="font-semibold text-gray-800">{ownerDetails.mobileNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Owner ID</p>
                        <p className="font-semibold text-gray-800">{ownerDetails._id}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-700 text-sm font-medium">
                          ℹ️ Owner account is active and accessible. No reassignment needed.
                        </p>
                      </div>
                    )}
                  </div>
                ) : ownerError ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-red-500">{ownerError}</p>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          fetchAvailableUsers();
                          setShowAssignOwnerModal(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
                      >
                        <FaEdit /> Assign New Owner
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No owner details found.</p>
                )}
              </div>
            </>
          )}

          {/* Additional Details - Only show for owner of this property (non-admin context) */}
          {currentUser && (listing.sellerId === currentUser._id || listing.userRef === currentUser._id) && !(isAdmin && isAdminContext) && (
            <div className="p-6 bg-gray-50 shadow-md rounded-lg mb-6">
              <h4 className="text-xl font-bold text-gray-800 mb-4">Additional Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Created Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(listing.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(listing.updatedAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Book Appointment Button */}
          <div className="flex justify-center">
            {currentUser && (listing.sellerId === currentUser._id || listing.userRef === currentUser._id) ? (
              <div className="text-red-500 font-semibold text-lg py-3">You cannot book an appointment for your own property.</div>
            ) : (
              <button
                onClick={() => {
                  if (!currentUser) {
                    toast.info('Please sign in to book appointments.');
                    navigate('/sign-in');
                    return;
                  }
                  const appointmentUrl = isAdminContext 
                    ? `/admin/appointmentlisting?listingId=${listing._id}&propertyName=${encodeURIComponent(listing.name)}&propertyDescription=${encodeURIComponent(listing.description)}&listingType=${listing.type}`
                    : `/user/appointment?listingId=${listing._id}&propertyName=${encodeURIComponent(listing.name)}&propertyDescription=${encodeURIComponent(listing.description)}&listingType=${listing.type}`;
                  navigate(appointmentUrl);
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
              >
                📅 Book Appointment
              </button>
            )}
          </div>

          {/* Neighborhood Insights */}
          {neighborhood && (
            <div className="mt-8 p-4 bg-white rounded-lg shadow">
              <h4 className="text-xl font-bold text-gray-800 mb-3">Neighborhood Insights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">City</p>
                  <p className="font-semibold text-gray-800">{neighborhood.city}</p>
                </div>
                <div>
                  <p className="text-gray-600">Average Price Nearby</p>
                  <p className="font-semibold text-gray-800">₹{(neighborhood.averagePriceNearby||0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-600">School Score</p>
                  <p className="font-semibold text-gray-800">{neighborhood.schoolScore}</p>
                </div>
                <div>
                  <p className="text-gray-600">Safety Score</p>
                  <p className="font-semibold text-gray-800">{neighborhood.safetyScore}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-gray-600">Commute Times</p>
                <p className="font-semibold text-gray-800">Metro: {neighborhood.commuteTimes?.metro}, Bus: {neighborhood.commuteTimes?.bus}, Car: {neighborhood.commuteTimes?.car}</p>
              </div>
              <div className="mt-3">
                <p className="text-gray-600">Nearby Amenities</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(neighborhood.nearbyAmenities||[]).map((a,i)=>(
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded text-gray-700">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Similar Properties Section */}
          {similarProperties.length > 0 && (
            <div className="mt-8 p-6 bg-white shadow-md rounded-lg mb-6">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaHome className="text-blue-600" />
                Similar Properties in {listing.city}
              </h4>
              {loadingSimilar ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similarProperties.map((property) => (
                    <div key={property._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-800 truncate">{property.name}</h5>
                        <span className={`px-2 py-1 text-xs rounded ${property.type === 'rent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {property.type === 'rent' ? 'Rent' : 'Sale'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{property.city}, {property.state}</p>
                      <p className="text-lg font-bold text-blue-600 mb-2">
                        {formatINR(property.offer ? property.discountPrice : property.regularPrice)}
                        {property.type === "rent" && " / month"}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>{property.bedrooms} bed • {property.bathrooms} bath</span>
                      </div>
                      <div className="flex gap-2">
                        <Link 
                          to={`/listing/${property._id}`}
                          className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </Link>
                        <div className="relative">
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                showSignInPrompt();
                                return;
                              }
                              addPropertyFromSearch(property);
                            }}
                            className="bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 transition-colors"
                          >
                            + Compare
                          </button>
                          {showSignInTooltip && (
                            <div className="absolute top-full left-0 mt-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50">
                              Please sign in to use comparison tool
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Section Toggle Button */}
          <div className="flex justify-center mt-8">
            <div className="relative">
              <button
                onClick={() => {
                  if (!currentUser) {
                    showSignInPrompt();
                    return;
                  }
                  setShowReviews((prev) => !prev);
                }}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-2 rounded-lg shadow font-semibold flex items-center gap-2 hover:from-yellow-500 hover:to-yellow-700 transition-all"
              >
                {showReviews ? 'Hide Reviews' : 'Show Reviews'}
                {listing.reviewCount > 0 && (
                  <span className="ml-2 bg-white text-yellow-700 rounded-full px-2 py-0.5 text-xs font-bold">
                    {listing.reviewCount}
                  </span>
                )}
              </button>
              {showSignInTooltip && (
                <div className="absolute top-full left-0 mt-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50">
                  Please sign in to view reviews
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
                </div>
              )}
            </div>
          </div>
          {/* Reviews Section (collapsible) */}
          {showReviews && currentUser && (
            <div className="mt-8">
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FaStar className="text-yellow-500 mr-2" />
                    Reviews
                    {listing.averageRating > 0 && (
                      <span className="ml-2 text-lg text-gray-600">
                        ({listing.averageRating.toFixed(1)} ⭐ • {listing.reviewCount} review{listing.reviewCount !== 1 ? 's' : ''})
                      </span>
                    )}
                  </h3>
                </div>
                {/* Review Form */}
                <ReviewForm 
                  listingId={listing._id} 
                  onReviewSubmitted={() => {
                    // Refresh the listing data to update rating
                    window.location.reload();
                  }}
                />
                {/* Review List */}
                <ReviewList 
                  listingId={listing._id}
                  onReviewDeleted={() => {
                    // Refresh the listing data to update rating
                    window.location.reload();
                  }}
                  listingOwnerId={listing.userRef}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <ContactSupportWrapper />
      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form onSubmit={handleReasonSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col gap-4">
            <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2"><FaTrash /> Reason for Deletion</h3>
            <textarea
              className="border rounded p-2 w-full"
              placeholder="Enter reason for deleting this property"
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              rows={3}
              autoFocus
            />
            {deleteError && <div className="text-red-600 text-sm">{deleteError}</div>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowReasonModal(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-red-600 text-white font-semibold">Next</button>
            </div>
          </form>
        </div>
      )}
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form onSubmit={handlePasswordSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col gap-4">
            <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2"><FaLock /> Confirm Password</h3>
            <input
              type="password"
              className="border rounded p-2 w-full"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              autoFocus
            />
            {deleteError && <div className="text-red-600 text-sm">{deleteError}</div>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-700 text-white font-semibold" disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Confirm & Delete'}</button>
            </div>
          </form>
        </div>
      )}
      
      {/* Image Preview Modal */}
      {listing && listing.imageUrls && listing.imageUrls.length > 0 && (
        <ImagePreview
          isOpen={showImagePreview}
          onClose={() => setShowImagePreview(false)}
          images={listing.imageUrls}
          initialIndex={selectedImageIndex}
          listingId={listing._id}
          metadata={{
            addedFrom: 'listing',
            listingName: listing.name,
            listingType: listing.type
          }}
        />
      )}

      {/* Report Property Modal */}
      {showReportModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
              <FaFlag /> Report Property
            </h3>
            <p className="text-sm text-gray-600">Help us maintain quality by reporting any issues with this property.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Category *</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                >
                  <option value="">Select a category</option>
                  <option value="fake">Fake / misleading listing</option>
                  <option value="wrong_info">Wrong information</option>
                  <option value="inappropriate">Inappropriate images/content</option>
                  <option value="scam">Scam / suspicious activity</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {(reportCategory === 'other' || reportCategory) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {reportCategory === 'other' ? 'Additional Details *' : 'Additional Details (Optional)'}
                  </label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                    rows={4}
                    placeholder={reportCategory === 'other' ? 'Please provide details about the issue...' : 'Provide additional context (optional)...'}
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportCategory('');
                  setReportDetails('');
                }}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReportProperty}
                disabled={reportLoading || !reportCategory || (reportCategory === 'other' && !reportDetails.trim())}
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {reportLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Reporting...
                  </>
                ) : (
                  <>
                    <FaFlag className="text-sm" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign New Owner Modal */}
      {showAssignOwnerModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2"><FaEdit /> Assign New Owner</h3>
            <p className="text-sm text-gray-600">Select a user to assign as the new owner of this property.</p>
            <select
              className="border rounded p-2 w-full"
              value={selectedNewOwner}
              onChange={(e) => setSelectedNewOwner(e.target.value)}
              disabled={assignOwnerLoading}
            >
              <option value="">Select a user</option>
              {availableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
            {assignOwnerLoading && <p className="text-gray-500">Assigning new owner...</p>}
            {selectedNewOwner && !assignOwnerLoading && (
              <button
                onClick={handleAssignNewOwner}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
              >
                <FaCheckCircle /> Confirm Assignment
              </button>
            )}
            <button
              onClick={() => setShowAssignOwnerModal(false)}
              className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* EMI Calculator Modal */}
      {showCalculatorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
                <FaCalculator /> EMI Calculator
              </h3>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
            
            <EMICalculator 
              propertyPrice={listing.offer ? listing.discountPrice : listing.regularPrice}
              propertyName={listing.name}
            />
          </div>
        </div>
      )}

      {/* Property Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
                  <FaChartLine /> Property Comparison Tool
                </h2>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-purple-50">
                      <th className="border border-gray-300 p-3 text-left font-semibold text-purple-800">Property</th>
                      {comparisonProperties.map((property, index) => (
                        <th key={property._id} className="border border-gray-300 p-3 text-center font-semibold text-purple-800 min-w-[200px]">
                          <div className="flex flex-col items-center">
                            <img 
                              src={property.imageUrls?.[0] || '/placeholder-property.jpg'} 
                              alt={property.name}
                              className="w-16 h-16 object-cover rounded-lg mb-2"
                            />
                            <span className="text-sm font-medium">{property.name}</span>
                            <button
                              onClick={() => removeFromComparison(property._id)}
                              className="mt-1 text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Basic Information */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-semibold text-gray-700">Basic Information</td>
                      {comparisonProperties.map((property) => (
                        <td key={property._id} className="border border-gray-300 p-3 text-sm">
                          <div className="space-y-1">
                            <div><strong>Location:</strong> {property.city}, {property.state}</div>
                            <div><strong>Type:</strong> {property.type}</div>
                            <div><strong>BHK:</strong> {property.bhk}</div>
                            <div><strong>Furnished:</strong> {property.furnished ? 'Yes' : 'No'}</div>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Pricing */}
                    <tr>
                      <td className="border border-gray-300 p-3 font-semibold text-gray-700">Pricing</td>
                      {comparisonProperties.map((property) => {
                        const data = getComparisonData(property);
                        return (
                          <td key={property._id} className="border border-gray-300 p-3 text-sm">
                            <div className="space-y-1">
                              <div><strong>Price:</strong> ₹{data.pricing.price.toLocaleString('en-IN')}</div>
                              <div><strong>Per Sq Ft:</strong> ₹{data.pricing.pricePerSqFt}</div>
                              {data.pricing.discount > 0 && (
                                <div className="text-green-600"><strong>Discount:</strong> ₹{data.pricing.discount.toLocaleString('en-IN')}</div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Size & Layout */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-semibold text-gray-700">Size & Layout</td>
                      {comparisonProperties.map((property) => {
                        const data = getComparisonData(property);
                        return (
                          <td key={property._id} className="border border-gray-300 p-3 text-sm">
                            <div className="space-y-1">
                              <div><strong>Area:</strong> {data.size.area} sq ft</div>
                              <div><strong>Floor:</strong> {data.size.floor}</div>
                              <div><strong>Age:</strong> {data.size.age} years</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Amenities */}
                    <tr>
                      <td className="border border-gray-300 p-3 font-semibold text-gray-700">Amenities</td>
                      {comparisonProperties.map((property) => {
                        const data = getComparisonData(property);
                        return (
                          <td key={property._id} className="border border-gray-300 p-3 text-sm">
                            <div className="space-y-1">
                              <div><strong>Parking:</strong> {data.amenities.parking}</div>
                              <div><strong>Wi-Fi:</strong> {data.amenities.wifi}</div>
                              <div><strong>Power Backup:</strong> {data.amenities.powerBackup}</div>
                              <div><strong>Lift:</strong> {data.amenities.lift}</div>
                              <div><strong>Gym:</strong> {data.amenities.gym}</div>
                              <div><strong>Security:</strong> {data.amenities.security}</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Reviews & Ratings */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-3 font-semibold text-gray-700">Reviews & Ratings</td>
                      {comparisonProperties.map((property) => {
                        const data = getComparisonData(property);
                        return (
                          <td key={property._id} className="border border-gray-300 p-3 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <strong>Rating:</strong>
                                {[...Array(5)].map((_, i) => (
                                  <FaStar key={i} className={i < data.reviews.rating ? 'text-yellow-400' : 'text-gray-300'} size={12} />
                                ))}
                                <span>({data.reviews.rating})</span>
                              </div>
                              <div><strong>Reviews:</strong> {data.reviews.totalReviews}</div>
                              <div><strong>Views:</strong> {data.reviews.views}</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setComparisonProperties([]);
                    setShowComparisonModal(false);
                    toast.success('Comparison cleared');
                  }}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Search Modal */}
      {showPropertySearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
                  <FaChartLine /> Add Properties to Compare
                </h2>
                <button
                  onClick={() => {
                    setShowPropertySearch(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search properties by name, location, type, or BHK..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Results */}
              <div className="space-y-4">
                {searchResults.length > 0 ? (
                  searchResults.map((property) => (
                    <div key={property._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <img 
                          src={property.imageUrls?.[0] || '/placeholder-property.jpg'} 
                          alt={property.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{property.name}</h3>
                          <p className="text-gray-600 text-sm">{property.city}, {property.state}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`px-2 py-1 text-xs rounded ${property.type === 'rent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                              {property.type === 'rent' ? 'Rent' : 'Sale'}
                            </span>
                            <span className="text-sm text-gray-500">{property.bhk} BHK</span>
                            <span className="text-sm text-gray-500">{property.area || 'N/A'} sq ft</span>
                            {property.furnished && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Furnished</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold text-green-600">
                              ₹{(property.offer ? property.discountPrice : property.regularPrice).toLocaleString('en-IN')}
                              {property.type === 'rent' && ' / month'}
                            </span>
                            {property.offer && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{property.regularPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          {property.averageRating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className={i < property.averageRating ? 'text-yellow-400' : 'text-gray-300'} size={12} />
                              ))}
                              <span className="text-xs text-gray-500">({property.averageRating.toFixed(1)})</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => addPropertyFromSearch(property)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          Add to Compare
                        </button>
                      </div>
                    </div>
                  ))
                ) : searchQuery.trim() ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaChartLine className="text-4xl mx-auto mb-2 text-gray-300" />
                    <p>No properties found matching "{searchQuery}"</p>
                    <p className="text-sm">Try searching with different keywords like:</p>
                    <div className="mt-2 text-xs text-gray-400">
                      • Property names (e.g., "Villa", "Apartment")<br/>
                      • Cities (e.g., "Mumbai", "Delhi")<br/>
                      • Types (e.g., "rent", "sale")<br/>
                      • BHK (e.g., "2", "3")
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FaChartLine className="text-4xl mx-auto mb-2 text-gray-300" />
                    <p>Search for properties to add to comparison</p>
                    <p className="text-sm">Enter property name, location, type, or BHK</p>
                    <div className="mt-2 text-xs text-gray-400">
                      Start typing to see suggestions...
                    </div>
                  </div>
                )}
              </div>

              {/* Similar Properties Section */}
              {similarProperties.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Similar Properties</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {similarProperties.map((property) => (
                      <div key={property._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <img 
                            src={property.imageUrls?.[0] || '/placeholder-property.jpg'} 
                            alt={property.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 text-sm">{property.name}</h4>
                            <p className="text-gray-600 text-xs">{property.city}, {property.state}</p>
                            <p className="text-xs text-gray-500">{property.type} • {property.bhk} BHK</p>
                            <p className="font-semibold text-green-600 text-sm">
                              ₹{(property.offer ? property.discountPrice : property.regularPrice).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => {
                                if (!currentUser) {
                                  showSignInPrompt();
                                  return;
                                }
                                addPropertyFromSearch(property);
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              Add
                            </button>
                            {showSignInTooltip && (
                              <div className="absolute top-full left-0 mt-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50">
                                Please sign in to use comparison tool
                                <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {comparisonProperties.length} of 4 properties selected
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPropertySearch(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  {comparisonProperties.length >= 2 && (
                    <button
                      onClick={() => {
                        setShowPropertySearch(false);
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowComparisonModal(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Compare Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

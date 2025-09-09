import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { FaBath, FaBed, FaChair, FaMapMarkerAlt, FaParking, FaShare, FaEdit, FaTrash, FaArrowLeft, FaStar, FaLock, FaHeart, FaExpand, FaCheckCircle, FaFlag, FaRuler, FaBuilding, FaTree, FaWifi, FaSwimmingPool, FaCar, FaShieldAlt, FaClock, FaPhone, FaEnvelope, FaCalendarAlt, FaEye, FaThumbsUp, FaThumbsDown, FaComments, FaCalculator, FaChartLine, FaHome, FaUtensils, FaHospital, FaSchool, FaShoppingCart, FaPlane, FaUser, FaTimes, FaSearch, FaTable, FaRocket } from "react-icons/fa";
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
  const [showPriceAnalysisTooltip, setShowPriceAnalysisTooltip] = useState(false);
  const [showInsightsTooltip, setShowInsightsTooltip] = useState(false);
  const [showReviewsTooltip, setShowReviewsTooltip] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, propertyId: null, origin: null, message: '' });

  const openConfirm = (type, { propertyId = null, origin = null, message = 'Are you sure?' } = {}) => {
    setConfirmModal({ open: true, type, propertyId, origin, message });
  };

  const closeConfirm = () => setConfirmModal({ open: false, type: null, propertyId: null, origin: null, message: '' });

  const confirmYes = () => {
    const { type, propertyId, origin } = confirmModal;
    if (type === 'remove-one' && propertyId) {
      removeFromComparison(propertyId);
    }
    if (type === 'clear-all') {
      setComparisonProperties([]);
      if (origin === 'comparison') {
        setShowComparisonModal(false);
        setShowPropertySearch(true);
      } else if (origin === 'search') {
        // keep search modal open to add more
        setShowPropertySearch(true);
      }
    }
    closeConfirm();
  };

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

  // Function to show sign-in prompt for specific features
  const showSignInPrompt = (tooltipType) => {
    // Hide all tooltips first
    setShowPriceAnalysisTooltip(false);
    setShowInsightsTooltip(false);
    setShowComparisonTooltip(false);
    setShowReviewsTooltip(false);
    
    // Show the specific tooltip
    switch(tooltipType) {
      case 'priceAnalysis':
        setShowPriceAnalysisTooltip(true);
        setTimeout(() => setShowPriceAnalysisTooltip(false), 3000);
        break;
      case 'insights':
        setShowInsightsTooltip(true);
        setTimeout(() => setShowInsightsTooltip(false), 3000);
        break;
      case 'comparison':
        setShowComparisonTooltip(true);
        setTimeout(() => setShowComparisonTooltip(false), 3000);
        break;
      case 'reviews':
        setShowReviewsTooltip(true);
        setTimeout(() => setShowReviewsTooltip(false), 3000);
        break;
      default:
        break;
    }
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
                        showSignInPrompt('priceAnalysis');
                        return;
                      }
                      setShowPriceAnalysis(!showPriceAnalysis);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 w-full"
                  >
                    <FaChartLine />
                    <span className="text-sm font-medium">Price Analysis</span>
                  </button>
                  {showPriceAnalysisTooltip && (
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
                        showSignInPrompt('insights');
                        return;
                      }
                      setShowContactInfo(!showContactInfo);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 w-full"
                  >
                    <FaChartLine />
                    <span className="text-sm font-medium">Insights</span>
                  </button>
                  {showInsightsTooltip && (
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
                                showSignInPrompt('comparison');
                                return;
                              }
                              addPropertyFromSearch(property);
                            }}
                            className="bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 transition-colors"
                          >
                            + Compare
                          </button>
                          {showComparisonTooltip && (
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
                    showSignInPrompt('reviews');
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
              {showReviewsTooltip && (
                <div className="absolute bottom-full left-0 mb-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50">
                  Please sign in to view reviews
                  <div className="absolute -bottom-1 left-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
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

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="px-4 py-3 border-b border-gray-200 font-semibold">Confirm</div>
            <div className="px-4 py-4 text-gray-700 text-sm">{confirmModal.message}</div>
            <div className="px-4 py-3 border-t border-gray-200 flex gap-2 justify-end">
              <button onClick={closeConfirm} className="px-4 py-2 rounded bg-gray-200 text-gray-800 text-sm">Cancel</button>
              <button onClick={confirmYes} className="px-4 py-2 rounded bg-red-600 text-white text-sm">Yes</button>
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

      {/* Advanced Property Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full mx-2 sm:mx-4 h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 sm:p-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1 sm:p-2 bg-white bg-opacity-20 rounded-lg">
                    <FaChartLine className="text-base sm:text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-2xl font-bold">Property Comparison</h2>
                    <p className="text-purple-100 text-[10px] sm:text-sm hidden sm:block">Compare {comparisonProperties.length} properties side by side</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-white bg-opacity-20 rounded-lg px-2 sm:px-3 py-0.5 sm:py-1">
                    <span className="text-[10px] sm:text-sm font-medium">{comparisonProperties.length}/4</span>
                  </div>
                  {comparisonProperties.length < 4 && (
                    <button
                      onClick={() => {
                        setShowComparisonModal(false);
                        setShowPropertySearch(true);
                      }}
                      className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs sm:text-sm font-medium"
                    >
                      + Add Properties
                    </button>
                  )}
                  <button
                    onClick={() => setShowComparisonModal(false)}
                    className="p-1 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-base sm:text-xl" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 sm:p-6 space-y-6 sm:space-y-8">
                {/* Detailed Comparison Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <FaTable /> Detailed Comparison
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm sm:text-base min-w-[640px]">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="px-3 py-2 sm:px-6 sm:py-4 text-left text-gray-700 w-1/4">Attribute</th>
                          {comparisonProperties.map((property) => (
                            <th key={property._id} className="px-3 py-2 sm:px-6 sm:py-4 text-left">
                              <div className="flex items-center gap-2">
                                <img src={property.imageUrls?.[0] || '/placeholder-property.jpg'} alt={property.name} className="w-8 h-8 object-cover rounded" />
                                <span className="font-semibold text-gray-800 text-[11px] sm:text-sm line-clamp-1 flex-1 min-w-0">{property.name}</span>
                                <button
                                  onClick={() => openConfirm('remove-one', { propertyId: property._id, message: 'Remove this property from comparison?' })}
                                  className="ml-auto text-red-600 hover:text-red-700 text-[10px] sm:text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                                  title="Remove from comparison"
                                >
                                  Remove
                                </button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Quick Actions */}
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-700 bg-gray-50">Quick Actions</td>
                          {comparisonProperties.map((property) => (
                            <td key={property._id} className="px-4 py-3 sm:px-6 sm:py-4 text-[13px] sm:text-sm">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Link
                                  to={`/listing/${property._id}`}
                                  className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors text-center"
                                >
                                  View Details
                                </Link>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/listing/${property._id}`);
                                    toast.success('Property link copied!');
                                  }}
                                  className="px-3 py-2 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                  Share Link
                                </button>
                              </div>
                            </td>
                          ))}
                        </tr>
                        {/* Pricing */}
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-700">Pricing</td>
                          {comparisonProperties.map((property) => {
                            const data = getComparisonData(property);
                            const isLowest = comparisonProperties.every(p => {
                              const pData = getComparisonData(p);
                              return data.pricing.price <= pData.pricing.price;
                            });
                            const isHighest = comparisonProperties.every(p => {
                              const pData = getComparisonData(p);
                              return data.pricing.price >= pData.pricing.price;
                            });
                            return (
                              <td key={property._id} className="px-4 py-3 sm:px-6 sm:py-4 text-[13px] sm:text-sm align-top">
                                <div className="space-y-1">
                                  <div className={`font-bold ${isLowest ? 'text-green-700' : isHighest ? 'text-red-700' : 'text-gray-800'}`}>₹{data.pricing.price.toLocaleString('en-IN')}{property.type === 'rent' && <span className="text-xs text-gray-500">/month</span>}</div>
                                  <div className="text-gray-600">₹{data.pricing.pricePerSqFt}/sq ft</div>
                                  {data.pricing.discount > 0 && (
                                    <div className="text-xs text-green-600">Save ₹{data.pricing.discount.toLocaleString('en-IN')}</div>
                                  )}
                                  {isLowest && <div className="text-[10px] sm:text-xs text-green-700 font-semibold flex items-center gap-1">✅ Best Value</div>}
                                  {isHighest && <div className="text-[10px] sm:text-xs text-red-700 font-semibold flex items-center gap-1">⚠️ Highest Price</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        {/* Basic Information */}
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-700 bg-gray-50 w-1/4">Basic Information</td>
                          {comparisonProperties.map((property) => (
                            <td key={property._id} className="px-4 py-3 sm:px-6 sm:py-4 text-[13px] sm:text-sm">
                              <div className="space-y-2">
                                <div><span className="font-medium text-gray-600">Location:</span> {property.city}, {property.state}</div>
                                <div><span className="font-medium text-gray-600">Type:</span> 
                                  <span className={`ml-2 px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full ${
                                    property.type === 'rent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {property.type}
                                  </span>
                                </div>
                                <div><span className="font-medium text-gray-600">BHK:</span> {property.bhk}</div>
                                <div><span className="font-medium text-gray-600">Furnished:</span> 
                                  <span className={`ml-2 px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full ${
                                    property.furnished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {property.furnished ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Size & Layout */}
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-700">Size & Layout</td>
                          {comparisonProperties.map((property) => {
                            const data = getComparisonData(property);
                            return (
                              <td key={property._id} className="px-4 py-3 sm:px-6 sm:py-4 text-[13px] sm:text-sm">
                                <div className="space-y-2">
                                  <div><span className="font-medium text-gray-600">Area:</span> {data.size.area} sq ft</div>
                                  <div><span className="font-medium text-gray-600">Floor:</span> {data.size.floor}</div>
                                  <div><span className="font-medium text-gray-600">Age:</span> {data.size.age} years</div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Amenities */}
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-700">Amenities</td>
                          {comparisonProperties.map((property) => {
                            const data = getComparisonData(property);
                            return (
                              <td key={property._id} className="px-4 py-3 sm:px-6 sm:py-4 text-[13px] sm:text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full text-center ${
                                    data.amenities.parking === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    🅿️ Parking
                                  </div>
                                  <div className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full text-center ${
                                    data.amenities.wifi === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    📶 Wi-Fi
                                  </div>
                                  <div className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full text-center ${
                                    data.amenities.powerBackup === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    ⚡ Power Backup
                                  </div>
                                  <div className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full text-center ${
                                    data.amenities.lift === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    🛗 Lift
                                  </div>
                                  <div className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full text-center ${
                                    data.amenities.gym === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    💪 Gym
                                  </div>
                                  <div className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full text-center ${
                                    data.amenities.security === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    🛡️ Security
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Reviews & Ratings */}
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-gray-700">Reviews & Ratings</td>
                          {comparisonProperties.map((property) => {
                            const data = getComparisonData(property);
                            return (
                              <td key={property._id} className="px-4 py-3 sm:px-6 sm:py-4 text-[13px] sm:text-sm">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Rating:</span>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < data.reviews.rating ? 'text-yellow-400' : 'text-gray-300'} size={12} />
                                      ))}
                                    </div>
                                    <span className="text-gray-600">({data.reviews.rating})</span>
                                  </div>
                                  <div><span className="font-medium text-gray-600">Reviews:</span> {data.reviews.totalReviews}</div>
                                  <div><span className="font-medium text-gray-600">Views:</span> {data.reviews.views}</div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Actions merged into table */}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-3 py-2 sm:px-6 sm:py-4 border-t border-gray-200 sticky bottom-0">
              <div className="flex items-center justify-between">
                <div className="text-xs sm:text-sm text-gray-600">
                  Comparing {comparisonProperties.length} properties • Last updated: {new Date().toLocaleDateString()}
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => openConfirm('clear-all', { origin: 'comparison', message: 'Clear all compared properties? You can add new ones next.' })}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
                  >
                    <FaTrash className="text-sm" />
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowComparisonModal(false)}
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Property Search Modal */}
      {showPropertySearch && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl max-w-5xl w-full mx-4 h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <FaChartLine className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold">Add Properties to Compare</h2>
                    <p className="text-blue-100 text-xs sm:text-sm">Search and select properties for detailed comparison</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                    <span className="text-sm font-medium">{comparisonProperties.length}/4 Selected</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowPropertySearch(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Advanced Search Input */}
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search properties by name, location, type, BHK, or amenities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 sm:py-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg shadow-sm"
                    />
                    {searchLoading && (
                      <div className="absolute right-4 top-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Search Suggestions */}
                  {searchQuery.trim() && (
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">Search suggestions:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Property names</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Cities</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Property types</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">BHK configurations</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Search Results */}
                <div className="space-y-4">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">
                          Search Results ({searchResults.length})
                        </h3>
                        <div className="text-sm text-gray-500">
                          Showing properties matching "{searchQuery}"
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {searchResults.map((property) => {
                          const isAlreadyAdded = comparisonProperties.some(p => p._id === property._id);
                          const canAdd = !isAlreadyAdded && comparisonProperties.length < 4;
                          
                          return (
                            <div key={property._id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:border-purple-300 relative overflow-hidden">
                              <div className="flex gap-4">
                                <div className="relative">
                                  <img 
                                    src={property.imageUrls?.[0] || '/placeholder-property.jpg'} 
                                    alt={property.name}
                                    className="w-20 h-20 object-cover rounded-lg shadow-md"
                                  />
                                  {property.offer && (
                                    <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                      OFFER
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{property.name}</h3>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < (property.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'} size={14} />
                                      ))}
                                      {property.averageRating > 0 && (
                                        <span className="text-xs text-gray-500 ml-1">({property.averageRating.toFixed(1)})</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <p className="text-gray-600 text-sm mb-3">{property.city}, {property.state}</p>
                                  
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                      property.type === 'rent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                      {property.type === 'rent' ? 'Rent' : 'Sale'}
                                    </span>
                                    <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                      {property.bhk} BHK
                                    </span>
                                    {property.area && (
                                      <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                        {property.area} sq ft
                                      </span>
                                    )}
                                    {property.furnished && (
                                      <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                        Furnished
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <div className="text-xl font-bold text-green-600">
                                        ₹{(property.offer ? property.discountPrice : property.regularPrice).toLocaleString('en-IN')}
                                        {property.type === 'rent' && <span className="text-sm text-gray-500">/month</span>}
                                      </div>
                                      {property.offer && (
                                        <div className="text-sm text-gray-500 line-through">
                                          ₹{property.regularPrice.toLocaleString('en-IN')}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 min-w-0">
                                      <Link
                                        to={`/listing/${property._id}`}
                                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                                      >
                                        View
                                      </Link>
                                      <button
                                        onClick={() => addPropertyFromSearch(property)}
                                        disabled={!canAdd}
                                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors w-full sm:w-auto ${
                                          isAlreadyAdded 
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                            : canAdd 
                                              ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                      >
                                        {isAlreadyAdded ? 'Added' : canAdd ? 'Add to Compare' : 'Max Reached'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  
                  ) : searchQuery.trim() ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <FaChartLine className="text-3xl text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Properties Found</h3>
                    <p className="text-gray-600 mb-4">No properties found matching "{searchQuery}"</p>
                    <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm font-medium text-blue-800 mb-2">Try searching with:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                        <div>• Property names</div>
                        <div>• Cities</div>
                        <div>• Property types</div>
                        <div>• BHK configurations</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <FaChartLine className="text-3xl text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Your Search</h3>
                    <p className="text-gray-600 mb-4">Search for properties to add to comparison</p>
                    <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm font-medium text-gray-700 mb-2">Search by:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Property names</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">Locations</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Types</span>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">BHK</span>
                      </div>
                    </div>
                  </div>
                )}
              

                {/* Enhanced Similar Properties Section */}
                {similarProperties.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
                        <FaChartLine />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Similar Properties</h3>
                      <span className="text-sm text-gray-500">({similarProperties.length} found)</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {similarProperties.map((property) => {
                        const isAlreadyAdded = comparisonProperties.some(p => p._id === property._id);
                        const canAdd = !isAlreadyAdded && comparisonProperties.length < 4;
                        
                        return (
                          <div key={property._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                            <div className="flex gap-3">
                              <img 
                                src={property.imageUrls?.[0] || '/placeholder-property.jpg'} 
                                alt={property.name}
                                className="w-16 h-16 object-cover rounded-lg shadow-sm"
                              />
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{property.name}</h4>
                                <p className="text-gray-600 text-xs mb-2">{property.city}, {property.state}</p>
                                
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    property.type === 'rent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {property.type}
                                  </span>
                                  <span className="text-xs text-gray-500">{property.bhk} BHK</span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-green-600 text-sm">
                                      ₹{(property.offer ? property.discountPrice : property.regularPrice).toLocaleString('en-IN')}
                                    </p>
                                    {property.offer && (
                                      <p className="text-xs text-gray-500 line-through">
                                        ₹{property.regularPrice.toLocaleString('en-IN')}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="relative">
                                    <button
                                      onClick={() => {
                                        if (!currentUser) {
                                          showSignInPrompt('comparison');
                                          return;
                                        }
                                        addPropertyFromSearch(property);
                                      }}
                                      disabled={!canAdd}
                                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                        isAlreadyAdded 
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                          : canAdd 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      }`}
                                    >
                                      {isAlreadyAdded ? 'Added' : canAdd ? 'Add' : 'Max'}
                                    </button>
                                    {showComparisonTooltip && (
                                      <div className="absolute top-full left-0 mt-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50">
                                        Please sign in to use comparison tool
                                        <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Enhanced Footer Actions */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 sm:p-6 mt-8 border border-gray-200">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                        <div className="text-sm font-medium text-gray-700">
                          {comparisonProperties.length} of 4 properties selected
                        </div>
                        <div className="text-xs text-gray-500">
                          {comparisonProperties.length >= 2 ? 'Ready to compare!' : 'Add more properties to compare'}
                        </div>
                      </div>
                      
                      {comparisonProperties.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-gray-600">Selected:</div>
                          <div className="flex gap-1">
                            {comparisonProperties.map((property, index) => (
                              <div key={property._id} className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">
                                {index + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => setShowPropertySearch(false)}
                        className="w-full sm:w-auto px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                      >
                        Close
                      </button>
                      {comparisonProperties.length >= 2 && (
                        <button
                          onClick={() => setShowComparisonModal(true)}
                          className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium flex items-center justify-center gap-2"
                        >
                          <FaChartLine />
                          Compare Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
            </div>
          </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}

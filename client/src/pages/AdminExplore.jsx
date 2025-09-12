import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaTrash, FaLock } from "react-icons/fa";
import { useSelector } from "react-redux";
import { toast } from 'react-toastify';
import ListingItem from "../components/ListingItem";
import GeminiAIWrapper from "../components/GeminiAIWrapper";
import LocationSelector from "../components/LocationSelector";
import duckImg from "../assets/duck-go-final.gif";
import ContactSupportWrapper from '../components/ContactSupportWrapper';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminExplore() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    searchTerm: "",
    type: "all",
    parking: false,
    furnished: false,
    offer: false,
    sort: "createdAt",
    order: "desc",
    minPrice: "",
    maxPrice: "",
    city: "",
    state: "",
    bedrooms: "",
    bathrooms: "",
  });
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMoreListing, setShowMoreListing] = useState(false);
  const [locationFilter, setLocationFilter] = useState({ state: "", district: "", city: "" });
  const [smartQuery, setSmartQuery] = useState("");
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    setFormData({
      searchTerm: urlParams.get("searchTerm") || "",
      type: urlParams.get("type") || "all",
      parking: urlParams.get("parking") === "true",
      furnished: urlParams.get("furnished") === "true",
      offer: urlParams.get("offer") === "true",
      sort: urlParams.get("sort") || "createdAt",
      order: urlParams.get("order") || "desc",
      minPrice: urlParams.get("minPrice") || "",
      maxPrice: urlParams.get("maxPrice") || "",
      city: urlParams.get("city") || "",
      state: urlParams.get("state") || "",
      bedrooms: urlParams.get("bedrooms") || "",
      bathrooms: urlParams.get("bathrooms") || "",
    });
    setLocationFilter({
      state: urlParams.get("state") || "",
      district: urlParams.get("district") || "",
      city: urlParams.get("city") || "",
    });

    const fetchListings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get?${urlParams.toString()}`);
        const data = await res.json();
        setListings(data);
        setShowMoreListing(data.length > 8);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
      setLoading(false);
    };
    fetchListings();
  }, [location.search]);

  const handleChanges = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const natural = (formData.searchTerm || '').trim();
    const extracted = { ...formData };
    const inferStateFromCity = (city) => {
      const cityToState = {
        'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra',
        'delhi': 'Delhi', 'new delhi': 'Delhi',
        'bengaluru': 'Karnataka', 'bangalore': 'Karnataka', 'mysuru': 'Karnataka',
        'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu',
        'kolkata': 'West Bengal',
        'hyderabad': 'Telangana',
        'ahmedabad': 'Gujarat', 'surat': 'Gujarat',
        'jaipur': 'Rajasthan',
        'lucknow': 'Uttar Pradesh', 'noida': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh',
        'gurgaon': 'Haryana', 'gurugram': 'Haryana',
        'indore': 'Madhya Pradesh', 'bhopal': 'Madhya Pradesh',
        'patna': 'Bihar'
      };
      const key = (city||'').toLowerCase();
      return cityToState[key] || '';
    };
    if (natural) {
      const bedsMatch = natural.match(/(\d+)\s*(bhk|bed|beds)/i) || natural.match(/^(\d+)\s*bhk/i);
      if (bedsMatch) extracted.bedrooms = bedsMatch[1];
      const priceMatch = natural.match(/(?:under|below|within|upto|up to)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore)?/i);
      if (priceMatch) extracted.maxPrice = priceMatch[1].replace(/,/g,'');
      if (priceMatch && priceMatch[2]) {
        const unit = priceMatch[2].toLowerCase();
        const val = Number(extracted.maxPrice||0);
        if (unit==='k') extracted.maxPrice = String(val*1000);
        if (unit==='l' || unit==='lac' || unit==='lakh') extracted.maxPrice = String(val*100000);
        if (unit==='cr' || unit==='crore') extracted.maxPrice = String(val*10000000);
      }
      const minPriceMatch = natural.match(/(?:above|over|minimum|at least)\s*(\d[\d,]*)/i);
      if (minPriceMatch) extracted.minPrice = minPriceMatch[1].replace(/,/g,'');
      const nearMatch = natural.match(/near\s+([a-zA-Z ]+)/i);
      if (nearMatch) extracted.city = nearMatch[1].trim();
      const inCity = natural.match(/in\s+([a-zA-Z ]+)/i);
      if (inCity) extracted.city = inCity[1].trim();
      if (extracted.city && !extracted.state) extracted.state = inferStateFromCity(extracted.city);
      // Direct state input (if the query is just a state name)
      const states = ['andhra pradesh','arunachal pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana','himachal pradesh','jharkhand','karnataka','kerala','madhya pradesh','maharashtra','manipur','meghalaya','mizoram','nagaland','odisha','punjab','rajasthan','sikkim','tamil nadu','telangana','tripura','uttar pradesh','uttarakhand','west bengal','delhi'];
      const lower = natural.toLowerCase();
      const matchedState = states.find(s => new RegExp(`(^|\b)${s}(\b|$)`).test(lower));
      if (matchedState) extracted.state = matchedState.replace(/\b\w/g, c => c.toUpperCase());
      const typeMatch = natural.match(/\b(rent|rental|sale|buy)\b/i);
      if (typeMatch) extracted.type = /rent/.test(typeMatch[1].toLowerCase()) ? 'rent' : 'sale';
      if (/no parking/i.test(natural)) extracted.parking = false; else if (/parking/i.test(natural)) extracted.parking = true;
      if (/unfurnished/i.test(natural)) extracted.furnished = false; else if (/furnished/i.test(natural)) extracted.furnished = true;
      const offerMatch = natural.match(/offer|discount|deal/i);
      if (offerMatch) extracted.offer = true;
      const furnishedMatch = natural.match(/furnished/i);
      if (furnishedMatch) extracted.furnished = true;
      const parkingMatch = natural.match(/parking/i);
      if (parkingMatch) extracted.parking = true;
    }
    const urlParams = new URLSearchParams(extracted);
    navigate(`?${urlParams.toString()}`);
  };

  // Admin delete flow (same as AdminListings)
  const handleDelete = (id) => {
    setPendingDeleteId(id);
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError("Password is required");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/api/user/verify-password/${currentUser._id}`, {
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
      const res = await fetch(`${API_BASE_URL}/api/listing/delete/${pendingDeleteId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l._id !== pendingDeleteId));
        setShowPasswordModal(false);
        const data = await res.json();
        toast.success(data.message || "Listing deleted successfully!");
      } else {
        const data = await res.json();
        setDeleteError(data.message || "Failed to delete listing.");
      }
    } catch (err) {
      setDeleteError("An error occurred. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const applySmartQuery = (e) => {
    e.preventDefault();
    const natural = (smartQuery || '').trim();
    if (!natural) return;
    const extracted = { ...formData };
    
    // Enhanced city to state mapping
    const inferStateFromCity = (city) => {
      const cityToState = {
        'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra', 'nashik': 'Maharashtra', 'aurangabad': 'Maharashtra',
        'delhi': 'Delhi', 'new delhi': 'Delhi', 'noida': 'Uttar Pradesh', 'gurgaon': 'Haryana', 'gurugram': 'Haryana', 'faridabad': 'Haryana',
        'bengaluru': 'Karnataka', 'bangalore': 'Karnataka', 'mysuru': 'Karnataka', 'mysore': 'Karnataka', 'mangalore': 'Karnataka', 'hubli': 'Karnataka',
        'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu', 'tiruchirapalli': 'Tamil Nadu', 'salem': 'Tamil Nadu',
        'kolkata': 'West Bengal', 'howrah': 'West Bengal', 'durgapur': 'West Bengal', 'asansol': 'West Bengal',
        'hyderabad': 'Telangana', 'warangal': 'Telangana', 'nizamabad': 'Telangana',
        'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat', 'rajkot': 'Gujarat', 'bhavnagar': 'Gujarat',
        'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'udaipur': 'Rajasthan', 'kota': 'Rajasthan', 'bikaner': 'Rajasthan',
        'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'agra': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh', 'meerut': 'Uttar Pradesh',
        'indore': 'Madhya Pradesh', 'bhopal': 'Madhya Pradesh', 'gwalior': 'Madhya Pradesh', 'jabalpur': 'Madhya Pradesh',
        'patna': 'Bihar', 'gaya': 'Bihar', 'bhagalpur': 'Bihar', 'muzaffarpur': 'Bihar',
        'kochi': 'Kerala', 'thiruvananthapuram': 'Kerala', 'kozhikode': 'Kerala', 'thrissur': 'Kerala',
        'visakhapatnam': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh', 'guntur': 'Andhra Pradesh', 'nellore': 'Andhra Pradesh',
        'chandigarh': 'Chandigarh', 'panchkula': 'Haryana', 'mohali': 'Punjab'
      };
      const key = (city||'').toLowerCase().trim();
      return cityToState[key] || '';
    };

    // Enhanced bedroom detection
    const bedsMatch = natural.match(/(\d+)\s*(bhk|bed|beds|bedroom|bedrooms|room|rooms)/i);
    if (bedsMatch) extracted.bedrooms = bedsMatch[1];
    
    // Enhanced bathroom detection
    const bathMatch = natural.match(/(\d+)\s*(bath|baths|bathroom|bathrooms|toilet|toilets)/i);
    if (bathMatch) extracted.bathrooms = bathMatch[1];

    // Enhanced price detection with more patterns
    const pricePatterns = [
      /(?:under|below|upto|max|maximum)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:within|around|about)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:budget|budget of)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:less than|not more than)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i
    ];
    
    for (const pattern of pricePatterns) {
      const priceMatch = natural.match(pattern);
      if (priceMatch) {
        extracted.maxPrice = priceMatch[1].replace(/,/g,'');
        if (priceMatch[2]) {
          const unit = priceMatch[2].toLowerCase();
          const val = Number(extracted.maxPrice||0);
          if (unit==='k' || unit==='thousand') extracted.maxPrice = String(val*1000);
          if (unit==='l' || unit==='lac' || unit==='lakh' || unit==='lakhs') extracted.maxPrice = String(val*100000);
          if (unit==='cr' || unit==='crore' || unit==='crores') extracted.maxPrice = String(val*10000000);
        }
        break;
      }
    }

    // Enhanced minimum price detection
    const minPricePatterns = [
      /(?:above|more than|minimum|min|from)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:starting from|starting at)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i
    ];
    
    for (const pattern of minPricePatterns) {
      const minPriceMatch = natural.match(pattern);
      if (minPriceMatch) {
        extracted.minPrice = minPriceMatch[1].replace(/,/g,'');
        if (minPriceMatch[2]) {
          const unit = minPriceMatch[2].toLowerCase();
          const val = Number(extracted.minPrice||0);
          if (unit==='k' || unit==='thousand') extracted.minPrice = String(val*1000);
          if (unit==='l' || unit==='lac' || unit==='lakh' || unit==='lakhs') extracted.minPrice = String(val*100000);
          if (unit==='cr' || unit==='crore' || unit==='crores') extracted.minPrice = String(val*10000000);
        }
        break;
      }
    }

    // Enhanced location detection
    const locationPatterns = [
      /(?:near|close to|around)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      /(?:in|at|from)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      /(?:located in|situated in)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      /(?:area|locality|neighborhood)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i
    ];
    
    for (const pattern of locationPatterns) {
      const locationMatch = natural.match(pattern);
      if (locationMatch) {
        const location = locationMatch[1].trim();
        // Check if it's a city or landmark
        if (location.length > 2 && !/^(the|a|an|and|or|but|in|on|at|to|for|of|with|by)$/i.test(location)) {
          extracted.city = location;
          break;
        }
      }
    }

    // Auto-infer state from city
    if (extracted.city && !extracted.state) {
      extracted.state = inferStateFromCity(extracted.city);
    }

    // Enhanced state detection
    const states = ['andhra pradesh','arunachal pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana','himachal pradesh','jharkhand','karnataka','kerala','madhya pradesh','maharashtra','manipur','meghalaya','mizoram','nagaland','odisha','punjab','rajasthan','sikkim','tamil nadu','telangana','tripura','uttar pradesh','uttarakhand','west bengal','delhi','chandigarh','jammu and kashmir','ladakh'];
    const lower = natural.toLowerCase();
    const matchedState = states.find(s => new RegExp(`(^|\b)${s}(\b|$)`).test(lower));
    if (matchedState) extracted.state = matchedState.replace(/\b\w/g, c => c.toUpperCase());

    // Enhanced property type detection
    const typePatterns = [
      /\b(rent|rental|renting|for rent|to rent)\b/i,
      /\b(sale|sell|selling|for sale|to sell|buy|buying|purchase|purchasing)\b/i,
      /\b(lease|leasing|leased)\b/i
    ];
    
    for (const pattern of typePatterns) {
      const typeMatch = natural.match(pattern);
      if (typeMatch) {
        const type = typeMatch[1].toLowerCase();
        if (/rent|lease/.test(type)) extracted.type = 'rent';
        else if (/sale|buy|purchase/.test(type)) extracted.type = 'sale';
        break;
      }
    }

    // Enhanced amenities detection
    const amenityPatterns = {
      parking: [
        /(?:with|having|includes?)\s+parking/i,
        /parking\s+(?:available|included|provided)/i,
        /(?:car\s+)?parking/i,
        /garage/i
      ],
      furnished: [
        /(?:fully\s+)?furnished/i,
        /(?:with|having|includes?)\s+furniture/i,
        /furniture\s+(?:included|provided|available)/i,
        /(?:semi\s+)?furnished/i
      ],
      unfurnished: [
        /unfurnished/i,
        /(?:without|no)\s+furniture/i,
        /bare\s+apartment/i
      ],
      offer: [
        /(?:special\s+)?offer/i,
        /discount/i,
        /deal/i,
        /promotion/i,
        /(?:reduced|lower)\s+price/i,
        /(?:cheap|affordable|budget)/i
      ]
    };

    // Check for parking
    if (amenityPatterns.parking.some(pattern => pattern.test(natural))) {
      extracted.parking = true;
    } else if (/no\s+parking|without\s+parking/i.test(natural)) {
      extracted.parking = false;
    }

    // Check for furnished/unfurnished
    if (amenityPatterns.furnished.some(pattern => pattern.test(natural))) {
      extracted.furnished = true;
    } else if (amenityPatterns.unfurnished.some(pattern => pattern.test(natural))) {
      extracted.furnished = false;
    }

    // Check for offers
    if (amenityPatterns.offer.some(pattern => pattern.test(natural))) {
      extracted.offer = true;
    }

    // Property size detection
    if (/small|compact|studio|1\s*bhk/i.test(natural)) {
      extracted.bedrooms = '1';
    } else if (/medium|2\s*bhk|3\s*bhk/i.test(natural)) {
      extracted.bedrooms = '2';
    } else if (/large|big|4\s*bhk|5\s*bhk/i.test(natural)) {
      extracted.bedrooms = '4';
    }

    // Urgency detection
    if (/urgent|immediate|asap|quick|fast/i.test(natural)) {
      extracted.sort = 'createdAt';
      extracted.order = 'desc';
    }
    if (/no parking/i.test(natural)) extracted.parking = false; else if (/parking/i.test(natural)) extracted.parking = true;
    if (/unfurnished/i.test(natural)) extracted.furnished = false; else if (/furnished/i.test(natural)) extracted.furnished = true;
    const offerMatch = natural.match(/offer|discount|deal/i);
    if (offerMatch) extracted.offer = true;
    const furnishedMatch = natural.match(/furnished/i);
    if (furnishedMatch) extracted.furnished = true;
    const parkingMatch = natural.match(/parking/i);
    if (parkingMatch) extracted.parking = true;
    const urlParams = new URLSearchParams(extracted);
    navigate(`?${urlParams.toString()}`);
  };

  const showMoreListingClick = async () => {
    const urlParams = new URLSearchParams(location.search);
    urlParams.set("startIndex", listings.length);
    const res = await fetch(`${API_BASE_URL}/api/listing/get?${urlParams.toString()}`);
    const data = await res.json();
    setListings((prev) => [...prev, ...data]);
    setShowMoreListing(data.length >= 8);
  };

  const handleLocationChange = (loc) => {
    setLocationFilter(loc);
    setFormData((prev) => ({ ...prev, state: loc.state, district: loc.district, city: loc.city }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-2 md:px-8">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6 relative">
          <h3 className="text-3xl font-extrabold text-blue-700 mb-6 text-center drop-shadow">
            Explore Properties (Admin View)
          </h3>
          <p className="text-center text-gray-600 mb-6">Search and filter all properties across the platform</p>
          
          {/* Enhanced Smart (NLP) Search - Desktop Optimized */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 lg:p-6 rounded-xl mb-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-3 lg:mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <label className="text-base lg:text-lg font-semibold text-blue-800">Smart Search (Natural Language)</label>
            </div>
            <form onSubmit={applySmartQuery} className="space-y-3 lg:space-y-4">
              <div className="relative">
                <input
                  value={smartQuery}
                  onChange={(e) => setSmartQuery(e.target.value)}
                  placeholder="e.g., 3BHK above 50L in Bengaluru with parking"
                  className="w-full p-3 lg:p-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-base lg:text-lg"
                />
                <div className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2">
                  <button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 lg:px-6 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold text-sm lg:text-base">
                    Search
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 lg:gap-2">
                <span className="text-xs lg:text-sm text-gray-600">Try:</span>
                {[
                  "3BHK above 50L in Mumbai",
                  "2BHK with parking in Delhi", 
                  "Furnished apartment in Bangalore",
                  "Budget house for sale in Pune"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSmartQuery(suggestion)}
                    className="text-xs bg-white border border-blue-300 text-blue-700 px-2 lg:px-3 py-1 rounded-full hover:bg-blue-50 transition-colors duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </form>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-gray-100 p-4 lg:p-6 rounded-lg mb-6"
          >
            {/* First Row - Search and Sort */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                name="searchTerm"
                placeholder="Search by property name, address, or description..."
                value={formData.searchTerm}
                onChange={handleChanges}
                className="p-3 border rounded-lg w-full text-sm lg:text-base"
              />

              <select
                name="sort_order"
                onChange={(e) => {
                  const [sort, order] = e.target.value.split("_");
                  setFormData((prev) => ({
                    ...prev,
                    sort,
                    order,
                  }));
                }}
                value={`${formData.sort}_${formData.order}`}
                className="p-3 border rounded-lg w-full text-sm lg:text-base"
              >
                <option value="regularPrice_desc">Price high to low</option>
                <option value="regularPrice_asc">Price low to high</option>
                <option value="createdAt_desc">Latest</option>
                <option value="createdAt_asc">Oldest</option>
              </select>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center justify-center gap-2 text-sm lg:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" /></svg>
                Search
              </button>
            </div>

            {/* Location Selector */}
            <div className="mb-4">
              <LocationSelector value={locationFilter} onChange={handleLocationChange} mode="search" />
            </div>

            {/* Second Row - Type and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Property Type */}
              <div className="flex flex-wrap gap-3 lg:gap-4">
                <label className="flex items-center gap-2 text-sm lg:text-base">
                  <input
                    type="radio"
                    name="type"
                    value="all"
                    checked={formData.type === "all"}
                    onChange={handleChanges}
                    className="w-4 h-4"
                  />
                  All
                </label>
                <label className="flex items-center gap-2 text-sm lg:text-base">
                  <input
                    type="radio"
                    name="type"
                    value="rent"
                    checked={formData.type === "rent"}
                    onChange={handleChanges}
                    className="w-4 h-4"
                  />
                  Rent
                </label>
                <label className="flex items-center gap-2 text-sm lg:text-base">
                  <input
                    type="radio"
                    name="type"
                    value="sale"
                    checked={formData.type === "sale"}
                    onChange={handleChanges}
                    className="w-4 h-4"
                  />
                  Sale
                </label>
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-3 lg:gap-4">
                <label className="flex items-center gap-2 text-sm lg:text-base">
                  <input
                    type="checkbox"
                    name="parking"
                    onChange={handleChanges}
                    checked={formData.parking}
                    className="w-4 h-4"
                  />
                  Parking
                </label>
                <label className="flex items-center gap-2 text-sm lg:text-base">
                  <input
                    type="checkbox"
                    name="furnished"
                    onChange={handleChanges}
                    checked={formData.furnished}
                    className="w-4 h-4"
                  />
                  Furnished
                </label>
                <label className="flex items-center gap-2 text-sm lg:text-base">
                  <input
                    type="checkbox"
                    name="offer"
                    onChange={handleChanges}
                    checked={formData.offer}
                    className="w-4 h-4"
                  />
                  Offer
                </label>
              </div>
            </div>

            {/* Third Row - Advanced Filters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <input
                type="number"
                name="minPrice"
                placeholder="Min Price"
                value={formData.minPrice}
                onChange={handleChanges}
                className="p-3 border rounded-lg w-full text-sm lg:text-base"
                min={0}
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max Price"
                value={formData.maxPrice}
                onChange={handleChanges}
                className="p-3 border rounded-lg w-full text-sm lg:text-base"
                min={0}
              />
              <input
                type="number"
                name="bedrooms"
                placeholder="Bedrooms"
                value={formData.bedrooms}
                onChange={handleChanges}
                className="p-3 border rounded-lg w-full text-sm lg:text-base"
                min={1}
              />
              <input
                type="number"
                name="bathrooms"
                placeholder="Bathrooms"
                value={formData.bathrooms}
                onChange={handleChanges}
                className="p-3 border rounded-lg w-full text-sm lg:text-base"
                min={1}
              />
            </div>
          </form>

          

          {/* Listings Display */}
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">All Properties ({listings.length})</h2>
            {loading && <p className="text-center text-lg font-semibold text-blue-600 animate-pulse">Loading...</p>}
            {!loading && listings.length === 0 && (
              <div className="text-center py-8">
                <img src={duckImg} alt="No properties found" className="w-72 h-72 object-contain mx-auto mb-0" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Properties Found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingItem key={listing._id} listing={listing} onDelete={handleDelete} />
              ))}
            </div>
            {showMoreListing && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={showMoreListingClick}
                  className="mt-4 bg-gray-600 text-white p-2 rounded-md w-500 hover:bg-gray-700 transition-colors"
                >
                  Show More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <GeminiAIWrapper />
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
    </>
  );
}

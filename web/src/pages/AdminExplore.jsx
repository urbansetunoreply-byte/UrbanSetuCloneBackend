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
import SearchSuggestions from '../components/SearchSuggestions';
import { usePageTitle } from '../hooks/usePageTitle';
import FormField from "../components/ui/FormField";
import SelectField from "../components/ui/SelectField";
import ListingSkeletonGrid from "../components/skeletons/ListingSkeletonGrid";
import FilterChips from "../components/search/FilterChips";
import { Search as SearchIcon, IndianRupee, Filter, MapPin, Home, DollarSign, GripVertical, ChevronDown, RefreshCw } from "lucide-react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminExplore() {
  // Set page title
  usePageTitle("Property Explorer - Admin Panel");

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
  const [showSuggestions, setShowSuggestions] = useState(false);
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

    // Show suggestions when typing in search term
    if (name === 'searchTerm') {
      setShowSuggestions(value.trim().length >= 2);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      searchTerm: suggestion.displayText
    }));
    setShowSuggestions(false);

    // Navigate to the property listing
    navigate(`/listing/${suggestion.id}`);
  };

  const handleSearchInputFocus = () => {
    if (formData.searchTerm.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const clearAllFilters = () => {
    const reset = {
      searchTerm: "", type: "all", parking: false, furnished: false, offer: false,
      sort: "createdAt", order: "desc", minPrice: "", maxPrice: "",
      city: "", state: "", bedrooms: "", bathrooms: ""
    };
    setFormData(reset);
    navigate(`?${new URLSearchParams(reset).toString()}`);
  };

  const removeFilter = (key) => {
    const updated = { ...formData };
    if (typeof updated[key] === 'boolean') updated[key] = false; else updated[key] = "";
    setFormData(updated);
    navigate(`?${new URLSearchParams(updated).toString()}`);
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
      const key = (city || '').toLowerCase();
      return cityToState[key] || '';
    };
    if (natural) {
      const bedsMatch = natural.match(/(\d+)\s*(bhk|bed|beds)/i) || natural.match(/^(\d+)\s*bhk/i);
      if (bedsMatch) extracted.bedrooms = bedsMatch[1];
      const priceMatch = natural.match(/(?:under|below|within|upto|up to)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore)?/i);
      if (priceMatch) extracted.maxPrice = priceMatch[1].replace(/,/g, '');
      if (priceMatch && priceMatch[2]) {
        const unit = priceMatch[2].toLowerCase();
        const val = Number(extracted.maxPrice || 0);
        if (unit === 'k') extracted.maxPrice = String(val * 1000);
        if (unit === 'l' || unit === 'lac' || unit === 'lakh') extracted.maxPrice = String(val * 100000);
        if (unit === 'cr' || unit === 'crore') extracted.maxPrice = String(val * 10000000);
      }
      const minPriceMatch = natural.match(/(?:above|over|minimum|at least)\s*(\d[\d,]*)/i);
      if (minPriceMatch) extracted.minPrice = minPriceMatch[1].replace(/,/g, '');
      const nearMatch = natural.match(/near\s+([a-zA-Z ]+)/i);
      if (nearMatch) extracted.city = nearMatch[1].trim();
      const inCity = natural.match(/in\s+([a-zA-Z ]+)/i);
      if (inCity) extracted.city = inCity[1].trim();
      if (extracted.city && !extracted.state) extracted.state = inferStateFromCity(extracted.city);
      // Direct state input (if the query is just a state name)
      const states = ['andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka', 'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal', 'delhi'];
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

    // Normalize number words (e.g., "two bhk" -> "2 bhk")
    const numberWordToDigit = (text) => {
      const map = { one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10' };
      return text.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, (m) => map[m.toLowerCase()]);
    };
    const norm = numberWordToDigit(natural);

    // Enhanced NLP processing with context understanding
    const processNaturalLanguage = (query) => {
      const lowerQuery = query.toLowerCase();

      // Intent detection
      const intents = {
        search: /(?:find|search|look for|looking for|need|want|require|dhundh|khoj|chahiye)/i,
        rent: /(?:rent|rental|renting|for rent|to rent|kiran|bhada|rent par)/i,
        buy: /(?:buy|purchase|sale|selling|for sale|to buy|kharid|bechne|sale par)/i,
        budget: /(?:budget|affordable|cheap|low cost|economical|paisa|dam|rate)/i,
        location: /(?:near|close to|around|in|at|from|paas|mein|se)/i,
        size: /(?:room|bedroom|bhk|bed|bath|bathroom|toilet|kamra|washroom)/i,
        amenities: /(?:parking|furnished|unfurnished|garden|balcony|lift|security|gym|pool|ac|air conditioning)/i
      };

      // Extract intent
      const detectedIntent = Object.keys(intents).find(intent => intents[intent].test(query));

      return { detectedIntent, query: lowerQuery };
    };

    const { detectedIntent } = processNaturalLanguage(norm);

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
      const key = (city || '').toLowerCase().trim();
      return cityToState[key] || '';
    };

    // Enhanced bedroom detection with routine language
    const bedPatterns = [
      /(\d+)\s*(bhk|bed|beds|bedroom|bedrooms|room|rooms)/i,
      // Routine language patterns
      /(\d+)\s*(?:ka|ke)\s*(?:room|kamra|bedroom)/i,
      /(\d+)\s*(?:bhk|bed|room)\s*(?:ka|ke)\s*(?:flat|apartment|ghar)/i,
      /(?:flat|apartment|ghar)\s*(?:with|mein)\s*(\d+)\s*(?:room|bed|bhk)/i,
      /(\d+)\s*(?:room|bed|bhk)\s*(?:wala|wali)\s*(?:flat|apartment|ghar)/i
    ];

    for (const pattern of bedPatterns) {
      const bedsMatch = norm.match(pattern);
      if (bedsMatch) {
        extracted.bedrooms = bedsMatch[1];
        break;
      }
    }

    // Enhanced bathroom detection with routine language
    const bathPatterns = [
      /(\d+)\s*(bath|baths|bathroom|bathrooms|toilet|toilets)/i,
      // Routine language patterns
      /(\d+)\s*(?:ka|ke)\s*(?:bathroom|toilet|washroom)/i,
      /(\d+)\s*(?:bath|toilet)\s*(?:ka|ke)\s*(?:flat|apartment|ghar)/i,
      /(?:flat|apartment|ghar)\s*(?:with|mein)\s*(\d+)\s*(?:bath|toilet)/i,
      /(\d+)\s*(?:bath|toilet)\s*(?:wala|wali)\s*(?:flat|apartment|ghar)/i
    ];

    for (const pattern of bathPatterns) {
      const bathMatch = norm.match(pattern);
      if (bathMatch) {
        extracted.bathrooms = bathMatch[1];
        break;
      }
    }

    // Enhanced price detection with more patterns including routine language
    const pricePatterns = [
      /(?:under|below|upto|max|maximum)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:within|around|about)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:budget|budget of)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:less than|not more than)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      // Routine language patterns
      /(?:kam\s+se\s+kam|minimum|at\s+least)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:zyada\s+se\s+zyada|maximum|at\s+most)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:tak|se\s+zyada|se\s+kam)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:around|about|lagbhag|takriban)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:budget|paisa|rupees)\s*(?:hai|mein)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
      /(?:price|dam|rate)\s*(?:hai|mein)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i
    ];

    for (const pattern of pricePatterns) {
      const priceMatch = norm.match(pattern);
      if (priceMatch) {
        extracted.maxPrice = priceMatch[1].replace(/,/g, '');
        if (priceMatch[2]) {
          const unit = priceMatch[2].toLowerCase();
          const val = Number(extracted.maxPrice || 0);
          if (unit === 'k' || unit === 'thousand') extracted.maxPrice = String(val * 1000);
          if (unit === 'l' || unit === 'lac' || unit === 'lakh' || unit === 'lakhs') extracted.maxPrice = String(val * 100000);
          if (unit === 'cr' || unit === 'crore' || unit === 'crores') extracted.maxPrice = String(val * 10000000);
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
      const minPriceMatch = norm.match(pattern);
      if (minPriceMatch) {
        extracted.minPrice = minPriceMatch[1].replace(/,/g, '');
        if (minPriceMatch[2]) {
          const unit = minPriceMatch[2].toLowerCase();
          const val = Number(extracted.minPrice || 0);
          if (unit === 'k' || unit === 'thousand') extracted.minPrice = String(val * 1000);
          if (unit === 'l' || unit === 'lac' || unit === 'lakh' || unit === 'lakhs') extracted.minPrice = String(val * 100000);
          if (unit === 'cr' || unit === 'crore' || unit === 'crores') extracted.minPrice = String(val * 10000000);
        }
        break;
      }
    }

    // Price range detection: "between X and Y"
    const rangeMatch = norm.match(/between\s+(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore)?\s+(?:and|to|\-)+\s+(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore)?/i);
    if (rangeMatch) {
      const toNumber = (val, unit) => {
        let n = Number((val || '').replace(/,/g, ''));
        if (!unit) return String(n);
        const u = unit.toLowerCase();
        if (u === 'k') n *= 1000;
        if (u === 'l' || u === 'lac' || u === 'lakh') n *= 100000;
        if (u === 'cr' || u === 'crore') n *= 10000000;
        return String(n);
      };
      extracted.minPrice = toNumber(rangeMatch[1], rangeMatch[2]);
      extracted.maxPrice = toNumber(rangeMatch[3], rangeMatch[4]);
    }

    // Enhanced location detection with routine language
    const locationPatterns = [
      /(?:near|close to|around)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      /(?:in|at|from)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      /(?:located in|situated in)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      /(?:area|locality|neighborhood)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      // Routine language patterns
      /(?:paas|near|ke\s+paas|ke\s+near)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      /(?:mein|in|at)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      /(?:area|ilaka|mohalla|colony)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      /(?:located|situated|hain)\s+(?:in|mein)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
      /(?:from|se)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i
    ];

    for (const pattern of locationPatterns) {
      const locationMatch = norm.match(pattern);
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
    const states = ['andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka', 'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal', 'delhi', 'chandigarh', 'jammu and kashmir', 'ladakh'];
    const lower = norm.toLowerCase();
    const matchedState = states.find(s => new RegExp(`(^|\\b)${s}(\\b|$)`).test(lower));
    if (matchedState) extracted.state = matchedState.replace(/\b\w/g, c => c.toUpperCase());

    // Enhanced property type detection with routine language
    const typePatterns = [
      /\b(rent|rental|renting|for rent|to rent)\b/i,
      /\b(sale|sell|selling|for sale|to sell|buy|buying|purchase|purchasing)\b/i,
      /\b(lease|leasing|leased)\b/i,
      // Routine language patterns
      /(?:rent|kiran|bhada)\s+(?:ke\s+liye|par|mein)/i,
      /(?:sale|bechne|kharidne)\s+(?:ke\s+liye|par|mein)/i,
      /(?:for|ke\s+liye)\s+(?:rent|sale|kiran|bechne)/i,
      /(?:looking\s+for|chahiye|dhundh\s+raha)\s+(?:rent|sale|kiran|bechne)/i,
      /(?:want|chahiye)\s+(?:to\s+)?(?:rent|buy|kiran|kharid)/i,
      /(?:available\s+for|available)\s+(?:rent|sale|kiran|bechne)/i
    ];

    // Enhanced amenities detection with smart context understanding
    const amenitiesPatterns = {
      parking: [
        /(?:parking|car\s+parking|vehicle\s+parking|garage)/i,
        /(?:parking\s+available|parking\s+space|car\s+space)/i,
        /(?:with\s+parking|parking\s+included)/i,
        // Hindi/regional patterns
        /(?:parking|gaadi\s+rakhne\s+ki\s+jagah|vehicle\s+parking)/i
      ],
      furnished: [
        /(?:furnished|fully\s+furnished|semi\s+furnished)/i,
        /(?:with\s+furniture|furniture\s+included)/i,
        /(?:ready\s+to\s+move|move\s+in\s+ready)/i,
        // Hindi/regional patterns
        /(?:furnished|saman\s+ke\s+saath|ready\s+to\s+move)/i
      ],
      unfurnished: [
        /(?:unfurnished|semi\s+furnished|bare)/i,
        /(?:without\s+furniture|no\s+furniture)/i,
        // Hindi/regional patterns
        /(?:unfurnished|bina\s+saman\s+ke|khali)/i
      ],
      garden: [
        /(?:garden|lawn|green\s+space|outdoor\s+space)/i,
        /(?:with\s+garden|garden\s+available)/i,
        // Hindi/regional patterns
        /(?:garden|bagicha|lawn|green\s+area)/i
      ],
      balcony: [
        /(?:balcony|terrace|veranda)/i,
        /(?:with\s+balcony|balcony\s+available)/i,
        // Hindi/regional patterns
        /(?:balcony|terrace|veranda|chhat)/i
      ],
      lift: [
        /(?:lift|elevator|elevator\s+available)/i,
        /(?:with\s+lift|lift\s+facility)/i,
        // Hindi/regional patterns
        /(?:lift|elevator|lift\s+ki\s+facility)/i
      ],
      security: [
        /(?:security|24\s*7\s*security|gated\s+community)/i,
        /(?:security\s+guard|security\s+system)/i,
        // Hindi/regional patterns
        /(?:security|suraksha|guard|24\s*7\s*security)/i
      ],
      gym: [
        /(?:gym|fitness\s+center|workout\s+area)/i,
        /(?:with\s+gym|gym\s+facility)/i,
        // Hindi/regional patterns
        /(?:gym|fitness|vyayam\s+shala)/i
      ],
      pool: [
        /(?:pool|swimming\s+pool)/i,
        /(?:with\s+pool|pool\s+facility)/i,
        // Hindi/regional patterns
        /(?:pool|swimming\s+pool|tairne\s+ki\s+jagah)/i
      ],
      ac: [
        /(?:ac|air\s+conditioning|air\s+conditioned)/i,
        /(?:with\s+ac|ac\s+available)/i,
        // Hindi/regional patterns
        /(?:ac|air\s+conditioning|thandak)/i
      ]
    };

    // Process amenities
    Object.keys(amenitiesPatterns).forEach(amenity => {
      const patterns = amenitiesPatterns[amenity];
      const hasAmenity = patterns.some(pattern => pattern.test(norm));
      if (hasAmenity) {
        if (amenity === 'furnished') extracted.furnished = true;
        if (amenity === 'parking') extracted.parking = true;
        if (amenity === 'offer') extracted.offer = true; // For special offers
      }
    });

    for (const pattern of typePatterns) {
      const typeMatch = norm.match(pattern);
      if (typeMatch) {
        const type = typeMatch[1] || typeMatch[0];
        if (/rent|kiran|bhada|lease/i.test(type)) extracted.type = 'rent';
        else if (/sale|bechne|kharidne|buy|purchase/i.test(type)) extracted.type = 'sale';
        break;
      }
    }

    // Enhanced amenities detection with routine language
    const amenityPatterns = {
      parking: [
        /(?:with|having|includes?)\s+parking/i,
        /parking\s+(?:available|included|provided)/i,
        /(?:car\s+)?parking/i,
        /garage/i,
        // Routine language patterns
        /(?:gaadi|car|bike|scooter)\s+(?:parking|khada|rakhne)/i,
        /(?:parking|khada)\s+(?:hai|available|mila)/i,
        /(?:covered|chhaya)\s+(?:parking|khada)/i,
        /(?:basement|tala)\s+(?:parking|khada)/i,
        /(?:open|khula)\s+(?:parking|khada)/i
      ],
      furnished: [
        /(?:fully\s+)?furnished/i,
        /(?:with|having|includes?)\s+furniture/i,
        /furniture\s+(?:included|provided|available)/i,
        /(?:semi\s+)?furnished/i,
        // Routine language patterns
        /(?:furnished|sajavata|sajaya|sajaya\s+hua)/i,
        /(?:furniture|samagri|saman)\s+(?:hai|available|mila)/i,
        /(?:ready|taiyar)\s+(?:to\s+move|rehne|rahan)/i,
        /(?:fully|puri\s+tarah|bilkul)\s+(?:furnished|sajaya)/i,
        /(?:semi|aadha|thoda)\s+(?:furnished|sajaya)/i,
        /(?:modern|naya|latest)\s+(?:furniture|samagri)/i
      ],
      unfurnished: [
        /unfurnished/i,
        /(?:without|no)\s+furniture/i,
        /bare\s+apartment/i,
        // Routine language patterns
        /(?:unfurnished|khali|saman\s+nahi)/i,
        /(?:without|bina)\s+(?:furniture|samagri)/i,
        /(?:empty|khali)\s+(?:flat|apartment|ghar)/i,
        /(?:bare|nanga)\s+(?:flat|apartment)/i,
        /(?:no|nahi)\s+(?:furniture|samagri)/i
      ],
      offer: [
        /(?:special\s+)?offer/i,
        /discount/i,
        /deal/i,
        /promotion/i,
        /(?:reduced|lower)\s+price/i,
        /(?:cheap|affordable|budget)/i,
        // Routine language patterns
        /(?:offer|sasta|kam\s+dam)/i,
        /(?:discount|chhut|bargain)/i,
        /(?:deal|sasta\s+deal|achha\s+deal)/i,
        /(?:cheap|sasta|kam\s+price)/i,
        /(?:affordable|paisa\s+vasool|value\s+for\s+money)/i,
        /(?:budget|kam\s+budget|sasta)/i,
        /(?:special|khas|limited)\s+(?:offer|deal)/i
      ]
    };

    // Check for parking
    if (amenityPatterns.parking.some(pattern => pattern.test(norm))) {
      extracted.parking = true;
    } else if (/no\s+parking|without\s+parking/i.test(norm)) {
      extracted.parking = false;
    }

    // Check for furnished/unfurnished
    if (amenityPatterns.furnished.some(pattern => pattern.test(norm))) {
      extracted.furnished = true;
    } else if (amenityPatterns.unfurnished.some(pattern => pattern.test(norm))) {
      extracted.furnished = false;
    }

    // Check for offers
    if (amenityPatterns.offer.some(pattern => pattern.test(norm))) {
      extracted.offer = true;
    }

    // Property size detection
    if (/small|compact|studio|1\s*bhk/i.test(norm)) {
      extracted.bedrooms = '1';
    } else if (/medium|2\s*bhk|3\s*bhk/i.test(norm)) {
      extracted.bedrooms = '2';
    } else if (/large|big|4\s*bhk|5\s*bhk/i.test(norm)) {
      extracted.bedrooms = '4';
    }

    // Urgency detection
    if (/urgent|immediate|asap|quick|fast/i.test(norm)) {
      extracted.sort = 'createdAt';
      extracted.order = 'desc';
    }
    if (/no parking/i.test(norm)) extracted.parking = false; else if (/parking/i.test(norm)) extracted.parking = true;
    if (/unfurnished/i.test(norm)) extracted.furnished = false; else if (/furnished/i.test(norm)) extracted.furnished = true;
    const offerMatch = norm.match(/offer|discount|deal/i);
    if (offerMatch) extracted.offer = true;
    const furnishedMatch = norm.match(/furnished/i);
    if (furnishedMatch) extracted.furnished = true;
    const parkingMatch = norm.match(/parking/i);
    if (parkingMatch) extracted.parking = true;

    // Monthly rent cues imply rent
    if (/(per\s*month|monthly|\/mo|pm)/i.test(norm)) {
      extracted.type = 'rent';
    }

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 animate-pulse font-medium">Finding properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">
      {/* Search Header / Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 pb-20 pt-10 px-4 shadow-lg mb-8 relative overflow-hidden">
        {/* Abstract shapes for visual interest */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white mix-blend-overlay filter blur-3xl animate-float"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-300 mix-blend-overlay filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-20 animate-slideInFromTop">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
            Admin <span className="text-yellow-300">Explorer</span>
          </h1>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto font-light">
            Manage and explore all properties with AI-powered search and detailed filters.
          </p>

          {/* Smart Search Section */}
          <div className="max-w-4xl mx-auto mb-8 relative z-30">
            <div className="text-left mb-2 pl-2 animate-fade-in">
              <span className="text-blue-100 font-semibold text-sm flex items-center gap-2">
                <span className="bg-white/20 p-1 rounded-full"><svg className="w-3 h-3 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></span>
                Smart Search (Natural Language)
              </span>
            </div>
            <form onSubmit={applySmartQuery} className="relative group">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300 flex flex-col md:flex-row gap-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <input
                    value={smartQuery}
                    onChange={(e) => setSmartQuery(e.target.value)}
                    placeholder="Try '3BHK in Mumbai under 50k rent'..."
                    className="block w-full pl-12 pr-4 py-4 border-none rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-white transition-colors text-lg"
                  />
                </div>
                <button type="submit" className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:-translate-y-1 transition-all duration-300 min-w-[120px]">
                  AI Search
                </button>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="text-xs text-blue-100 uppercase tracking-widest font-semibold py-1">Try:</span>
                {[
                  "3BHK above 50L in Mumbai",
                  "2BHK with parking in Delhi",
                  "Furnished apartment in Bangalore",
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSmartQuery(suggestion)}
                    className="text-xs bg-white/20 border border-white/30 text-white px-3 py-1 rounded-full hover:bg-white/30 transition-colors duration-200 backdrop-blur-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 w-full -mt-20 relative z-10 pb-20">
        {/* Detailed Filters Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Detailed Filters</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Keyword Search */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 relative group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Property Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  name="searchTerm"
                  value={formData.searchTerm}
                  onChange={handleChanges}
                  onFocus={handleSearchInputFocus}
                  onBlur={handleSearchInputBlur}
                  placeholder="Search by name, location, or features..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
                <SearchSuggestions
                  searchTerm={formData.searchTerm}
                  onSuggestionClick={handleSuggestionClick}
                  onClose={() => setShowSuggestions(false)}
                  isVisible={showSuggestions}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Location */}
            <div className="lg:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Location</label>
              <LocationSelector value={locationFilter} onChange={handleLocationChange} mode="search" className="w-full" />
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Property Type</label>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {['all', 'rent', 'sale'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                    className={`flex-1 capitalize py-2 rounded-lg text-sm font-medium transition-all ${formData.type === t
                      ? 'bg-white text-blue-700 shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Sort By</label>
              <div className="relative">
                <select
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split("_");
                    setFormData((prev) => ({ ...prev, sort, order }));
                  }}
                  value={`${formData.sort}_${formData.order}`}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:bg-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                  id="sort_order"
                >
                  <option value="regularPrice_desc">Price: High to Low</option>
                  <option value="regularPrice_asc">Price: Low to High</option>
                  <option value="createdAt_desc">Newest First</option>
                  <option value="createdAt_asc">Oldest First</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Price Range */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Min Price</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="minPrice"
                    value={formData.minPrice}
                    onChange={handleChanges}
                    placeholder="Min"
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Max Price</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="maxPrice"
                    value={formData.maxPrice}
                    onChange={handleChanges}
                    placeholder="Max"
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Beds / Baths */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChanges}
                  placeholder="Beds"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChanges}
                  placeholder="Baths"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  min={0}
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-wrap gap-4 pt-2">
              {[
                { name: 'parking', label: 'Parking Space' },
                { name: 'furnished', label: 'Furnished' },
                { name: 'offer', label: 'Special Offer' }
              ].map((amenity) => (
                <label key={amenity.name} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${formData[amenity.name] ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'
                    }`}>
                    {formData[amenity.name] && <svg className="w-4 h-4 text-white font-bold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${formData[amenity.name] ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>{amenity.label}</span>
                  <input
                    type="checkbox"
                    name={amenity.name}
                    onChange={handleChanges}
                    checked={formData[amenity.name]}
                    className="hidden"
                  />
                </label>
              ))}
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Update Results
              </button>
            </div>
          </form>
        </div>

        {/* Active Filters Display */}
        <div className="mb-8">
          <FilterChips formData={formData} onClear={clearAllFilters} onRemove={removeFilter} />
        </div>

        {/* Listing Results */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Search Results
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                {listings.length} properties
              </span>
            </h2>
          </div>


          {!loading && listings.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in-up">
              <img src={duckImg} alt="No listings found" className="w-[280px] h-[280px] object-contain mx-auto opacity-90 hover:scale-105 transition-transform duration-500" />
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No properties matched your search</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                We couldn't find exactly what you're looking for. Try adjusting your filters or use our Smart Search.
              </p>
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-full font-semibold hover:bg-blue-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Clear all filters
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing, index) => (
              <div
                key={listing._id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ListingItem listing={listing} onDelete={handleDelete} />
              </div>
            ))}
          </div>

          {showMoreListing && (
            <div className="flex justify-center mt-12">
              <button
                type="button"
                onClick={showMoreListingClick}
                className="group relative px-8 py-3 bg-white text-gray-800 font-bold rounded-full shadow-md hover:shadow-lg hover:text-blue-600 transition-all border border-gray-200 border-b-4 hover:border-b active:border-b-0 active:translate-y-1"
              >
                <span className="relative z-10 flex items-center gap-2">Show More Properties <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" /></span>
              </button>
            </div>
          )}
        </div>
      </main>

      <GeminiAIWrapper />
      <ContactSupportWrapper />

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 animate-fade-in">
          <form onSubmit={handleReasonSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 transform transition-all scale-100">
            <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2"><FaTrash /> Reason for Deletion</h3>
            <p className="text-sm text-gray-500">Please provide a reason for deleting this property. This action cannot be undone.</p>
            <textarea
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter reason..."
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              rows={3}
              autoFocus
            />
            {deleteError && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{deleteError}</div>}
            <div className="flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => setShowReasonModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 shadow-md transition-all">Next</button>
            </div>
          </form>
        </div>
      )}
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 animate-fade-in">
          <form onSubmit={handlePasswordSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 transform transition-all scale-100">
            <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2"><FaLock /> Confirm Password</h3>
            <p className="text-sm text-gray-500">For security, please confirm your password to permanently delete this listing.</p>
            <input
              type="password"
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              autoFocus
            />
            {deleteError && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{deleteError}</div>}
            <div className="flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md transition-all" disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Confirm & Delete'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

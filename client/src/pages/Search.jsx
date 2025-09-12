import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ListingItem from "../components/ListingItem";
import GeminiAIWrapper from "../components/GeminiAIWrapper";
import LocationSelector from "../components/LocationSelector";
import duckImg from "../assets/duck-go-final.gif";
import ContactSupportWrapper from '../components/ContactSupportWrapper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Search() {
    const location = useLocation();
    const navigate = useNavigate();
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
    const [error, setError] = useState(null);
    const [locationFilter, setLocationFilter] = useState({ state: "", district: "", city: "" });
    const [recommendations, setRecommendations] = useState([]);
    const [smartQuery, setSmartQuery] = useState("");

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
            setError(null);
            try {
                const res = await fetch(`${API_BASE_URL}/api/listing/get?${urlParams.toString()}`);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setListings(Array.isArray(data) ? data : []);
                setShowMoreListing(Array.isArray(data) && data.length > 8);
            } catch (error) {
                console.error("Error fetching listings:", error);
                setError("Failed to load listings. Please try again.");
                setListings([]);
                setShowMoreListing(false);
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
        const bedsMatch = natural.match(/(\d+)\s*(bhk|bed|beds)/i);
        if (bedsMatch) extracted.bedrooms = bedsMatch[1];
        const priceMatch = natural.match(/(?:under|below)\s*(\d[\d,]*)/i);
        if (priceMatch) extracted.maxPrice = priceMatch[1].replace(/,/g,'');
        const nearMatch = natural.match(/near\s+([a-zA-Z ]+)/i);
        if (nearMatch) extracted.city = nearMatch[1].trim();
        const typeMatch = natural.match(/\b(rent|sale)\b/i);
        if (typeMatch) extracted.type = typeMatch[1].toLowerCase();
        if (extracted.city && !extracted.state) extracted.state = inferStateFromCity(extracted.city);
        const states = ['andhra pradesh','arunachal pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana','himachal pradesh','jharkhand','karnataka','kerala','madhya pradesh','maharashtra','manipur','meghalaya','mizoram','nagaland','odisha','punjab','rajasthan','sikkim','tamil nadu','telangana','tripura','uttar pradesh','uttarakhand','west bengal','delhi'];
        const lower = natural.toLowerCase();
        const matchedState = states.find(s => new RegExp(`(^|\\b)${s}(\\b|$)`).test(lower));
        if (matchedState) extracted.state = matchedState.replace(/\b\w/g, c => c.toUpperCase());
        const urlParams = new URLSearchParams(extracted);
        navigate(`?${urlParams.toString()}`);
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
        const matchedState = states.find(s => new RegExp(`(^|\\b)${s}(\\b|$)`).test(lower));
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
        const sizePatterns = [
            /(?:small|compact|studio|1\s*bhk)/i,
            /(?:medium|2\s*bhk|3\s*bhk)/i,
            /(?:large|big|4\s*bhk|5\s*bhk)/i,
            /(?:luxury|premium|villa|penthouse)/i
        ];

        if (/small|compact|studio|1\s*bhk/i.test(natural)) {
            extracted.bedrooms = '1';
        } else if (/medium|2\s*bhk|3\s*bhk/i.test(natural)) {
            extracted.bedrooms = '2';
        } else if (/large|big|4\s*bhk|5\s*bhk/i.test(natural)) {
            extracted.bedrooms = '4';
        }

        // Property condition detection
        if (/new|newly\s+built|recently\s+constructed/i.test(natural)) {
            // Could add a condition filter if needed
        } else if (/old|aged|renovated|refurbished/i.test(natural)) {
            // Could add a condition filter if needed
        }

        // Urgency detection
        if (/urgent|immediate|asap|quick|fast/i.test(natural)) {
            extracted.sort = 'createdAt';
            extracted.order = 'desc';
        }

        const urlParams = new URLSearchParams(extracted);
        navigate(`?${urlParams.toString()}`);
    };

    const showMoreListingClick = async () => {
        try {
            const urlParams = new URLSearchParams(location.search);
            urlParams.set("startIndex", listings.length);
            const res = await fetch(`${API_BASE_URL}/api/listing/get?${urlParams.toString()}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setListings((prev) => [...prev, ...data]);
                setShowMoreListing(data.length >= 8);
            }
        } catch (error) {
            console.error("Error fetching more listings:", error);
        }
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
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-2 md:px-8">
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6 relative">
                <h3 className="text-3xl font-extrabold text-blue-700 mb-6 text-center drop-shadow">
                    Explore Properties
                </h3>
                {/* Smart (NLP) Search - moved to top */}
                <form onSubmit={applySmartQuery} className="bg-blue-50 p-4 rounded-lg mb-6">
                    <label className="block text-sm font-medium text-blue-800 mb-2">Smart Search (natural language)</label>
                    <div className="flex gap-2">
                        <input
                          value={smartQuery}
                          onChange={(e) => setSmartQuery(e.target.value)}
                          placeholder="e.g., 2BHK under 15k near Delhi Metro, furnished with parking"
                          className="flex-1 p-2 border rounded-md"
                        />
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Apply</button>
                    </div>
                </form>
                <form
                    onSubmit={handleSubmit}
                    className="grid md:grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg mb-6"
                >
                    <input
                        type="text"
                        name="searchTerm"
                        placeholder="Search..."
                        value={formData.searchTerm}
                        onChange={handleChanges}
                        className="p-2 border rounded-md w-full"
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
                        className="p-2 border rounded-md w-full"
                    >
                        <option value="regularPrice_desc">Price high to low</option>
                        <option value="regularPrice_asc">Price low to high</option>
                        <option value="createdAt_desc">Latest</option>
                        <option value="createdAt_asc">Oldest</option>
                    </select>

                    {/* LocationSelector for search */}
                    <div className="md:col-span-2">
                        <LocationSelector value={locationFilter} onChange={handleLocationChange} mode="search" />
                    </div>

                    {/* Radio Buttons for Type Selection */}
                    <div className="flex gap-4">
                        <label>
                            <input
                                type="radio"
                                name="type"
                                value="all"
                                checked={formData.type === "all"}
                                onChange={handleChanges}
                            />{" "}
                            All
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="type"
                                value="rent"
                                checked={formData.type === "rent"}
                                onChange={handleChanges}
                            />{" "}
                            Rent
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="type"
                                value="sale"
                                checked={formData.type === "sale"}
                                onChange={handleChanges}
                            />{" "}
                            Sale
                        </label>
                    </div>

                    {/* Checkboxes for Filters */}
                    <div className="flex gap-4">
                        <label>
                            <input
                                type="checkbox"
                                name="parking"
                                onChange={handleChanges}
                                checked={formData.parking}
                            />{" "}
                            Parking
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                name="furnished"
                                onChange={handleChanges}
                                checked={formData.furnished}
                            />{" "}
                            Furnished
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                name="offer"
                                onChange={handleChanges}
                                checked={formData.offer}
                            />{" "}
                            Offer
                        </label>
                    </div>

                    {/* Advanced Filters */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="minPrice"
                        placeholder="Min Price"
                        value={formData.minPrice}
                        onChange={handleChanges}
                        className="p-2 border rounded-md w-full"
                        min={0}
                      />
                      <input
                        type="number"
                        name="maxPrice"
                        placeholder="Max Price"
                        value={formData.maxPrice}
                        onChange={handleChanges}
                        className="p-2 border rounded-md w-full"
                        min={0}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="bedrooms"
                        placeholder="Bedrooms"
                        value={formData.bedrooms}
                        onChange={handleChanges}
                        className="p-2 border rounded-md w-full"
                        min={1}
                      />
                      <input
                        type="number"
                        name="bathrooms"
                        placeholder="Bathrooms"
                        value={formData.bathrooms}
                        onChange={handleChanges}
                        className="p-2 border rounded-md w-full"
                        min={1}
                      />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" /></svg>
                        Search
                    </button>
                </form>


                {/* Listings Display */}
                <div className="mt-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Listings</h2>
                    {loading && <p className="text-center text-lg font-semibold text-blue-600 animate-pulse">Loading...</p>}
                    {error && <p className="text-center text-red-600 text-lg mb-4">{error}</p>}
                    {!loading && !error && listings.length === 0 && (
                      <div className="text-center py-8">
                        <img src={duckImg} alt="No listings found" className="w-72 h-72 object-contain mx-auto mb-0" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Listings Found</h3>
                        <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {listings && listings.map((listing) => (
                            <ListingItem key={listing._id} listing={listing} />
                        ))}
                    </div>
                    {showMoreListing && (
                        <div className="flex justify-center mt-4">
                        <button
                            type="button"
                            onClick={showMoreListingClick}
                            className="mt-4 bg-gray-600 text-white p-2 rounded-md w-500"
                        >
                            Show More
                        </button>
                        </div>
                    )}
                </div>
                {recommendations.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Recommended for you</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {recommendations.map((l) => (
                        <ListingItem key={l._id} listing={l} />
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <GeminiAIWrapper />
            <ContactSupportWrapper />
        </div>
    );
}

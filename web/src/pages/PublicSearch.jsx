import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ListingItem from "../components/ListingItem";
import LocationSelector from "../components/LocationSelector";
import data from "../data/countries+states+cities.json";
import duckImg from "../assets/duck-go-final.gif";
import ContactSupportWrapper from '../components/ContactSupportWrapper';
import SearchSuggestions from '../components/SearchSuggestions';
import FilterChips from "../components/search/FilterChips";
import { usePageTitle } from '../hooks/usePageTitle';
import { Search, Filter, MapPin, Home, DollarSign, GripVertical, ChevronDown, RefreshCw } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PublicSearch() {
    // Set page title
    usePageTitle("Search Properties - Find Your Dream Home");

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
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false); // Mobile filter toggle

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
            city: "", // City filter disabled for public search
            state: urlParams.get("state") || "",
            bedrooms: urlParams.get("bedrooms") || "",
            bathrooms: urlParams.get("bathrooms") || "",
        });
        setLocationFilter({
            state: urlParams.get("state") || "",
            district: urlParams.get("district") || "",
            city: "", // Always clear city for public search
        });

        const fetchListings = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchParams = new URLSearchParams(urlParams);
                fetchParams.set('visibility', 'public');
                const res = await fetch(`${API_BASE_URL}/api/listing/get?${fetchParams.toString()}`);
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(formData);
        navigate(`?${urlParams.toString()}`);
    };

    const showMoreListingClick = async () => {
        try {
            const urlParams = new URLSearchParams(location.search);
            urlParams.set("startIndex", listings.length);
            urlParams.set("visibility", "public");
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
        // For public search, always clear city filter
        const updatedLoc = { ...loc, city: "" };
        setLocationFilter(updatedLoc);
        setFormData((prev) => ({ ...prev, state: loc.state, district: loc.district, city: "" }));
    };

    const clearAllFilters = () => {
        const reset = {
            searchTerm: "", type: "all", parking: false, furnished: false, offer: false,
            sort: "createdAt", order: "desc", minPrice: "", maxPrice: "",
            city: "", state: "", bedrooms: "", bathrooms: ""
        };
        setFormData(reset);
        setLocationFilter({ state: "", district: "", city: "" });
        navigate(`?${new URLSearchParams(reset).toString()}`);
    };

    const removeFilter = (key) => {
        const updated = { ...formData };
        if (typeof updated[key] === 'boolean') updated[key] = false; else updated[key] = "";
        setFormData(updated);
        navigate(`?${new URLSearchParams(updated).toString()}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">

            {/* Search Header / Hero */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 pb-16 pt-10 px-4 shadow-lg mb-8 relative overflow-hidden">
                {/* Abstract shapes for visual interest */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                    <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white mix-blend-overlay filter blur-3xl animate-float"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-300 mix-blend-overlay filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
                </div>

                <div className="max-w-7xl mx-auto text-center relative z-10 animate-slideInFromTop">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
                        Find Your <span className="text-yellow-300">Perfect Place</span>
                    </h1>
                    <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto font-light">
                        Search through thousands of properties to find the one that feels like home.
                    </p>

                    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
                        <div className="flex flex-col md:flex-row gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300">

                            {/* Search Input */}
                            <div className="relative flex-grow group-focus-within:ring-2 ring-blue-400 rounded-xl transition-all">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-blue-200" />
                                </div>
                                <input
                                    type="text"
                                    name="searchTerm"
                                    placeholder="Search by location, property type..."
                                    value={formData.searchTerm}
                                    onChange={handleChanges}
                                    onFocus={handleSearchInputFocus}
                                    onBlur={handleSearchInputBlur}
                                    className="block w-full pl-10 pr-3 py-4 border-none rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-white transition-colors text-lg"
                                />
                                <SearchSuggestions
                                    searchTerm={formData.searchTerm}
                                    onSuggestionClick={handleSuggestionClick}
                                    onClose={() => setShowSuggestions(false)}
                                    isVisible={showSuggestions}
                                    className="mt-2 w-full text-left"
                                />
                            </div>

                            {/* Mobile Filter Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                className="md:hidden bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <Filter className="h-5 w-5" /> Filters
                            </button>

                            {/* Desktop Search Button */}
                            <button
                                type="submit"
                                className="hidden md:flex bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:-translate-y-1 transition-all duration-300 items-center justify-center gap-2 min-w-[140px]"
                            >
                                Search
                            </button>
                        </div>

                        {/* Expanded Filters for Desktop */}
                        <div className="hidden md:grid grid-cols-4 gap-4 mt-4 animate-fade-in-down" style={{ animationDelay: "0.1s" }}>
                            {/* State Select */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                </div>
                                <select
                                    className="w-full pl-10 pr-4 py-3 bg-white/90 border-none rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm cursor-pointer hover:bg-white transition-colors"
                                    value={locationFilter.state || ""}
                                    onChange={(e) => handleLocationChange({ ...locationFilter, state: e.target.value, city: "" })}
                                >
                                    <option value="">Select State</option>
                                    {(() => {
                                        const india = data.find((country) => country.name === "India");
                                        return india ? india.states.map((s) => (
                                            <option key={s.state_code} value={s.name}>{s.name}</option>
                                        )) : [];
                                    })()}
                                </select>
                            </div>

                            {/* Type Toggle */}
                            <div className="bg-white/90 rounded-xl p-1 flex shadow-sm">
                                {['all', 'rent', 'sale'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                                        className={`flex-1 capitalize py-2 rounded-lg text-sm font-medium transition-all ${formData.type === t
                                                ? 'bg-blue-100 text-blue-700 shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* Price Range */}
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    name="minPrice"
                                    placeholder="Min Price"
                                    value={formData.minPrice}
                                    onChange={handleChanges}
                                    className="w-full px-4 py-3 bg-white/90 border-none rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm"
                                    min={0}
                                />
                                <input
                                    type="number"
                                    name="maxPrice"
                                    placeholder="Max Price"
                                    value={formData.maxPrice}
                                    onChange={handleChanges}
                                    className="w-full px-4 py-3 bg-white/90 border-none rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm"
                                    min={0}
                                />
                            </div>

                            {/* Sort */}
                            <div className="relative">
                                <select
                                    onChange={(e) => {
                                        const [sort, order] = e.target.value.split("_");
                                        setFormData((prev) => ({ ...prev, sort, order }));
                                    }}
                                    value={`${formData.sort}_${formData.order}`}
                                    className="w-full px-4 py-3 bg-white/90 border-none rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm cursor-pointer hover:bg-white appearance-none"
                                >
                                    <option value="regularPrice_desc">Price: High to Low</option>
                                    <option value="regularPrice_asc">Price: Low to High</option>
                                    <option value="createdAt_desc">Newest First</option>
                                    <option value="createdAt_asc">Oldest First</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Visual Amenities Checkboxes */}
                        <div className="hidden md:flex justify-center gap-6 mt-4 text-white/90 animate-fade-in-down" style={{ animationDelay: "0.2s" }}>
                            {[
                                { name: 'parking', label: 'Parking' },
                                { name: 'furnished', label: 'Furnished' },
                                { name: 'offer', label: 'Special Offer' }
                            ].map((amenity) => (
                                <label key={amenity.name} className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData[amenity.name] ? 'bg-yellow-400 border-yellow-400' : 'border-white/50 group-hover:border-white'
                                        }`}>
                                        {formData[amenity.name] && <svg className="w-3 h-3 text-blue-900 font-bold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                    </div>
                                    <span className="text-sm font-medium group-hover:text-white transition-colors">{amenity.label}</span>
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

                    </form>
                </div>
            </div>

            {/* Mobile Filters Modal/Drawer */}
            {isFiltersOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsFiltersOpen(false)}>
                    <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-2xl p-6 flex flex-col gap-4 overflow-y-auto animate-slide-in-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                            <button onClick={() => setIsFiltersOpen(false)} className="text-gray-500 hover:text-gray-800">Close</button>
                        </div>

                        {/* Mobile Filters Content */}
                        {/* ... Similar inputs as desktop but stacked ... */}
                        <select
                            className="w-full p-3 border rounded-xl"
                            onChange={(e) => {
                                const [sort, order] = e.target.value.split("_");
                                setFormData((prev) => ({ ...prev, sort, order }));
                            }}
                            value={`${formData.sort}_${formData.order}`}
                        >
                            <option value="regularPrice_desc">Price: High to Low</option>
                            <option value="regularPrice_asc">Price: Low to High</option>
                            <option value="createdAt_desc">Newest First</option>
                            <option value="createdAt_asc">Oldest First</option>
                        </select>

                        <div className="p-3 bg-gray-50 rounded-xl">
                            <label className="block text-sm font-semibold mb-2">Detailed Filters</label>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" name="minPrice" placeholder="Min ₹" value={formData.minPrice} onChange={handleChanges} className="p-2 border rounded-lg w-full" />
                                <input type="number" name="maxPrice" placeholder="Max ₹" value={formData.maxPrice} onChange={handleChanges} className="p-2 border rounded-lg w-full" />
                                <input type="number" name="bedrooms" placeholder="Beds" value={formData.bedrooms} onChange={handleChanges} className="p-2 border rounded-lg w-full" />
                                <input type="number" name="bathrooms" placeholder="Baths" value={formData.bathrooms} onChange={handleChanges} className="p-2 border rounded-lg w-full" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {['parking', 'furnished', 'offer'].map(item => (
                                <label key={item} className="flex items-center gap-2">
                                    <input type="checkbox" name={item} checked={formData[item]} onChange={handleChanges} className="w-5 h-5 accent-blue-600" />
                                    <span className="capitalize">{item}</span>
                                </label>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                handleSubmit({ preventDefault: () => { } });
                                setIsFiltersOpen(false);
                            }}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-grow max-w-7xl mx-auto px-4 w-full -mt-10 relative z-10 pb-20">

                {/* Active Filters Display */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
                    <FilterChips formData={formData} onClear={clearAllFilters} onRemove={removeFilter} />
                </div>

                {/* Listings Grid */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Property Results
                            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {listings.length} found
                            </span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="min-h-[400px] flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-500 animate-pulse font-medium">Finding the best properties for you...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-red-600 text-lg font-medium">{error}</p>
                            <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 hover:underline">Try refreshing the page</button>
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center animate-fade-in-up">
                            <img src={duckImg} alt="No listings found" className="w-[280px] h-[280px] object-contain mx-auto opacity-90 hover:scale-105 transition-transform duration-500" />
                            <h3 className="text-2xl font-bold text-gray-700 mb-2">No properties matched your search</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                We couldn't find exactly what you're looking for. Try adjusting your price range or removing some filters.
                            </p>
                            <button
                                onClick={clearAllFilters}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-full font-semibold hover:bg-blue-100 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" /> Clear all filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {listings.map((listing, index) => (
                                    <div
                                        key={listing._id}
                                        className="animate-fade-in-up"
                                        style={{ animationDelay: `${index * 0.05}s` }} // Staggered animation
                                    >
                                        <ListingItem listing={listing} />
                                    </div>
                                ))}
                            </div>

                            {showMoreListing && (
                                <div className="flex justify-center mt-12">
                                    <button
                                        type="button"
                                        onClick={showMoreListingClick}
                                        className="group relative px-8 py-3 bg-white text-gray-800 font-bold rounded-full shadow-md hover:shadow-lg hover:text-blue-600 transition-all border border-gray-200"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">Show More Properties <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" /></span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <ContactSupportWrapper />
        </div>
    );
}

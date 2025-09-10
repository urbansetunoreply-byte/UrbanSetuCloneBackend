import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ListingItem from '../components/ListingItem';
import { toast } from 'react-toastify';
import { FaEye, FaTrash, FaSearch, FaFilter, FaSort, FaPlus, FaTimes, FaFire, FaArrowDown, FaArrowUp, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Watchlist() {
  const { currentUser } = useSelector((state) => state.user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [filterType, setFilterType] = useState('all');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [propertySearchTerm, setPropertySearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const fetchWatchlist = async () => {
    if (!currentUser?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist/user/${currentUser._id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const listings = data.map((x) => x.listingId).filter(Boolean);
        setItems(listings);
      }
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWatchlist(); }, [currentUser?._id]);

  const handleRemove = async (listingId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist/remove/${listingId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setItems(prev => prev.filter(l => l._id !== listingId));
        toast.success('Removed from watchlist');
      }
    } catch (_) {}
  };

  const searchProperties = async () => {
    if (!propertySearchTerm.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/get?search=${encodeURIComponent(propertySearchTerm)}&limit=20`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching properties:', error);
      toast.error('Failed to search properties');
    } finally {
      setSearching(false);
    }
  };

  const fetchSearchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSuggestionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/get?search=${encodeURIComponent(query)}&limit=5`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSearchSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setPropertySearchTerm(value);
    fetchSearchSuggestions(value);
  };

  const selectSuggestion = (listing) => {
    setPropertySearchTerm(listing.name);
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  const addToWatchlist = async (listing) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingId: listing._id })
      });
      if (res.ok) {
        setItems(prev => [listing, ...prev]);
        setSearchResults(prev => prev.filter(l => l._id !== listing._id));
        toast.success('Added to watchlist');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to add to watchlist');
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  const isInWatchlist = (listingId) => {
    return items.some(item => item._id === listingId);
  };

  const getPropertyFeatures = (listing) => {
    const features = [];
    
    // Check for price drop
    if (listing.offer && listing.discountPrice && listing.regularPrice && listing.discountPrice < listing.regularPrice) {
      const savings = listing.regularPrice - listing.discountPrice;
      const percentage = Math.round((savings / listing.regularPrice) * 100);
      features.push({
        type: 'price_drop',
        icon: <FaArrowDown className="text-green-500" />,
        text: `Save ₹${savings.toLocaleString('en-IN')} (${percentage}% off)`,
        color: 'text-green-600 bg-green-50 border-green-200'
      });
    }
    
    // Check for trending (based on watchlist count or recent activity)
    if (listing.watchCount && listing.watchCount > 5) {
      features.push({
        type: 'trending',
        icon: <FaFire className="text-orange-500" />,
        text: `Trending (${listing.watchCount} watching)`,
        color: 'text-orange-600 bg-orange-50 border-orange-200'
      });
    }
    
    // Check for special offer
    if (listing.offer) {
      features.push({
        type: 'offer',
        icon: <FaCheckCircle className="text-blue-500" />,
        text: 'Special Offer',
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      });
    }
    
    // Check for new listing (created within last 7 days)
    const daysSinceCreated = Math.floor((new Date() - new Date(listing.createdAt)) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated <= 7) {
      features.push({
        type: 'new',
        icon: <FaCheckCircle className="text-purple-500" />,
        text: 'New Listing',
        color: 'text-purple-600 bg-purple-50 border-purple-200'
      });
    }
    
    return features;
  };

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.state?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.regularPrice || 0) - (b.regularPrice || 0);
        case 'price-high':
          return (b.regularPrice || 0) - (a.regularPrice || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'dateAdded':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen py-4 sm:py-10 px-2 md:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <FaEye className="text-3xl text-purple-700" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-700">My Watchlist</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {filteredAndSortedItems.length} of {items.length} properties
            </div>
            <button
              onClick={() => setShowAddProperty(!showAddProperty)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <FaPlus className="text-sm" />
              Add Properties
            </button>
          </div>
        </div>

        {/* Add Property Search Section */}
        {showAddProperty && (
          <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-800">Search and Add Properties</h3>
              <button
                onClick={() => setShowAddProperty(false)}
                className="text-purple-600 hover:text-purple-800"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties by name, city, or state..."
                  value={propertySearchTerm}
                  onChange={handleSearchInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && searchProperties()}
                  onFocus={() => propertySearchTerm.length >= 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && (searchSuggestions.length > 0 || suggestionLoading) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {suggestionLoading ? (
                      <div className="p-3 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-1 text-sm">Searching...</p>
                      </div>
                    ) : (
                      searchSuggestions.map((listing) => (
                        <div
                          key={listing._id}
                          onClick={() => selectSuggestion(listing)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            {listing.imageUrls && listing.imageUrls.length > 0 ? (
                              <img
                                src={listing.imageUrls[0]}
                                alt={listing.name}
                                className="w-12 h-12 object-cover rounded-md"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/48x48?text=No+Image";
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                                <span className="text-gray-400 text-lg">🏠</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 truncate">{listing.name}</h4>
                              <p className="text-sm text-gray-600 truncate">{listing.city}, {listing.state}</p>
                              <p className="text-sm text-gray-500">
                                {listing.type} • {listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''} • ₹{listing.regularPrice?.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {searchSuggestions.length === 0 && !suggestionLoading && (
                      <div className="p-3 text-center text-gray-500">
                        <p className="text-sm">No properties found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={searchProperties}
                disabled={searching || !propertySearchTerm.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <FaSearch />
                    Search
                  </>
                )}
              </button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((listing) => (
                  <div key={listing._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{listing.name}</h4>
                      <p className="text-sm text-gray-600">{listing.city}, {listing.state}</p>
                      <p className="text-sm text-gray-500">
                        {listing.type} • {listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''} • ₹{listing.regularPrice?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button
                      onClick={() => addToWatchlist(listing)}
                      disabled={isInWatchlist(listing._id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isInWatchlist(listing._id)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isInWatchlist(listing._id) ? 'Added' : 'Add to Watchlist'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search and Filter Controls */}
        {items.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties by name, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <FaSort className="text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="dateAdded">Date Added</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {items.length === 0 ? (
          <div className="text-center py-10 sm:py-16">
            <div className="text-6xl sm:text-8xl mb-4">👁️</div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Your watchlist is empty</h3>
            <p className="text-gray-600 mb-6">Track properties to get price-drop and availability alerts.</p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FaSearch />
              Browse Properties
            </Link>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No properties found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAndSortedItems.map((listing) => {
              const features = getPropertyFeatures(listing);
              return (
                <div key={listing._id} className="relative group">
                  <div className="relative">
                    <ListingItem listing={listing} />
                    
                    {/* Property Features - positioned to avoid conflicts */}
                    {features.length > 0 && (
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-30 max-w-[calc(100%-120px)]">
                        {features.map((feature, index) => (
                          <div
                            key={index}
                            className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${feature.color} shadow-sm`}
                          >
                            {feature.icon}
                            <span className="hidden sm:inline">{feature.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Remove Button - positioned to avoid conflicts with other buttons */}
                    <button 
                      onClick={() => handleRemove(listing._id)} 
                      className="absolute top-2 right-2 bg-white/95 hover:bg-white text-red-600 px-2 py-1 rounded shadow-lg hover:shadow-xl transition-all flex items-center gap-1 text-sm z-30"
                      title="Remove from watchlist"
                    >
                      <FaTrash className="text-xs" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



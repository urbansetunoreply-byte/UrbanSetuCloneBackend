import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ListingItem from '../components/ListingItem';
import { toast } from 'react-toastify';
import { FaEye, FaTrash, FaSearch, FaFilter, FaSort } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Watchlist() {
  const { currentUser } = useSelector((state) => state.user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [filterType, setFilterType] = useState('all');

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
          <div className="text-sm text-gray-600">
            {filteredAndSortedItems.length} of {items.length} properties
          </div>
        </div>

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
            {filteredAndSortedItems.map((listing) => (
              <div key={listing._id} className="relative group">
                <ListingItem listing={listing} />
                <button 
                  onClick={() => handleRemove(listing._id)} 
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 px-2 py-1 rounded shadow-lg hover:shadow-xl transition-all flex items-center gap-1 text-sm"
                  title="Remove from watchlist"
                >
                  <FaTrash className="text-xs" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



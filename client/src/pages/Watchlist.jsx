import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ListingItem from '../components/ListingItem';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Watchlist() {
  const { currentUser } = useSelector((state) => state.user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen py-10 px-2 md:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-purple-700">My Watchlist</h1>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">👁️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Your watchlist is empty</h3>
            <p className="text-gray-600">Track properties to get price-drop and availability alerts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((listing) => (
              <div key={listing._id} className="relative group">
                <ListingItem listing={listing} />
                <button onClick={() => handleRemove(listing._id)} className="absolute top-2 right-2 bg-white/90 text-red-600 px-3 py-1 rounded shadow hover:bg-white">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



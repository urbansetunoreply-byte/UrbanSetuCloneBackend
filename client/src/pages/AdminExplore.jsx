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
    const bedsMatch = natural.match(/(\d+)\s*(bhk|bed|beds)/i);
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
          
          {/* Smart (NLP) Search - moved to top */}
          <form onSubmit={applySmartQuery} className="bg-blue-50 p-4 rounded-lg mb-6">
            <label className="block text-sm font-medium text-blue-800 mb-2">Smart Search (natural language)</label>
            <div className="flex gap-2">
              <input
                value={smartQuery}
                onChange={(e) => setSmartQuery(e.target.value)}
                placeholder="e.g., 3BHK above 50L in Bengaluru with parking"
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
              placeholder="Search by property name, address, or description..."
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

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaEye, FaPlus, FaLock, FaShieldAlt } from "react-icons/fa";
import ContactSupportWrapper from '../components/ContactSupportWrapper';
import { maskAddress } from '../utils/addressMasking';
import { toast } from 'react-toastify';
import { useDispatch } from "react-redux";
import { signoutUserStart, signoutUserSuccess, signoutUserFailure } from "../redux/user/userSlice";

import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function MyListings() {
  // Set page title
  usePageTitle("My Listings - My Properties");

  const { currentUser } = useSelector((state) => state.user);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [filters, setFilters] = useState({
    searchTerm: '',
    type: 'all',
    offer: 'all',
    furnished: 'all',
    parking: 'all',
    city: '',
    state: ''
  });

  useEffect(() => {
    const fetchUserListings = async () => {
      if (!currentUser) {
        setError("Please sign in to view your listings");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/listing/user`, {
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          setListings(data);
        } else {
          throw new Error("Failed to fetch listings");
        }
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError("Failed to load listings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserListings();
  }, [currentUser]);

  const handleDelete = (id) => {
    setPendingDeleteId(id);
    setShowPasswordModal(true);
    setDeletePassword("");
    setDeleteError("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError("");
    try {
      // Verify password
      const verifyRes = await fetch(`${API_BASE_URL}/api/user/verify-password/${currentUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!verifyRes.ok) {
        // Track wrong attempts locally (allow up to 3 attempts before logout)
        const key = 'deleteListingPwAttempts';
        const prev = parseInt(localStorage.getItem(key) || '0');
        const next = prev + 1;
        localStorage.setItem(key, String(next));

        if (next >= 3) {
          // Sign out and redirect on third wrong attempt
          toast.error("Too many incorrect attempts. You've been signed out for security.");
          dispatch(signoutUserStart());
          try {
            const signoutRes = await fetch(`${API_BASE_URL}/api/auth/signout`);
            const signoutData = await signoutRes.json();
            if (signoutData.success === false) {
              dispatch(signoutUserFailure(signoutData.message));
            } else {
              dispatch(signoutUserSuccess(signoutData));
            }
          } catch (err) {
            dispatch(signoutUserFailure(err.message));
          }
          localStorage.removeItem(key); // Clear attempts on logout
          setShowPasswordModal(false);
          setTimeout(() => {
            navigate('/sign-in');
          }, 800);
          return;
        }

        const remaining = 3 - next;
        setDeleteError(`Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} left before logout.`);
        setDeleteLoading(false);
        return;
      }

      // Success - Clear attempts
      localStorage.removeItem('deleteListingPwAttempts');

      // Proceed to delete
      const res = await fetch(`${API_BASE_URL}/api/listing/delete/${pendingDeleteId}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (res.ok) {
        setListings((prev) => prev.filter((listing) => listing._id !== pendingDeleteId));
        toast.success("Listing deleted successfully!");
        setShowPasswordModal(false);
        setPendingDeleteId(null);
        navigate("/user/my-listings");
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredListings = listings.filter((l) => {
    const matchesSearch = filters.searchTerm
      ? (l.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (l.address && String(l.address).toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (l.city && l.city.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (l.state && l.state.toLowerCase().includes(filters.searchTerm.toLowerCase())))
      : true;
    const matchesType = filters.type === 'all' ? true : l.type === filters.type;
    const matchesOffer = filters.offer === 'all' ? true : (filters.offer === 'true' ? !!l.offer : !l.offer);
    const matchesFurnished = filters.furnished === 'all' ? true : (filters.furnished === 'true' ? !!l.furnished : !l.furnished);
    const matchesParking = filters.parking === 'all' ? true : (filters.parking === 'true' ? !!l.parking : !l.parking);
    const matchesCity = filters.city ? (l.city && l.city.toLowerCase().includes(filters.city.toLowerCase())) : true;
    const matchesState = filters.state ? (l.state && l.state.toLowerCase().includes(filters.state.toLowerCase())) : true;
    return matchesSearch && matchesType && matchesOffer && matchesFurnished && matchesParking && matchesCity && matchesState;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-2 md:px-8">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="text-center text-red-600 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-2 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-700 drop-shadow">My Listings</h3>
            {listings.length > 0 && (
              <Link
                to="/user/create-listing"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-1 sm:gap-2 text-sm sm:text-base w-full sm:w-auto justify-center mt-4 md:mt-0"
              >
                <FaPlus /> <span>Create New Listing</span>
              </Link>
            )}
          </div>

          {/* Filters */}
          {listings.length > 0 && (
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
                placeholder="Search by name/address/city/state"
              />
              <select className="border rounded px-3 py-2 text-sm" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="all">All Types</option>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
              <select className="border rounded px-3 py-2 text-sm" value={filters.offer} onChange={(e) => setFilters({ ...filters, offer: e.target.value })}>
                <option value="all">Offer: Any</option>
                <option value="true">Offer: Yes</option>
                <option value="false">Offer: No</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select className="border rounded px-3 py-2 text-sm" value={filters.furnished} onChange={(e) => setFilters({ ...filters, furnished: e.target.value })}>
                  <option value="all">Furnished: Any</option>
                  <option value="true">Furnished</option>
                  <option value="false">Unfurnished</option>
                </select>
                <select className="border rounded px-3 py-2 text-sm" value={filters.parking} onChange={(e) => setFilters({ ...filters, parking: e.target.value })}>
                  <option value="all">Parking: Any</option>
                  <option value="true">With Parking</option>
                  <option value="false">No Parking</option>
                </select>
              </div>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
                placeholder="City"
              />
              <input
                type="text"
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                className="border rounded px-3 py-2 text-sm"
                placeholder="State"
              />
            </div>
          )}

          {listings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏠</div>
              <h4 className="text-xl font-semibold text-gray-600 mb-2">No listings yet</h4>
              <p className="text-gray-500 mb-6">Start by creating your first property listing</p>
              <Link
                to="/user/create-listing"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold inline-flex items-center gap-1 sm:gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <FaPlus /> <span>Create Your First Listing</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.slice(0, visibleCount).map((listing) => (
                  <div key={listing._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    {/* Image */}
                    <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      {listing.imageUrls && listing.imageUrls.length > 0 ? (
                        <img
                          src={listing.imageUrls[0]}
                          alt={listing.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span>No Image</span>
                        </div>
                      )}
                      {/* Sale Status Overlays */}
                      {listing.availabilityStatus === 'under_contract' && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10">
                          <span className="bg-yellow-500 text-white px-4 py-2 font-bold text-lg rounded-lg transform -rotate-12 border-2 border-dashed border-white shadow-xl backdrop-blur-sm">
                            UNDER CONTRACT
                          </span>
                        </div>
                      )}

                      {listing.availabilityStatus === 'sold' && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white px-6 py-2 font-extrabold text-xl rounded-lg transform -rotate-12 border-4 border-double border-white shadow-2xl">
                            SOLD
                          </span>
                        </div>
                      )}

                      <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-20">
                        {listing.isRentLocked && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <FaLock size={10} /> Rent-Locked
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${listing.type === 'sale'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                          }`}>
                          {listing.type === 'sale' ? 'For Sale' : 'For Rent'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="font-semibold text-lg text-gray-800 mb-2 truncate">{listing.name}</h4>
                      <p className="text-gray-600 text-sm mb-2 truncate">
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

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>{listing.bedrooms} bed</span>
                        <span>{listing.bathrooms} bath</span>
                        {listing.parking && <span>Parking</span>}
                        {listing.furnished && <span>Furnished</span>}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-bold text-blue-600">
                          {listing.offer ? formatPrice(listing.discountPrice) : formatPrice(listing.regularPrice)}
                          {listing.type === 'rent' && <span className="text-sm text-gray-500">/month</span>}
                        </div>
                        {listing.offer && (
                          <span className="text-sm text-green-600 font-medium">Offer!</span>
                        )}
                      </div>


                      {/* Verification Status - For All Properties */}
                      {!listing.isVerified ? (
                        <div className="mb-3 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 mt-0.5">
                              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800 mb-1">Not Published</p>
                              <p className="text-xs text-yellow-700">Complete verification to make this property visible to buyers</p>
                              <button
                                onClick={() => navigate(`/user/property-verification?listingId=${listing._id}`)}
                                className="mt-2 px-3 py-1.5 bg-yellow-600 text-white rounded text-xs font-semibold hover:bg-yellow-700 transition flex items-center gap-1"
                              >
                                <FaShieldAlt /> Verify Property
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1 w-fit">
                            <FaShieldAlt /> Verified
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/user/listing/${listing._id}`}
                          className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600 transition flex items-center justify-center gap-1"
                        >
                          <FaEye /> View
                        </Link>
                        {/* Edit Button - Disabled if Under Contract or Sold */}
                        <Link
                          to={
                            listing.availabilityStatus === 'sold' || listing.availabilityStatus === 'under_contract'
                              ? '#'
                              : `/user/update-listing/${listing._id}`
                          }
                          onClick={(e) => {
                            if (listing.availabilityStatus === 'sold' || listing.availabilityStatus === 'under_contract') {
                              e.preventDefault();
                            }
                          }}
                          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-1 ${listing.availabilityStatus === 'sold' || listing.availabilityStatus === 'under_contract'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                            }`}
                          title={
                            listing.availabilityStatus === 'sold'
                              ? "Cannot edit sold property"
                              : listing.availabilityStatus === 'under_contract'
                                ? "Cannot edit property under contract"
                                : "Edit Property"
                          }
                        >
                          <FaEdit /> Edit
                        </Link>
                        {listing.type === 'rent' && (
                          <Link
                            to={`/user/property-verification?listingId=${listing._id}`}
                            className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-600 transition flex items-center justify-center gap-1"
                          >
                            <FaShieldAlt /> {listing.isVerified ? 'Verify Status' : 'Verify'}
                          </Link>
                        )}

                        {/* Delete Button - Disabled if Rent Locked, Under Contract, or Sold */}
                        <button
                          onClick={() => {
                            if (listing.availabilityStatus === 'sold' || listing.availabilityStatus === 'under_contract') return;
                            if (!listing.isRentLocked) handleDelete(listing._id);
                          }}
                          disabled={listing.isRentLocked || listing.availabilityStatus === 'sold' || listing.availabilityStatus === 'under_contract'}
                          title={
                            listing.availabilityStatus === 'sold'
                              ? "Cannot delete sold property"
                              : listing.availabilityStatus === 'under_contract'
                                ? "Cannot delete property under contract"
                                : listing.isRentLocked
                                  ? `Cannot delete. Rent-Locked until ${new Date(listing.rentLockEndDate || Date.now()).toLocaleDateString()}`
                                  : "Delete Property"
                          }
                          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-1 ${listing.isRentLocked || listing.availabilityStatus === 'sold' || listing.availabilityStatus === 'under_contract'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredListings.length > visibleCount && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setVisibleCount((c) => c + 12)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Show more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
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
              <button type="submit" className="px-4 py-2 rounded bg-red-600 text-white font-semibold" disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Confirm & Delete'}</button>
            </div>
          </form>
        </div>
      )}
      <ContactSupportWrapper />
    </div>
  );
} 
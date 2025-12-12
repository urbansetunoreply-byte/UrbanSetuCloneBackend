import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaEye, FaPlus, FaLock, FaFlag, FaTimes, FaSync } from "react-icons/fa";
import ContactSupportWrapper from "../components/ContactSupportWrapper";
import { maskAddress } from '../utils/addressMasking';
import { useSelector, useDispatch } from "react-redux";
import { signoutUserStart, signoutUserSuccess, signoutUserFailure } from "../redux/user/userSlice";
import { toast } from 'react-toastify';

import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminListings() {
  // Set page title
  usePageTitle("Property Management - Admin Panel");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMoreListing, setShowMoreListing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Property Reports state
  const [showPropertyReportsModal, setShowPropertyReportsModal] = useState(false);
  const [propertyReports, setPropertyReports] = useState([]);
  const [filteredPropertyReports, setFilteredPropertyReports] = useState([]);
  const [propertyReportsLoading, setPropertyReportsLoading] = useState(false);
  const [propertyReportsError, setPropertyReportsError] = useState('');
  const [propertyReportsFilters, setPropertyReportsFilters] = useState({
    dateFrom: '',
    dateTo: '',
    reporter: '',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Lock body scroll when deletion modals are open on Admin Listings
  useEffect(() => {
    const shouldLock = showReasonModal || showPasswordModal || showPropertyReportsModal;
    if (shouldLock) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showReasonModal, showPasswordModal, showPropertyReportsModal]);

  const [filters, setFilters] = useState({
    searchTerm: '',
    type: 'all',
    offer: 'all',
    furnished: 'all',
    parking: 'all',
    minPrice: '',
    maxPrice: '',
    city: '',
    state: ''
  });

  const buildParams = (startIndex, limit) => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('startIndex', String(startIndex));
    if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.offer !== 'all') params.set('offer', filters.offer);
    if (filters.furnished !== 'all') params.set('furnished', filters.furnished);
    if (filters.parking !== 'all') params.set('parking', filters.parking);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.city) params.set('city', filters.city);
    if (filters.state) params.set('state', filters.state);
    return params;
  };

  useEffect(() => {
    // Debounce filter fetches to avoid jarring reload on each keystroke
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setFetching(true);
        setError(null);
        const limit = 12;
        const params = buildParams(0, limit);
        const res = await fetch(`${API_BASE_URL}/api/listing/get?${params.toString()}`, { credentials: 'include', signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setListings(data);
          setShowMoreListing(Array.isArray(data) && data.length === limit);
        } else {
          throw new Error("Failed to fetch listings");
        }
      } catch (err) {
        if (err.name !== 'AbortError') setError("Failed to load listings. Please try again.");
      } finally {
        setFetching(false);
        setLoading(false);
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [filters]);

  const handleShowMore = async () => {
    try {
      const limit = 12;
      const params = buildParams(listings.length, limit);
      const res = await fetch(`${API_BASE_URL}/api/listing/get?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setListings((prev) => [...prev, ...data]);
      setShowMoreListing(Array.isArray(data) && data.length === limit);
    } catch (_) { }
  };

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
      // Verify password
      const verifyRes = await fetch(`${API_BASE_URL}/api/user/verify-password/${currentUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!verifyRes.ok) {
        // Track wrong attempts locally (allow up to 3 attempts before logout)
        const key = 'deleteAdminListingPwAttempts';
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
      localStorage.removeItem('deleteAdminListingPwAttempts');

      // Proceed to delete
      const res = await fetch(`${API_BASE_URL}/api/listing/delete/${pendingDeleteId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      });
      if (res.ok) {
        setListings((prev) => prev.filter((listing) => listing._id !== pendingDeleteId));
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calculate discount percentage
  const getDiscountPercentage = (listing) => {
    if (listing.offer && listing.regularPrice && listing.discountPrice) {
      return Math.round(((listing.regularPrice - listing.discountPrice) / listing.regularPrice) * 100);
    }
    return 0;
  };

  // Fetch property reports
  const fetchPropertyReports = async () => {
    try {
      setPropertyReportsLoading(true);
      setPropertyReportsError('');

      const params = new URLSearchParams();
      if (propertyReportsFilters.dateFrom) params.append('dateFrom', propertyReportsFilters.dateFrom);
      if (propertyReportsFilters.dateTo) params.append('dateTo', propertyReportsFilters.dateTo);
      if (propertyReportsFilters.reporter) params.append('reporter', propertyReportsFilters.reporter);
      if (propertyReportsFilters.search) params.append('search', propertyReportsFilters.search);
      params.append('sortBy', propertyReportsFilters.sortBy);
      params.append('sortOrder', propertyReportsFilters.sortOrder);

      console.log('Fetching property reports from:', `${API_BASE_URL}/api/notifications/reports/properties?${params}`);

      const res = await fetch(`${API_BASE_URL}/api/notifications/reports/properties?${params}`, {
        credentials: 'include'
      });
      const data = await res.json();

      console.log('Property Reports API response:', data);

      if (data.success) {
        setPropertyReports(data.reports || []);
        console.log('Property Reports set:', data.reports?.length || 0);
        // Debug: Log first report to see what data is available
        if (data.reports && data.reports.length > 0) {
          console.log('First property report data:', JSON.stringify(data.reports[0], null, 2));
        }
      } else {
        setPropertyReportsError(data.message || 'Failed to load property reports');
        console.error('Property Reports API error:', data.message);
      }
    } catch (error) {
      setPropertyReportsError('Network error while loading property reports');
      console.error('Error fetching property reports:', error);
    } finally {
      setPropertyReportsLoading(false);
    }
  };

  // Fetch property reports only when modal opens
  useEffect(() => {
    if (showPropertyReportsModal) {
      fetchPropertyReports();
    }
  }, [showPropertyReportsModal]);

  // Client-side filtering for immediate UI updates
  useEffect(() => {
    if (propertyReports.length === 0) {
      setFilteredPropertyReports([]);
      return;
    }

    let filtered = [...propertyReports];

    // Apply search filter
    if (propertyReportsFilters.search) {
      const searchTerm = propertyReportsFilters.search.toLowerCase();
      filtered = filtered.filter(report =>
        report.propertyName?.toLowerCase().includes(searchTerm) ||
        report.reporter?.toLowerCase().includes(searchTerm) ||
        report.reporterEmail?.toLowerCase().includes(searchTerm) ||
        report.reporterPhone?.toLowerCase().includes(searchTerm) ||
        report.category?.toLowerCase().includes(searchTerm) ||
        report.details?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply reporter filter
    if (propertyReportsFilters.reporter) {
      const reporterTerm = propertyReportsFilters.reporter.toLowerCase();
      filtered = filtered.filter(report =>
        report.reporter?.toLowerCase().includes(reporterTerm)
      );
    }

    // Apply date filters
    if (propertyReportsFilters.dateFrom) {
      const fromDate = new Date(propertyReportsFilters.dateFrom);
      filtered = filtered.filter(report =>
        new Date(report.createdAt) >= fromDate
      );
    }

    if (propertyReportsFilters.dateTo) {
      const toDate = new Date(propertyReportsFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include entire day
      filtered = filtered.filter(report =>
        new Date(report.createdAt) <= toDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (propertyReportsFilters.sortBy) {
        case 'reporter':
          aValue = a.reporter || '';
          bValue = b.reporter || '';
          break;
        case 'property':
          aValue = a.propertyName || '';
          bValue = b.propertyName || '';
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (propertyReportsFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPropertyReports(filtered);
  }, [propertyReports, propertyReportsFilters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading all listings...</p>
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
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-2 md:px-8">
        <div className="max-w-6xl w-full mx-auto px-2 sm:px-4 md:px-8 py-8 overflow-x-hidden">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-700 drop-shadow">All Listings (Admin)</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => {
                    setShowPropertyReportsModal(true);
                    fetchPropertyReports();
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition shadow text-sm sm:text-base"
                  title="View Property Reports"
                >
                  <FaFlag />
                  <span className="hidden sm:inline">Reports</span>
                </button>
                <Link
                  to="/admin/create-listing"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-1 sm:gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <FaPlus /> <span>Create New Listing</span>
                </Link>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input type="text" value={filters.searchTerm} onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="Search by name/address/city/state" />
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
              <input type="number" min="0" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="Min Price" />
              <input type="number" min="0" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="Max Price" />
              <input type="text" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="City" />
              <input type="text" value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })} className="border rounded px-3 py-2 text-sm" placeholder="State" />
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏠</div>
                <h4 className="text-xl font-semibold text-gray-600 mb-2">No listings yet</h4>
                <p className="text-gray-500 mb-6">Start by creating your first property listing</p>
                <Link
                  to="/admin/create-listing"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold inline-flex items-center gap-1 sm:gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <FaPlus /> <span>Create Your First Listing</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {listings.map((listing) => (
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

                        {/* Offer Badge */}
                        {listing.offer && getDiscountPercentage(listing) > 0 && (
                          <div className="absolute top-2 left-2 z-20">
                            <span
                              className="bg-yellow-400 text-gray-900 text-xs font-semibold px-2 py-1 rounded-full shadow-md animate-pulse"
                              title="Limited-time offer!"
                            >
                              {getDiscountPercentage(listing)}% OFF
                            </span>
                          </div>
                        )}

                        <div className="absolute top-2 right-2">
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
                            true
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
                            {listing.offer && getDiscountPercentage(listing) > 0 ? (
                              <div className="flex items-center gap-2">
                                <span>{formatPrice(listing.discountPrice)}</span>
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(listing.regularPrice)}
                                </span>
                              </div>
                            ) : (
                              <span>
                                {formatPrice(listing.regularPrice)}
                                {listing.type === 'rent' && <span className="text-sm text-gray-500">/month</span>}
                              </span>
                            )}
                          </div>
                          {listing.offer && getDiscountPercentage(listing) > 0 && (
                            <span className="text-sm text-green-600 font-medium">
                              Save {formatPrice(listing.regularPrice - listing.discountPrice)}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link
                            to={`/admin/listing/${listing._id}`}
                            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600 transition flex items-center justify-center gap-1"
                          >
                            <FaEye /> View
                          </Link>
                          <Link
                            to={`/admin/update-listing/${listing._id}`}
                            className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-yellow-600 transition flex items-center justify-center gap-1"
                          >
                            <FaEdit /> Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(listing._id)}
                            className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-600 transition flex items-center justify-center gap-1"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {fetching && (
                  <div className="flex justify-center mt-4 text-sm text-gray-500">Updating results…</div>
                )}
                {showMoreListing && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleShowMore}
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

      {/* Property Reports Modal */}
      {showPropertyReportsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <h2 className="text-xl sm:text-2xl font-bold text-red-700 flex items-center gap-2">
                <FaFlag />
                Property Reports
              </h2>
              <button
                onClick={() => setShowPropertyReportsModal(false)}
                className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-2 sm:p-4 lg:p-6 border-b border-gray-200 bg-gray-50">
              {/* Mobile: Collapsible filters, Desktop: Always visible */}
              <div className="space-y-3">
                {/* Primary filters - always visible but compact on mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={propertyReportsFilters.dateFrom}
                      onChange={(e) => setPropertyReportsFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="w-full p-1.5 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={propertyReportsFilters.dateTo}
                      onChange={(e) => setPropertyReportsFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className="w-full p-1.5 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reporter</label>
                    <input
                      type="text"
                      placeholder="Reporter"
                      value={propertyReportsFilters.reporter}
                      onChange={(e) => setPropertyReportsFilters(prev => ({ ...prev, reporter: e.target.value }))}
                      className="w-full p-1.5 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={propertyReportsFilters.search}
                      onChange={(e) => setPropertyReportsFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full p-1.5 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Secondary controls - compact on mobile */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center justify-between">
                  <div className="flex gap-2">
                    <select
                      value={propertyReportsFilters.sortBy}
                      onChange={(e) => setPropertyReportsFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                      className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="date">Date</option>
                      <option value="reporter">Reporter</option>
                      <option value="property">Property</option>
                      <option value="category">Category</option>
                    </select>
                    <select
                      value={propertyReportsFilters.sortOrder}
                      onChange={(e) => setPropertyReportsFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                      className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="desc">↓</option>
                      <option value="asc">↑</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPropertyReportsFilters({
                          dateFrom: '',
                          dateTo: '',
                          reporter: '',
                          search: '',
                          sortBy: 'date',
                          sortOrder: 'desc'
                        });
                      }}
                      className="px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={fetchPropertyReports}
                      disabled={propertyReportsLoading}
                      className="px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2"
                    >
                      {propertyReportsLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                          <span className="hidden sm:inline">Loading...</span>
                        </>
                      ) : (
                        <>
                          <FaSync className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Refresh</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 min-h-0">
              {/* Debug info */}
              <div className="mb-2 sm:mb-4 p-1.5 sm:p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                <div className="hidden sm:block">
                  Debug: Loading={propertyReportsLoading.toString()}, Error={propertyReportsError}, Total Reports={propertyReports.length}, Filtered={filteredPropertyReports.length}
                </div>
                <div className="sm:hidden">
                  L:{propertyReportsLoading.toString()} | T:{propertyReports.length} | F:{filteredPropertyReports.length}
                </div>
              </div>
              {propertyReportsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="ml-2 text-gray-600">Loading property reports...</span>
                </div>
              ) : propertyReportsError ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-2">{propertyReportsError}</div>
                  <button
                    onClick={fetchPropertyReports}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredPropertyReports.length === 0 ? (
                <div className="text-center py-8">
                  <FaFlag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {propertyReports.length === 0 ? 'No property reports found' : 'No reports match your filters'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {propertyReports.length === 0 ? 'Reports will appear here when users report properties' : 'Try adjusting your search criteria'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Showing {filteredPropertyReports.length} of {propertyReports.length} report{propertyReports.length !== 1 ? 's' : ''}
                  </div>
                  {filteredPropertyReports.map((report, index) => (
                    <div key={report.notificationId || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <FaFlag className="mr-1" />
                              Property Report
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(report.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium text-gray-700">Property: </span>
                              <span className="text-gray-900">{report.propertyName}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium text-gray-700">Reporter: </span>
                                <span className="text-gray-900">{report.reporter || report.reporterUsername || 'Unknown'}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Email: </span>
                                <span className="text-gray-900">{report.reporterEmail || 'Not available'}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium text-gray-700">Phone: </span>
                                <span className="text-gray-900">{report.reporterPhone || 'Not available'}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Role: </span>
                                <span className="text-gray-900 capitalize">{report.reporterRole || 'Not available'}</span>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Category: </span>
                              <span className="text-gray-900">{report.category}</span>
                            </div>
                            {report.details && (
                              <div>
                                <span className="font-medium text-gray-700">Details: </span>
                                <span className="text-gray-900">{report.details}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {report.listingId && (
                            <a
                              href={`/admin/listing/${report.listingId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition text-center"
                            >
                              View Property
                            </a>
                          )}
                          <a
                            href={report.reporterEmail ? `mailto:${report.reporterEmail}` : '#'}
                            className={`px-3 py-1 text-sm rounded-md transition text-center ${report.reporterEmail
                              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            onClick={!report.reporterEmail ? (e) => e.preventDefault() : undefined}
                          >
                            Email Reporter
                          </a>
                          <a
                            href={report.reporterPhone ? `tel:${report.reporterPhone}` : '#'}
                            className={`px-3 py-1 text-sm rounded-md transition text-center ${report.reporterPhone
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            onClick={!report.reporterPhone ? (e) => e.preventDefault() : undefined}
                          >
                            Call Reporter
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
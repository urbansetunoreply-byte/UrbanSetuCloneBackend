import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaStar, FaUser, FaHome, FaSpinner, FaSearch, FaTimes, FaCheckCircle, FaClock } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';
import RatingForm from '../components/ratings/RatingForm';
import RatingDisplay from '../components/ratings/RatingDisplay';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function RentalRatings() {
  usePageTitle("Rental Ratings - UrbanSetu");

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  const [ratings, setRatings] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingRole, setRatingRole] = useState(null); // 'tenant' or 'landlord'
  const [showRatingDisplay, setShowRatingDisplay] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [filters, setFilters] = useState({
    role: 'all', // 'all', 'tenant', 'landlord'
    search: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }
    // Only fetch on initial load or user change, not on filter changes
    if (ratings.length === 0) {
      fetchRatings();
    }
    fetchContracts();
  }, [currentUser]);

  // Handle URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const contractIdParam = searchParams.get('contractId');
    const roleParam = searchParams.get('role');

    if (contractIdParam && roleParam) {
      const contract = contracts.find(c => 
        (c._id === contractIdParam) || (c.contractId === contractIdParam)
      );
      
      if (contract) {
        handleSubmitRating(contract, roleParam);
        navigate('/user/rental-ratings', { replace: true });
      }
    }
  }, [location.search, contracts]);

  const fetchRatings = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      // Fetch all ratings, apply filters client-side
      const res = await fetch(`${API_BASE_URL}/api/rental/ratings`, {
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRatings(data.ratings || []);
      } else {
        toast.error(data.message || 'Failed to fetch ratings');
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast.error('Failed to load ratings');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rental/contracts?status=active,expired`, {
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const handleSubmitRating = (contract, role) => {
    setSelectedContract(contract);
    setRatingRole(role);
    setShowRatingForm(true);
  };

  const handleViewRating = async (contract) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rental/ratings/${contract._id}`, {
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.rating) {
          setSelectedRating(data.rating);
          setSelectedContract(contract);
          setShowRatingDisplay(true);
        } else {
          toast.info('No rating found for this contract');
        }
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
      toast.error('Failed to fetch rating');
    }
  };

  const handleRatingSubmitted = () => {
    setShowRatingForm(false);
    setSelectedContract(null);
    setRatingRole(null);
    fetchRatings();
    toast.success('Rating submitted successfully');
  };

  const handleRatingUpdated = () => {
    fetchRatings();
    if (selectedContract) {
      handleViewRating(selectedContract);
    }
  };

  const filteredRatings = ratings.filter(rating => {
    // Filter by role
    if (filters.role !== 'all') {
      if (filters.role === 'tenant' && !rating.tenantToLandlordRating?.overallRating) {
        return false;
      }
      if (filters.role === 'landlord' && !rating.landlordToTenantRating?.overallRating) {
        return false;
      }
    }
    
    // Filter by search
    const matchesSearch = filters.search === '' || 
      rating.contractId?.contractId?.toLowerCase().includes(filters.search.toLowerCase()) ||
      rating.contractId?.listingId?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      rating.contractId?.listingId?.address?.toLowerCase().includes(filters.search.toLowerCase()) ||
      rating.tenantId?.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
      rating.tenantId?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      rating.landlordId?.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
      rating.landlordId?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      rating.ratingId?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  const getStarRating = (rating) => {
    if (!rating || rating === 0) return 0;
    return rating;
  };

  const renderStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={i < fullStars ? 'text-yellow-400 fill-current' : i === fullStars && hasHalfStar ? 'text-yellow-400 fill-current opacity-50' : 'text-gray-300'}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaStar className="text-yellow-600" />
                Rental Ratings
              </h1>
              <p className="text-gray-600 mt-2">Rate your rental experience and view ratings</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search ratings..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="tenant">As Tenant</option>
              <option value="landlord">As Landlord</option>
            </select>
          </div>
        </div>

        {/* Contracts Available for Rating */}
        {contracts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaHome /> Available for Rating
            </h2>
            <div className="space-y-3">
              {contracts
                .filter(contract => {
                  // Find if rating exists
                  const existingRating = ratings.find(r => 
                    r.contractId?._id?.toString() === contract._id || 
                    r.contractId?.toString() === contract._id
                  );
                  
                  if (!existingRating) return true;
                  
                  // Check if user can still rate
                  const isTenant = contract.tenantId?._id === currentUser._id || contract.tenantId === currentUser._id;
                  const isLandlord = contract.landlordId?._id === currentUser._id || contract.landlordId === currentUser._id;
                  
                  if (isTenant && !existingRating.tenantToLandlordRating?.overallRating) return true;
                  if (isLandlord && !existingRating.landlordToTenantRating?.overallRating) return true;
                  
                  return false;
                })
                .slice(0, 5)
                .map(contract => {
                  const existingRating = ratings.find(r => 
                    r.contractId?._id?.toString() === contract._id || 
                    r.contractId?.toString() === contract._id
                  );
                  
                  const isTenant = contract.tenantId?._id === currentUser._id || contract.tenantId === currentUser._id;
                  const isLandlord = contract.landlordId?._id === currentUser._id || contract.landlordId === currentUser._id;
                  
                  const canRateAsTenant = isTenant && !existingRating?.tenantToLandlordRating?.overallRating;
                  const canRateAsLandlord = isLandlord && !existingRating?.landlordToTenantRating?.overallRating;

                  return (
                    <div key={contract._id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{contract.listingId?.name || 'Property'}</h3>
                        <p className="text-sm text-gray-600">Contract ID: {contract.contractId}</p>
                        <p className="text-sm text-gray-600">Rent: ₹{contract.lockedRentAmount?.toLocaleString()}/month</p>
                      </div>
                      <div className="flex gap-2">
                        {canRateAsTenant && (
                          <button
                            onClick={() => handleSubmitRating(contract, 'tenant')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Rate Landlord
                          </button>
                        )}
                        {canRateAsLandlord && (
                          <button
                            onClick={() => handleSubmitRating(contract, 'landlord')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Rate Tenant
                          </button>
                        )}
                        {existingRating && (
                          <button
                            onClick={() => handleViewRating(contract)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                          >
                            View Rating
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Ratings List */}
        {filteredRatings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaStar className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Ratings Found</h3>
            <p className="text-gray-500 mb-6">
              {filters.role !== 'all' || filters.search !== ''
                ? 'Try adjusting your filters'
                : 'You don\'t have any ratings yet'}
            </p>
            {contracts.length > 0 && (
              <button
                onClick={() => setFilters({ role: 'all', search: '' })}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Available Ratings
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRatings.map((rating) => {
              const tenantRating = rating.tenantToLandlordRating;
              const landlordRating = rating.landlordToTenantRating;
              const contract = rating.contractId;

              return (
                <div
                  key={rating._id}
                  className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {contract?.listingId?.name || 'Property'}
                        </h3>
                        {rating.bothRated && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1">
                            <FaCheckCircle /> Complete
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-mono mb-3">
                        {contract?.contractId || rating.ratingId}
                      </p>

                      {/* Tenant to Landlord Rating */}
                      {tenantRating?.overallRating && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FaUser className="text-blue-600" />
                            <span className="font-semibold text-blue-800">Tenant rated Landlord</span>
                            {tenantRating.ratedAt && (
                              <span className="text-xs text-gray-500">
                                ({new Date(tenantRating.ratedAt).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                          {renderStarRating(tenantRating.overallRating)}
                          {tenantRating.comment && (
                            <p className="text-sm text-gray-700 mt-2">{tenantRating.comment}</p>
                          )}
                        </div>
                      )}

                      {/* Landlord to Tenant Rating */}
                      {landlordRating?.overallRating && (
                        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FaUser className="text-green-600" />
                            <span className="font-semibold text-green-800">Landlord rated Tenant</span>
                            {landlordRating.ratedAt && (
                              <span className="text-xs text-gray-500">
                                ({new Date(landlordRating.ratedAt).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                          {renderStarRating(landlordRating.overallRating)}
                          {landlordRating.comment && (
                            <p className="text-sm text-gray-700 mt-2">{landlordRating.comment}</p>
                          )}
                        </div>
                      )}

                      {/* Pending Rating */}
                      {!tenantRating?.overallRating && (
                        <div className="mb-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <span className="text-sm text-yellow-700 flex items-center gap-1">
                            <FaClock /> Tenant rating pending
                          </span>
                        </div>
                      )}
                      {!landlordRating?.overallRating && (
                        <div className="mb-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <span className="text-sm text-yellow-700 flex items-center gap-1">
                            <FaClock /> Landlord rating pending
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleViewRating(rating.contractId || { _id: rating.contractId?._id || rating.contractId })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <FaStar /> View Details
                      </button>
                      <Link
                        to={`/user/rental-contracts?contractId=${rating.contractId?._id || rating.contractId}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center text-sm"
                      >
                        View Contract
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rating Form Modal */}
        {showRatingForm && selectedContract && ratingRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {ratingRole === 'tenant' ? 'Rate Landlord' : 'Rate Tenant'}
                </h2>
                <button
                  onClick={() => {
                    setShowRatingForm(false);
                    setSelectedContract(null);
                    setRatingRole(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>
              <RatingForm
                contract={selectedContract}
                role={ratingRole}
                currentUser={currentUser}
                onSuccess={handleRatingSubmitted}
                onCancel={() => {
                  setShowRatingForm(false);
                  setSelectedContract(null);
                  setRatingRole(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Rating Display Modal */}
        {showRatingDisplay && selectedRating && selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Rating Details</h2>
                <button
                  onClick={() => {
                    setShowRatingDisplay(false);
                    setSelectedRating(null);
                    setSelectedContract(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>
              <RatingDisplay
                rating={selectedRating}
                contract={selectedContract}
                currentUser={currentUser}
                onUpdate={handleRatingUpdated}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdLocationOn } from 'react-icons/md';
import { useWishlist } from '../WishlistContext';
import { FaHeart, FaTrash, FaCheckCircle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { maskAddress } from '../utils/addressMasking';
import { toast } from 'react-toastify';
import PrimaryButton from "./ui/PrimaryButton";
import { MapPin, Bath, BedDouble, Tag } from "lucide-react";

export default function ListingItem({ listing, onDelete, onWishToggle }) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isInWishlistState, setIsInWishlistState] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useSelector((state) => state.user);

  // Check if we're in admin context
  const isAdminContext = location.pathname.includes('/admin');

  // Check if item is in wishlist when component mounts or wishlist changes
  useEffect(() => {
    setIsInWishlistState(isInWishlist(listing._id));
  }, [isInWishlist, listing._id]);

  const handleWishList = async () => {
    if (!currentUser) {
      toast.info('Please sign in to add properties to your wishlist.');
      navigate('/sign-in');
      return;
    }
    
    if (isInWishlistState) {
      await removeFromWishlist(listing._id);
      setIsInWishlistState(false);
      if (typeof onWishToggle === 'function') onWishToggle(listing._id, false);
    } else {
      await addToWishlist(listing);
      setIsInWishlistState(true);
      if (typeof onWishToggle === 'function') onWishToggle(listing._id, true);
    }
  };

  const onHandleAppointment = () => {
    if (!currentUser) {
      toast.info('Please sign in to book appointments.');
      navigate('/sign-in');
      return;
    }
    
    const appointmentUrl = isAdminContext 
      ? `/admin/appointmentlisting?listingId=${listing._id}&listingType=${listing.type}&propertyName=${encodeURIComponent(listing.name)}&propertyDescription=${encodeURIComponent(listing.description)}`
      : `/user/appointment?listingId=${listing._id}&listingType=${listing.type}&propertyName=${encodeURIComponent(listing.name)}&propertyDescription=${encodeURIComponent(listing.description)}`;
    navigate(appointmentUrl);
  };

  const formatINR = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (listing.offer && listing.regularPrice && listing.discountPrice) {
      return Math.round(((listing.regularPrice - listing.discountPrice) / listing.regularPrice) * 100);
    }
    return 0;
  };

  // Determine the correct link based on context
  let listingLink = `/listing/${listing._id}`;
  if (isAdminContext) {
    listingLink = `/admin/listing/${listing._id}`;
  } else if (location.pathname.startsWith('/user')) {
    listingLink = `/user/listing/${listing._id}`;
  }

  return (
    <div className="group relative bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-100 shadow-2xl transition-transform duration-200 hover:-translate-y-0.5">
      {/* Offer Badge */}
      {listing.offer && getDiscountPercentage() > 0 && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20">
          <span className="inline-flex items-center gap-1 bg-yellow-400 text-gray-900 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full shadow-md">
            <Tag className="w-3 h-3" /> {getDiscountPercentage()}% OFF
          </span>
        </div>
      )}

      {/* Top-right action: admin shows Delete (if available), users show Wishlist */}
      {isAdminContext ? (
        onDelete ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(listing._id); }}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 p-2 rounded-full transition z-20 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white"
            title="Delete property"
          >
            <FaTrash className="text-base sm:text-lg" />
          </button>
        ) : null
      ) : (
        <button
          onClick={handleWishList}
          className={`absolute top-2 sm:top-4 right-2 sm:right-4 p-2 rounded-full transition z-20 ${
            isInWishlistState ? 'bg-red-500 text-white' : 'bg-gray-200 text-red-500'
          }`}
          title={isInWishlistState ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <FaHeart className="text-base sm:text-lg" />
        </button>
      )}


      <Link to={listingLink}>
        <div className="relative">
          {listing.imageUrls && listing.imageUrls.length > 0 ? (
            <div className="aspect-[16/10] w-full overflow-hidden">
              <img
                src={listing.imageUrls[0]}
                alt="home"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                  e.target.className = "h-full w-full object-cover opacity-50";
                }}
              />
            </div>
          ) : (
            <div className="aspect-[16/10] w-full bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🏠</div>
                <p className="text-sm">No Image</p>
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <p className="text-gray-700 font-semibold text-base sm:text-lg truncate">
                {listing.name}
              </p>
              {listing.isVerified && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap">
                  <FaCheckCircle className="text-[10px]" /> Verified
                </span>
              )}
            </div>
            {/* Remove Button - only show in watchlist context (hide for admins to avoid duplicate) */}
            {onDelete && !isAdminContext && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(listing._id);
                }}
                className="ml-2 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1 text-xs"
                title="Remove from watchlist"
              >
                <FaTrash className="text-xs" />
                <span className="hidden sm:inline">Remove</span>
              </button>
            )}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4 text-red-500" />
            <p className="truncate">
              {maskAddress(
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
          </div>
          <p className="text-gray-600 text-xs sm:text-sm mt-2 truncate">{listing.description}</p>
          <div className="mt-2">
            {listing.offer && getDiscountPercentage() > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-base sm:text-lg font-bold text-blue-500">
                    {formatINR(listing.discountPrice)}
                    {listing.type === 'rent' && ' / month'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 line-through">
                    {formatINR(listing.regularPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                    Save ₹{(listing.regularPrice - listing.discountPrice).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs sm:text-sm text-green-600 font-semibold">
                    ({getDiscountPercentage()}% off)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-base sm:text-lg font-bold text-blue-500">
                {formatINR(listing.regularPrice)}
                {listing.type === 'rent' && ' / month'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-gray-700 text-xs sm:text-sm mt-2">
            <span className="inline-flex items-center gap-1"><BedDouble className="w-4 h-4" /> {listing.bedrooms} {listing.bedrooms > 1 ? 'beds' : 'bed'}</span>
            <span className="inline-flex items-center gap-1"><Bath className="w-4 h-4" /> {listing.bathrooms} {listing.bathrooms > 1 ? 'baths' : 'bath'}</span>
          </div>
          
          {/* Property Features - Special Offer + Type badge */}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {listing.offer && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                Special Offer
              </span>
            )}
            {listing.type && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  listing.type === 'rent' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'
                }`}
              >
                {listing.type === 'rent' ? 'Rent' : 'Sale'}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-2 sm:mt-4">
        {currentUser && currentUser._id === listing.userRef ? (
          <div className="w-full text-red-500 font-semibold text-center py-2 sm:py-3 rounded-lg bg-red-50 border border-red-200">
            You cannot book an appointment for your own property.
          </div>
        ) : (
          <PrimaryButton variant="blue" type="button" onClick={onHandleAppointment} className="!py-2 sm:!py-3">
            📅 Book Appointment
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

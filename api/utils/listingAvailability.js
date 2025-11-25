import Listing from "../models/listing.model.js";

export const UNAVAILABLE_STATUSES = ['reserved', 'under_contract', 'rented', 'sold', 'suspended'];

const DEFAULT_LOCK_DESCRIPTIONS = {
  booking_pending: 'This property already has an active booking in progress. Please check back after the current deal is resolved.',
  awaiting_payment: 'We are waiting for the current buyer to finish payment for this property.',
  contract_in_progress: 'A rent-lock contract is currently being prepared for this property.',
  active_rental: 'This property is protected by an active rent-lock contract.',
  sale_in_progress: 'A sale transaction for this property is already underway.',
  admin_hold: 'This property is temporarily on hold while our team reviews the current deal.',
  sold: 'This property is no longer available.',
  reserved: 'This property is reserved for another customer at the moment.',
  under_contract: 'This property is under contract and temporarily unavailable.',
  rented: 'This property is currently rented.',
  default: 'This property is temporarily unavailable. Please check back later.'
};

const getDefaultDescription = (status, reason) => {
  if (reason && DEFAULT_LOCK_DESCRIPTIONS[reason]) {
    return DEFAULT_LOCK_DESCRIPTIONS[reason];
  }
  if (status && DEFAULT_LOCK_DESCRIPTIONS[status]) {
    return DEFAULT_LOCK_DESCRIPTIONS[status];
  }
  return DEFAULT_LOCK_DESCRIPTIONS.default;
};

export const isListingUnavailable = (listing) => {
  if (!listing) return false;
  return UNAVAILABLE_STATUSES.includes(listing.availabilityStatus);
};

export const getAvailabilityGuardMessage = (listing) => {
  if (!listing) return DEFAULT_LOCK_DESCRIPTIONS.default;
  return listing.availabilityMeta?.lockDescription ||
    getDefaultDescription(listing.availabilityStatus, listing.availabilityMeta?.lockReason);
};

export const lockListingForBooking = async ({
  listingId,
  bookingId,
  lockReason = 'booking_pending',
  lockDescription
}) => {
  if (!listingId || !bookingId) return null;
  const description = lockDescription || getDefaultDescription('reserved', lockReason);
  try {
    return await Listing.findByIdAndUpdate(
      listingId,
      {
        availabilityStatus: 'reserved',
        'availabilityMeta.lockReason': lockReason,
        'availabilityMeta.lockDescription': description,
        'availabilityMeta.lockedAt': new Date(),
        'availabilityMeta.bookingId': bookingId,
        'availabilityMeta.contractId': null,
        'availabilityMeta.releasedAt': null,
        'availabilityMeta.releaseReason': null
      },
      { new: true }
    ).exec();
  } catch (error) {
    console.error('Failed to lock listing for booking:', error);
    throw error;
  }
};

export const markListingUnderContract = async ({
  listingId,
  bookingId,
  contractId,
  lockReason = 'contract_in_progress',
  lockDescription
}) => {
  if (!listingId || !bookingId || !contractId) return null;
  const description = lockDescription || getDefaultDescription('under_contract', lockReason);
  try {
    return await Listing.findByIdAndUpdate(
      listingId,
      {
        availabilityStatus: 'under_contract',
        'availabilityMeta.lockReason': lockReason,
        'availabilityMeta.lockDescription': description,
        'availabilityMeta.lockedAt': new Date(),
        'availabilityMeta.bookingId': bookingId,
        'availabilityMeta.contractId': contractId,
        'availabilityMeta.releasedAt': null,
        'availabilityMeta.releaseReason': null
      },
      { new: true }
    ).exec();
  } catch (error) {
    console.error('Failed to mark listing under contract:', error);
    throw error;
  }
};

export const markListingAsRented = async ({
  listingId,
  contractId,
  bookingId = null,
  lockReason = 'active_rental',
  lockDescription
}) => {
  if (!listingId || !contractId) return null;
  const description = lockDescription || getDefaultDescription('rented', lockReason);
  try {
    return await Listing.findByIdAndUpdate(
      listingId,
      {
        availabilityStatus: 'rented',
        'availabilityMeta.lockReason': lockReason,
        'availabilityMeta.lockDescription': description,
        'availabilityMeta.lockedAt': new Date(),
        'availabilityMeta.bookingId': bookingId,
        'availabilityMeta.contractId': contractId,
        'availabilityMeta.releasedAt': null,
        'availabilityMeta.releaseReason': null
      },
      { new: true }
    ).exec();
  } catch (error) {
    console.error('Failed to mark listing as rented:', error);
    throw error;
  }
};

export const releaseListingLock = async ({
  listingId,
  bookingId = null,
  contractId = null,
  releaseReason = 'deal_released',
  force = false
}) => {
  if (!listingId) return null;

  try {
    const listing = await Listing.findById(listingId)
      .select('availabilityStatus availabilityMeta')
      .lean();
    if (!listing) return null;

    const status = listing.availabilityStatus || 'available';
    const meta = listing.availabilityMeta || {};
    const bookingMatches = bookingId && meta.bookingId && meta.bookingId.toString() === bookingId.toString();
    const contractMatches = contractId && meta.contractId && meta.contractId.toString() === contractId.toString();

    const canRelease =
      force ||
      (status === 'reserved' && bookingMatches) ||
      (status === 'under_contract' && (bookingMatches || contractMatches)) ||
      (status === 'rented' && contractMatches);

    if (!canRelease) {
      return listing;
    }

    return await Listing.findByIdAndUpdate(
      listingId,
      {
        availabilityStatus: 'available',
        'availabilityMeta.lockReason': null,
        'availabilityMeta.lockDescription': null,
        'availabilityMeta.bookingId': null,
        'availabilityMeta.contractId': null,
        'availabilityMeta.lockedAt': null,
        'availabilityMeta.releasedAt': new Date(),
        'availabilityMeta.releaseReason': releaseReason
      },
      { new: true }
    ).exec();
  } catch (error) {
    console.error('Failed to release listing lock:', error);
    throw error;
  }
};


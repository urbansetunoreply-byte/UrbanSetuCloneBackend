import { errorHandler } from "../utils/error.js";
import PropertyWatchlist from "../models/propertyWatchlist.model.js";
import Listing from "../models/listing.model.js";
import Notification from "../models/notification.model.js";

// Get user's watchlist
export const getUserWatchlist = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (req.user._id.toString() !== userId) {
      return next(errorHandler(403, 'You can only view your own watchlist'));
    }
    const items = await PropertyWatchlist.find({ userId })
      .populate('listingId')
      .sort({ createdAt: -1 });

    // Include original listing ref for removed listings and pass along effectivePriceAtAdd
    const response = items.map((doc) => {
      const obj = doc.toObject({ virtuals: false });
      return {
        ...obj,
        listingIdRaw: obj.listingId?._id || doc.listingId,
      };
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Add to watchlist
export const addToWatchlist = async (req, res, next) => {
  try {
    const { listingId } = req.body;
    const userId = req.user._id;
    const listing = await Listing.findById(listingId);
    if (!listing) return next(errorHandler(404, 'Listing not found'));
    const exists = await PropertyWatchlist.findOne({ userId, listingId });
    if (exists) return next(errorHandler(400, 'Already in watchlist'));
    const effective = (listing.offer && listing.discountPrice) ? listing.discountPrice : listing.regularPrice;
    const item = await PropertyWatchlist.create({ userId, listingId, effectivePriceAtAdd: effective ?? null });
    await item.populate('listingId');
    const obj = item.toObject();
    res.status(201).json({ success: true, item: { ...obj, listingIdRaw: obj.listingId?._id || listingId } });
  } catch (error) {
    next(error);
  }
};

// Remove from watchlist
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const userId = req.user._id;
    const deleted = await PropertyWatchlist.findOneAndDelete({ userId, listingId });
    if (!deleted) return next(errorHandler(404, 'Item not in watchlist'));
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Count watchers for a listing (admin or owner)
export const getListingWatchCount = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const count = await PropertyWatchlist.countDocuments({ listingId });
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};

// Top most-watched listings
export const getTopWatchedListings = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const agg = await PropertyWatchlist.aggregate([
      { $group: { _id: '$listingId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
    const listingIds = agg.map(a => a._id);
    const listings = await Listing.find({ _id: { $in: listingIds } });
    const listingsById = new Map(listings.map(l => [l._id.toString(), l]));
    const result = agg.map(a => ({ 
      _id: a._id,
      name: listingsById.get(a._id.toString())?.name || 'Unknown',
      city: listingsById.get(a._id.toString())?.city || 'Unknown',
      state: listingsById.get(a._id.toString())?.state || 'Unknown',
      type: listingsById.get(a._id.toString())?.type || 'Unknown',
      bedrooms: listingsById.get(a._id.toString())?.bedrooms || 0,
      watchCount: a.count 
    }))
      .filter(x => x.name !== 'Unknown');
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Check if property is in user's watchlist
export const checkWatchlistStatus = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const userId = req.user._id;
    const exists = await PropertyWatchlist.findOne({ userId, listingId });
    res.status(200).json({ isInWatchlist: !!exists });
  } catch (error) {
    next(error);
  }
};

// Get watchlist statistics
export const getWatchlistStats = async (req, res, next) => {
  try {
    const totalWatchlists = await PropertyWatchlist.countDocuments();
    const totalWatchedProperties = await PropertyWatchlist.distinct('listingId').then(ids => ids.length);
    
    res.status(200).json({
      totalWatchlists,
      totalWatchedProperties
    });
  } catch (error) {
    next(error);
  }
};

// Notify watchers on price drop or deletion
export const notifyWatchersOnChange = async (app, { listing, changeType, oldPrice, newPrice }) => {
  try {
    const watchers = await PropertyWatchlist.find({ listingId: listing._id });
    if (!watchers.length) return;
    const io = app.get('io');
    const notifications = [];
    for (const w of watchers) {
      const data = {
        userId: w.userId,
        listingId: listing._id,
        type: changeType === 'price_drop' ? 'watchlist_price_drop' : (changeType === 'removed' ? 'watchlist_removed' : 'watchlist_update'),
        title: changeType === 'price_drop' ? 'Price Drop Alert' : (changeType === 'removed' ? 'Property Unavailable' : 'Property Updated'),
        message: changeType === 'price_drop'
          ? `Good news! "${listing.name}" price dropped from ₹${oldPrice?.toLocaleString('en-IN')} to ₹${newPrice?.toLocaleString('en-IN')}.`
          : (changeType === 'removed'
            ? `Heads up! "${listing.name}" has been sold or removed.`
            : `"${listing.name}" has new updates. Check it out!`),
      };
      const n = await Notification.create(data);
      notifications.push(n);
      if (io) io.to(w.userId.toString()).emit('notificationCreated', n);
    }
    return notifications;
  } catch (e) {
    console.error('Failed to notify watchers:', e);
    return [];
  }
};



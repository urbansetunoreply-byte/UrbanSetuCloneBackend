import mongoose from 'mongoose';

const propertyWatchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  // Effective price at the moment user added to watchlist
  // (discountPrice if offer is true and available, otherwise regularPrice)
  effectivePriceAtAdd: {
    type: Number,
    default: null
  }
}, { timestamps: true });

// Ensure uniqueness per user per listing
propertyWatchlistSchema.index({ userId: 1, listingId: 1 }, { unique: true });

const PropertyWatchlist = mongoose.model('PropertyWatchlist', propertyWatchlistSchema);

export default PropertyWatchlist;



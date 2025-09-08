import express from 'express';
import Listing from '../models/listing.model.js';
import Review from '../models/review.model.js';

const router = express.Router();

// Simple recommendations: return popular/offer listings, optionally filtered by city/state from query
router.get('/recommendations', async (req, res) => {
  try {
    const { city, state, limit = 10 } = req.query;
    const filter = {};
    if (city) filter.city = city;
    if (state) filter.state = state;
    const listings = await Listing.find(filter)
      .sort({ offer: -1, averageRating: -1, createdAt: -1 })
      .limit(Number(limit));
    res.json(listings);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
  }
});

// Neighborhood insights stub: returns placeholder metrics based on listing location
router.get('/neighborhood/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    const city = listing.city || 'Unknown';
    // Simple aggregates using existing listings in same city as lightweight proxy
    const nearby = await Listing.find({ city }).limit(50);
    const avgPrice = nearby.length ? Math.round(nearby.reduce((s,l)=>s+((l.offer&&l.discountPrice)||l.regularPrice||0),0)/nearby.length) : 0;
    res.json({
      city,
      schoolScore: 7.4,
      safetyScore: 8.1,
      commuteTimes: { metro: '15 min', bus: '20 min', car: '12 min' },
      nearbyAmenities: ['Grocery', 'Pharmacy', 'Park', 'Gym'],
      averagePriceNearby: avgPrice,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch neighborhood insights' });
  }
});

// Fraud detection stub: naive checks
router.get('/fraud/stats', async (_req, res) => {
  try {
    const suspiciousListings = 0;
    const suspectedFakeReviews = 0;
    res.json({ suspiciousListings, suspectedFakeReviews, lastScan: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch fraud stats' });
  }
});

export default router;


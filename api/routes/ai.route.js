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

// Fraud detection heuristic: flag listings with extreme price outliers or duplicate images, and repetitive reviews
router.get('/fraud/stats', async (_req, res) => {
  try {
    const listings = await Listing.find({}).limit(2000);
    const prices = listings.map(l => (l.offer && l.discountPrice) ? l.discountPrice : l.regularPrice).filter(Boolean);
    const mean = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : 0;
    const variance = prices.length ? prices.reduce((a,b)=>a+Math.pow(b-mean,2),0)/prices.length : 0;
    const std = Math.sqrt(variance);
    const upper = mean + 3*std;
    const lower = Math.max(0, mean - 3*std);

    // Duplicate image heuristic
    const imageHash = new Map();
    let duplicateImageCount = 0;
    listings.forEach(l => {
      (l.imageUrls||[]).forEach(u => {
        if (!u) return;
        const key = u.split('?')[0];
        imageHash.set(key, (imageHash.get(key)||0)+1);
      });
    });
    duplicateImageCount = Array.from(imageHash.values()).filter(v => v>3).length;

    const suspiciousListings = listings.filter(l => {
      const p = (l.offer && l.discountPrice) ? l.discountPrice : l.regularPrice;
      if (!p) return false;
      const outlier = p > upper || p < lower;
      const fewImages = !l.imageUrls || l.imageUrls.length === 0;
      return outlier || fewImages;
    }).length + duplicateImageCount;

    // Simple repetitive review text heuristic
    const recentReviews = await Review.find({}).sort({ createdAt: -1 }).limit(1000);
    const textMap = new Map();
    recentReviews.forEach(r => {
      const t = (r.comment||'').trim().toLowerCase();
      if (!t) return;
      textMap.set(t, (textMap.get(t)||0)+1);
    });
    const suspectedFakeReviews = Array.from(textMap.values()).filter(v => v>=3).length;

    res.json({ suspiciousListings, suspectedFakeReviews, lastScan: new Date().toISOString(), bounds: { mean, std, lower, upper } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch fraud stats' });
  }
});

export default router;


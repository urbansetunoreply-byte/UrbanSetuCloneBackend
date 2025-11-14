import express from 'express';
import crypto from 'crypto';
import Listing from '../models/listing.model.js';
import PropertyView from '../models/propertyView.model.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// POST /api/properties/:id/view
// Count one view per user (or anonId) per window (6h). Skip admins and owners.
router.post('/:id/view', async (req, res) => {
  try {
    const { id: propertyId } = req.params;

    const listing = await Listing.findById(propertyId).select('userRef viewCount');
    if (!listing) return res.status(404).json({ success: false, message: 'Property not found' });

    // Identify viewer
    const isAuthenticated = !!req.user; // may be undefined
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role;

    // Skip admins and property owners
    if (userRole === 'admin' || userRole === 'rootadmin' || (userId && String(listing.userRef) === String(userId))) {
      return res.status(204).end();
    }

    // Build viewerId (user or guest)
    let viewerId = null;
    if (userId) {
      viewerId = `u:${userId}`;
    } else {
      const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || '').toString().split(',')[0].trim();
      const ua = (req.headers['user-agent'] || '').toString();
      const hash = crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex');
      viewerId = `g:${hash}`;
    }

    const windowMs = 6 * 60 * 60 * 1000; // 6 hours
    const since = new Date(Date.now() - windowMs);

    const existing = await PropertyView.findOne({
      propertyId,
      viewerId,
      createdAt: { $gte: since }
    }).lean();

    if (!existing) {
      // Create view record and increment counter
      await PropertyView.create({ propertyId, viewerId });
      await Listing.findByIdAndUpdate(propertyId, { $inc: { viewCount: 1 } }).lean();
    }

    // Lightweight response
    return res.status(204).end();
  } catch (err) {
    console.error('Error counting property view:', err);
    return res.status(500).json({ success: false });
  }
});

export default router;



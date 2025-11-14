import express from 'express';
import { 
    getUserWishlist, 
    addToWishlist, 
    removeFromWishlist, 
    checkWishlistStatus,
    getWishlistCount,
    getPropertyWishlistCount
} from '../controllers/wishlist.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// Get wishlist count for a specific property (public route - no auth required)
router.get('/property-count/:listingId', getPropertyWishlistCount);

// All other routes require authentication
router.use(verifyToken);

// Get user's wishlist
router.get('/user/:userId', getUserWishlist);

// Add item to wishlist
router.post('/add', addToWishlist);

// Remove item from wishlist
router.delete('/remove/:listingId', removeFromWishlist);

// Check if item is in wishlist
router.get('/check/:listingId', checkWishlistStatus);

// Get wishlist count
router.get('/count', getWishlistCount);

export default router; 
import express from 'express';
import { 
    getUserImageFavorites, 
    addImageToFavorites, 
    removeImageFromFavorites, 
    checkImageFavoriteStatus,
    getImageFavoritesCount,
    getFavoritesByListing,
    bulkAddToFavorites,
    bulkRemoveFromFavorites
} from '../controllers/imageFavorite.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get user's image favorites
router.get('/user/:userId', getUserImageFavorites);

// Add image to favorites
router.post('/add', addImageToFavorites);

// Remove image from favorites
router.delete('/remove/:imageId', removeImageFromFavorites);

// Check if image is in favorites
router.get('/check/:imageId', checkImageFavoriteStatus);

// Get favorites count
router.get('/count', getImageFavoritesCount);

// Get favorites by listing
router.get('/listing/:listingId', getFavoritesByListing);

// Bulk operations
router.post('/bulk/add', bulkAddToFavorites);
router.post('/bulk/remove', bulkRemoveFromFavorites);

export default router;
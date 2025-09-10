import express from 'express';
import { verifyToken } from '../utils/verify.js';
import {
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getListingWatchCount,
  getTopWatchedListings,
  getWatchlistStats,
  checkWatchlistStatus
} from '../controllers/propertyWatchlist.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/user/:userId', getUserWatchlist);
router.post('/add', addToWatchlist);
router.delete('/remove/:listingId', removeFromWatchlist);
router.get('/count/:listingId', getListingWatchCount);
router.get('/check/:listingId', checkWatchlistStatus);
router.get('/top', getTopWatchedListings);
router.get('/stats', getWatchlistStats);

export default router;

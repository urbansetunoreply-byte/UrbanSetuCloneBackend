import express from 'express';
import { verifyToken } from '../utils/verify.js';
import {
    getESGAnalytics,
    getESGPerformanceByCategory,
    getESGTrends,
    updateESGScore
} from '../controllers/esgAnalytics.controller.js';

const router = express.Router();

// All routes require authentication (admin access)
router.use(verifyToken);

// Get ESG Analytics Dashboard Data
router.get('/esg', getESGAnalytics);

// Get ESG Performance by Category
router.get('/esg/category/:category', getESGPerformanceByCategory);

// Get ESG Trends Over Time
router.get('/esg/trends', getESGTrends);

// Update ESG Score for a Property
router.put('/esg/update/:listingId', updateESGScore);

export default router;

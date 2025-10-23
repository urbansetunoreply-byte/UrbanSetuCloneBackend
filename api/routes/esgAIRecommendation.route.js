import express from 'express';
import { verifyToken } from '../utils/verify.js';
import {
    testESGAuth,
    getESGRecommendations,
    getUserESGPreferences,
    getESGAnalytics,
    getESGPropertyInsights,
    getESGComparison
} from '../controllers/esgAIRecommendation.controller.js';

const router = express.Router();

// Test endpoint for debugging authentication
router.get('/test-auth', verifyToken, testESGAuth);

// ESG-Aware AI Recommendations (requires authentication)
router.get('/recommendations', verifyToken, getESGRecommendations);

// User ESG Preferences (requires authentication)
router.get('/preferences', verifyToken, getUserESGPreferences);

// ESG Analytics Dashboard (requires authentication)
router.get('/analytics', verifyToken, getESGAnalytics);

// ESG Property Insights (requires authentication)
router.get('/property/:propertyId/insights', verifyToken, getESGPropertyInsights);

// ESG Property Comparison (requires authentication)
router.post('/compare', verifyToken, getESGComparison);

export default router;

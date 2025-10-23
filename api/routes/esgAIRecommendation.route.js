import express from 'express';
import { verifyToken } from '../utils/verify.js';
import {
    getESGRecommendations,
    getUserESGPreferences,
    getESGAnalytics,
    getESGPropertyInsights,
    getESGComparison
} from '../controllers/esgAIRecommendation.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ESG-Aware AI Recommendations
router.get('/recommendations', getESGRecommendations);

// User ESG Preferences
router.get('/preferences', getUserESGPreferences);

// ESG Analytics Dashboard
router.get('/analytics', getESGAnalytics);

// ESG Property Insights
router.get('/property/:propertyId/insights', getESGPropertyInsights);

// ESG Property Comparison
router.post('/compare', getESGComparison);

export default router;

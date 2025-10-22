import express from 'express';
import { 
    getAdvancedRecommendations,
    getUserProfileAnalysis,
    getModelPerformance,
    getAIInsights
} from '../controllers/advancedAIRecommendation.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// Advanced AI Recommendation Routes
router.get('/recommendations', verifyToken, getAdvancedRecommendations); // GET /api/advanced-ai/recommendations?limit=10&model=ensemble
router.get('/profile-analysis', verifyToken, getUserProfileAnalysis); // GET /api/advanced-ai/profile-analysis
router.get('/model-performance', verifyToken, getModelPerformance); // GET /api/advanced-ai/model-performance
router.get('/insights', verifyToken, getAIInsights); // GET /api/advanced-ai/insights

export default router;

import express from 'express';
import { 
    getRecommendations, 
    getSimilar, 
    getTrending, 
    getHomepage,
    getRecommendationInsights 
} from '../controllers/aiRecommendation.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// AI Recommendation Routes
router.get('/recommendations', verifyToken, getRecommendations); // GET /api/ai/recommendations?limit=10&type=personalized
router.get('/similar/:propertyId', getSimilar); // GET /api/ai/similar/64f7b7c02b5107d563697d70?limit=6
router.get('/trending', getTrending); // GET /api/ai/trending?limit=10
router.get('/homepage', verifyToken, getHomepage); // GET /api/ai/homepage?limit=8
router.get('/insights', verifyToken, getRecommendationInsights); // GET /api/ai/insights

export default router;

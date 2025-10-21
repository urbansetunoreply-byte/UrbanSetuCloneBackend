import express from 'express';
import { 
    getFAQs, 
    getFAQ, 
    createFAQ, 
    updateFAQ, 
    deleteFAQ, 
    rateFAQ, 
    getFAQCategories,
    checkUserFAQReaction,
    reactToFAQ
} from '../controllers/faq.controller.js';
import { verifyToken } from '../utils/verify.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// Public routes (with optional authentication for admin features)
router.get('/', optionalAuth, getFAQs); // GET /api/faqs?propertyId=123&isGlobal=true&category=General
router.get('/categories', getFAQCategories); // GET /api/faqs/categories
router.get('/:id', getFAQ); // GET /api/faqs/:id
router.post('/:id/rate', rateFAQ); // POST /api/faqs/:id/rate

// Protected routes (require authentication)
router.get('/:id/reaction-status', verifyToken, checkUserFAQReaction); // GET /api/faqs/:id/reaction-status
router.post('/:id/react', verifyToken, reactToFAQ); // POST /api/faqs/:id/react

// Admin routes (protected)
router.post('/', verifyToken, createFAQ); // POST /api/faqs
router.put('/:id', verifyToken, updateFAQ); // PUT /api/faqs/:id
router.delete('/:id', verifyToken, deleteFAQ); // DELETE /api/faqs/:id

export default router;

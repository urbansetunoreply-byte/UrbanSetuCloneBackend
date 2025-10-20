import express from 'express';
import { 
    getFAQs, 
    getFAQ, 
    createFAQ, 
    updateFAQ, 
    deleteFAQ, 
    rateFAQ, 
    getFAQCategories 
} from '../controllers/faq.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// Public routes
router.get('/', getFAQs); // GET /api/faqs?propertyId=123&isGlobal=true&category=General
router.get('/categories', getFAQCategories); // GET /api/faqs/categories
router.get('/:id', getFAQ); // GET /api/faqs/:id
router.post('/:id/rate', rateFAQ); // POST /api/faqs/:id/rate

// Admin routes (protected)
router.post('/', verifyToken, createFAQ); // POST /api/faqs
router.put('/:id', verifyToken, updateFAQ); // PUT /api/faqs/:id
router.delete('/:id', verifyToken, deleteFAQ); // DELETE /api/faqs/:id

export default router;

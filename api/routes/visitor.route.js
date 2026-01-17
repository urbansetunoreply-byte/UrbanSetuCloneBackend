import express from 'express';
import {
  trackVisitor,
  getDailyVisitorCount,
  getVisitorStats,
  getAllVisitors,
  clearOldVisitorLogs,
  getClientErrors
} from '../controllers/visitor.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// Public routes
router.post('/track', trackVisitor); // Track visitor when accepting cookies
router.get('/count/daily', getDailyVisitorCount); // Get today's visitor count

// Admin routes (require authentication)
router.get('/stats', verifyToken, getVisitorStats); // Get visitor statistics
router.get('/all', verifyToken, getAllVisitors); // Get all visitors with filters
router.get('/client-errors', verifyToken, getClientErrors); // Get all client errors
router.delete('/cleanup', verifyToken, clearOldVisitorLogs); // Clear old visitor logs

export default router;

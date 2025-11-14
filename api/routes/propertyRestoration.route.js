import express from 'express';
import { 
  verifyRestorationToken, 
  restoreProperty, 
  getDeletedProperties, 
  cleanupExpiredRestorations,
  testRestorationSystem
} from '../controllers/propertyRestoration.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/verify/:token', verifyRestorationToken);
router.post('/restore/:token', restoreProperty);
router.get('/test', testRestorationSystem);

// Admin routes (authentication required)
router.get('/admin/deleted-properties', verifyToken, getDeletedProperties);
router.delete('/admin/cleanup-expired', verifyToken, cleanupExpiredRestorations);

export default router;

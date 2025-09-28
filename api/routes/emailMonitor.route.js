import express from 'express';
import { 
  getEmailHealth, 
  getEmailStatistics, 
  getQueueStatus, 
  clearFailedEmailsFromQueue, 
  testEmailSending, 
  toggleEmailMonitoring,
  getEmailConfig 
} from '../controllers/emailMonitor.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'rootadmin')) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

// Apply admin check to all routes
router.use(requireAdmin);

// Get comprehensive email health status
router.get('/health', getEmailHealth);

// Get email statistics
router.get('/stats', getEmailStatistics);

// Get queue status
router.get('/queue', getQueueStatus);

// Get email configuration
router.get('/config', getEmailConfig);

// Clear failed emails from queue
router.post('/queue/clear-failed', clearFailedEmailsFromQueue);

// Test email sending
router.post('/test', testEmailSending);

// Toggle email monitoring
router.post('/monitoring/toggle', toggleEmailMonitoring);

export default router;

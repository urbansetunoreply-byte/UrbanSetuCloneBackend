import express from 'express';
import { verifyToken } from '../utils/verify.js';
import { logSecurityEvent } from '../middleware/security.js';
import { getFraudStats } from '../utils/emailValidation.js';

const router = express.Router();

// Get fraud detection statistics (admin only)
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    // Check if user is admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'rootadmin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden - Admin access required' 
      });
    }

    const stats = getFraudStats();
    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Fraud stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch fraud statistics' 
    });
  }
});

// Get recent fraud attempts (admin only)
router.get('/attempts', verifyToken, async (req, res, next) => {
  try {
    // Check if user is admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'rootadmin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden - Admin access required' 
      });
    }

    // This would typically query a database for fraud attempts
    // For now, return a placeholder
    const attempts = [];
    res.json({ 
      success: true, 
      attempts 
    });
  } catch (error) {
    console.error('Fraud attempts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch fraud attempts' 
    });
  }
});

export default router;

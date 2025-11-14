import express from 'express';
import { 
  getEmailHealth, 
  getEmailStatistics, 
  getQueueStatus, 
  clearFailedEmailsFromQueue, 
  testEmailSending, 
  toggleEmailMonitoring,
  getEmailConfig,
  testEmailConnection,
  testBrevoConnectionEndpoint
} from '../controllers/emailMonitor.controller.js';
import { testSmtpConfigurations } from '../utils/brevoService.js';
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

// Test email connection and configuration
router.post('/test-connection', testEmailConnection);

// Clear failed emails from queue
router.post('/queue/clear-failed', clearFailedEmailsFromQueue);

// Test email sending
router.post('/test', testEmailSending);

// Toggle email monitoring
router.post('/monitoring/toggle', toggleEmailMonitoring);

// Test Brevo connection
router.get('/brevo/test', testBrevoConnectionEndpoint);

// Test all SMTP configurations
router.get('/brevo/test-configs', async (req, res, next) => {
  try {
    console.log('🧪 Testing all Brevo SMTP configurations...');
    
    const testResults = await testSmtpConfigurations();
    
    res.status(200).json({
      success: true,
      data: {
        testResults,
        timestamp: new Date().toISOString(),
        message: testResults.hasWorkingConfig 
          ? `Found working configuration: Port ${testResults.workingConfig + 1}`
          : 'No working SMTP configurations found'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Test Brevo API key
router.get('/brevo/test-api-key', async (req, res, next) => {
  try {
    console.log('🔑 Testing Brevo API key...');
    
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'BREVO_API_KEY not found in environment variables'
      });
    }

    // Test API key by making a simple request to Brevo API
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': apiKey
      }
    });

    if (response.ok) {
      const accountData = await response.json();
      res.status(200).json({
        success: true,
        data: {
          apiKey: `${apiKey.substring(0, 10)}...`,
          accountInfo: {
            email: accountData.email,
            firstName: accountData.firstName,
            lastName: accountData.lastName
          },
          timestamp: new Date().toISOString()
        }
      });
    } else {
      const errorData = await response.json();
      res.status(400).json({
        success: false,
        error: `API key validation failed: ${response.status} - ${errorData.message || 'Unknown error'}`,
        details: errorData
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

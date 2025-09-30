import express from 'express';
import { triggerPriceDropAlerts, sendPriceDropAlertEndpoint } from '../services/priceDropAlertService.js';
import { sendPriceDropAlertEmail } from '../utils/emailService.js';

const router = express.Router();

// Send price drop alert for specific user and listing
router.post('/send', sendPriceDropAlertEndpoint);

// Manual trigger for price drop alerts (for testing)
router.post('/trigger-alerts', triggerPriceDropAlerts);

// Test email delivery (for debugging)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    
    const testData = {
      propertyName: 'Test Property',
      propertyDescription: 'This is a test property for email delivery verification',
      propertyImage: null,
      originalPrice: 1000000,
      currentPrice: 800000,
      dropAmount: 200000,
      dropPercentage: 20,
      propertyType: 'Apartment',
      propertyLocation: 'Test City, Test State',
      listingId: 'test123',
      watchlistDate: new Date()
    };
    
    console.log(`🧪 Testing email delivery to ${email}`);
    const result = await sendPriceDropAlertEmail(email, testData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error in test email endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Test simple email delivery (minimal test)
router.post('/test-simple-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    
    // Import email service functions
    const { sendEmailWithRetry } = await import('../utils/emailService.js');
    
    const mailOptions = {
      to: email,
      subject: 'Test Email - UrbanSetu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Test Email</h1>
          <p>This is a simple test email to verify email delivery.</p>
          <p>If you receive this email, the email system is working correctly.</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      `
    };
    
    console.log(`🧪 Testing simple email delivery to ${email}`);
    const result = await sendEmailWithRetry(mailOptions);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Simple test email sent successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send simple test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error in simple test email endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send simple test email',
      error: error.message
    });
  }
});

export default router;

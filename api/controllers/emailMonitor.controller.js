import { getEmailStats } from '../utils/emailService.js';
import { getQueueStats, clearFailedEmails } from '../utils/emailQueue.js';
import { emailMonitor } from '../utils/emailMonitor.js';
import { errorHandler } from '../utils/error.js';

// Get email system health status
export const getEmailHealth = async (req, res, next) => {
  try {
    const emailStats = getEmailStats();
    const queueStats = getQueueStats();
    const monitorStatus = emailMonitor.getStatus();

    const healthData = {
      emailStats,
      queueStats,
      monitorStatus,
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(emailStats, queueStats)
    };

    res.status(200).json({
      success: true,
      data: healthData
    });
  } catch (error) {
    next(error);
  }
};

// Get detailed email statistics
export const getEmailStats = async (req, res, next) => {
  try {
    const stats = getEmailStats();
    
    res.status(200).json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get queue status
export const getQueueStatus = async (req, res, next) => {
  try {
    const queueStats = getQueueStats();
    
    res.status(200).json({
      success: true,
      data: {
        ...queueStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Clear failed emails from queue
export const clearFailedEmails = async (req, res, next) => {
  try {
    const beforeCount = getQueueStats().failed;
    clearFailedEmails();
    const afterCount = getQueueStats().failed;
    
    res.status(200).json({
      success: true,
      message: `Cleared ${beforeCount - afterCount} failed emails from queue`,
      data: {
        beforeCount,
        afterCount,
        cleared: beforeCount - afterCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Test email sending
export const testEmailSending = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(errorHandler(400, 'Email address is required'));
    }

    // Import here to avoid circular dependency
    const { sendSignupOTPEmail } = await import('../utils/emailService.js');
    
    const testOtp = '123456'; // Test OTP
    const result = await sendSignupOTPEmail(email, testOtp);
    
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        email,
        result,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Start/Stop email monitoring
export const toggleEmailMonitoring = async (req, res, next) => {
  try {
    const { action } = req.body; // 'start' or 'stop'
    
    if (action === 'start') {
      emailMonitor.startMonitoring();
      res.status(200).json({
        success: true,
        message: 'Email monitoring started'
      });
    } else if (action === 'stop') {
      emailMonitor.stopMonitoring();
      res.status(200).json({
        success: true,
        message: 'Email monitoring stopped'
      });
    } else {
      return next(errorHandler(400, 'Invalid action. Use "start" or "stop"'));
    }
  } catch (error) {
    next(error);
  }
};

// Generate recommendations based on stats
const generateRecommendations = (emailStats, queueStats) => {
  const recommendations = [];

  // Check success rate
  if (emailStats.successRate < 80) {
    recommendations.push({
      type: 'error',
      message: 'Low email success rate detected',
      action: 'Check SMTP configuration and credentials',
      priority: 'high'
    });
  }

  // Check daily limit
  if (emailStats.sent > 400) {
    recommendations.push({
      type: 'warning',
      message: 'Approaching Gmail daily limit',
      action: 'Consider upgrading to Gmail Workspace or alternative service',
      priority: 'medium'
    });
  }

  // Check queue status
  if (queueStats.failed > 10) {
    recommendations.push({
      type: 'warning',
      message: 'High number of failed emails in queue',
      action: 'Review failed emails and check email service status',
      priority: 'medium'
    });
  }

  // Check retry rate
  if (emailStats.retries > emailStats.sent * 0.1) {
    recommendations.push({
      type: 'info',
      message: 'High retry rate detected',
      action: 'Check network connectivity and SMTP server status',
      priority: 'low'
    });
  }

  return recommendations;
};

// Get email configuration status
export const getEmailConfig = async (req, res, next) => {
  try {
    const config = {
      smtpService: 'gmail',
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPass: !!process.env.EMAIL_PASS,
      emailUser: process.env.EMAIL_USER ? 
        process.env.EMAIL_USER.replace(/(.{2}).*(@.*)/, '$1***$2') : null, // Mask email
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

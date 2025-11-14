import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { getBrevoStatus } from '../utils/brevoService.js';

/**
 * Check email service status and notify admins if all services are down
 */
export const checkEmailServiceStatus = async (app) => {
  try {
    console.log('🔍 Checking email service status...');
    
    // Check Brevo service status
    const brevoStatus = getBrevoStatus();
    const brevoWorking = brevoStatus.isInitialized && brevoStatus.isWorking;
    
    // Check Gmail service status
    const gmailWorking = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    
    // Check if any email service is working
    const anyServiceWorking = brevoWorking || gmailWorking;
    
    console.log(`📧 Email Service Status Check:`);
    console.log(`   - Brevo API: ${brevoWorking ? '✅ Working' : '❌ Failed'}`);
    console.log(`   - Gmail SMTP: ${gmailWorking ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`   - Overall Status: ${anyServiceWorking ? '✅ At least one service working' : '❌ All services failed'}`);
    
    // If all services are down, notify admins
    if (!anyServiceWorking) {
      console.log('🚨 All email services are down! Notifying admins...');
      await notifyAdminsAboutEmailServiceFailure(app);
    } else {
      console.log('✅ Email services are operational');
    }
    
    return {
      success: true,
      brevoWorking,
      gmailWorking,
      anyServiceWorking,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('❌ Error checking email service status:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Notify all admins and root admins about email service failure
 */
const notifyAdminsAboutEmailServiceFailure = async (app) => {
  try {
    // Find all active admins and root admins
    const admins = await User.find({
      status: { $ne: 'suspended' },
      $or: [
        { role: 'rootadmin' },
        { role: 'admin', adminApprovalStatus: 'approved' },
        { isDefaultAdmin: true }
      ]
    }, '_id email username role');
    
    if (admins.length === 0) {
      console.log('⚠️ No admins found to notify about email service failure');
      return;
    }
    
    console.log(`📢 Notifying ${admins.length} admins about email service failure`);
    
    // Create notification for each admin
    const notifications = admins.map(admin => ({
      userId: admin._id,
      type: 'email_service_failure',
      title: '🚨 Critical Alert: Email Services Down',
      message: `All email services have failed to initialize. This affects OTP delivery, account notifications, and automated emails. Please check email service configuration immediately.`,
      adminId: 'system',
      meta: {
        serviceType: 'email_monitoring',
        severity: 'critical',
        timestamp: new Date(),
        affectedServices: ['brevo', 'gmail'],
        actionRequired: 'Check email service configuration and credentials'
      }
    }));
    
    // Save notifications to database
    const createdNotifications = await Notification.insertMany(notifications);
    
    // Emit socket events to notify admins in real-time
    const io = app.get('io');
    if (io) {
      createdNotifications.forEach(notification => {
        io.to(notification.userId.toString()).emit('notificationCreated', notification);
        console.log(`📡 Socket notification sent to admin: ${notification.userId}`);
      });
    }
    
    console.log(`✅ Email service failure notifications sent to ${createdNotifications.length} admins`);
    
    return {
      success: true,
      notifiedAdmins: createdNotifications.length,
      adminIds: admins.map(a => a._id)
    };
    
  } catch (error) {
    console.error('❌ Error notifying admins about email service failure:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get email service monitoring statistics
 */
export const getEmailServiceMonitoringStats = async () => {
  try {
    const brevoStatus = getBrevoStatus();
    const gmailWorking = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    const anyServiceWorking = brevoStatus.isInitialized || gmailWorking;
    
    // Count recent email service failure notifications
    const recentFailures = await Notification.countDocuments({
      type: 'email_service_failure',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });
    
    return {
      success: true,
      brevoStatus: {
        isInitialized: brevoStatus.isInitialized,
        isWorking: brevoStatus.isWorking,
        lastChecked: brevoStatus.lastChecked
      },
      gmailStatus: {
        isConfigured: gmailWorking,
        hasCredentials: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
      },
      overallStatus: {
        anyServiceWorking,
        allServicesDown: !anyServiceWorking
      },
      monitoring: {
        recentFailures24h: recentFailures,
        lastCheck: new Date()
      }
    };
  } catch (error) {
    console.error('Error getting email service monitoring stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

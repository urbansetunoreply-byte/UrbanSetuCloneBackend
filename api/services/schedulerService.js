import cron from 'node-cron';
import { checkAndSendAppointmentReminders } from './appointmentReminderService.js';
import { checkAndSendOutdatedAppointmentEmails } from './outdatedAppointmentService.js';
import { autoPurgeSoftbannedAccounts } from './autoPurgeService.js';
import { sendAccountDeletionReminders } from './accountReminderService.js';
import { checkEmailServiceStatus } from './emailMonitoringService.js';
import { cleanupOldChatData } from './dataRetentionService.js';

// Schedule appointment reminders to run every day at 9:00 AM
const scheduleAppointmentReminders = () => {
  console.log('📅 Setting up appointment reminder scheduler...');
  
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running scheduled appointment reminder check...');
    try {
      const result = await checkAndSendAppointmentReminders();
      console.log('✅ Scheduled appointment reminder check completed:', result);
    } catch (error) {
      console.error('❌ Error in scheduled appointment reminder check:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  console.log('✅ Appointment reminder scheduler set up successfully');
  console.log('📋 Schedule: Every day at 9:00 AM (Asia/Kolkata timezone)');
};

// Schedule outdated appointment emails to run every day at 8:00 AM
const scheduleOutdatedAppointmentEmails = () => {
  console.log('📅 Setting up outdated appointment email scheduler...');
  
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running scheduled outdated appointment email check...');
    try {
      const result = await checkAndSendOutdatedAppointmentEmails();
      console.log('✅ Scheduled outdated appointment email check completed:', result);
    } catch (error) {
      console.error('❌ Error in scheduled outdated appointment email check:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  console.log('✅ Outdated appointment email scheduler set up successfully');
  console.log('📋 Schedule: Every day at 8:00 AM (Asia/Kolkata timezone)');
};

// Schedule automatic purging of softbanned accounts to run every day at 2:00 AM
const scheduleAutoPurge = () => {
  console.log('🗑️ Setting up automatic purging scheduler...');
  
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running scheduled automatic purging check...');
    try {
      const result = await autoPurgeSoftbannedAccounts();
      console.log('✅ Scheduled automatic purging check completed:', result);
    } catch (error) {
      console.error('❌ Error in scheduled automatic purging check:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  console.log('✅ Automatic purging scheduler set up successfully');
  console.log('📋 Schedule: Every day at 2:00 AM (Asia/Kolkata timezone)');
};

// Schedule account deletion reminders to run every day at 10:00 AM
const scheduleAccountReminders = () => {
  console.log('📧 Setting up account deletion reminder scheduler...');
  
  // Run every day at 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Running scheduled account deletion reminder check...');
    try {
      const result = await sendAccountDeletionReminders();
      console.log('✅ Scheduled account deletion reminder check completed:', result);
    } catch (error) {
      console.error('❌ Error in scheduled account deletion reminder check:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  console.log('✅ Account deletion reminder scheduler set up successfully');
  console.log('📋 Schedule: Every day at 10:00 AM (Asia/Kolkata timezone)');
};

// Schedule email service monitoring to run every 24 hours at 11:00 PM
const scheduleEmailMonitoring = (app) => {
  console.log('📧 Setting up email service monitoring scheduler...');
  
  // Run every 24 hours at 11:00 PM
  cron.schedule('0 23 * * *', async () => {
    console.log('⏰ Running scheduled email service monitoring check...');
    try {
      const result = await checkEmailServiceStatus(app);
      console.log('✅ Scheduled email service monitoring check completed:', result);
    } catch (error) {
      console.error('❌ Error in scheduled email service monitoring check:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  console.log('✅ Email service monitoring scheduler set up successfully');
  console.log('📋 Schedule: Every 24 hours at 11:00 PM (Asia/Kolkata timezone)');
};

// Schedule data retention cleanup to run every day at 3:00 AM
const scheduleDataRetentionCleanup = () => {
  console.log('🗑️ Setting up data retention cleanup scheduler...');
  
  // Run every day at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Running scheduled data retention cleanup...');
    try {
      const result = await cleanupOldChatData(30); // Default 30 days retention
      console.log('✅ Scheduled data retention cleanup completed:', result);
    } catch (error) {
      console.error('❌ Error in scheduled data retention cleanup:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  console.log('✅ Data retention cleanup scheduler set up successfully');
  console.log('📋 Schedule: Every day at 3:00 AM (Asia/Kolkata timezone)');
};

// Start the scheduler
export const startScheduler = (app) => {
  console.log('🚀 Starting scheduler service...');
  scheduleAppointmentReminders();
  scheduleOutdatedAppointmentEmails();
  scheduleAutoPurge();
  scheduleAccountReminders();
  scheduleEmailMonitoring(app);
  scheduleDataRetentionCleanup();
  console.log('✅ Scheduler service started successfully');
};

// Stop the scheduler (for graceful shutdown)
export const stopScheduler = () => {
  console.log('🛑 Stopping scheduler service...');
  cron.getTasks().forEach(task => {
    task.destroy();
  });
  console.log('✅ Scheduler service stopped');
};

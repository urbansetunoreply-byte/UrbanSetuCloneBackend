import cron from 'node-cron';
import { checkAndSendAppointmentReminders } from './appointmentReminderService.js';
import { autoPurgeSoftbannedAccounts } from './autoPurgeService.js';

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

// Start the scheduler
export const startScheduler = () => {
  console.log('🚀 Starting scheduler service...');
  scheduleAppointmentReminders();
  scheduleAutoPurge();
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

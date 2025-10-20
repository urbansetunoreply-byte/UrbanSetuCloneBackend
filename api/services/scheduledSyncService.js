import cron from 'node-cron';
import { indexAllWebsiteData, getSyncStatus, needsReindexing } from './dataSyncService.js';

/**
 * Scheduled Data Synchronization Service
 * Runs periodic checks to ensure data is up-to-date
 */

let syncJob = null;

/**
 * Start scheduled synchronization
 */
export const startScheduledSync = () => {
    console.log('🕐 Starting scheduled data synchronization...');
    
    // Run every 30 minutes
    syncJob = cron.schedule('*/30 * * * *', async () => {
        console.log('⏰ Running scheduled data sync...');
        
        try {
            const status = getSyncStatus();
            console.log('📊 Current sync status:', status);
            
            if (needsReindexing()) {
                console.log('🔄 Data needs re-indexing, starting full sync...');
                const result = await indexAllWebsiteData();
                
                if (result.success) {
                    console.log(`✅ Scheduled sync completed: ${result.totalIndexed} items indexed`);
                } else {
                    console.error('❌ Scheduled sync failed:', result.error);
                }
            } else {
                console.log('✅ Data is up-to-date, skipping sync');
            }
        } catch (error) {
            console.error('❌ Error in scheduled sync:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    
    console.log('✅ Scheduled sync started (every 30 minutes)');
};

/**
 * Stop scheduled synchronization
 */
export const stopScheduledSync = () => {
    if (syncJob) {
        syncJob.stop();
        console.log('⏹️ Scheduled sync stopped');
    }
};

/**
 * Force immediate sync
 */
export const forceSync = async () => {
    console.log('🔄 Forcing immediate data synchronization...');
    
    try {
        const result = await indexAllWebsiteData();
        
        if (result.success) {
            console.log(`✅ Force sync completed: ${result.totalIndexed} items indexed`);
            return { success: true, result };
        } else {
            console.error('❌ Force sync failed:', result.error);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('❌ Error in force sync:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get sync job status
 */
export const getSyncJobStatus = () => {
    return {
        isRunning: syncJob ? syncJob.running : false,
        nextRun: syncJob ? syncJob.nextDate() : null,
        lastRun: syncJob ? syncJob.lastDate() : null
    };
};

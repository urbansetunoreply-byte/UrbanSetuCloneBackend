import { 
    indexAllWebsiteData, 
    getSyncStatus, 
    forceSync as forceDataSync, 
    getCachedData 
} from '../services/dataSyncService.js';
import { 
    startScheduledSync, 
    stopScheduledSync, 
    forceSync as forceScheduledSync,
    getSyncJobStatus 
} from '../services/scheduledSyncService.js';

/**
 * Get current sync status
 */
export const getSyncStatusController = async (req, res) => {
    try {
        const syncStatus = getSyncStatus();
        const jobStatus = getSyncJobStatus();
        
        res.status(200).json({
            success: true,
            data: {
                ...syncStatus,
                scheduledJob: jobStatus
            }
        });
    } catch (error) {
        console.error('Error getting sync status:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting sync status',
            error: error.message
        });
    }
};

/**
 * Force immediate data synchronization
 */
export const forceSyncController = async (req, res) => {
    try {
        console.log('🔄 Admin requested force sync...');
        
        const result = await forceScheduledSync();
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Data synchronization completed successfully',
                data: result.result
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Data synchronization failed',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in force sync:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing force sync',
            error: error.message
        });
    }
};

/**
 * Get cached data statistics
 */
export const getCachedDataStats = async (req, res) => {
    try {
        const cachedData = getCachedData();
        
        res.status(200).json({
            success: true,
            data: {
                stats: cachedData.stats,
                sampleData: {
                    properties: cachedData.properties.slice(0, 3),
                    blogs: cachedData.blogs.slice(0, 3),
                    faqs: cachedData.faqs.slice(0, 3)
                }
            }
        });
    } catch (error) {
        console.error('Error getting cached data stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting cached data statistics',
            error: error.message
        });
    }
};

/**
 * Start scheduled synchronization
 */
export const startScheduledSyncController = async (req, res) => {
    try {
        startScheduledSync();
        
        res.status(200).json({
            success: true,
            message: 'Scheduled synchronization started'
        });
    } catch (error) {
        console.error('Error starting scheduled sync:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting scheduled synchronization',
            error: error.message
        });
    }
};

/**
 * Stop scheduled synchronization
 */
export const stopScheduledSyncController = async (req, res) => {
    try {
        stopScheduledSync();
        
        res.status(200).json({
            success: true,
            message: 'Scheduled synchronization stopped'
        });
    } catch (error) {
        console.error('Error stopping scheduled sync:', error);
        res.status(500).json({
            success: false,
            message: 'Error stopping scheduled synchronization',
            error: error.message
        });
    }
};

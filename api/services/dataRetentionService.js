import ChatHistory from '../models/chatHistory.model.js';
import MessageRating from '../models/messageRating.model.js';

/**
 * Clean up old chat data based on retention period
 * @param {number} retentionDays - Number of days to retain data (default: 30)
 * @returns {Object} - Cleanup results
 */
export const cleanupOldChatData = async (retentionDays = 30) => {
    try {
        console.log(`Starting data retention cleanup for ${retentionDays} days...`);
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        console.log(`Cutoff date for cleanup: ${cutoffDate.toISOString()}`);
        
        // Delete old chat sessions
        const deletedChats = await ChatHistory.deleteMany({
            createdAt: { $lt: cutoffDate }
        });
        
        // Delete old message ratings
        const deletedRatings = await MessageRating.deleteMany({
            createdAt: { $lt: cutoffDate }
        });
        
        const result = {
            deletedChats: deletedChats.deletedCount || 0,
            deletedRatings: deletedRatings.deletedCount || 0,
            cutoffDate: cutoffDate.toISOString(),
            retentionDays
        };
        
        console.log(`Data retention cleanup completed:`, result);
        
        return result;
    } catch (error) {
        console.error('Data retention cleanup failed:', error);
        throw error;
    }
};

/**
 * Get data retention statistics
 * @returns {Object} - Statistics about current data
 */
export const getDataRetentionStats = async () => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        const totalChats = await ChatHistory.countDocuments();
        const totalRatings = await MessageRating.countDocuments();
        
        const oldChats = await ChatHistory.countDocuments({
            createdAt: { $lt: thirtyDaysAgo }
        });
        
        const oldRatings = await MessageRating.countDocuments({
            createdAt: { $lt: thirtyDaysAgo }
        });
        
        const recentChats = await ChatHistory.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        
        const recentRatings = await MessageRating.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        
        return {
            total: {
                chats: totalChats,
                ratings: totalRatings
            },
            old: {
                chats: oldChats,
                ratings: oldRatings
            },
            recent: {
                chats: recentChats,
                ratings: recentRatings
            },
            cutoffDate: thirtyDaysAgo.toISOString()
        };
    } catch (error) {
        console.error('Failed to get data retention stats:', error);
        throw error;
    }
};

/**
 * Clean up data for a specific user
 * @param {string} userId - User ID to clean up data for
 * @param {number} retentionDays - Number of days to retain data
 * @returns {Object} - Cleanup results
 */
export const cleanupUserData = async (userId, retentionDays = 30) => {
    try {
        console.log(`Starting data retention cleanup for user ${userId} (${retentionDays} days)...`);
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        // Delete old chat sessions for specific user
        const deletedChats = await ChatHistory.deleteMany({
            userId,
            createdAt: { $lt: cutoffDate }
        });
        
        // Delete old message ratings for specific user
        const deletedRatings = await MessageRating.deleteMany({
            userId,
            createdAt: { $lt: cutoffDate }
        });
        
        const result = {
            userId,
            deletedChats: deletedChats.deletedCount || 0,
            deletedRatings: deletedRatings.deletedCount || 0,
            cutoffDate: cutoffDate.toISOString(),
            retentionDays
        };
        
        console.log(`User data retention cleanup completed:`, result);
        
        return result;
    } catch (error) {
        console.error('User data retention cleanup failed:', error);
        throw error;
    }
};

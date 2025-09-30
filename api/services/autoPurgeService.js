import DeletedAccount from '../models/deletedAccount.model.js';
import AuditLog from '../models/auditLog.model.js';

/**
 * Automatically purge softbanned accounts that haven't been restored within 30 days
 * This function finds accounts that were softbanned 30+ days ago and haven't been purged yet
 */
export const autoPurgeSoftbannedAccounts = async () => {
  try {
    console.log('🔄 Starting automatic purging of softbanned accounts...');
    
    // Calculate the cutoff date (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Find accounts that were softbanned 30+ days ago and haven't been purged
    const accountsToPurge = await DeletedAccount.find({
      deletedAt: { $lte: thirtyDaysAgo },
      purgedAt: null // Not already purged
    });
    
    if (accountsToPurge.length === 0) {
      console.log('✅ No accounts found for automatic purging');
      return {
        success: true,
        message: 'No accounts found for automatic purging',
        purgedCount: 0,
        accounts: []
      };
    }
    
    console.log(`📋 Found ${accountsToPurge.length} accounts eligible for automatic purging`);
    
    const purgedAccounts = [];
    const errors = [];
    
    // Process each account
    for (const account of accountsToPurge) {
      try {
        // Set purgedAt timestamp and purgedBy as 'system'
        account.purgedAt = new Date();
        account.purgedBy = 'system_auto_purge';
        
        // Save the updated account
        await account.save();
        
        // Create audit log entry
        await AuditLog.create({
          action: 'auto_purge',
          performedBy: 'system',
          targetAccount: account._id,
          targetEmail: account.email,
          details: {
            type: 'automatic_purge',
            reason: '30_day_retention_policy',
            softbannedAt: account.deletedAt,
            purgedAt: account.purgedAt,
            originalRole: account.role
          }
        });
        
        purgedAccounts.push({
          id: account._id,
          email: account.email,
          name: account.name,
          role: account.role,
          softbannedAt: account.deletedAt,
          purgedAt: account.purgedAt
        });
        
        console.log(`✅ Auto-purged account: ${account.email} (softbanned: ${account.deletedAt.toISOString()})`);
        
      } catch (error) {
        console.error(`❌ Failed to purge account ${account.email}:`, error.message);
        errors.push({
          email: account.email,
          error: error.message
        });
      }
    }
    
    const result = {
      success: true,
      message: `Automatic purging completed. ${purgedAccounts.length} accounts purged successfully`,
      purgedCount: purgedAccounts.length,
      accounts: purgedAccounts,
      errors: errors
    };
    
    console.log(`✅ Automatic purging completed: ${purgedAccounts.length} accounts purged, ${errors.length} errors`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in automatic purging process:', error);
    return {
      success: false,
      message: 'Error in automatic purging process',
      error: error.message,
      purgedCount: 0,
      accounts: []
    };
  }
};

/**
 * Get statistics about accounts eligible for purging
 */
export const getPurgeStatistics = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stats = await DeletedAccount.aggregate([
      {
        $match: {
          deletedAt: { $lte: thirtyDaysAgo },
          purgedAt: null
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          oldestSoftban: { $min: '$deletedAt' },
          newestSoftban: { $max: '$deletedAt' }
        }
      }
    ]);
    
    const totalEligible = stats.reduce((sum, stat) => sum + stat.count, 0);
    
    return {
      success: true,
      totalEligible,
      byRole: stats,
      cutoffDate: thirtyDaysAgo
    };
  } catch (error) {
    console.error('Error getting purge statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

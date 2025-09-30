import PropertyWatchlist from '../models/propertyWatchlist.model.js';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import { sendPriceDropAlertEmail } from '../utils/emailService.js';

// Send price drop alert email to user
export const sendPriceDropAlert = async (userId, listingId, priceDropDetails) => {
  try {
    console.log(`🔍 Sending price drop alert for user ${userId}, listing ${listingId}`);
    
    // Get user details
    const user = await User.findById(userId).select('email username firstName lastName').lean();
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return { success: false, error: 'User not found' };
    }
    
    // Get listing details
    const listing = await Listing.findById(listingId).lean();
    if (!listing) {
      console.error(`❌ Listing not found: ${listingId}`);
      return { success: false, error: 'Listing not found' };
    }
    
    // Get watchlist entry to get the date when property was added
    const watchlistEntry = await PropertyWatchlist.findOne({
      userId: userId,
      listingId: listingId
    }).lean();
    
    if (!watchlistEntry) {
      console.error(`❌ Watchlist entry not found for user ${userId}, listing ${listingId}`);
      return { success: false, error: 'Watchlist entry not found' };
    }
    
    // Prepare email data
    const emailData = {
      propertyName: listing.name || 'Property',
      propertyDescription: listing.description || 'No description available',
      propertyImage: listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[0] : null,
      originalPrice: priceDropDetails.originalPrice,
      currentPrice: priceDropDetails.currentPrice,
      dropAmount: priceDropDetails.dropAmount,
      dropPercentage: priceDropDetails.dropPercentage,
      propertyType: listing.type || 'Property',
      propertyLocation: `${listing.city || ''}, ${listing.state || ''}`.trim() || 'Location not specified',
      listingId: listingId,
      watchlistDate: watchlistEntry.addedAt || watchlistEntry.createdAt || new Date()
    };
    
    console.log(`📧 Sending price drop email to ${user.email}`);
    
    // Send email
    const result = await sendPriceDropAlertEmail(user.email, emailData);
    
    if (result.success) {
      console.log(`✅ Price drop alert sent successfully to ${user.email}`);
      return { success: true, message: 'Price drop alert sent successfully' };
    } else {
      console.error(`❌ Failed to send price drop alert to ${user.email}:`, result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Error in sendPriceDropAlert:', error);
    return { success: false, error: error.message };
  }
};

// Check for price drops and send alerts
export const checkAndSendPriceDropAlerts = async () => {
  try {
    console.log('🔍 Checking for price drops in watchlisted properties...');
    
    // Get all watchlist entries with populated listing data
    const watchlistEntries = await PropertyWatchlist.find({})
      .populate('listingId', 'name description type city state regularPrice discountPrice offer imageUrls')
      .populate('userId', 'email username firstName lastName')
      .lean();
    
    console.log(`📋 Found ${watchlistEntries.length} watchlist entries`);
    
    if (watchlistEntries.length === 0) {
      console.log('✅ No watchlist entries found');
      return { success: true, message: 'No watchlist entries found', count: 0 };
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each watchlist entry
    for (const entry of watchlistEntries) {
      try {
        if (!entry.listingId || !entry.userId) {
          console.log(`⚠️ Skipping entry with missing data: ${entry._id}`);
          continue;
        }
        
        const listing = entry.listingId;
        const user = entry.userId;
        
        // Get effective prices
        const originalPrice = entry.effectivePriceAtAdd;
        const currentPrice = listing.offer && listing.discountPrice ? listing.discountPrice : listing.regularPrice;
        
        if (!originalPrice || !currentPrice) {
          console.log(`⚠️ Skipping entry with missing price data: ${entry._id}`);
          continue;
        }
        
        // Check if price dropped
        if (currentPrice < originalPrice) {
          const dropAmount = originalPrice - currentPrice;
          const dropPercentage = Math.round((dropAmount / originalPrice) * 100);
          
          console.log(`💰 Price drop detected for ${listing.name}: ₹${originalPrice.toLocaleString()} → ₹${currentPrice.toLocaleString()} (${dropPercentage}% drop)`);
          
          const priceDropDetails = {
            originalPrice,
            currentPrice,
            dropAmount,
            dropPercentage
          };
          
          // Send email alert
          const result = await sendPriceDropAlert(user._id, listing._id, priceDropDetails);
          
          if (result.success) {
            successCount++;
            console.log(`✅ Price drop alert sent to ${user.email}`);
          } else {
            errorCount++;
            errors.push(`User ${user.email}: ${result.error}`);
            console.error(`❌ Failed to send price drop alert to ${user.email}:`, result.error);
          }
        } else {
          console.log(`📈 No price drop for ${listing.name}: ₹${originalPrice.toLocaleString()} → ₹${currentPrice.toLocaleString()}`);
        }
        
      } catch (entryError) {
        console.error(`❌ Error processing watchlist entry ${entry._id}:`, entryError);
        errorCount++;
        errors.push(`Entry ${entry._id}: ${entryError.message}`);
      }
    }
    
    const result = {
      success: errorCount === 0,
      message: `Processed ${watchlistEntries.length} watchlist entries. ${successCount} price drop alerts sent, ${errorCount} failed.`,
      totalEntries: watchlistEntries.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    };
    
    console.log(`📊 Price drop alert summary:`, result);
    return result;
    
  } catch (error) {
    console.error('❌ Error in checkAndSendPriceDropAlerts:', error);
    return {
      success: false,
      message: 'Failed to check price drop alerts',
      error: error.message
    };
  }
};

// Send price drop alert for specific user and listing
export const sendPriceDropAlertEndpoint = async (req, res) => {
  try {
    const { userId, listingId, priceDropDetails } = req.body;
    
    if (!userId || !listingId || !priceDropDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, listingId, priceDropDetails'
      });
    }
    
    console.log(`🚀 Sending price drop alert for user ${userId}, listing ${listingId}`);
    
    const result = await sendPriceDropAlert(userId, listingId, priceDropDetails);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Price drop alert sent successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send price drop alert',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error in sendPriceDropAlertEndpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send price drop alert',
      error: error.message
    });
  }
};

// Manual trigger for price drop alerts (for testing)
export const triggerPriceDropAlerts = async (req, res) => {
  try {
    console.log('🚀 Manually triggering price drop alerts...');
    const result = await checkAndSendPriceDropAlerts();
    
    res.status(200).json({
      success: true,
      message: 'Price drop alert check completed',
      data: result
    });
  } catch (error) {
    console.error('❌ Error in triggerPriceDropAlerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger price drop alerts',
      error: error.message
    });
  }
};

import DeletedListing from '../models/deletedListing.model.js';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import crypto from 'crypto';

// Generate a secure restoration token
const generateRestorationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Verify restoration token and get deleted listing
export const verifyRestorationToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    console.log(`🔍 Verifying restoration token: ${token}`);

    if (!token) {
      return next(errorHandler(400, 'Restoration token is required'));
    }

    // Find the deleted listing by token
    const deletedListing = await DeletedListing.findOne({ 
      restorationToken: token 
    }).populate('userRef', 'email username');

    console.log(`📊 Deleted listing found:`, deletedListing ? 'Yes' : 'No');

    if (!deletedListing) {
      return next(errorHandler(404, 'Invalid restoration token'));
    }

    // Check if token is still valid
    if (!deletedListing.isTokenValid()) {
      return next(errorHandler(400, 'Restoration token has expired or has already been used'));
    }

    // Check if listing has already been restored
    if (deletedListing.isRestored) {
      return next(errorHandler(400, 'This property has already been restored'));
    }

    // Return the deleted listing data
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      deletedListing: {
        id: deletedListing._id,
        originalListingId: deletedListing.originalListingId,
        propertyName: deletedListing.listingData.name,
        propertyDescription: deletedListing.listingData.description,
        propertyAddress: deletedListing.listingData.address,
        propertyPrice: deletedListing.listingData.regularPrice || deletedListing.listingData.discountPrice,
        propertyImages: deletedListing.listingData.imageUrls || [],
        deletedAt: deletedListing.deletedAt,
        tokenExpiry: deletedListing.tokenExpiry,
        deletionType: deletedListing.deletionType,
        deletionReason: deletedListing.deletionReason,
        ownerEmail: deletedListing.userRef.email,
        ownerUsername: deletedListing.userRef.username
      }
    });

  } catch (error) {
    console.error('Error verifying restoration token:', error);
    return next(errorHandler(500, 'Failed to verify restoration token'));
  }
};

// Restore a deleted property
export const restoreProperty = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { confirmRestore } = req.body;

    if (!token) {
      return next(errorHandler(400, 'Restoration token is required'));
    }

    if (!confirmRestore) {
      return next(errorHandler(400, 'Confirmation is required to restore the property'));
    }

    // Find the deleted listing by token
    const deletedListing = await DeletedListing.findOne({ 
      restorationToken: token 
    }).populate('userRef', 'email username');

    if (!deletedListing) {
      return next(errorHandler(404, 'Invalid restoration token'));
    }

    // Check if token is still valid
    if (!deletedListing.isTokenValid()) {
      return next(errorHandler(400, 'Restoration token has expired or has already been used'));
    }

    // Check if listing has already been restored
    if (deletedListing.isRestored) {
      return next(errorHandler(400, 'This property has already been restored'));
    }

    // Check if the original listing still exists (shouldn't happen, but safety check)
    const existingListing = await Listing.findById(deletedListing.originalListingId);
    if (existingListing) {
      return next(errorHandler(400, 'A property with this ID already exists. Cannot restore.'));
    }

    // Create the restored listing
    const restoredListing = new Listing({
      ...deletedListing.listingData,
      _id: deletedListing.originalListingId, // Use the original ID
      userRef: deletedListing.userRef._id,
      createdAt: deletedListing.listingData.createdAt,
      updatedAt: new Date()
    });

    await restoredListing.save();

    // Mark the deleted listing as restored
    await deletedListing.restoreListing(deletedListing.userRef._id);

    // Create notification for the user
    try {
      const Notification = (await import('../models/notification.model.js')).default;
      const notification = new Notification({
        userId: deletedListing.userRef._id,
        type: 'property_restored',
        title: 'Property Restored Successfully',
        message: `Your property "${deletedListing.listingData.name}" has been successfully restored.`,
        listingId: restoredListing._id
      });
      
      await notification.save();
    } catch (notificationError) {
      console.error('Failed to create restoration notification:', notificationError);
      // Don't fail the restoration if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Property restored successfully',
      listing: {
        id: restoredListing._id,
        name: restoredListing.name,
        address: restoredListing.address,
        price: restoredListing.regularPrice || restoredListing.discountPrice
      }
    });

  } catch (error) {
    console.error('Error restoring property:', error);
    return next(errorHandler(500, 'Failed to restore property'));
  }
};

// Get all deleted properties for a user (admin only)
export const getDeletedProperties = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
      return next(errorHandler(403, 'Only admins can view deleted properties'));
    }

    const { page = 1, limit = 10, userId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (userId) {
      query.userRef = userId;
    }

    const deletedProperties = await DeletedListing.find(query)
      .populate('userRef', 'email username')
      .populate('deletedBy', 'email username')
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DeletedListing.countDocuments(query);

    res.status(200).json({
      success: true,
      deletedProperties,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching deleted properties:', error);
    return next(errorHandler(500, 'Failed to fetch deleted properties'));
  }
};

// Test endpoint to check if the model is working
export const testRestorationSystem = async (req, res, next) => {
  try {
    // Check if we can connect to the database and find any deleted listings
    const count = await DeletedListing.countDocuments();
    const sample = await DeletedListing.findOne().populate('userRef', 'email username');
    
    res.status(200).json({
      success: true,
      message: 'Restoration system test',
      data: {
        totalDeletedListings: count,
        sampleListing: sample ? {
          id: sample._id,
          token: sample.restorationToken,
          propertyName: sample.listingData?.name,
          userEmail: sample.userRef?.email
        } : null
      }
    });
  } catch (error) {
    console.error('Error testing restoration system:', error);
    return next(errorHandler(500, 'Failed to test restoration system'));
  }
};

// Permanently delete expired restoration records (cleanup job)
export const cleanupExpiredRestorations = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
      return next(errorHandler(403, 'Only admins can run cleanup jobs'));
    }

    const expiredDate = new Date();
    const deletedCount = await DeletedListing.deleteMany({
      tokenExpiry: { $lt: expiredDate },
      isRestored: false
    });

    res.status(200).json({
      success: true,
      message: `Cleaned up ${deletedCount.deletedCount} expired restoration records`,
      deletedCount: deletedCount.deletedCount
    });

  } catch (error) {
    console.error('Error cleaning up expired restorations:', error);
    return next(errorHandler(500, 'Failed to cleanup expired restorations'));
  }
};

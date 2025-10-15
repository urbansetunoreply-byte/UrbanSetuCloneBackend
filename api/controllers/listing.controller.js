import Listing from "../models/listing.model.js"
import Wishlist from "../models/wishlist.model.js"
import PropertyWatchlist from "../models/propertyWatchlist.model.js"
import { notifyWatchersOnChange } from "./propertyWatchlist.controller.js"
import User from "../models/user.model.js"
import Notification from "../models/notification.model.js"
import { errorHandler } from "../utils/error.js"
import { sendPropertyListingPublishedEmail, sendPropertyEditNotificationEmail, sendPropertyDeletionConfirmationEmail } from "../utils/emailService.js"
import DeletedListing from "../models/deletedListing.model.js"
import crypto from 'crypto'



export const createListing=async (req,res,next)=>{
    try{
        const { assignToEmail, ...listingData } = req.body;
        
        // Determine the user reference for the listing
        let userRef = req.user.id; // Default to current admin
        
        // If email is provided, validate and assign to that user
        if (assignToEmail && assignToEmail.trim()) {
            const targetUser = await User.findOne({ 
                email: assignToEmail.trim(),
                status: { $ne: 'suspended' }
            });
            
            if (!targetUser) {
                return res.status(400).json({
                    success: false,
                    message: "User not found with the provided email"
                });
            }
            
            userRef = targetUser._id;
        }
        
        // Create the listing with the determined user reference
        const listing = await Listing.create({
            ...listingData,
            userRef: userRef
        });
        
        // Get the user who will receive the email
        const listingOwner = await User.findById(userRef);
        
        // Prepare success message based on assignment
        let successMessage = "Property Added Successfully";
        const isAdminCreated = assignToEmail && assignToEmail.trim();
        
        if (isAdminCreated) {
            successMessage = `Listing assigned to ${assignToEmail}`;
            // Send notification to the user
            try {
                const notification = await Notification.create({
                    userId: userRef,
                    type: 'admin_created_listing',
                    title: 'Property Added by Admin',
                    message: `A new property "${listing.name}" is added on behalf of you by admin.`,
                    listingId: listing._id,
                    adminId: req.user.id
                });
                const io = req.app.get('io');
                if (io) io.to(userRef.toString()).emit('notificationCreated', notification);
            } catch (notificationError) {
                console.error('Failed to create notification:', notificationError);
            }
        } else {
            successMessage = "Listing created under admin ownership";
        }
        
        // Send property listing published email
        if (listingOwner && listingOwner.email) {
            try {
                const listingDetails = {
                    listingId: listing._id,
                    propertyName: listing.name,
                    propertyDescription: listing.description,
                    propertyAddress: listing.address,
                    propertyPrice: listing.offer ? listing.discountPrice : listing.regularPrice,
                    propertyType: listing.type,
                    bedrooms: listing.bedrooms,
                    bathrooms: listing.bathrooms,
                    area: listing.area,
                    city: listing.city,
                    state: listing.state,
                    imageUrls: listing.imageUrls,
                    createdBy: isAdminCreated ? 'admin' : 'user'
                };
                
                await sendPropertyListingPublishedEmail(listingOwner.email, listingDetails, isAdminCreated);
                console.log(`✅ Property listing published email sent to: ${listingOwner.email}`);
            } catch (emailError) {
                console.error(`❌ Failed to send property listing published email to ${listingOwner.email}:`, emailError);
                // Don't fail the listing creation if email fails
            }
        }
        
        return res.status(201).json({
            success: true,
            message: successMessage,
            listing,
            assignedTo: assignToEmail || "admin"
        });
    }
    catch(error){
        console.error(error);
        return next(errorHandler(500, "Failed to create listing"));
    }
}

export const getUserListings=async (req,res,next)=>{
    try{
        let listings;
        if (req.user.role === 'rootadmin' || req.user.isDefaultAdmin) {
            // Root admin or default admin: show all listings
            listings = await Listing.find().sort({createdAt:-1});
        } else {
            // Regular admin or user: show only their own listings
            const userIdStr = req.user.id?.toString();
            listings = await Listing.find({
                $or: [
                    { userRef: req.user.id },               // ObjectId match
                    { userRef: userIdStr }                   // legacy string match (if any)
                ]
            }).sort({createdAt:-1});
        }
        res.status(200).json(listings)
    }
    catch(error){
        console.error(error);
        next(error)
    }
}

export const deleteListing=async (req,res,next)=>{
    const listing=await Listing.findById(req.params.id)

    if (!listing){
        return next(errorHandler(404,"Listing not found"))
    }

    // Allow admin, rootadmin, or isDefaultAdmin to delete any listing, regular users can only delete their own
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'rootadmin' &&
      !req.user.isDefaultAdmin &&
      req.user.id !== listing.userRef.toString()
    ) {
      return next(errorHandler(401, 'You can only delete your own listing (unless you are admin/rootadmin)'))
    }

    // If admin is deleting someone else's property, require a reason
    const isAdminDeletingOthersProperty = (
      (req.user.role === 'admin' || req.user.role === 'rootadmin' || req.user.isDefaultAdmin) &&
      req.user.id !== listing.userRef.toString()
    );

    if (isAdminDeletingOthersProperty) {
      const { reason } = req.body;
      if (!reason || reason.trim().length === 0) {
        return next(errorHandler(400, 'Reason is required when deleting another user\'s property'));
      }
    }

    try{
        // Create notification if admin is deleting someone else's property
        let notificationMessage = "Listing deleted successfully";
        if (isAdminDeletingOthersProperty) {
          try {
            // Get the property owner's details
            const propertyOwner = await User.findById(listing.userRef);
            
            if (propertyOwner) {
              // Create notification for the property owner
              const notification = new Notification({
                userId: listing.userRef,
                type: 'property_deleted',
                title: 'Property Deleted by Admin',
                message: `Your property "${listing.name}" has been deleted by an administrator. Reason: ${req.body.reason}`,
                listingId: listing._id,
                adminId: req.user.id,
                adminNote: req.body.reason
              });
              
              await notification.save();
              
              // Update success message to include user email
              notificationMessage = `Property deleted successfully and notified to ${propertyOwner.email}`;
            }
          } catch (notificationError) {
            // Log notification error but don't fail the listing deletion
            console.error('Failed to create notification:', notificationError);
          }
        }

        // Store deleted listing for potential restoration before actual deletion
        // Only create restoration token for user deletions, not admin deletions
        let restorationToken = null;
        let tokenExpiry = null;
        let deletedListingRecord = null;
        
        if (!isAdminDeletingOthersProperty) {
          try {
            // Only create restoration token for user deletions
            restorationToken = crypto.randomBytes(32).toString('hex');
            tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            
            // Check if there's already a deletion record for this listing
            const existingDeletedRecord = await DeletedListing.findOne({
              originalListingId: listing._id
            });
            
            console.log(`🔍 Checking for existing deletion record for listing ${listing._id}:`, existingDeletedRecord ? 'Found' : 'Not found');
            
            if (existingDeletedRecord) {
              console.log(`🔄 Updating existing deletion record for listing ${listing._id}`);
              // Update existing record with new deletion info
              existingDeletedRecord.listingData = listing.toObject();
              existingDeletedRecord.deletedBy = req.user.id;
              existingDeletedRecord.deletionType = 'owner';
              existingDeletedRecord.deletionReason = null;
              existingDeletedRecord.restorationToken = restorationToken;
              existingDeletedRecord.tokenExpiry = tokenExpiry;
              existingDeletedRecord.isRestored = false;
              existingDeletedRecord.restoredAt = null;
              existingDeletedRecord.restoredBy = null;
              existingDeletedRecord.isUsed = false;
              existingDeletedRecord.deletedAt = new Date();
              
              await existingDeletedRecord.save();
              deletedListingRecord = existingDeletedRecord;
              console.log(`✅ Updated existing deletion record for listing ${listing._id}`);
            } else {
              console.log(`🆕 Creating new deletion record for listing ${listing._id}`);
              // Create new deletion record
              deletedListingRecord = new DeletedListing({
                originalListingId: listing._id,
                listingData: listing.toObject(), // Store complete listing data
                userRef: listing.userRef,
                deletedBy: req.user.id,
                deletionType: 'owner',
                deletionReason: null,
                restorationToken: restorationToken,
                tokenExpiry: tokenExpiry
              });
              
              await deletedListingRecord.save();
              console.log(`✅ Created new deletion record for listing ${listing._id}`);
            }
          } catch (deletionRecordError) {
            console.error(`❌ Error handling deletion record for listing ${listing._id}:`, deletionRecordError);
            // Don't fail the deletion if deletion record creation fails
            // The property will still be deleted, just without restoration capability
          }
        }

        // Send property deletion confirmation email
        try {
          const propertyOwner = await User.findById(listing.userRef);
          
          if (propertyOwner && propertyOwner.email) {
            const deletionDetails = {
              propertyName: listing.name,
              propertyId: listing._id,
              propertyDescription: listing.description,
              propertyAddress: listing.address,
              propertyPrice: listing.offer ? listing.discountPrice : listing.regularPrice,
              propertyImages: listing.imageUrls || [],
              deletedBy: req.user.username || req.user.email,
              deletionType: isAdminDeletingOthersProperty ? 'admin' : 'owner',
              deletionReason: isAdminDeletingOthersProperty ? req.body.reason : null,
              restorationToken: restorationToken, // Will be null for admin deletions
              tokenExpiry: tokenExpiry // Will be null for admin deletions
            };

            await sendPropertyDeletionConfirmationEmail(propertyOwner.email, deletionDetails);
            console.log(`✅ Property deletion confirmation email sent to: ${propertyOwner.email}`);
          }
        } catch (emailError) {
          console.error(`❌ Failed to send property deletion confirmation email:`, emailError);
          // Don't fail the deletion if email fails
        }

        // Delete the listing
        await Listing.findByIdAndDelete(req.params.id)
        
        // Delete all wishlist items associated with this listing
        await Wishlist.deleteMany({ listingId: req.params.id })
        // Notify watchers and cleanup watchlist entries
        try {
          await notifyWatchersOnChange(req.app, { listing, changeType: 'removed' });
        } catch (e) {
          console.error('Failed to notify watchers on removal:', e);
        }
        await PropertyWatchlist.deleteMany({ listingId: req.params.id })
        
        res.status(200).json({
          success: true,
          message: notificationMessage
        });
    }
    catch(error){
        console.error(error);
        return next(error)
    }
    
}

export const updateListing=async (req,res,next)=>{
    const listing=await Listing.findById(req.params.id)

    if (!listing){
        return next(errorHandler(404,"Listing not found"))
    }

    // Allow admin, rootadmin, or isDefaultAdmin to edit any listing, regular users can only edit their own
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'rootadmin' &&
      !req.user.isDefaultAdmin &&
      req.user.id !== listing.userRef.toString()
    ) {
      return next(errorHandler(401, 'You can only edit your own listing (unless you are admin/rootadmin)'))
    }

    try{
        // For admin updates, exclude userRef to preserve original ownership
        let updateData = req.body;
        if (req.user.role === 'admin' || req.user.role === 'rootadmin' || req.user.isDefaultAdmin) {
          // Remove userRef from update data to preserve original ownership
          const { userRef, ...dataWithoutUserRef } = req.body;
          updateData = dataWithoutUserRef;
        }
        
        // Detect price drop before update
        const oldRegular = listing.regularPrice;
        const oldDiscount = listing.discountPrice;
        const oldEffective = (listing.offer && oldDiscount) ? oldDiscount : oldRegular;

        const updateListing=await Listing.findByIdAndUpdate(req.params.id, updateData, {new:true})

        // Notify watchers if price dropped
        try {
          const newRegular = updateListing.regularPrice;
          const newDiscount = updateListing.discountPrice;
          const newEffective = (updateListing.offer && newDiscount) ? newDiscount : newRegular;
          if (oldEffective && newEffective && newEffective < oldEffective) {
            await notifyWatchersOnChange(req.app, { listing: updateListing, changeType: 'price_drop', oldPrice: oldEffective, newPrice: newEffective });
          }
        } catch (e) {
          console.error('Failed to notify watchers on price change:', e);
        }
        
        // Create notification if admin is editing someone else's property
        let notificationMessage = "Property Updated Successfully";
        const isAdminEdit = (req.user.role === 'admin' || req.user.role === 'rootadmin' || req.user.isDefaultAdmin) &&
                           req.user.id !== listing.userRef.toString();
        
        if (isAdminEdit) {
          try {
            // Get the property owner's details
            const propertyOwner = await User.findById(listing.userRef);
            
            if (propertyOwner) {
              // Create notification for the property owner
              const notification = new Notification({
                userId: listing.userRef,
                type: 'property_edited',
                title: 'Property Updated by Admin',
                message: `Your property "${listing.name}" has been updated by an administrator. Please review the changes.`,
                listingId: listing._id,
                adminId: req.user.id,
              });
              
              await notification.save();
              
              // Update success message to include user email
              notificationMessage = `Property updated successfully and notified to ${propertyOwner.email}`;
            }
          } catch (notificationError) {
            // Log notification error but don't fail the listing update
            console.error('Failed to create notification:', notificationError);
          }
        }

        // Send property edit notification email
        try {
          // Get the property owner (who should receive the email)
          const propertyOwner = await User.findById(updateListing.userRef);
          
          if (propertyOwner && propertyOwner.email) {
            // Detect changes made to the property
            const changes = [];
            
            // Check for common field changes
            if (req.body.name && req.body.name !== listing.name) {
              changes.push(`Property name updated to "${req.body.name}"`);
            }
            if (req.body.description && req.body.description !== listing.description) {
              changes.push("Property description updated");
            }
            if (req.body.address && req.body.address !== listing.address) {
              changes.push("Property address updated");
            }
            if (req.body.regularPrice && req.body.regularPrice !== listing.regularPrice) {
              changes.push(`Regular price updated to ₹${req.body.regularPrice}`);
            }
            if (req.body.discountPrice && req.body.discountPrice !== listing.discountPrice) {
              changes.push(`Discount price updated to ₹${req.body.discountPrice}`);
            }
            if (req.body.bedrooms && req.body.bedrooms !== listing.bedrooms) {
              changes.push(`Bedrooms updated to ${req.body.bedrooms}`);
            }
            if (req.body.bathrooms && req.body.bathrooms !== listing.bathrooms) {
              changes.push(`Bathrooms updated to ${req.body.bathrooms}`);
            }
            if (req.body.area && req.body.area !== listing.area) {
              changes.push(`Area updated to ${req.body.area} sq ft`);
            }
            if (req.body.type && req.body.type !== listing.type) {
              changes.push(`Property type updated to ${req.body.type}`);
            }
            if (req.body.city && req.body.city !== listing.city) {
              changes.push(`City updated to ${req.body.city}`);
            }
            if (req.body.state && req.body.state !== listing.state) {
              changes.push(`State updated to ${req.body.state}`);
            }
            if (req.body.pincode && req.body.pincode !== listing.pincode) {
              changes.push(`Pincode updated to ${req.body.pincode}`);
            }
            if (req.body.imageUrls && JSON.stringify(req.body.imageUrls) !== JSON.stringify(listing.imageUrls)) {
              changes.push("Property images updated");
            }
            
            // If no specific changes detected, add a generic message
            if (changes.length === 0) {
              changes.push("Property details have been updated");
            }

            // Prepare email details
            const editDetails = {
              propertyName: updateListing.name,
              propertyId: updateListing._id,
              propertyDescription: updateListing.description,
              propertyAddress: updateListing.address,
              propertyPrice: updateListing.offer ? updateListing.discountPrice : updateListing.regularPrice,
              propertyImages: updateListing.imageUrls || [],
              editedBy: req.user.username || req.user.email,
              editType: isAdminEdit ? 'admin' : 'user',
              changes: changes
            };

            // Send email to property owner
            await sendPropertyEditNotificationEmail(propertyOwner.email, editDetails, 'owner');
            console.log(`✅ Property edit notification email sent to: ${propertyOwner.email}`);
          }
        } catch (emailError) {
          console.error(`❌ Failed to send property edit notification email:`, emailError);
          // Don't fail the listing update if email fails
        }
        
        return res.status(200).json({
            success: true,
            message: notificationMessage,
            listing: updateListing
        })
    }
    catch(error){
        console.error(error);
        return next(errorHandler(500, "Failed to update listing"))
    }
    
}


export const getListing =async (req,res,next)=>{
    try{
        const listing=await Listing.findById(req.params.id)
        if (!listing){
            return next(errorHandler(404,"Listing not found"))
        }
        res.status(200)
        res.json(listing)
    }
    catch(error){
        console.error(error);
        next(error)
    }
}

export const getListings=async (req,res,next)=>{
    try{
        const limit=parseInt(req.query.limit)||10
        const startIndex=parseInt(req.query.startIndex)||0 
        let offer=req.query.offer 
        if (offer===undefined || offer==='false'){
            offer={$in:[false,true]}
        }

        let furnished=req.query.furnished 
        if (furnished===undefined || furnished==='false'){
            furnished={$in:[false,true]}
        }
        let parking=req.query.parking 
        if (parking===undefined || parking==='false'){
            parking={$in:[false,true]}
        }

        let type=req.query.type 
        if (type===undefined || type==='false' || type==='all'){
            type={$in:['sale','rent']}
        }
        const searchTerm=req.query.searchTerm || ''
        const sort=req.query.sort || 'createdAt' 
        const order=req.query.order || 'desc'

        // Advanced filters
        const minPrice = req.query.minPrice ? Number(req.query.minPrice) : 0;
        const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : Number.MAX_SAFE_INTEGER;
        const city = req.query.city || '';
        const state = req.query.state || '';
        const bedrooms = req.query.bedrooms ? Number(req.query.bedrooms) : null;
        const bathrooms = req.query.bathrooms ? Number(req.query.bathrooms) : null;

        // Validate sort field to prevent injection
        const allowedSortFields = ['createdAt', 'regularPrice', 'discountPrice', 'bedrooms', 'bathrooms'];
        const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
        const sortOrder = order === 'asc' ? 1 : -1;

        // Build query
        const query = {
            name:{$regex:searchTerm,$options:'i'},
            offer,
            furnished,
            parking,
            type,
            regularPrice: { $gte: minPrice, $lte: maxPrice },
        };
        if (city) query.city = { $regex: city, $options: 'i' };
        if (state) query.state = { $regex: state, $options: 'i' };
        if (bedrooms) query.bedrooms = bedrooms;
        if (bathrooms) query.bathrooms = bathrooms;

        const listings=await Listing.find(query)
            .sort({[sortField]:sortOrder})
            .limit(limit)
            .skip(startIndex)

        return res.status(200).json(listings)
    }   
    catch(error){
        console.error('Error in getListings:', error);
        return res.status(500).json([]);
    }
}

export const reassignPropertyOwner = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const { newOwnerId } = req.body;

    // Check if user is admin or rootadmin
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
      return next(errorHandler(401, 'Only admins can reassign property ownership'));
    }

    // Validate listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found'));
    }

    // Check if current owner exists and is active
    if (listing.userRef) {
      try {
        const currentOwner = await User.findById(listing.userRef);
        if (currentOwner && currentOwner.status !== 'suspended') {
          return next(errorHandler(400, 'Owner already exists and is active. Cannot reassign property ownership.'));
        }
      } catch (error) {
        // If we can't fetch the current owner, it means the account is deleted/inactive
        // This is the case where we want to allow reassignment
        console.log('Current owner account appears to be deleted/inactive, allowing reassignment');
      }
    }

    // Validate new owner exists
    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) {
      return next(errorHandler(404, 'New owner not found'));
    }

    // Check if new owner is not suspended
    if (newOwner.status === 'suspended') {
      return next(errorHandler(400, 'Cannot assign property to a suspended user'));
    }

    // Update the listing with new owner
    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      { userRef: newOwnerId },
      { new: true }
    );

    // Create notification for the new owner
    try {
      const notification = new Notification({
        userId: newOwnerId,
        type: 'property_assigned',
        title: 'Property Assigned to You',
        message: `You have been assigned as the owner of property "${listing.name}".`,
        listingId: listing._id,
        adminId: req.user.id,
      });
      
      await notification.save();
    } catch (notificationError) {
      // Log notification error but don't fail the ownership update
      console.error('Failed to create notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: `Property ownership successfully reassigned to ${newOwner.username}`,
      listing: updatedListing
    });

  } catch (error) {
    console.error('Error reassigning property owner:', error);
    return next(errorHandler(500, 'Failed to reassign property ownership'));
  }
};
import Listing from "../models/listing.model.js"
import User from "../models/user.model.js"
import { errorHandler } from "../utils/error.js"
import mongoose from "mongoose"
import DeletedAccount from '../models/deletedAccount.model.js';
import AuditLog from '../models/auditLog.model.js';
import AccountRevocation from '../models/accountRevocation.model.js';
import bcryptjs from "bcryptjs"
import crypto from 'crypto';
import { sendAccountDeletionEmail, sendDataExportEmail, sendProfileUpdateSuccessEmail } from '../utils/emailService.js';
import Review from "../models/review.model.js";
import ReviewReply from "../models/reviewReply.model.js";
import { validateEmail } from "../utils/emailValidation.js";
import { logSecurityEvent } from "../middleware/security.js";
import Wishlist from "../models/wishlist.model.js";
import PropertyWatchlist from "../models/propertyWatchlist.model.js";
import Booking from "../models/booking.model.js";
import Payment from "../models/payment.model.js";
import { awardSetuCoins } from "../utils/gamification.js";

import DataExport from "../models/dataExport.model.js";

// EXPORT_CACHE_EXPIRY remains relevant for setting the expiration Date object, 
// though Mongo TTL handles the actual deletion.
const EXPORT_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const test = (req, res) => {
    res.send("Hello Api")
}


export const updateUser = async (req, res, next) => {
    if (req.user.id !== req.params.id) {
        return next(errorHandler(401, "Unauthorized"))
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }

        // Validate password if provided (for profile updates)
        if (req.body.password) {
            const isMatch = await bcryptjs.compare(req.body.password, user.password);
            if (!isMatch) {
                return res.status(200).json({ status: "invalid_password" });
            }
            // Remove password from body since it's just for validation
            delete req.body.password;
        }

        // Validate mobile number if provided
        if (req.body.mobileNumber && !/^[0-9]{10}$/.test(req.body.mobileNumber)) {
            return res.status(200).json({ status: "mobile_invalid" });
        }
        // Check for duplicate email if changed
        if (req.body.email && req.body.email !== user.email) {
            // Validate email for fraud detection
            const ip = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');
            const emailValidation = validateEmail(req.body.email, {
                logSecurity: true,
                context: 'profile_email_update',
                ip,
                userAgent
            });

            if (!emailValidation.isValid) {
                // Log fraud attempt for security monitoring
                if (emailValidation.isFraud) {
                    logSecurityEvent('fraud_email_profile_update_attempt', {
                        email: req.body.email.toLowerCase(),
                        reason: emailValidation.reason,
                        ip,
                        userAgent,
                        userId: req.params.id
                    });
                }
                return res.status(200).json({ status: "email_invalid", message: emailValidation.message });
            }

            const existingEmail = await User.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
            if (existingEmail) {
                return res.status(200).json({ status: "email_exists" });
            }
        }
        // Check for duplicate mobile number if changed
        if (req.body.mobileNumber && req.body.mobileNumber !== user.mobileNumber) {
            const existingMobile = await User.findOne({ mobileNumber: req.body.mobileNumber, _id: { $ne: req.params.id } });
            if (existingMobile) {
                return res.status(200).json({ status: "mobile_exists" });
            }
        }

        // Build update object only with provided fields
        const updateFields = {};
        if (req.body.username) updateFields.username = req.body.username;
        if (req.body.email) updateFields.email = req.body.email;
        if ('avatar' in req.body) updateFields.avatar = req.body.avatar || null;
        if (req.body.mobileNumber) updateFields.mobileNumber = req.body.mobileNumber;
        if (req.body.address) updateFields.address = req.body.address.trim();
        if (req.body.gender) updateFields.gender = req.body.gender;
        if (req.body.profileVisibility) updateFields.profileVisibility = req.body.profileVisibility;
        // If mobile number is being updated and is different, set isGeneratedMobile to false
        if (req.body.mobileNumber && req.body.mobileNumber !== user.mobileNumber) {
            updateFields.isGeneratedMobile = false;
        }

        let coinsEarned = 0;

        // Award setuCoins if all profile details are filled for the FIRST time
        // Required fields for "completion": gender, address, mobileNumber, avatar (avatar has default so usually check if user changed/confirmed it, or just check the others)
        // Check current state before update to see if it was incomplete
        // Actually, we can just checking the NEW state from req.body + existing user data

        // We need to check the comprehensive set of fields for completion status
        const isProfileComplete =
            (req.body.gender || user.gender) &&
            (req.body.address || user.address) &&
            (req.body.mobileNumber || user.mobileNumber) &&
            // Ensure mobile is not the dummy one if that logic applies, assuming standard validation passed
            true;

        const bonusAlreadyReceived = user.gamification?.hasReceivedProfileCompletionBonus;

        if (isProfileComplete && !bonusAlreadyReceived && user.role === 'user') {
            // Award 20 coins
            await awardSetuCoins(user._id, 20, 'profile_completion', 'Profile Completion Bonus');
            updateFields['gamification.hasReceivedProfileCompletionBonus'] = true;
            coinsEarned = 20;
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, {
            $set: updateFields
        }, { new: true });
        if (!updatedUser) {
            return next(errorHandler(404, "User not found"));
        }
        // Update all reviews by this user
        await Review.updateMany(
            { userId: updatedUser._id },
            { $set: { userName: updatedUser.username, userAvatar: updatedUser.avatar } }
        );
        // Update all replies by this user
        await ReviewReply.updateMany(
            { userId: updatedUser._id },
            { $set: { userName: updatedUser.username, userAvatar: updatedUser.avatar } }
        );
        // Return a plain object with all fields except password
        const { password, ...userObj } = updatedUser._doc;
        // Emit socket event for profile update
        const io = req.app.get('io');
        if (io) {
            io.emit('profileUpdated', {
                userId: updatedUser._id.toString(),
                username: updatedUser.username,
                avatar: updatedUser.avatar,
                mobileNumber: updatedUser.mobileNumber,
                email: updatedUser.email,
                address: updatedUser.address,
                gender: updatedUser.gender
            });
        }

        // Send profile update confirmation email
        try {
            await sendProfileUpdateSuccessEmail(updatedUser.email, updatedUser.username, updatedUser.role, coinsEarned);
        } catch (emailErr) {
            console.error('Failed to send profile update email:', emailErr);
            // Non-blocking error
        }

        res.status(200).json({ status: "success", updatedUser: userObj });
    }
    catch (error) {
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            if (error.keyPattern && error.keyPattern.email) {
                return res.status(200).json({ status: "email_exists" });
            }
            if (error.keyPattern && error.keyPattern.mobileNumber) {
                return res.status(200).json({ status: "mobile_exists" });
            }
        }
        console.error("Update user error:", error);
        return res.status(500).json({ status: "error", message: "Server error" });
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return next(errorHandler(401, "Unauthorized"))
        }
        // Check if user is the default admin
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }
        if (user.isDefaultAdmin) {
            return next(errorHandler(403, "Default admin cannot be deleted directly. Please assign a new default admin first."));
        }
        // Password verification
        const { password, reason, otherReason } = req.body;
        if (!password) {
            return next(errorHandler(401, "Password is required to delete account"));
        }
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return next(errorHandler(401, "Password is incorrect"));
        }
        // Soft-delete: move to DeletedAccounts and audit log
        const resolvedReason = reason === 'other' && otherReason ? otherReason : (reason || 'self_deleted');
        const deletedRecord = await DeletedAccount.create({
            accountId: user._id,
            name: user.username,
            email: user.email,
            role: user.role,
            deletedAt: new Date(),
            deletedBy: 'self',
            reason: resolvedReason,
            originalData: {
                username: user.username,
                email: user.email,
                password: user.password,
                mobileNumber: user.mobileNumber,
                address: user.address,
                gender: user.gender,
                avatar: user.avatar,
                role: user.role,
                isDefaultAdmin: user.isDefaultAdmin,
                adminApprovalStatus: user.adminApprovalStatus,
                adminApprovalDate: user.adminApprovalDate,
                approvedBy: user.approvedBy,
                adminRequestDate: user.adminRequestDate,
                status: user.status,
                createdAt: user.createdAt
            }
        });

        // Create revocation token for account restoration
        const revocationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        await AccountRevocation.create({
            accountId: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            revocationToken,
            expiresAt,
            originalData: deletedRecord.originalData,
            reason: resolvedReason
        });

        // Generate revocation link
        const revocationLink = `${process.env.CLIENT_URL || 'https://urbansetu.vercel.app'}/restore-account/${revocationToken}`;

        // Send account deletion email with revocation link
        try {
            await sendAccountDeletionEmail(user.email, {
                username: user.username,
                role: user.role
            }, revocationLink);
            console.log(`✅ Account deletion email sent to: ${user.email}`);
        } catch (emailError) {
            console.error(`❌ Failed to send deletion email to ${user.email}:`, emailError);
            // Don't fail the deletion if email fails
        }

        await User.findByIdAndDelete(req.params.id);
        await AuditLog.create({ action: 'soft_delete', performedBy: user._id, targetAccount: deletedRecord._id, targetEmail: user.email, details: { type: 'self_delete', role: user.role } });
        res.status(200).json({ success: true, message: "User moved to DeletedAccounts" })
    }
    catch (error) {
        console.error(error);
        next(error)
    }
}

// Get all approved admins for default admin selection
export const getApprovedAdmins = async (req, res, next) => {
    try {
        const currentUserId = req.params.currentUserId;

        // Get all approved admins except the current user
        const admins = await User.find({
            role: "admin",
            adminApprovalStatus: "approved",
            _id: { $ne: currentUserId }
        }).select('-password');

        res.status(200).json(admins);
    } catch (error) {
        next(error);
    }
};

// Get all users for email autocomplete (admin only)
export const getAllUsersForAutocomplete = async (req, res, next) => {
    try {
        // Only allow admin, rootadmin, or default admin to access this
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin' && !req.user.isDefaultAdmin) {
            return next(errorHandler(403, "Only admins can access user list"));
        }

        // Get only regular users (exclude admins and rootadmins)
        const users = await User.find({
            _id: { $ne: req.user.id },
            status: { $ne: 'suspended' }, // Exclude suspended users
            role: 'user' // Only return regular users, exclude admins and rootadmins
        }).select('email username _id mobileNumber').sort({ email: 1 });

        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

// Get user by email for assignment validation
export const getUserByEmailForAssignment = async (req, res, next) => {
    try {
        const { email } = req.params;

        if (!email) {
            return next(errorHandler(400, "Email is required"));
        }

        const user = await User.findOne({
            email: email,
            status: { $ne: 'suspended' } // Exclude suspended users
        }).select('email username _id');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email"
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

// Transfer default admin rights to another admin
export const transferDefaultAdminRights = async (req, res, next) => {
    try {
        const { currentAdminId, newDefaultAdminId } = req.body;
        // Verify current user is the default admin
        const currentAdmin = await User.findById(currentAdminId);
        if (!currentAdmin || !currentAdmin.isDefaultAdmin) {
            return next(errorHandler(403, "Only the default admin can transfer default admin rights"));
        }
        // Verify new default admin exists, is approved, active, and not already default/root
        const newDefaultAdmin = await User.findById(newDefaultAdminId);
        if (!newDefaultAdmin ||
            newDefaultAdmin.role !== "admin" ||
            newDefaultAdmin.adminApprovalStatus !== "approved" ||
            newDefaultAdmin.status === 'suspended' ||
            newDefaultAdmin.isDefaultAdmin) {
            return next(errorHandler(400, "Selected user must be an approved, active admin (not default/root)."));
        }
        if (newDefaultAdmin.status === 'suspended') {
            return next(errorHandler(400, "Cannot transfer default admin rights to a suspended admin. Please remove suspension first."));
        }
        // Transfer default admin rights and swap roles
        // Current admin becomes regular admin
        await User.findByIdAndUpdate(currentAdminId, {
            isDefaultAdmin: false,
            role: 'admin'
        });

        // New admin becomes root admin (default admin)
        const updatedNewAdmin = await User.findByIdAndUpdate(newDefaultAdminId, {
            isDefaultAdmin: true,
            role: 'rootadmin'
        }, { new: true });

        res.status(200).json({
            message: "Default admin rights transferred successfully",
            newDefaultAdmin: {
                _id: updatedNewAdmin._id,
                username: updatedNewAdmin.username,
                email: updatedNewAdmin.email
            }
        });
    } catch (error) {
        next(error);
    }
};

// Delete user after default admin transfer (for default admin only)
export const deleteUserAfterTransfer = async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return next(errorHandler(401, "Unauthorized"));
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }
        // Only allow deletion if user is not default admin or if transfer was completed
        if (user.isDefaultAdmin) {
            return next(errorHandler(403, "Default admin rights must be transferred before deletion"));
        }
        // Password verification
        const { password } = req.body;
        if (!password) {
            return next(errorHandler(401, "Password is required to delete account"));
        }
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return next(errorHandler(401, "Password is incorrect"));
        }
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json("User deleted successfully");
    } catch (error) {
        next(error);
    }
};

export const getUserListings = async (req, res, next) => {

    if (req.user.id !== req.params.id) {
        return next(errorHandler(401, 'unauthorized'))
    }
    else {
        try {
            const listing = await Listing.find({ userRef: req.params.id })
            res.status(200)
            res.json(listing)
        }
        catch (error) {
            console.error(error);
            next(error)
        }
    }
}

export const getUserByEmail = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.params.email })
        if (!user) {
            return next(errorHandler(404, 'User not found'))
        }
        res.status(200).json(user)
    }
    catch (error) {
        console.error(error);
        next(error)
    }
}

export const changePassword = async (req, res, next) => {
    try {
        // Only allow user to change their own password
        if (req.user.id !== req.params.id) {
            return next(errorHandler(401, "Unauthorized"));
        }
        const { previousPassword, newPassword } = req.body;
        if (!previousPassword || !newPassword) {
            return next(errorHandler(400, "Previous and new password are required"));
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }
        const isMatch = await bcryptjs.compare(previousPassword, user.password);
        if (!isMatch) {
            return next(errorHandler(401, "Previous password is incorrect"));
        }
        user.password = bcryptjs.hashSync(newPassword, 10);
        await user.save();

        // Send password change success email
        try {
            const { sendPasswordChangeSuccessEmail } = await import("../utils/emailService.js");
            await sendPasswordChangeSuccessEmail(user.email, user.username, 'manual_change');
        } catch (emailError) {
            console.error('Failed to send password change success email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        next(error);
    }
};

// Verify password for account deletion (for default admin)
export const verifyPassword = async (req, res, next) => {
    try {
        // Only allow user to verify their own password
        if (req.user.id !== req.params.id) {
            return next(errorHandler(401, "Unauthorized"));
        }
        const { password } = req.body;
        if (!password) {
            return next(errorHandler(400, "Password is required"));
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return next(errorHandler(401, "Password is incorrect"));
        }
        res.status(200).json({ success: true, message: "Password verified successfully" });
    } catch (error) {
        next(error);
    }
};

// Check email availability for profile updates
export const checkEmailAvailability = async (req, res, next) => {
    try {
        const { email } = req.params;
        const currentUserId = req.user.id;

        if (!email) {
            return next(errorHandler(400, "Email is required"));
        }

        // Check if email exists (excluding current user)
        const existingUser = await User.findOne({
            email: email,
            _id: { $ne: currentUserId }
        });

        if (existingUser) {
            return res.status(200).json({
                available: false,
                message: "Email already exists"
            });
        }

        res.status(200).json({
            available: true,
            message: "Email available"
        });
    } catch (error) {
        next(error);
    }
};

// Check mobile number availability for profile updates
export const checkMobileAvailability = async (req, res, next) => {
    try {
        const { mobile } = req.params;
        const currentUserId = req.user.id;

        if (!mobile) {
            return next(errorHandler(400, "Mobile number is required"));
        }

        // Validate mobile number format
        if (!/^[0-9]{10}$/.test(mobile)) {
            return res.status(200).json({
                available: false,
                message: "Please provide a valid 10-digit mobile number"
            });
        }

        // Check if mobile number exists (excluding current user)
        const existingUser = await User.findOne({
            mobileNumber: mobile,
            _id: { $ne: currentUserId }
        });

        if (existingUser) {
            return res.status(200).json({
                available: false,
                message: "Mobile number already exists"
            });
        }

        res.status(200).json({
            available: true,
            message: "Mobile number available"
        });
    } catch (error) {
        next(error);
    }
};

// Export user data
export const exportData = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        if (!password) {
            return next(errorHandler(400, "Password is required"));
        }

        // Verify password
        const user = await User.findById(userId);
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return next(errorHandler(401, "Invalid password"));
        }

        // Collect all user data
        const [wishlistItems, watchlistItems, appointments, userListings, reviews, payments] = await Promise.all([
            Wishlist.find({ userId }).populate('listingId').lean(),
            PropertyWatchlist.find({ userId }).populate('listingId').lean(),
            Booking.find({ $or: [{ buyerId: userId }, { sellerId: userId }] }).populate('listingId').lean(),
            Listing.find({ userRef: userId }).lean(),
            Review.find({ userId }).populate('listingId').lean(),
            Payment.find({ userId }).lean().catch(() => [])
        ]);

        // Get counts
        const wishlistCount = wishlistItems.length;
        const watchlistCount = watchlistItems.length;
        const appointmentsCount = appointments.length;
        const listingsCount = userListings.length;
        const reviewsCount = reviews.length;
        const paymentsCount = payments.length;

        // Prepare comprehensive user data
        const userData = {
            accountInfo: {
                username: user.username,
                email: user.email,
                mobileNumber: user.mobileNumber,
                address: user.address,
                gender: user.gender,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                profilePicture: user.profilePicture
            },
            statistics: {
                wishlistCount,
                watchlistCount,
                appointmentsCount,
                listingsCount,
                reviewsCount,
                paymentsCount
            },
            wishlist: wishlistItems.map(item => ({
                listingId: item.listingId?._id || item.listingId,
                listingTitle: item.listingId?.name || 'N/A',
                addedAt: item.addedAt || item.createdAt,
                effectivePriceAtAdd: item.effectivePriceAtAdd
            })),
            watchlist: watchlistItems.map(item => ({
                listingId: item.listingId?._id || item.listingId,
                listingTitle: item.listingId?.name || 'N/A',
                addedAt: item.addedAt || item.createdAt,
                effectivePriceAtAdd: item.effectivePriceAtAdd
            })),
            appointments: appointments.map(apt => ({
                appointmentId: apt._id,
                listingId: apt.listingId?._id || apt.listingId,
                listingTitle: apt.listingId?.name || apt.propertyName || 'N/A',
                purpose: apt.purpose,
                date: apt.date,
                time: apt.time,
                status: apt.status,
                createdAt: apt.createdAt
            })),
            listings: userListings.map(listing => ({
                listingId: listing._id,
                name: listing.name,
                address: listing.address,
                regularPrice: listing.regularPrice,
                discountPrice: listing.discountPrice,
                type: listing.type,
                offer: listing.offer,
                createdAt: listing.createdAt,
                updatedAt: listing.updatedAt
            })),
            reviews: reviews.map(review => ({
                reviewId: review._id,
                listingId: review.listingId?._id || review.listingId,
                listingTitle: review.listingId?.name || 'N/A',
                starRating: review.starRating,
                comment: review.comment,
                createdAt: review.createdAt
            })),
            payments: payments.map(payment => ({
                paymentId: payment._id,
                amount: payment.amount,
                status: payment.status,
                createdAt: payment.createdAt
            })),
            exportDate: new Date().toISOString(),
            exportVersion: "1.0"
        };

        // Convert to JSON string
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBuffer = Buffer.from(dataStr, 'utf-8');

        // Generate unique token for download links
        const exportToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + EXPORT_CACHE_EXPIRY);

        // Store export data in database
        await DataExport.create({
            userId: user._id,
            token: exportToken,
            data: dataStr,
            username: user.username,
            expiresAt: expiresAt
        });

        // Generate download URLs
        const base = `${req.protocol}://${req.get('host')}`;
        const jsonDownloadUrl = `${base}/api/user/export-data/${exportToken}/json`;
        const txtDownloadUrl = `${base}/api/user/export-data/${exportToken}/txt`;

        // Send email with download links
        const emailResult = await sendDataExportEmail(user.email, user.username, jsonDownloadUrl, txtDownloadUrl);

        if (!emailResult.success) {
            // Clean up database on email failure
            await DataExport.deleteOne({ token: exportToken });
            return next(errorHandler(500, "Failed to send export email: " + emailResult.error));
        }

        res.status(200).json({
            success: true,
            message: "Your data export has been prepared and will be sent to your email shortly."
        });
    } catch (error) {
        next(error);
    }
};

// Search users by name or email (for Admin Panel)
export const searchUsers = async (req, res, next) => {
    try {
        // Strict admin check
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'Forbidden'));
        }

        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(200).json({ success: true, users: [] });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        })
            .select('username email _id avatar')
            .limit(10);

        res.status(200).json({ success: true, users });
    } catch (error) {
        next(error);
    }
};

// Download exported data
export const downloadExportData = async (req, res, next) => {
    try {
        const { token, type } = req.params;

        const record = await DataExport.findOne({ token });

        if (!record || new Date() > record.expiresAt) {
            if (record) await DataExport.deleteOne({ token });
            return res.status(404).json({ message: "Export link expired or invalid" });
        }

        const extension = type === 'json' ? 'json' : 'txt';
        const contentType = type === 'json' ? 'application/json' : 'text/plain';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="urbansetu-data-${record.username}-${Math.floor(Date.now() / 1000)}.${extension}"`);
        res.send(record.data);

    } catch (error) {
        next(error);
    }
};

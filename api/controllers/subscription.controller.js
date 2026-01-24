import Subscription from '../models/subscription.model.js';
import User from '../models/user.model.js'; // Import User model to check if email is registered
import { errorHandler } from '../utils/error.js';
import {
    sendSubscriptionReceivedEmail,
    sendSubscriptionApprovedEmail,
    sendSubscriptionRejectedEmail,
    sendSubscriptionRevokedEmail,
    sendSubscriptionOtpEmail,
    sendOptOutOtpEmail
} from '../utils/emailService.js';
import crypto from 'crypto';

export const subscribeToNewsletter = async (req, res, next) => {
    const { email, source = 'guides_page' } = req.body;

    if (!email) {
        return next(errorHandler(400, 'Email is required'));
    }

    try {
        let subscription = await Subscription.findOne({ email });
        const type = source === 'blogs_page' ? 'blog' : 'guide';

        if (subscription) {
            // Already subscribed logic refactored for granular preferences
            if (subscription.status === 'approved') {
                if (subscription.preferences && subscription.preferences[type]) {
                    return res.status(200).json({ success: true, message: `You are already subscribed to our ${type}s!` });
                } else {
                    // Approved generally, but adding new preference
                    subscription.preferences[type] = true;
                    subscription.source = source; // Update last source
                    await subscription.save();
                    return res.status(200).json({ success: true, message: `Successfully subscribed to ${type}s!` });
                }
            }

            // If pending, allow updating preference
            if (subscription.status === 'pending') {
                if (!subscription.preferences[type]) {
                    subscription.preferences[type] = true;
                    subscription.source = source;
                    await subscription.save();
                }
                return res.status(200).json({ success: true, message: 'Your subscription is already pending approval.' });
            }

            if (subscription.status === 'rejected' || subscription.status === 'opted_out' || subscription.status === 'revoked') {
                // Re-subscribe attempt
                subscription.status = 'pending';
                subscription.source = source;
                subscription.preferences = subscription.preferences || { blog: false, guide: false };
                subscription.preferences[type] = true;
                subscription.rejectionReason = null; // Clear reason
                subscription.statusUpdatedAt = new Date();
                await subscription.save();

                // Send "Received" email
                await sendSubscriptionReceivedEmail(email, source);

                return res.status(200).json({ success: true, message: 'Welcome back! Your subscription request has been received and is pending approval.' });
            }
        } else {
            // New subscription
            subscription = new Subscription({
                email,
                source,
                status: 'pending',
                preferences: {
                    blog: type === 'blog',
                    guide: type === 'guide'
                }
            });
            await subscription.save();

            // Send "Received" email
            await sendSubscriptionReceivedEmail(email, source);

            res.status(201).json({ success: true, message: 'Subscription request received! Please check your email.' });
        }
    } catch (error) {
        next(error);
    }
};

export const getAllSubscribers = async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
        return next(errorHandler(403, 'Forbidden'));
    }

    try {
        const subscribers = await Subscription.find().sort({ subscribedAt: -1 });
        res.status(200).json({ success: true, data: subscribers });
    } catch (error) {
        next(error);
    }
};

export const getMySubscriptionStatus = async (req, res, next) => {
    // Assuming authenticated user
    try {
        const email = req.user.email;
        const subscription = await Subscription.findOne({ email });

        if (!subscription) {
            return res.status(200).json({ success: true, data: { status: 'not_subscribed' } });
        }

        res.status(200).json({ success: true, data: subscription });
    } catch (error) {
        next(error);
    }
};

export const unsubscribeUser = async (req, res, next) => {
    try {
        const email = req.user.email;
        const subscription = await Subscription.findOne({ email });

        if (!subscription) {
            return next(errorHandler(404, 'Subscription not found'));
        }

        const { reason, source } = req.body;
        // Determine type based on source
        const type = source === 'blogs_page' ? 'blog' : (source === 'guides_page' ? 'guide' : null);

        if (type && subscription.preferences) {
            // Granular unsubscribe
            subscription.preferences[type] = false;

            // Check if any active subscriptions remain
            const hasActive = Object.values(subscription.preferences).some(v => v === true);

            if (!hasActive) {
                // If no active subscriptions left, fully opt-out
                subscription.status = 'opted_out';
                subscription.preferences = { blog: false, guide: false };
            } else {
                // If others remain, keep status as is
                // Just this one preference is gone.
            }
        } else {
            // Generic unsubscribe (full opt-out)
            subscription.status = 'opted_out';
            subscription.preferences = { blog: false, guide: false };
        }

        subscription.statusUpdatedAt = new Date();
        if (reason) {
            subscription.rejectionReason = reason;
        }
        await subscription.save();

        res.status(200).json({ success: true, message: 'You have successfully unsubscribed.' });
    } catch (error) {
        next(error);
    }
};

export const updateSubscriptionStatus = async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
        return next(errorHandler(403, 'Forbidden'));
    }

    const { id } = req.params;
    const { status, reason, type } = req.body; // Added 'type' to know what we are acting on (blog/guide)

    if (!['approved', 'rejected', 'revoked'].includes(status)) {
        return next(errorHandler(400, 'Invalid status update'));
    }

    try {
        const subscription = await Subscription.findById(id);
        if (!subscription) {
            return next(errorHandler(404, 'Subscription not found'));
        }

        const oldStatus = subscription.status;

        // Determine the context based on provided type or fallback to current source
        // Ideally frontend should send 'blog' or 'guide' as type
        const targetType = type || (subscription.source === 'blogs_page' ? 'blog' : 'guide');

        if (status === 'revoked') {
            // Unset the specific preference
            if (subscription.preferences) {
                subscription.preferences[targetType] = false;
            }

            // Check if any other subscription is still active/approved
            const hasOtherActive = Object.values(subscription.preferences || {}).some(val => val === true);

            if (!hasOtherActive) {
                // If nothing else is active, then we globally revoke
                subscription.status = 'revoked';
                if (reason) subscription.rejectionReason = reason;
            } else {
                // If others are active, we stay approved, just removed one permission
                // We don't change global status to revoked
                subscription.status = 'approved';
            }
        }
        else if (status === 'rejected') {
            // Similar logic for rejection: remove preference
            if (subscription.preferences) {
                subscription.preferences[targetType] = false;
            }
            const hasOtherActive = Object.values(subscription.preferences || {}).some(val => val === true);

            if (!hasOtherActive) {
                subscription.status = 'rejected';
                if (reason) subscription.rejectionReason = reason;
            } else {
                // Revert to approved if they had other active subscriptions
                subscription.status = 'approved';
            }
        }
        else {
            // Approved or other statuses apply globally or as standard flow
            subscription.status = status;
            if (reason) subscription.rejectionReason = reason;
        }

        subscription.statusUpdatedAt = new Date();
        await subscription.save();

        // Send emails based on status change
        // We need to be careful with emails now. 
        // If we "revoked" just one, we should probably send a specific "You've been unsubscribed from X" email?
        // For now, retaining original logic but ensuring it matches the action.

        if (status === 'approved' && oldStatus !== 'approved') {
            await sendSubscriptionApprovedEmail(subscription.email, subscription.source);
        } else if (status === 'rejected' && subscription.status === 'rejected') {
            // Only send rejection email if globally rejected
            await sendSubscriptionRejectedEmail(subscription.email, subscription.source, reason);
        } else if (status === 'revoked' && subscription.status === 'revoked') {
            // Only send revoked email if globally revoked
            await sendSubscriptionRevokedEmail(subscription.email, subscription.source, reason);
        }

        res.status(200).json({ success: true, data: subscription, message: `Subscription updated` });
    } catch (error) {
        next(error);
    }
};

// --------------------------------------------------------------------------
// OTP CONTROLLERS
// --------------------------------------------------------------------------

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendSubscriptionOtp = async (req, res, next) => {
    const { email, source = 'website' } = req.body;

    if (!email) {
        return next(errorHandler(400, 'Email is required'));
    }

    try {
        // IMPORTANT: Check if email exists in User database
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'This email is not registered with UrbanSetu. Please sign up first to subscribe.'
            });
        }

        let subscription = await Subscription.findOne({ email });
        const type = source === 'blogs_page' ? 'blog' : 'guide';

        if (subscription) {
            // Check if already approved for this specific type
            if (subscription.status === 'approved' && subscription.preferences && subscription.preferences[type]) {
                return res.status(200).json({ success: false, message: `You are already subscribed to ${type}s!` });
            }

            // Check if already pending for this specific type
            if (subscription.status === 'pending' && subscription.preferences && subscription.preferences[type]) {
                return res.status(200).json({ success: false, message: `Your ${type} subscription is already pending approval.` });
            }
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        if (!subscription) {
            // Create a temporary record
            subscription = new Subscription({
                email,
                source,
                status: 'verifying',
                verificationOtp: otp,
                verificationOtpExpires: otpExpires,
                preferences: {
                    blog: type === 'blog',
                    guide: type === 'guide'
                }
            });
        } else {
            // Update existing subscription
            subscription.verificationOtp = otp;
            subscription.verificationOtpExpires = otpExpires;
            subscription.source = source;
            // We don't update preferences here yet, only after verification
            // But we must ensure the temp state knows what we are verifying for?
            // Actually, verifySubscriptionOtp uses source to determine which preference to flip.
        }

        await subscription.save();
        await sendSubscriptionOtpEmail(email, otp);

        res.status(200).json({ success: true, message: 'OTP sent to your email. Please verify to complete subscription.' });
    } catch (error) {
        next(error);
    }
};

export const verifySubscriptionOtp = async (req, res, next) => {
    const { email, otp, source } = req.body;

    if (!email || !otp) {
        return next(errorHandler(400, 'Email and OTP are required'));
    }

    try {
        const subscription = await Subscription.findOne({ email }).select('+verificationOtp +verificationOtpExpires');

        if (!subscription) {
            return next(errorHandler(404, 'Subscription request not found.'));
        }

        if (subscription.verificationOtp !== otp) {
            return next(errorHandler(400, 'Invalid OTP'));
        }

        if (subscription.verificationOtpExpires < Date.now()) {
            return next(errorHandler(400, 'OTP has expired. Please request a new one.'));
        }

        const type = source === 'blogs_page' ? 'blog' : 'guide';

        // OTP Valid
        subscription.verificationOtp = undefined;
        subscription.verificationOtpExpires = undefined;

        // Ensure preference is set
        if (!subscription.preferences) subscription.preferences = {};
        subscription.preferences[type] = true;

        let message = 'Email verified! ';

        // If user was already approved, we keep them approved. 
        // We assume trust propagates. This fixes the issue where an existing 'Blog' subscriber 
        // gets blocked from Blogs because they asked for 'Guides' and went to 'Pending'.
        if (subscription.status === 'approved') {
            subscription.source = source;
            message += `You have successfully subscribed to ${type}s!`;
        } else {
            subscription.status = 'pending';
            subscription.rejectionReason = undefined;
            subscription.source = source || subscription.source;
            message += 'Your subscription request has been submitted for approval.';
        }

        subscription.statusUpdatedAt = new Date();
        await subscription.save();

        // Send 'Received' email ONLY if status changed to pending (meaning it wasn't approved already)
        if (subscription.status === 'pending') {
            await sendSubscriptionReceivedEmail(email, subscription.source);
        }

        res.status(200).json({ success: true, message });
    } catch (error) {
        next(error);
    }
};

export const sendUnsubscribeOtp = async (req, res, next) => {
    const email = req.user.email; // Authenticated user

    try {
        const subscription = await Subscription.findOne({ email });

        if (!subscription) {
            return next(errorHandler(404, 'Subscription not found'));
        }

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        subscription.verificationOtp = otp;
        subscription.verificationOtpExpires = otpExpires;
        await subscription.save();

        await sendOptOutOtpEmail(email, otp);

        res.status(200).json({ success: true, message: 'OTP sent for unsubscription verification.' });
    } catch (error) {
        next(error);
    }
};

export const verifyUnsubscribeOtp = async (req, res, next) => {
    const { otp, reason } = req.body;
    const email = req.user.email;

    try {
        const subscription = await Subscription.findOne({ email }).select('+verificationOtp +verificationOtpExpires');

        if (!subscription) {
            return next(errorHandler(404, 'Subscription not found'));
        }

        if (subscription.verificationOtp !== otp) {
            return next(errorHandler(400, 'Invalid OTP'));
        }

        if (subscription.verificationOtpExpires < Date.now()) {
            return next(errorHandler(400, 'OTP has expired'));
        }

        // Verify & Opt-out
        subscription.verificationOtp = undefined;
        subscription.verificationOtpExpires = undefined;
        subscription.status = 'opted_out';
        subscription.statusUpdatedAt = new Date();
        if (reason) {
            subscription.rejectionReason = reason;
        }
        await subscription.save();

        res.status(200).json({ success: true, message: 'You have been successfully unsubscribed.' });
    } catch (error) {
        next(error);
    }
};

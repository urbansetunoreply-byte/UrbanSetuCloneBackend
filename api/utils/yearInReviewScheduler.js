import cron from 'node-cron';
import User from '../models/user.model.js';
import { sendYearInReviewEmail } from './emailService.js';

/**
 * Initializes the Year in Review email scheduler.
 * Runs once a day to check if it's the right time of year and sends emails in batches.
 */
export const initializeYearInReviewScheduler = () => {
    // Run hourly in December
    cron.schedule('0 * * 12 *', async () => {
        const now = new Date();
        const day = now.getDate();
        const currentYear = now.getFullYear();

        // Only run between Dec 20 and Dec 31
        if (day >= 20 && day <= 31) {
            console.log(`[YearInReview] Starting hourly email batch for ${currentYear}...`);
            await sendYearInReviewBatch(currentYear);
        } else {
            // Optional: Log once a day instead of every hour to reduce noise, or remove else block
        }
    });
};

/**
 * Sends Year in Review emails to a batch of users who haven't received it yet.
 */
export const sendYearInReviewBatch = async (year, limit = 100) => {
    try {
        // Find users who haven't received the review for the specified year
        const users = await User.find({
            yearInReviewSent: { $ne: year },
            status: 'active'
        }).select('email username role yearInReviewSent').limit(limit);

        if (users.length === 0) {
            console.log(`[YearInReview] No pending users for ${year}.`);
            return;
        }

        console.log(`[YearInReview] Sending emails to ${users.length} users...`);

        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            try {
                // Pass user role to the email service
                const result = await sendYearInReviewEmail(user.email, user.username, year, user.role);
                if (result.success) {
                    // Update user to mark as sent
                    await User.findByIdAndUpdate(user._id, {
                        $addToSet: { yearInReviewSent: year }
                    });
                    successCount++;
                    // Small delay between emails to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    failCount++;
                    console.error(`[YearInReview] Failed to send to ${user.email}:`, result.error);
                }
            } catch (err) {
                failCount++;
                console.error(`[YearInReview] Error processing ${user.email}:`, err);
            }
        }

        console.log(`[YearInReview] Batch complete for ${year}. Success: ${successCount}, Failed: ${failCount}`);
    } catch (error) {
        console.error('[YearInReview] Batch processing error:', error);
    }
};

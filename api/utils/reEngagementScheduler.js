import cron from 'node-cron';
import User from '../models/user.model.js';
import { sendReEngagementEmail } from './emailService.js';

// Initialize the re-engagement scheduler
export const initializeReEngagementScheduler = () => {
    // Schedule task to run every day at 10:00 AM
    // Cron syntax: Minute Hour DayOfMonth Month DayOfWeek
    cron.schedule('0 10 * * *', async () => {
        console.log('⏰ Running daily re-engagement email check...');
        const INACTIVITY_THRESHOLD_DAYS = 30; // 30 days of inactivity
        const RE_ENGAGEMENT_COOLDOWN_DAYS = 30; // Don't spam, wait another 30 days before next email

        try {
            const thirtyDaysAgo = new Date(Date.now() - INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

            // Find users who:
            // 1. Have lastLogin older than 30 days OR (lastLogin is null AND created > 30 days ago)
            // 2. AND (lastReEngagementEmailSent is null OR lastReEngagementEmailSent < 30 days ago)
            // 3. AND are not suspended

            // Note: We limit to 50 users per run to avoid overwhelming the email service (rate limits/quotas).
            // Since this runs daily, we will eventually cover everyone.
            const inactiveUsers = await User.find({
                status: 'active',
                $or: [
                    { lastLogin: { $lt: thirtyDaysAgo } },
                    { lastLogin: null, createdAt: { $lt: thirtyDaysAgo } }
                ],
                $and: [
                    {
                        $or: [
                            { lastReEngagementEmailSent: null },
                            { lastReEngagementEmailSent: { $lt: thirtyDaysAgo } }
                        ]
                    }
                ]
            }).limit(50);

            if (inactiveUsers.length === 0) {
                console.log('No inactive users found needing re-engagement emails today.');
                return;
            }

            console.log(`Found ${inactiveUsers.length} inactive users eligible for re-engagement email.`);

            for (const user of inactiveUsers) {
                try {
                    console.log(`Sending re-engagement email to: ${user.email}`);
                    const result = await sendReEngagementEmail(user.email, user.username);

                    if (result && result.success) {
                        // Update the timestamp only if email was sent successfully
                        user.lastReEngagementEmailSent = new Date();
                        await user.save();
                        console.log(`✅ Re-engagement email sent and logged for ${user.email}`);
                    } else {
                        console.error(`❌ Failed to send re-engagement email to ${user.email}:`, result?.error);
                    }

                    // Small delay to be gentle on the email provider (1 second)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (err) {
                    console.error(`Failed to process user ${user.email}:`, err);
                }
            }

            console.log('✅ Re-engagement email job completed.');
        } catch (error) {
            console.error('❌ Error in re-engagement scheduler:', error);
        }
    });

    console.log('✅ Re-engagement scheduler initialized (running daily at 10:00 AM)');
};

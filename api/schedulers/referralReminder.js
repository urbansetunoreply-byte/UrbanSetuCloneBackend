/**
 * Referral Program Reminder Scheduler
 * 
 * Sends automated emails to all users to encourage them to refer friends
 * and earn SetuCoins.
 * 
 * Schedule: Weekly on Monday at 10:00 AM IST
 */

import cron from 'node-cron';
import User from '../models/user.model.js';
import { sendReferralReminderEmail } from '../utils/emailService.js';

/**
 * Start the referral reminder scheduler
 */
export const startReferralReminderScheduler = () => {
    // Run weekly on Monday at 10:00 AM IST (4:30 AM UTC)
    // Cron format: minute hour day month weekday
    cron.schedule('30 4 * * 1', async () => {
        console.log('💎 [Referral Reminder] Starting scheduler run...');
        console.log(`   Time: ${new Date().toISOString()}`);

        try {
            // Find all active users
            const users = await User.find({ status: 'active' }).select('email username _id role');

            console.log(`   Found ${users.length} active users`);

            if (users.length === 0) {
                console.log('   ✅ No users to send reminders to');
                return;
            }

            let emailsSent = 0;
            let emailsFailed = 0;
            const clientUrl = process.env.CLIENT_URL || 'https://urbansetu.vercel.app';

            // Process users in batches of 50 to avoid overwhelming resources
            const batchSize = 50;

            for (let i = 0; i < users.length; i += batchSize) {
                const batch = users.slice(i, i + batchSize);

                await Promise.all(batch.map(async (user) => {
                    try {
                        if (!user.email) return;

                        // Create referral link
                        const referralLink = `${clientUrl}/sign-up?ref=${user._id}`;

                        // Send email
                        await sendReferralReminderEmail(
                            user.email,
                            user.username,
                            referralLink
                        );

                        emailsSent++;
                        // Log sporadic status updates
                        if (emailsSent % 10 === 0) {
                            console.log(`   ✅ Sent referral reminder to ${user.email} (${emailsSent}/${users.length})`);
                        }
                    } catch (error) {
                        emailsFailed++;
                        console.error(`   ❌ Failed to send referral reminder to ${user.email}:`, error.message);
                    }
                }));

                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log(`\n   📊 Summary:`);
            console.log(`      - Total users: ${users.length}`);
            console.log(`      - Emails sent: ${emailsSent}`);
            console.log(`      - Emails failed: ${emailsFailed}`);
            console.log(`   ✅ Referral scheduler run completed\n`);

        } catch (error) {
            console.error('   ❌ Referral scheduler error:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    console.log('📅 Referral reminder scheduler started');
    console.log('   Schedule: Weekly on Monday at 10:00 AM IST');
};

/**
 * Manual trigger for testing
 */
export const runReferralReminderManually = async () => {
    console.log('💎 [Manual Trigger] Running referral reminder...\n');

    try {
        const users = await User.find({ status: 'active' }).select('email username _id role');
        console.log(`Found ${users.length} active users\n`);

        const clientUrl = process.env.CLIENT_URL || 'https://urbansetu.vercel.app';
        let emailsSent = 0;
        let emailsFailed = 0;

        for (const user of users) {
            try {
                if (!user.email) continue;

                const referralLink = `${clientUrl}/sign-up?ref=${user._id}`;
                console.log(`Sending to ${user.email}...`);

                await sendReferralReminderEmail(
                    user.email,
                    user.username,
                    referralLink
                );

                emailsSent++;
                console.log(`✅ Sent`);
            } catch (error) {
                emailsFailed++;
                console.error(`❌ Failed:`, error.message);
            }
        }

        console.log(`\nSummary: Sent ${emailsSent}, Failed ${emailsFailed}`);

    } catch (error) {
        console.error('Error:', error);
    }
};

export default startReferralReminderScheduler;

/**
 * Property Verification Reminder Scheduler
 * 
 * Sends automated reminder emails to property owners who haven't completed
 * verification for their listings.
 * 
 * Schedule: Runs daily at 9:00 AM IST
 * Reminder Days: 1, 3, 7, 14 days after property creation
 */

import cron from 'node-cron';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import { sendPropertyVerificationReminderEmail } from '../utils/emailService.js';

/**
 * Start the verification reminder scheduler
 */
export const startVerificationReminderScheduler = () => {
    // Run daily at 9:00 AM IST (3:30 AM UTC)
    // Cron format: minute hour day month weekday
    cron.schedule('30 3 * * *', async () => {
        console.log('🔔 [Verification Reminder] Starting scheduler run...');
        console.log(`   Time: ${new Date().toISOString()}`);

        try {
            // Find all unverified listings older than 1 day
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const unverifiedListings = await Listing.find({
                isVerified: false,
                visibility: 'private',
                createdAt: { $lt: oneDayAgo }
            }).populate('userRef', 'email username');

            console.log(`   Found ${unverifiedListings.length} unverified listings`);

            if (unverifiedListings.length === 0) {
                console.log('   ✅ No reminders to send');
                return;
            }

            let remindersSent = 0;
            let remindersFailed = 0;

            for (const listing of unverifiedListings) {
                try {
                    // Calculate days since creation
                    const daysSinceCreation = Math.floor(
                        (Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    // Send reminders on specific days: 1, 3, 7, 14
                    const reminderDays = [1, 3, 7, 14];

                    if (reminderDays.includes(daysSinceCreation)) {
                        // Check if user exists
                        if (!listing.userRef || !listing.userRef.email) {
                            console.log(`   ⚠️  Skipping listing ${listing._id}: No user email`);
                            continue;
                        }

                        // Prepare listing details for email
                        const listingDetails = {
                            listingId: listing._id,
                            propertyName: listing.name,
                            propertyType: listing.type,
                            city: listing.city,
                            state: listing.state
                        };

                        // Send reminder email
                        await sendPropertyVerificationReminderEmail(
                            listing.userRef.email,
                            listingDetails,
                            daysSinceCreation
                        );

                        remindersSent++;
                        console.log(`   ✅ Reminder sent to ${listing.userRef.email} (Day ${daysSinceCreation}) - ${listing.name}`);
                    }
                } catch (error) {
                    remindersFailed++;
                    console.error(`   ❌ Failed to send reminder for listing ${listing._id}:`, error.message);
                }
            }

            console.log(`\n   📊 Summary:`);
            console.log(`      - Total unverified: ${unverifiedListings.length}`);
            console.log(`      - Reminders sent: ${remindersSent}`);
            console.log(`      - Reminders failed: ${remindersFailed}`);
            console.log(`   ✅ Scheduler run completed\n`);

        } catch (error) {
            console.error('   ❌ Scheduler error:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    console.log('📅 Verification reminder scheduler started');
    console.log('   Schedule: Daily at 9:00 AM IST');
    console.log('   Reminder Days: 1, 3, 7, 14 days after creation');
};

/**
 * Manual trigger for testing (optional)
 * Run this to test the scheduler without waiting for cron
 */
export const runVerificationReminderManually = async () => {
    console.log('🔔 [Manual Trigger] Running verification reminder...\n');

    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const unverifiedListings = await Listing.find({
            isVerified: false,
            visibility: 'private',
            createdAt: { $lt: oneDayAgo }
        }).populate('userRef', 'email username');

        console.log(`Found ${unverifiedListings.length} unverified listings\n`);

        for (const listing of unverifiedListings) {
            const daysSinceCreation = Math.floor(
                (Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );

            console.log(`Listing: ${listing.name}`);
            console.log(`  Days since creation: ${daysSinceCreation}`);
            console.log(`  Owner: ${listing.userRef?.email || 'No email'}`);
            console.log(`  Should send reminder: ${[1, 3, 7, 14].includes(daysSinceCreation) ? 'YES' : 'NO'}\n`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

export default startVerificationReminderScheduler;

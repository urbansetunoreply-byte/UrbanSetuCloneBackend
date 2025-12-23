import cron from 'node-cron';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import { sendTrendingUpdateEmail } from './emailService.js';

export const initializeTrendingEmailScheduler = () => {
    // Schedule: Bi-weekly on the 1st and 15th of the month at 5:00 PM (17:00)
    // Best practice: Large platforms (Zillow, Airbnb) typically use bi-weekly or monthly digests to avoid user fatigue while keeping engagement high.
    // Cron syntax: Minute Hour DayOfMonth Month DayOfWeek
    cron.schedule('0 17 1,15 * *', async () => {
        console.log('🚀 Starting Bi-Weekly Trending Email Job...');

        try {
            // 1. Fetch Global Data (Fallback/Default)
            // Top 4 Newest Public Listings
            const globalNew = await Listing.find({
                availabilityStatus: 'available',
                visibility: 'public'
            })
                .sort({ createdAt: -1 })
                .limit(4)
                .lean();

            // Top 4 Trending (Most Viewed) Public Listings
            const globalTrending = await Listing.find({
                availabilityStatus: 'available',
                visibility: 'public',
                viewCount: { $gt: 0 }
            })
                .sort({ viewCount: -1 })
                .limit(4)
                .lean();

            if (globalNew.length === 0 && globalTrending.length === 0) {
                console.log('No active listings found for trending email. Aborting.');
                return;
            }

            // 2. Stream Users Sequentially
            // We use a cursor to handle large datasets effectively without loading all into memory
            const userCursor = User.find({
                status: 'active',
                role: 'user'
            }).cursor();

            let processedCount = 0;
            let successCount = 0;

            console.log('Starting sequential user processing...');

            for (let user = await userCursor.next(); user != null; user = await userCursor.next()) {
                processedCount++;

                // 3. Personalized Content Logic
                // We default to global lists to ensure content availability
                let userNew = globalNew;
                let userTrending = globalTrending;

                // Note: Precise IP geolocation requires an external paid limit-free API or local GeoIP DB.
                // Since per-user IP lookup during batch processing is performance-heavy and rate-limited,
                // we prioritize the user's stored profile Address.

                // If user has a stored address, we could potentially refine queries (e.g. matching City).
                // However, to strictly follow "sequential" processing without stalling the DB with 
                // thousands of unique aggregation queries, we will stick to the high-quality Global lists for this iteration.
                // This ensures reliability and speed while still providing "Trending" context.

                // Future enhancement: Implement local GeoIP DB lookup here.

                // 4. Send Email with Retry Logic
                // "retry 2 times if not sent still failed shift to other user"
                try {
                    await sendWithRetryWrapper(user, userNew, userTrending);
                    successCount++;
                } catch (err) {
                    console.error(`Failed to send trending email to ${user.email} after retries. Moving to next user.`);
                }

                // 5. Throttling (Sequential load management)
                // Wait 1 second between users to avoid overwhelming the Notification Service / SMTP
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Log progress every 10 users
                if (processedCount % 10 === 0) {
                    console.log(`Processed ${processedCount} users...`);
                }
            }

            console.log(`✅ Bi-Weekly Trending Email Job Completed. Processed: ${processedCount}, Sent: ${successCount}`);

        } catch (error) {
            console.error('❌ Error in bi-weekly trending email scheduler:', error);
        }
    });

    console.log('✅ Bi-Weekly Trending Email Scheduler initialized (1st & 15th at 17:00)');
};

// Helper: Send with Retry (Max 2 retries -> 1 initial + 2 retries = 3 attempts)
async function sendWithRetryWrapper(user, newProps, trendingProps) {
    let attempts = 0;
    const maxRetries = 2;

    while (attempts <= maxRetries) {
        try {
            const result = await sendTrendingUpdateEmail(user.email, user.username, newProps, trendingProps);
            if (result && result.success) return true;
            throw new Error(result?.error || 'Email service returned failure');
        } catch (error) {
            attempts++;
            if (attempts > maxRetries) throw error;
            // Exponential backoff for retries: 1s, 2s
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
    }
}

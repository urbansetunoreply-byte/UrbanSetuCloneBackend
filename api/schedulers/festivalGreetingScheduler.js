import cron from 'node-cron';
import User from '../models/user.model.js';
import { getSeasonalTheme } from '../utils/seasonalEvents.js';
import { sendFestivalGreetingEmail } from '../utils/emailService.js';

export const startFestivalGreetingScheduler = () => {
    // Run Daily at 9:00 AM
    // Cron format: Minute Hour DayOfMonth Month DayOfWeek
    cron.schedule('0 9 * * *', async () => {
        console.log('🎉 [Festival Greetings] Starting daily check...');
        try {
            const theme = getSeasonalTheme();

            // Filter out generic seasons or no theme (only send for specific events)
            if (!theme || theme.id === 'winter') {
                console.log('   No specific festival today.');
                return;
            }

            const currentYear = new Date().getFullYear();
            const festivalId = theme.id;

            console.log(`   Found festival: ${theme.name} (${festivalId})`);

            // Find eligible users: active status and haven't received this festival greeting this year
            // Note: We intentionally query only users who haven't received it yet to avoid duplicates
            // even if the scheduler runs multiple times or crashes halfway.
            const users = await User.find({
                status: 'active',
                email: { $exists: true, $ne: null },
                'festivalGreetingsSent': {
                    $not: {
                        $elemMatch: {
                            year: currentYear,
                            festivalId: festivalId
                        }
                    }
                }
            });

            if (users.length > 0) {
                console.log(`   Found ${users.length} users eligible for ${theme.name} greeting.`);
            } else {
                console.log('   No eligible users found (all may have received it already).');
            }

            // Process sequentially to be gentle on mail server, or could use Promise.all with chunks
            for (const user of users) {
                try {
                    const result = await sendFestivalGreetingEmail(user.email, user.username, theme);

                    if (result.success) {
                        // Update user record immediately after success
                        await User.updateOne(
                            { _id: user._id },
                            {
                                $push: {
                                    festivalGreetingsSent: {
                                        year: currentYear,
                                        festivalId: festivalId,
                                        sentAt: new Date()
                                    }
                                }
                            }
                        );
                        console.log(`   ✅ Sent ${theme.name} greeting to ${user.username}`);
                    } else {
                        console.warn(`   ⚠️ Failed to send (service error) to ${user.username}`);
                    }
                } catch (err) {
                    console.error(`   ❌ Failed to send greeting to ${user.username}:`, err.message);
                }

                // Small delay between emails to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

        } catch (error) {
            console.error('   ❌ Festival Greeting Scheduler Error:', error);
        }
    });

    console.log('📅 Festival Greeting scheduler started');
};

export default startFestivalGreetingScheduler;

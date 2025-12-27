import cron from 'node-cron';
import User from '../models/user.model.js';
import coinService from '../services/coinService.js';
import { sendCoinExpiryWarningEmail, sendCoinsFrozenEmail } from '../utils/emailService.js';

const processWarnings = async (daysInAdvance) => {
    const warningStart = new Date();
    warningStart.setDate(warningStart.getDate() + daysInAdvance);
    warningStart.setHours(0, 0, 0, 0);

    const warningEnd = new Date(warningStart);
    warningEnd.setDate(warningEnd.getDate() + 1); // Next day

    const warningUsers = await User.find({
        'gamification.coinsExpiryDate': { $gte: warningStart, $lt: warningEnd },
        'gamification.setuCoinsBalance': { $gt: 0 }
    });

    if (warningUsers.length > 0) {
        console.log(`   Found ${warningUsers.length} users requiring ${daysInAdvance}-day warning notices.`);
    }

    for (const user of warningUsers) {
        try {
            // Calculate precise days left for display (should be equal to daysInAdvance)
            const daysLeft = daysInAdvance;

            await sendCoinExpiryWarningEmail(
                user.email,
                user.username,
                daysLeft,
                user.gamification.setuCoinsBalance,
                user.gamification.coinsExpiryDate
            );
            console.log(`   ⚠️ Sent ${daysInAdvance}-day warning to ${user.username}`);
        } catch (err) {
            console.error(`   ❌ Error sending warning to ${user.username}:`, err);
        }
    }
};

export const startCoinExpiryScheduler = () => {
    // Run Daily at 00:00 (Midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('🪙 [Coin Expiry] Starting daily check...');
        const now = new Date();

        try {
            // 1. Process Expired Coins
            const expiredUsers = await User.find({
                'gamification.coinsExpiryDate': { $lt: now },
                'gamification.setuCoinsBalance': { $gt: 0 }
            });

            if (expiredUsers.length > 0) {
                console.log(`   Found ${expiredUsers.length} users with expired coins.`);
            }

            for (const user of expiredUsers) {
                try {
                    const result = await coinService.expireCoins(user._id);
                    if (result.success) {
                        await sendCoinsFrozenEmail(user.email, user.username, result.frozenAmount, now);
                        console.log(`   🧊 Froze ${result.frozenAmount} coins for ${user.username}`);
                    }
                } catch (err) {
                    console.error(`   ❌ Error expiring coins for ${user.username}:`, err);
                }
            }

            // 2. Send Warnings (7 Days Notice)
            await processWarnings(7);

            // 3. Send Warnings (2 Days Notice)
            await processWarnings(2);

        } catch (error) {
            console.error('   ❌ Coin Expiry Scheduler Error:', error);
        }
    });

    console.log('📅 Coin Expiry scheduler started');
};

export default startCoinExpiryScheduler;

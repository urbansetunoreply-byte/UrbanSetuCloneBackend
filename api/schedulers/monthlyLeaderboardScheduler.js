import cron from 'node-cron';
import coinService from '../services/coinService.js';

export const startMonthlyLeaderboardScheduler = () => {
    // Run Monthly at 00:00 on the 1st day of the month
    cron.schedule('0 0 1 * *', async () => {
        console.log('📅 [Monthly Leaderboard] Starting monthly reward check...');
        try {
            await coinService.processMonthlyLeaderboardRewards();
        } catch (error) {
            console.error('❌ Monthly Leaderboard Scheduler Error:', error);
        }
    });

    console.log('🏆 Monthly Leaderboard scheduler started');
};

export default startMonthlyLeaderboardScheduler;

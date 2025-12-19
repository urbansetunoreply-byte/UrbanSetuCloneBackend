import User from "../models/user.model.js";
import CoinTransaction from "../models/coinTransaction.model.js";

/**
 * Service to handle SetuCoins operations
 */
class CoinService {
    /**
     * Get user's current coin balance and verified stats
     * @param {string} userId
     * @returns {Promise<Object>} { balance, totalEarned, currentStreak }
     */
    async getBalance(userId) {
        const user = await User.findById(userId).select('gamification');
        if (!user) {
            throw new Error('User not found');
        }
        return user.gamification || {
            setuCoinsBalance: 0,
            totalCoinsEarned: 0,
            currentStreak: 0,
            lastRentPaymentDate: null
        };
    }

    /**
     * Credit coins to a user
     * @param {Object} params
     * @param {string} params.userId
     * @param {number} params.amount
     * @param {string} params.source - enum from CoinTransaction
     * @param {string} params.referenceId - Optional
     * @param {string} params.referenceModel - Optional
     * @param {string} params.description - Optional
     * @param {string} params.adminId - Optional, if manual adjustment
     * @param {Object} params.session - Mongoose session for atomicity (optional)
     */
    async credit({ userId, amount, source, referenceId = null, referenceModel = null, description = '', adminId = null, session = null }) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new Error('User not found');
        }

        // Initialize gamification if it doesn't exist
        if (!user.gamification) {
            user.gamification = {
                setuCoinsBalance: 0,
                totalCoinsEarned: 0,
                currentStreak: 0,
                lastRentPaymentDate: null
            };
        }

        // Update balance
        user.gamification.setuCoinsBalance += amount;
        user.gamification.totalCoinsEarned += amount;

        // Save user
        await user.save({ session });

        // Create transaction record
        const transaction = new CoinTransaction({
            userId,
            type: 'credit',
            amount,
            source,
            referenceId,
            referenceModel,
            description,
            balanceAfter: user.gamification.setuCoinsBalance,
            adminId
        });

        await transaction.save({ session });

        return {
            success: true,
            newBalance: user.gamification.setuCoinsBalance,
            transactionId: transaction._id
        };
    }

    /**
     * Debit coins from a user
     * @param {Object} params
     * @param {string} params.userId
     * @param {number} params.amount
     * @param {string} params.source
     * @param {string} params.referenceId
     * @param {string} params.referenceModel
     * @param {string} params.description
     * @param {string} params.adminId
     * @param {Object} params.session
     */
    async debit({ userId, amount, source, referenceId = null, referenceModel = null, description = '', adminId = null, session = null }) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.gamification || user.gamification.setuCoinsBalance < amount) {
            throw new Error('Insufficient SetuCoins balance');
        }

        // Update balance
        user.gamification.setuCoinsBalance -= amount;

        // Save user
        await user.save({ session });

        // Create transaction record
        const transaction = new CoinTransaction({
            userId,
            type: 'debit',
            amount,
            source,
            referenceId,
            referenceModel,
            description,
            balanceAfter: user.gamification.setuCoinsBalance,
            adminId
        });

        await transaction.save({ session });

        return {
            success: true,
            newBalance: user.gamification.setuCoinsBalance,
            transactionId: transaction._id
        };
    }

    /**
     * Update rent streak logic
     * @param {string} userId 
     * @param {Date} paymentDate 
     * @param {Object} session 
     */
    async updateRentStreak(userId, paymentDate = new Date(), session = null) {
        const user = await User.findById(userId).session(session);
        if (!user) return;

        if (!user.gamification) {
            user.gamification = {
                setuCoinsBalance: 0,
                totalCoinsEarned: 0,
                currentStreak: 0,
                lastRentPaymentDate: null
            };
        }

        const lastDate = user.gamification.lastRentPaymentDate ? new Date(user.gamification.lastRentPaymentDate) : null;
        const currentDate = new Date(paymentDate);

        // Check if last payment was previous month
        // Logic: If lastDate is null, streak = 1
        // If lastDate is last month (any day), streak++
        // If lastDate is current month, streak stays same (already count)
        // If lastDate is > 1 month ago, streak = 1

        let streakIncreased = false;
        let earnedStreakBonus = 0;

        if (!lastDate) {
            user.gamification.currentStreak = 1;
            streakIncreased = true;
        } else {
            const monthsDiff = (currentDate.getFullYear() - lastDate.getFullYear()) * 12 + (currentDate.getMonth() - lastDate.getMonth());

            if (monthsDiff === 0) {
                // Same month, no streak increase
            } else if (monthsDiff === 1) {
                // Consecutive month
                user.gamification.currentStreak += 1;
                streakIncreased = true;
            } else {
                // Broken streak
                user.gamification.currentStreak = 1;
                streakIncreased = true;
            }
        }

        // Calculate Streak Bonus
        // Rule: 20 coins per streak month, capped at 100 max bonus per month
        if (streakIncreased && user.gamification.currentStreak > 1) {
            earnedStreakBonus = Math.min(user.gamification.currentStreak * 20, 100);

            // Auto-credit streak bonus
            // We need to call credit here, but carefully to avoid recursion or circular dependencies if logic expands
            // Ideally returned to caller to process credit
        }

        user.gamification.lastRentPaymentDate = currentDate;
        await user.save({ session });

        return {
            currentStreak: user.gamification.currentStreak,
            streakIncreased,
            earnedStreakBonus
        };
    }

    /**
     * Get Leaderboard
     */
    async getLeaderboard(limit = 10) {
        const users = await User.find({ 'gamification.totalCoinsEarned': { $gt: 0 } })
            .select('username firstName lastName avatar gamification.totalCoinsEarned gamification.currentStreak')
            .sort({ 'gamification.totalCoinsEarned': -1 })
            .limit(limit);

        return users.map((u, index) => {
            const name = u.username || 'Anonymous';
            const maskedName = name.length > 3
                ? `${name.substring(0, 3)}***`
                : `${name}***`;

            return {
                rank: index + 1,
                userId: u._id, // Ideally shouldn't expose ID, but rank tracking might need it. Masking name is key.
                name: maskedName,
                avatar: u.avatar,
                totalCoins: u.gamification?.totalCoinsEarned || 0,
                streak: u.gamification?.currentStreak || 0
            };
        });
    }

    /**
     * Get System Stats for Admin
     */
    async getStats() {
        // 1. Total Circulating Supply (Sum of all user balances)
        const supplyAgg = await User.aggregate([
            { $group: { _id: null, totalBalance: { $sum: '$gamification.setuCoinsBalance' }, totalEarned: { $sum: '$gamification.totalCoinsEarned' } } }
        ]);

        const circulatingSupply = supplyAgg[0]?.totalBalance || 0;
        const totalMintedLifetime = supplyAgg[0]?.totalEarned || 0;

        // 2. Total Redeemed (Burned)
        const burnedAgg = await CoinTransaction.aggregate([
            { $match: { type: 'debit' } },
            { $group: { _id: null, totalBurned: { $sum: '$amount' } } }
        ]);
        const totalBurned = burnedAgg[0]?.totalBurned || 0;

        // 3. User Stats
        const holdersCount = await User.countDocuments({ 'gamification.setuCoinsBalance': { $gt: 0 } });

        // 4. Recent Transactions
        const recentTransactions = await CoinTransaction.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'username email');

        return {
            circulatingSupply,
            totalMintedLifetime,
            totalBurned,
            holdersCount,
            recentTransactions
        };
    }

    /**
     * Get transaction history
     */
    async getHistory(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const transactions = await CoinTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('referenceId'); // Populate might be tricky if dynamic, but basic is fine

        const total = await CoinTransaction.countDocuments({ userId });

        return {
            transactions,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    }
}

export default new CoinService();

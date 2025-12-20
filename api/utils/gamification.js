import User from "../models/user.model.js";
import CoinTransaction from "../models/coinTransaction.model.js";

/**
 * Awards SetuCoins to a user
 * @param {string} userId - The user ID
 * @param {number} amount - Amount of coins to award
 * @param {string} source - Source of the reward (e.g., 'profile_completion')
 * @param {string} description - Description for the transaction
 * @param {string|null} referenceId - Optional reference ID (e.g., reviewId)
 * @param {string|null} referenceModel - Optional reference model name
 * @returns {Promise<Object>} - Result with new balance
 */
export const awardSetuCoins = async (userId, amount, source, description, referenceId = null, referenceModel = null) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // Initialize gamification if missing
        if (!user.gamification) {
            user.gamification = {
                setuCoinsBalance: 0,
                totalCoinsEarned: 0,
                currentStreak: 0
            };
        }

        // Update user balance
        const previousBalance = user.gamification.setuCoinsBalance || 0;
        const newBalance = previousBalance + amount;

        user.gamification.setuCoinsBalance = newBalance;
        user.gamification.totalCoinsEarned = (user.gamification.totalCoinsEarned || 0) + amount;

        // Save User
        await user.save();

        // Create Transaction Record
        await CoinTransaction.create({
            userId,
            type: 'credit',
            amount,
            source,
            description,
            referenceId,
            referenceModel,
            balanceAfter: newBalance
        });

        return { success: true, newBalance };
    } catch (error) {
        console.error("Error awarding SetuCoins:", error);
        throw error;
    }
};

/**
 * Revokes SetuCoins from a user (Admin Action)
 * @param {string} userId - The user ID
 * @param {number} amount - Amount of coins to revoke
 * @param {string} adminId - ID of the admin performing the action
 * @param {string} reason - Reason for revocation
 * @returns {Promise<Object>} - Result with new balance
 */
export const revokeSetuCoins = async (userId, amount, adminId, reason) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        if (!user.gamification) {
            user.gamification = { setuCoinsBalance: 0 };
        }

        const previousBalance = user.gamification.setuCoinsBalance || 0;
        // Don't go below zero
        const actualDeduction = Math.min(previousBalance, amount);
        const newBalance = previousBalance - actualDeduction;

        user.gamification.setuCoinsBalance = newBalance;
        await user.save();

        await CoinTransaction.create({
            userId,
            type: 'debit',
            amount: actualDeduction,
            source: 'admin_adjustment',
            description: reason || 'Revoked by Admin',
            adminId,
            balanceAfter: newBalance
        });

        return { success: true, newBalance, deducted: actualDeduction };

    } catch (error) {
        console.error("Error revoking SetuCoins:", error);
        throw error;
    }
};

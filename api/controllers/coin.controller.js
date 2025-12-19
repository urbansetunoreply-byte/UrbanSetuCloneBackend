import CoinService from "../services/coinService.js";
import { errorHandler } from "../utils/error.js";

/**
 * Get current coin balance and stats for logged-in user
 */
export const getBalance = async (req, res, next) => {
    try {
        // req.user is populated by verifyToken middleware
        const stats = await CoinService.getBalance(req.user.id);
        res.status(200).json({ success: true, ...stats });
    } catch (error) {
        next(error);
    }
};

/**
 * Get transaction history for logged-in user
 */
export const getHistory = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const history = await CoinService.getHistory(req.user.id, page, limit);
        res.status(200).json({ success: true, ...history });
    } catch (error) {
        next(error);
    }
};

/**
 * Get referral stats for logged-in user
 */
export const getReferralStats = async (req, res, next) => {
    try {
        const stats = await CoinService.getReferralStats(req.user.id);
        res.status(200).json({ success: true, ...stats });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Global Leaderboard (Public)
 */
export const getLeaderboard = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await CoinService.getLeaderboard(limit);
        res.status(200).json({ success: true, leaderboard });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Get any user's coin balance
 */
export const getUserBalance = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'Forbidden'));
        }

        const { userId } = req.params;
        const stats = await CoinService.getBalance(userId);
        res.status(200).json({ success: true, ...stats });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Adjust user coins (Credit/Debit)
 */
export const adminAdjustCoins = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'Forbidden'));
        }

        const { userId, type, amount, reason } = req.body; // type: 'credit' or 'debit'

        if (!userId || !type || !amount || !reason) {
            return next(errorHandler(400, 'All fields are required'));
        }

        if (amount <= 0) {
            return next(errorHandler(400, 'Amount must be positive'));
        }

        const result = await (type === 'credit' ? CoinService.credit : CoinService.debit)({
            userId,
            amount,
            source: 'admin_adjustment',
            description: reason,
            adminId: req.user.id,
            referenceModel: 'AdminLog'
        });

        // Send notification email
        try {
            const User = (await import("../models/user.model.js")).default;
            const updatedUser = await User.findById(userId).select('email');
            if (updatedUser?.email) {
                const { sendCoinAdjustmentEmail } = await import("../utils/emailService.js");
                await sendCoinAdjustmentEmail(updatedUser.email, {
                    type,
                    amount,
                    reason,
                    newBalance: result.newBalance
                });
            }
        } catch (emailError) {
            console.error("Failed to send coin adjustment email:", emailError);
            // Don't fail the whole request if email fails
        }

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Get System Stats
 */
export const getStats = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'Forbidden'));
        }
        const stats = await CoinService.getStats();
        res.status(200).json({ success: true, stats });
    } catch (error) {
        next(error);
    }
};

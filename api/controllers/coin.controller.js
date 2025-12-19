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

        let result;
        if (type === 'credit') {
            result = await CoinService.credit({
                userId,
                amount,
                source: 'admin_adjustment',
                description: reason,
                adminId: req.user.id,
                referenceModel: 'AdminLog' // Optional: link to an audit log if exists
            });
        } else if (type === 'debit') {
            result = await CoinService.debit({
                userId,
                amount,
                source: 'admin_adjustment',
                description: reason,
                adminId: req.user.id,
                referenceModel: 'AdminLog'
            });
        } else {
            return next(errorHandler(400, 'Invalid adjustment type'));
        }

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

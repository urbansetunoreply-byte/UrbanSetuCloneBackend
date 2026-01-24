import express from 'express';
import {
    subscribeToNewsletter,
    getAllSubscribers,
    getMySubscriptionStatus,
    unsubscribeUser,
    updateSubscriptionStatus,
    sendSubscriptionOtp,
    verifySubscriptionOtp,
    sendUnsubscribeOtp,
    verifyUnsubscribeOtp
} from '../controllers/subscription.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// OTP-based Subscription Flow (PRIMARY FLOW - FIXED)
router.post('/send-subscribe-otp', sendSubscriptionOtp); // Sends OTP email
router.post('/verify-subscribe-otp', verifySubscriptionOtp); // Verifies OTP and creates subscription

// Re-structuring routes (ALTERNATIVE ENDPOINTS - SAME FUNCTIONALITY):
// 1. Send OTP for subscription
router.post('/send-otp', sendSubscriptionOtp);
// 2. Verify OTP and Subscribe
router.post('/verify-otp', verifySubscriptionOtp);

// 3. Send OTP for Unsubscribe
router.post('/send-unsubscribe-otp', verifyToken, sendUnsubscribeOtp);
// 4. Verify OTP and Unsubscribe
router.post('/verify-unsubscribe-otp', verifyToken, verifyUnsubscribeOtp);

router.post('/subscribe', subscribeToNewsletter); // LEGACY: Direct subscription without OTP (deprecated)
router.get('/all', verifyToken, getAllSubscribers);
router.get('/my-status', verifyToken, getMySubscriptionStatus);
router.post('/unsubscribe', verifyToken, unsubscribeUser); // Keep or deprecate
router.put('/status/:id', verifyToken, updateSubscriptionStatus);

export default router;

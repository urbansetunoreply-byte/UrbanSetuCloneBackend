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

// OTP-based Subscription Flow
router.post('/send-subscribe-otp', subscribeToNewsletter); // Renamed logic or new
router.post('/verify-subscribe-otp', subscribeToNewsletter); // Will split controller

// Re-structuring routes:
// 1. Send OTP for subscription
router.post('/send-otp', sendSubscriptionOtp);
// 2. Verify OTP and Subscribe
router.post('/verify-otp', verifySubscriptionOtp);

// 3. Send OTP for Unsubscribe
router.post('/send-unsubscribe-otp', verifyToken, sendUnsubscribeOtp);
// 4. Verify OTP and Unsubscribe
router.post('/verify-unsubscribe-otp', verifyToken, verifyUnsubscribeOtp);

router.post('/subscribe', subscribeToNewsletter); // Keep for legacy/direct if needed, but we will likely replace usage
router.get('/all', verifyToken, getAllSubscribers);
router.get('/my-status', verifyToken, getMySubscriptionStatus);
router.post('/unsubscribe', verifyToken, unsubscribeUser); // Keep or deprecate
router.put('/status/:id', verifyToken, updateSubscriptionStatus);

export default router;

import express from 'express';
import { subscribeToNewsletter, getAllSubscribers } from '../controllers/subscription.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

router.post('/subscribe', subscribeToNewsletter);
router.get('/all', verifyToken, getAllSubscribers);

export default router;

import express from 'express';
import { chatWithGemini, getUserChatSessions, rateMessage, getMessageRatings, createNewSession, deleteSession, deleteAllSessions } from '../controllers/gemini.controller.js';
import { optionalAuth, verifyToken } from '../utils/verify.js';
import { aiChatRateLimit, getRateLimitStatus } from '../middleware/aiRateLimiter.js';

const router = express.Router();

// Chat endpoint with role-based rate limiting and optional authentication
router.post('/chat', aiChatRateLimit, optionalAuth, chatWithGemini);

// Get user's chat sessions (requires authentication)
router.get('/sessions', verifyToken, getUserChatSessions);

// Create a new chat session (requires authentication)
router.post('/sessions', verifyToken, createNewSession);

// Delete a chat session (requires authentication)
router.delete('/sessions/:sessionId', verifyToken, deleteSession);

// Delete all chat sessions (requires authentication)
router.delete('/sessions', verifyToken, deleteAllSessions);

// Rate a message (requires authentication)
router.post('/rate', verifyToken, rateMessage);

// Get message ratings for a session (requires authentication)
router.get('/ratings/:sessionId', verifyToken, getMessageRatings);

// Get rate limit status (optional authentication)
router.get('/rate-limit-status', optionalAuth, (req, res) => {
    try {
        const status = getRateLimitStatus(req);
        res.json({
            success: true,
            rateLimit: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get rate limit status'
        });
    }
});

export default router;
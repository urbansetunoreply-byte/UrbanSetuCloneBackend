import express from 'express';
import { chatWithGemini, getUserChatSessions } from '../controllers/gemini.controller.js';
import { optionalAuth, verifyToken } from '../utils/verify.js';

const router = express.Router();

// Chat endpoint with optional authentication (for both logged-in and anonymous users)
router.post('/chat', optionalAuth, chatWithGemini);

// Get user's chat sessions (requires authentication)
router.get('/sessions', verifyToken, getUserChatSessions);

export default router;
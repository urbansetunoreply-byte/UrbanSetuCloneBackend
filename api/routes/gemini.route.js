import express from 'express';
import { chatWithGemini, getUserChatSessions, rateMessage, getMessageRatings, createNewSession, deleteSession, deleteAllSessions } from '../controllers/gemini.controller.js';
import { optionalAuth, verifyToken } from '../utils/verify.js';

const router = express.Router();

// Chat endpoint with optional authentication (for both logged-in and anonymous users)
router.post('/chat', optionalAuth, chatWithGemini);

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

export default router;
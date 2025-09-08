import express from 'express';
import { chatWithGemini } from '../controllers/gemini.controller.js';
import { optionalAuth } from '../utils/verify.js';

const router = express.Router();

// Chat endpoint with optional authentication (for both logged-in and anonymous users)
router.post('/chat', optionalAuth, chatWithGemini);

export default router;
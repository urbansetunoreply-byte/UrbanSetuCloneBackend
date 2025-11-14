import express from 'express';
import { transcribeAudio, getWebSpeechInfo } from '../controllers/speechToText.controller.js';

const router = express.Router();

// Simple in-memory rate limiting for speech-to-text
const speechRateLimit = new Map();

const speechRateLimitMiddleware = (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 5; // Max 5 requests per minute per IP

    if (!speechRateLimit.has(clientId)) {
        speechRateLimit.set(clientId, { count: 1, resetTime: now + windowMs });
        return next();
    }

    const clientData = speechRateLimit.get(clientId);
    
    if (now > clientData.resetTime) {
        // Reset the window
        speechRateLimit.set(clientId, { count: 1, resetTime: now + windowMs });
        return next();
    }

    if (clientData.count >= maxRequests) {
        return res.status(429).json({
            success: false,
            message: 'Too many speech-to-text requests. Please wait 1 minute before trying again.',
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
    }

    clientData.count++;
    next();
};

// Route for OpenAI Whisper API transcription with rate limiting
router.post('/transcribe', speechRateLimitMiddleware, transcribeAudio);

// Route for Web Speech API information
router.get('/web-speech-info', getWebSpeechInfo);

export default router;

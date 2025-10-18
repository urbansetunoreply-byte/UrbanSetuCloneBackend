import express from 'express';
import { transcribeAudio, getWebSpeechInfo } from '../controllers/speechToText.controller.js';

const router = express.Router();

// Route for OpenAI Whisper API transcription
router.post('/transcribe', transcribeAudio);

// Route for Web Speech API information
router.get('/web-speech-info', getWebSpeechInfo);

export default router;

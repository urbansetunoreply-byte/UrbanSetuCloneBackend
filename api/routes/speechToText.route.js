import express from 'express';
import { transcribeAudio, getWebSpeechTranscription } from '../controllers/speechToText.controller.js';

const router = express.Router();

// Route for Google Speech-to-Text API transcription
router.post('/transcribe', transcribeAudio);

// Route for Web Speech API information
router.get('/web-speech-info', getWebSpeechTranscription);

export default router;

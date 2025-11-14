import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

// OpenAI Whisper API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

// Retry function with exponential backoff for rate limiting
const callWhisperAPIWithRetry = async (formData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.post(
                OPENAI_WHISPER_URL,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        ...formData.getHeaders()
                    },
                    timeout: 30000 // 30 second timeout
                }
            );
            return response;
        } catch (error) {
            console.log(`Whisper API attempt ${attempt} failed:`, error.response?.status, error.response?.data);
            
            // If it's a rate limit error (429), wait and retry
            if (error.response?.status === 429 && attempt < maxRetries) {
                const retryAfter = error.response.headers['retry-after'] || Math.pow(2, attempt);
                const waitTime = parseInt(retryAfter) * 1000; // Convert to milliseconds
                console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            
            // If it's not a rate limit error or we've exhausted retries, throw the error
            throw error;
        }
    }
};

export const transcribeAudio = async (req, res) => {
    try {
        const { audioUrl } = req.body;

        if (!audioUrl) {
            return res.status(400).json({
                success: false,
                message: 'Audio URL is required'
            });
        }

        if (!OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Speech-to-text service not configured. Please add OPENAI_API_KEY to environment variables.'
            });
        }

        // Download the audio file from Cloudinary
        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer'
        });

        // Create FormData for OpenAI Whisper API
        const formData = new FormData();
        formData.append('file', audioResponse.data, {
            filename: 'audio.webm',
            contentType: 'audio/webm'
        });
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'verbose_json');
        formData.append('language', 'en');

        // Call OpenAI Whisper API with retry logic
        const whisperResponse = await callWhisperAPIWithRetry(formData, 3);

        // Extract transcription from response
        const { text, language, duration, segments } = whisperResponse.data;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Could not transcribe audio. Please ensure the audio is clear and contains speech.'
            });
        }

        // Calculate average confidence from segments
        let avgConfidence = 0.9; // Default confidence
        if (segments && segments.length > 0) {
            const totalConfidence = segments.reduce((sum, segment) => sum + (segment.avg_logprob || 0), 0);
            avgConfidence = Math.max(0, Math.min(1, Math.exp(totalConfidence / segments.length)));
        }

        res.json({
            success: true,
            transcription: text.trim(),
            confidence: avgConfidence,
            language: language || 'en',
            duration: duration || 0,
            segments: segments || []
        });

    } catch (error) {
        console.error('Whisper API error:', error);
        
        if (error.response?.status === 400) {
            return res.status(400).json({
                success: false,
                message: 'Invalid audio format or poor audio quality. Please try recording again.',
                error: error.response.data?.error
            });
        }

        if (error.response?.status === 401) {
            return res.status(500).json({
                success: false,
                message: 'OpenAI API key is invalid. Please check your API key configuration.'
            });
        }

        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            return res.status(429).json({
                success: false,
                message: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
                retryAfter: parseInt(retryAfter)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to transcribe audio. Please try again.',
            error: error.response?.data?.error || error.message
        });
    }
};

// Get Web Speech API information
export const getWebSpeechInfo = (req, res) => {
    try {
        res.json({
            success: true,
            supported: true,
            provider: 'OpenAI Whisper',
            languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'],
            features: [
                'automatic_punctuation',
                'word_timing',
                'confidence_scores',
                'language_detection',
                'noise_robustness',
                'accent_adaptation'
            ],
            model: 'whisper-1',
            cost: '$0.006 per minute',
            advantages: [
                'High accuracy transcription',
                'Supports 99+ languages',
                'Handles various accents and dialects',
                'Works with noisy audio',
                'Automatic punctuation and capitalization'
            ]
        });
    } catch (error) {
        console.error('Web Speech API info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Web Speech API information'
        });
    }
};
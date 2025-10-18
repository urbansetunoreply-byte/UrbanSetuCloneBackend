import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Google Speech-to-Text API configuration
const GOOGLE_SPEECH_API_KEY = process.env.GOOGLE_SPEECH_API_KEY;
const GOOGLE_SPEECH_API_URL = 'https://speech.googleapis.com/v1/speech:recognize';

export const transcribeAudio = async (req, res) => {
    try {
        const { audioUrl } = req.body;

        if (!audioUrl) {
            return res.status(400).json({
                success: false,
                message: 'Audio URL is required'
            });
        }

        if (!GOOGLE_SPEECH_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Speech-to-text service not configured. Please add GOOGLE_SPEECH_API_KEY to environment variables.'
            });
        }

        // Download the audio file from Cloudinary
        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer'
        });

        // Convert to base64
        const audioBase64 = Buffer.from(audioResponse.data).toString('base64');

        // Prepare the request for Google Speech-to-Text API
        const requestBody = {
            config: {
                encoding: 'WEBM_OPUS', // or 'MP3', 'WAV', etc. based on your audio format
                sampleRateHertz: 48000,
                languageCode: 'en-US',
                alternativeLanguageCodes: ['en-IN', 'en-GB'],
                enableAutomaticPunctuation: true,
                enableWordTimeOffsets: true,
                model: 'latest_long'
            },
            audio: {
                content: audioBase64
            }
        };

        // Call Google Speech-to-Text API
        const speechResponse = await axios.post(
            `${GOOGLE_SPEECH_API_URL}?key=${GOOGLE_SPEECH_API_KEY}`,
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        // Extract transcription from response
        const transcription = speechResponse.data.results
            ?.map(result => result.alternatives?.[0]?.transcript)
            .filter(Boolean)
            .join(' ') || '';

        if (!transcription) {
            return res.status(400).json({
                success: false,
                message: 'Could not transcribe audio. Please ensure the audio is clear and contains speech.'
            });
        }

        res.json({
            success: true,
            transcription: transcription.trim(),
            confidence: speechResponse.data.results?.[0]?.alternatives?.[0]?.confidence || 0
        });

    } catch (error) {
        console.error('Speech-to-text error:', error);
        
        if (error.response?.status === 400) {
            return res.status(400).json({
                success: false,
                message: 'Invalid audio format or poor audio quality. Please try recording again.'
            });
        }

        if (error.response?.status === 403) {
            return res.status(500).json({
                success: false,
                message: 'Speech-to-text service access denied. Please check API key configuration.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to transcribe audio. Please try again.'
        });
    }
};

// Alternative method using Web Speech API (browser-based)
export const getWebSpeechTranscription = async (req, res) => {
    try {
        // This endpoint provides instructions for using Web Speech API
        res.json({
            success: true,
            message: 'Use Web Speech API for browser-based transcription',
            instructions: {
                method: 'Web Speech API',
                description: 'Browser-based speech recognition',
                advantages: [
                    'No server processing required',
                    'Real-time transcription',
                    'Works offline in some browsers',
                    'No API key required'
                ],
                limitations: [
                    'Browser compatibility varies',
                    'Requires microphone permission',
                    'Limited to supported languages',
                    'May not work in all environments'
                ]
            }
        });
    } catch (error) {
        console.error('Web Speech API info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Web Speech API information'
        });
    }
};

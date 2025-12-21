import axios from 'axios';

export const getTurnCredentials = async (req, res) => {
    try {
        // Metered.ca API endpoint
        if (!process.env.METERED_DOMAIN || !process.env.METERED_API_KEY || process.env.METERED_DOMAIN.includes('urbansetu.metered.ca')) {
            throw new Error('Metered credentials not configured or using placeholder.');
        }

        const response = await axios.get(`https://${process.env.METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`, {
            timeout: 3000 // 3s timeout to prevent hanging
        });

        // Metered returns an array of ICE servers directly
        // Format: [{ urls: "turn:...", username: "...", credential: "..." }, ...]
        res.json({ iceServers: response.data });
    } catch (error) {
        if (error.message.includes('Metered credentials not configured')) {
            console.warn('[TURN] Metered credentials not set. Using public STUN servers.');
        } else {
            console.error('[TURN] Error fetching TURN credentials:', error.message);
        }

        // Fallback to public STUN servers if Metered fails
        res.json({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });
    }
};

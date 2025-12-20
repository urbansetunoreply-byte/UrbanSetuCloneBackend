import axios from 'axios';

export const getTurnCredentials = async (req, res) => {
    try {
        // Metered.ca API endpoint
        const response = await axios.get(`https://${process.env.METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`);

        // Metered returns an array of ICE servers directly
        // Format: [{ urls: "turn:...", username: "...", credential: "..." }, ...]
        res.json({ iceServers: response.data });
    } catch (error) {
        console.error('Error fetching TURN credentials from Metered:', error.message);
        // Fallback to public STUN servers if Metered fails
        res.json({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });
    }
};

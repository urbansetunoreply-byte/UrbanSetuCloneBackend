import crypto from 'crypto';
import { errorHandler } from '../utils/error.js';

// Store for CSRF tokens (in production, use Redis)
const csrfTokenStore = new Map();

// Clean up expired CSRF tokens every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of csrfTokenStore.entries()) {
        if (now > data.expiresAt) {
            csrfTokenStore.delete(token);
        }
    }
}, 10 * 60 * 1000);

// Generate CSRF token
export const generateCSRFToken = (req, res, next) => {
    try {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
        
        // Use IP address and User-Agent as identifier since we don't have sessions
        const identifier = `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
        
        // Store token with expiration
        csrfTokenStore.set(token, {
            expiresAt,
            sessionId: identifier
        });
        
        // Set token in cookie
        res.cookie('csrf_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 1000 // 1 hour
        });
        
        res.locals.csrfToken = token;
        next();
    } catch (error) {
        next(error);
    }
};

// Verify CSRF token
export const verifyCSRFToken = (req, res, next) => {
    try {
        const token = req.body._csrf || req.headers['x-csrf-token'];
        const cookieToken = req.cookies.csrf_token;
        
        if (!token || !cookieToken) {
            return next(errorHandler(403, 'CSRF token missing'));
        }
        
        if (token !== cookieToken) {
            return next(errorHandler(403, 'Invalid CSRF token'));
        }
        
        // Check if token exists in store and is not expired
        const tokenData = csrfTokenStore.get(token);
        if (!tokenData || Date.now() > tokenData.expiresAt) {
            return next(errorHandler(403, 'CSRF token expired'));
        }
        
        // Check identifier (IP + User-Agent)
        const identifier = `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
        if (tokenData.sessionId !== identifier) {
            return next(errorHandler(403, 'CSRF token mismatch'));
        }
        
        // Remove used token (one-time use)
        csrfTokenStore.delete(token);
        
        next();
    } catch (error) {
        next(error);
    }
};

// Get CSRF token for forms
export const getCSRFToken = (req, res) => {
    try {
        const token = req.cookies.csrf_token;
        
        // If no token exists, generate a new one
        if (!token) {
            const newToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
            const identifier = `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
            
            // Store token with expiration
            csrfTokenStore.set(newToken, {
                expiresAt,
                sessionId: identifier
            });
            
            // Set token in cookie
            res.cookie('csrf_token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 1000 // 1 hour
            });
            
            return res.json({ csrfToken: newToken });
        }
        
        // Check if existing token is valid
        const tokenData = csrfTokenStore.get(token);
        if (!tokenData || Date.now() > tokenData.expiresAt) {
            // Token expired, generate a new one
            const newToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
            const identifier = `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
            
            // Store new token
            csrfTokenStore.set(newToken, {
                expiresAt,
                sessionId: identifier
            });
            
            // Set new token in cookie
            res.cookie('csrf_token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 1000 // 1 hour
            });
            
            return res.json({ csrfToken: newToken });
        }
        
        res.json({ csrfToken: token });
    } catch (error) {
        console.error('Error in getCSRFToken:', error);
        res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
};

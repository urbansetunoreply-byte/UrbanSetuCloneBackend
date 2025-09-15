import { errorHandler } from '../utils/error.js';
import { logSecurityEvent } from './security.js';

// Rate limiting for reCAPTCHA verification requests
const captchaRateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of captchaRateLimitStore.entries()) {
        if (now > data.expiresAt) {
            captchaRateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Rate limiter for reCAPTCHA verification
const captchaRateLimit = (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const key = `captcha_verify:${identifier}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxAttempts = 10; // max 10 captcha verifications per minute
    
    const existing = captchaRateLimitStore.get(key);
    
    if (!existing) {
        captchaRateLimitStore.set(key, {
            attempts: 1,
            firstAttempt: now,
            expiresAt: now + windowMs
        });
        return next();
    }
    
    // Check if window has expired
    if (now > existing.expiresAt) {
        captchaRateLimitStore.set(key, {
            attempts: 1,
            firstAttempt: now,
            expiresAt: now + windowMs
        });
        return next();
    }
    
    // Check if max attempts exceeded
    if (existing.attempts >= maxAttempts) {
        logSecurityEvent('captcha_rate_limit_exceeded', {
            identifier,
            attempts: existing.attempts,
            timeWindow: '1 minute'
        });
        return next(errorHandler(429, 'Too many reCAPTCHA verification attempts. Please try again later.'));
    }
    
    // Increment attempts
    existing.attempts += 1;
    captchaRateLimitStore.set(key, existing);
    
    next();
};

// Verify reCAPTCHA token with Google
const verifyRecaptchaToken = async (token, secretKey) => {
    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
                remoteip: '' // Optional: include client IP for additional security
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        throw new Error('Failed to verify reCAPTCHA token');
    }
};

// Verify hCaptcha token (for easy migration)
const verifyHcaptchaToken = async (token, secretKey) => {
    try {
        const response = await fetch('https://hcaptcha.com/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
                sitekey: process.env.VITE_HCAPTCHA_SITE_KEY || ''
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('hCaptcha verification error:', error);
        throw new Error('Failed to verify hCaptcha token');
    }
};

// Main reCAPTCHA validation middleware
export const validateRecaptcha = (options = {}) => {
    const {
        required = true,
        skipOnDev = false,
        provider = 'recaptcha' // 'recaptcha' or 'hcaptcha'
    } = options;
    
    return async (req, res, next) => {
        try {
            // Skip validation in development if configured
            if (skipOnDev && process.env.NODE_ENV === 'development') {
                return next();
            }
            
            const { recaptchaToken } = req.body;
            
            // Check if token is provided
            if (!recaptchaToken) {
                if (required) {
                    logSecurityEvent('captcha_token_missing', {
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        endpoint: req.path
                    });
                    return next(errorHandler(400, 'reCAPTCHA verification is required'));
                } else {
                    return next();
                }
            }
            
            // Get the appropriate secret key
            const secretKey = provider === 'hcaptcha' 
                ? process.env.HCAPTCHA_SECRET_KEY 
                : process.env.RECAPTCHA_SECRET_KEY;
            
            if (!secretKey) {
                console.error(`Missing ${provider.toUpperCase()} secret key in environment variables`);
                return next(errorHandler(500, 'reCAPTCHA configuration error'));
            }
            
            // Verify the token
            const verificationResult = provider === 'hcaptcha' 
                ? await verifyHcaptchaToken(recaptchaToken, secretKey)
                : await verifyRecaptchaToken(recaptchaToken, secretKey);
            
            // Check verification result
            if (!verificationResult.success) {
                logSecurityEvent('captcha_verification_failed', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.path,
                    errorCodes: verificationResult['error-codes'] || [],
                    provider
                });
                
                const errorMessage = verificationResult['error-codes']?.includes('timeout-or-duplicate')
                    ? 'reCAPTCHA token has expired or been used. Please try again.'
                    : 'reCAPTCHA verification failed. Please try again.';
                
                return next(errorHandler(400, errorMessage));
            }
            
            // Add verification details to request for logging
            req.recaptchaVerification = {
                success: true,
                score: verificationResult.score, // For reCAPTCHA v3
                action: verificationResult.action, // For reCAPTCHA v3
                challenge_ts: verificationResult.challenge_ts,
                hostname: verificationResult.hostname,
                provider
            };
            
            next();
            
        } catch (error) {
            console.error('reCAPTCHA middleware error:', error);
            logSecurityEvent('captcha_middleware_error', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.path,
                error: error.message
            });
            next(errorHandler(500, 'reCAPTCHA verification service unavailable'));
        }
    };
};

// Middleware for conditional reCAPTCHA (e.g., after failed attempts)
export const conditionalRecaptcha = (conditionFn) => {
    return (req, res, next) => {
        const shouldRequireCaptcha = conditionFn(req);
        
        if (shouldRequireCaptcha) {
            return validateRecaptcha({ required: true })(req, res, next);
        } else {
            return validateRecaptcha({ required: false })(req, res, next);
        }
    };
};

// Rate limiting middleware for reCAPTCHA
export { captchaRateLimit };

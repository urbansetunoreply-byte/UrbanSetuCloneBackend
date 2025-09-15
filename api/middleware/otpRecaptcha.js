import { errorHandler } from '../utils/error.js';
import { logSecurityEvent } from './security.js';
import OtpTracking from '../models/otpTracking.model.js';

// Rate limiting for OTP reCAPTCHA verification requests
const otpCaptchaRateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of otpCaptchaRateLimitStore.entries()) {
        if (now > data.expiresAt) {
            otpCaptchaRateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Rate limiter for OTP reCAPTCHA verification
const otpCaptchaRateLimit = (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const key = `otp_captcha_verify:${identifier}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxAttempts = 15; // max 15 captcha verifications per minute
    
    const existing = otpCaptchaRateLimitStore.get(key);
    
    if (!existing) {
        otpCaptchaRateLimitStore.set(key, {
            attempts: 1,
            firstAttempt: now,
            expiresAt: now + windowMs
        });
        return next();
    }
    
    // Check if window has expired
    if (now > existing.expiresAt) {
        otpCaptchaRateLimitStore.set(key, {
            attempts: 1,
            firstAttempt: now,
            expiresAt: now + windowMs
        });
        return next();
    }
    
    // Check if max attempts exceeded
    if (existing.attempts >= maxAttempts) {
        logSecurityEvent('otp_captcha_rate_limit_exceeded', {
            identifier,
            attempts: existing.attempts,
            timeWindow: '1 minute'
        });
        return next(errorHandler(429, 'Too many reCAPTCHA verification attempts. Please try again later.'));
    }
    
    // Increment attempts
    existing.attempts += 1;
    otpCaptchaRateLimitStore.set(key, existing);
    
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

// Middleware to check if reCAPTCHA is required for OTP requests
export const checkOtpCaptchaRequirement = async (req, res, next) => {
    try {
        const { email } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        
        if (!email) {
            return next(errorHandler(400, 'Email is required'));
        }
        
        // Get or create tracking record
        const tracking = await OtpTracking.getOrCreateTracking(email, ipAddress, userAgent);
        
        // Check if captcha is required
        const requiresCaptcha = tracking.checkCaptchaRequirement();
        
        // Add tracking info to request for use in controllers
        req.otpTracking = tracking;
        req.requiresCaptcha = requiresCaptcha;
        
        // If currently locked out from OTP actions
        if (tracking.isLocked && tracking.isLocked()) {
            return res.status(429).json({
                success: false,
                message: 'Too many OTP requests. Please try again in 15 minutes.',
                requiresCaptcha: true
            });
        }
        
        // If captcha is required but not provided, return error
        if (requiresCaptcha && !req.body.recaptchaToken) {
            return res.status(400).json({
                success: false,
                message: 'reCAPTCHA verification is required due to multiple failed attempts or requests',
                requiresCaptcha: true
            });
        }
        
        next();
    } catch (error) {
        console.error('OTP captcha requirement check error:', error);
        next(errorHandler(500, 'Failed to check OTP requirements'));
    }
};

// Middleware to verify reCAPTCHA token for OTP requests
export const validateOtpRecaptcha = async (req, res, next) => {
    try {
        const { recaptchaToken } = req.body;
        const { requiresCaptcha } = req;
        
        // Skip validation if captcha is not required
        if (!requiresCaptcha) {
            return next();
        }
        
        // If captcha is required but token is missing
        if (!recaptchaToken) {
            return res.status(400).json({
                success: false,
                message: 'reCAPTCHA verification is required',
                requiresCaptcha: true
            });
        }
        
        // Get secret key
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!secretKey) {
            console.error('Missing RECAPTCHA_SECRET_KEY in environment variables');
            return next(errorHandler(500, 'reCAPTCHA configuration error'));
        }
        
        // Verify the token
        const verificationResult = await verifyRecaptchaToken(recaptchaToken, secretKey);
        
        // Check verification result
        if (!verificationResult.success) {
            logSecurityEvent('otp_captcha_verification_failed', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                email: req.body.email,
                errorCodes: verificationResult['error-codes'] || []
            });
            
            const errorMessage = verificationResult['error-codes']?.includes('timeout-or-duplicate')
                ? 'reCAPTCHA token has expired or been used. Please try again.'
                : 'reCAPTCHA verification failed. Please try again.';
            
            return res.status(400).json({
                success: false,
                message: errorMessage,
                requiresCaptcha: true
            });
        }
        
        // Mark captcha as verified in tracking record
        if (req.otpTracking) {
            await req.otpTracking.verifyCaptcha();
        }
        
        // Add verification details to request for logging
        req.recaptchaVerification = {
            success: true,
            score: verificationResult.score,
            action: verificationResult.action,
            challenge_ts: verificationResult.challenge_ts,
            hostname: verificationResult.hostname
        };
        
        next();
        
    } catch (error) {
        console.error('OTP reCAPTCHA middleware error:', error);
        logSecurityEvent('otp_captcha_middleware_error', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            email: req.body.email,
            error: error.message
        });
        next(errorHandler(500, 'reCAPTCHA verification service unavailable'));
    }
};

// Combined middleware for OTP reCAPTCHA
export const otpRecaptchaMiddleware = [
    otpCaptchaRateLimit,
    checkOtpCaptchaRequirement,
    validateOtpRecaptcha
];

export { otpCaptchaRateLimit };

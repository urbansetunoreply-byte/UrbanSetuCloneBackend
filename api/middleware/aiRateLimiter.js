// Role-based rate limiting middleware for AI chat endpoints
import { errorHandler } from '../utils/error.js';

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now > data.expiresAt) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Role-based rate limit configurations
const RATE_LIMITS = {
    public: {
        maxPrompts: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        message: 'Rate limit exceeded. You have used all 5 free prompts. Please sign in to continue chatting or wait 15 minutes.'
    },
    user: {
        maxPrompts: 50,
        windowMs: 60 * 60 * 1000, // 1 hour
        message: 'Rate limit exceeded. You have reached your hourly limit of 50 prompts. Please wait before sending more prompts.'
    },
    admin: {
        maxPrompts: 500,
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        message: 'Rate limit exceeded. You have reached your daily limit of 500 prompts. Please wait before sending more prompts.'
    },
    rootadmin: {
        maxPrompts: Infinity, // Unlimited
        windowMs: 0,
        message: null
    }
};

/**
 * Get user role from request
 * @param {Object} req - Express request object
 * @returns {string} - User role (public, user, admin, rootadmin)
 */
const getUserRole = (req) => {
    // Debug logging
    console.log('Rate limiter - req.user:', req.user ? { id: req.user._id, role: req.user.role, email: req.user.email } : 'null');
    
    // If user is authenticated, use their role
    if (req.user && req.user.role) {
        console.log('Rate limiter - Using authenticated user role:', req.user.role);
        return req.user.role;
    }
    
    // Default to public for non-authenticated users
    console.log('Rate limiter - Using public role (no authenticated user)');
    return 'public';
};

/**
 * Generate unique identifier for rate limiting
 * @param {Object} req - Express request object
 * @param {string} role - User role
 * @returns {string} - Unique identifier
 */
const getIdentifier = (req, role) => {
    // For authenticated users, use user ID
    if (req.user && req.user.id) {
        return `user:${req.user.id}:${role}`;
    }
    
    // For public users, use IP address
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    return `ip:${ip}:${role}`;
};

/**
 * Role-based rate limiter for AI chat endpoints
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const aiChatRateLimit = (req, res, next) => {
    try {
        const role = getUserRole(req);
        const config = RATE_LIMITS[role];
        
        // Root admins bypass rate limiting
        if (role === 'rootadmin') {
            console.log('Rate limiter - Root admin detected, bypassing rate limiting');
            // Add rate limit headers for root admin
            res.set({
                'X-RateLimit-Limit': 'unlimited',
                'X-RateLimit-Remaining': 'unlimited',
                'X-RateLimit-Reset': null,
                'X-RateLimit-Role': 'rootadmin'
            });
            return next();
        }
        
        const identifier = getIdentifier(req, role);
        const key = `ai_chat:${identifier}`;
        const now = Date.now();
        
        const existing = rateLimitStore.get(key);
        
        if (!existing) {
            // First request in the window
            rateLimitStore.set(key, {
                count: 1,
                firstRequest: now,
                expiresAt: now + config.windowMs,
                role: role
            });
            
            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': config.maxPrompts,
                'X-RateLimit-Remaining': config.maxPrompts - 1,
                'X-RateLimit-Reset': new Date(now + config.windowMs).toISOString(),
                'X-RateLimit-Role': role
            });
            
            return next();
        }
        
        // Check if window has expired
        if (now > existing.expiresAt) {
            // Reset the window
            rateLimitStore.set(key, {
                count: 1,
                firstRequest: now,
                expiresAt: now + config.windowMs,
                role: role
            });
            
            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': config.maxPrompts,
                'X-RateLimit-Remaining': config.maxPrompts - 1,
                'X-RateLimit-Reset': new Date(now + config.windowMs).toISOString(),
                'X-RateLimit-Role': role
            });
            
            return next();
        }
        
        // Check if max prompts exceeded
        if (existing.count >= config.maxPrompts) {
            const resetTime = new Date(existing.expiresAt).toISOString();
            
            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': config.maxPrompts,
                'X-RateLimit-Remaining': 0,
                'X-RateLimit-Reset': resetTime,
                'X-RateLimit-Role': role
            });
            
            return next(errorHandler(429, config.message, {
                rateLimitInfo: {
                    role: role,
                    limit: config.maxPrompts,
                    windowMs: config.windowMs,
                    resetTime: resetTime,
                    remaining: 0
                }
            }));
        }
        
        // Increment count
        existing.count += 1;
        rateLimitStore.set(key, existing);
        
        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': config.maxPrompts,
            'X-RateLimit-Remaining': config.maxPrompts - existing.count,
            'X-RateLimit-Reset': new Date(existing.expiresAt).toISOString(),
            'X-RateLimit-Role': role
        });
        
        next();
        
    } catch (error) {
        console.error('Rate limiter error:', error);
        // If rate limiter fails, allow the request to proceed
        next();
    }
};

/**
 * Get rate limit status for a user
 * @param {Object} req - Express request object
 * @returns {Object} - Rate limit status
 */
export const getRateLimitStatus = (req) => {
    try {
        const role = getUserRole(req);
        const config = RATE_LIMITS[role];
        
        console.log('getRateLimitStatus - role:', role, 'config:', config);
        
        if (role === 'rootadmin') {
            console.log('getRateLimitStatus - Root admin detected, returning unlimited status');
            return {
                role: role,
                limit: Infinity,
                remaining: Infinity,
                resetTime: null,
                windowMs: 0
            };
        }
        
        const identifier = getIdentifier(req, role);
        const key = `ai_chat:${identifier}`;
        const existing = rateLimitStore.get(key);
        
        if (!existing) {
            return {
                role: role,
                limit: config.maxPrompts,
                remaining: config.maxPrompts,
                resetTime: null,
                windowMs: config.windowMs
            };
        }
        
        const now = Date.now();
        if (now > existing.expiresAt) {
            return {
                role: role,
                limit: config.maxPrompts,
                remaining: config.maxPrompts,
                resetTime: null,
                windowMs: config.windowMs
            };
        }
        
        return {
            role: role,
            limit: config.maxPrompts,
            remaining: Math.max(0, config.maxPrompts - existing.count),
            resetTime: new Date(existing.expiresAt).toISOString(),
            windowMs: config.windowMs
        };
        
    } catch (error) {
        console.error('Rate limit status error:', error);
        return {
            role: 'public',
            limit: 5,
            remaining: 5,
            resetTime: null,
            windowMs: 15 * 60 * 1000
        };
    }
};

/**
 * Clear rate limit for a specific user (admin function)
 * @param {Object} req - Express request object
 * @returns {boolean} - Success status
 */
export const clearRateLimit = (req) => {
    try {
        const role = getUserRole(req);
        const identifier = getIdentifier(req, role);
        const key = `ai_chat:${identifier}`;
        
        return rateLimitStore.delete(key);
    } catch (error) {
        console.error('Clear rate limit error:', error);
        return false;
    }
};

// Export rate limit configurations for frontend use
export { RATE_LIMITS };

// Export the main rate limiter
export default aiChatRateLimit;

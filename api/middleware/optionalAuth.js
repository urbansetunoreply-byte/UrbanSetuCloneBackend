import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Optional authentication middleware - tries to authenticate but doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
    try {
        // Try to get token from cookies first
        const accessToken = req.cookies.access_token;
        
        if (!accessToken) {
            // No token found, continue without authentication
            req.user = null;
            return next();
        }

        // Verify the token
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
            req.user = user;
        } else {
            req.user = null;
        }
        
        next();
    } catch (error) {
        // Token is invalid, continue without authentication
        req.user = null;
        next();
    }
};

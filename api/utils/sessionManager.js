import jwt from 'jsonwebtoken';
import { generateTokenPair } from './jwtUtils.js';
import User from '../models/user.model.js';
import SessionAuditLog from '../models/sessionAuditLog.model.js';

// Store for active sessions (in production, use Redis)
const activeSessions = new Map();

// Clean up expired sessions every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of activeSessions.entries()) {
        if (now > session.expiresAt) {
            activeSessions.delete(sessionId);
        }
    }
}, 5 * 60 * 1000);

// Create a new session
export const createSession = (userId, req) => {
    const sessionId = jwt.sign(
        { 
            userId, 
            type: 'session',
            timestamp: Date.now()
        }, 
        process.env.JWT_TOKEN, 
        { expiresIn: '7d' }
    );
    
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const session = {
        sessionId,
        userId,
        ip,
        userAgent,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        lastActivity: Date.now(),
        isActive: true
    };
    
    activeSessions.set(sessionId, session);
    
    return session;
};

// Get user's active sessions
export const getUserSessions = (userId) => {
    const userSessions = [];
    for (const [sessionId, session] of activeSessions.entries()) {
        if (session.userId === userId && session.isActive) {
            userSessions.push({
                sessionId,
                ip: session.ip,
                userAgent: session.userAgent,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                isCurrent: false // Will be set by caller
            });
        }
    }
    return userSessions;
};

// Update session activity
export const updateSessionActivity = (sessionId) => {
    const session = activeSessions.get(sessionId);
    if (session) {
        session.lastActivity = Date.now();
        activeSessions.set(sessionId, session);
    }
};

// Revoke a session
export const revokeSession = (sessionId) => {
    const session = activeSessions.get(sessionId);
    if (session) {
        session.isActive = false;
        activeSessions.set(sessionId, session);
        return true;
    }
    return false;
};

// Revoke all sessions for a user
export const revokeAllUserSessions = (userId) => {
    let revokedCount = 0;
    for (const [sessionId, session] of activeSessions.entries()) {
        if (session.userId === userId && session.isActive) {
            session.isActive = false;
            activeSessions.set(sessionId, session);
            revokedCount++;
        }
    }
    return revokedCount;
};

// Check if session is valid
export const isSessionValid = (sessionId) => {
    const session = activeSessions.get(sessionId);
    if (!session || !session.isActive) return false;
    
    const now = Date.now();
    if (now > session.expiresAt) {
        activeSessions.delete(sessionId);
        return false;
    }
    
    return true;
};

// Get session info
export const getSessionInfo = (sessionId) => {
    return activeSessions.get(sessionId);
};

// Detect concurrent logins
export const detectConcurrentLogins = (userId, currentSessionId) => {
    const userSessions = getUserSessions(userId);
    const activeSessions = userSessions.filter(s => s.sessionId !== currentSessionId);
    
    if (activeSessions.length > 0) {
        return {
            hasConcurrentLogins: true,
            activeSessions: activeSessions.length,
            sessions: activeSessions
        };
    }
    
    return {
        hasConcurrentLogins: false,
        activeSessions: 0,
        sessions: []
    };
};

// Role-based session limits
const SESSION_LIMITS = {
    user: 5,
    admin: 2,
    rootadmin: 1
};

// Get device info from user agent
export const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    
    // Simple device detection
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
        return 'Mobile Device';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        return 'iOS Device';
    } else if (userAgent.includes('Windows')) {
        return 'Windows PC';
    } else if (userAgent.includes('Mac')) {
        return 'Mac';
    } else if (userAgent.includes('Linux')) {
        return 'Linux PC';
    } else {
        return 'Desktop';
    }
};

// Get location from IP (simplified - in production use a proper geo service)
export const getLocationFromIP = (ip) => {
    try {
        if (!ip) return 'Unknown';
        if (ip === '127.0.0.1' || ip === '::1') return 'Local Development';
        const pureIp = String(ip).split(',')[0].trim();
        if (pureIp.startsWith('10.') || pureIp.startsWith('192.168.') || pureIp.startsWith('172.16.') || pureIp.startsWith('172.31.')) {
            return 'Private Network';
        }
        // Without external geo lookup, do not echo IP as location; show Unknown
        return 'Unknown';
    } catch (_) {
        return 'Unknown';
    }
};

// Create a new session with enhanced tracking
export const createEnhancedSession = async (userId, req) => {
    const sessionId = jwt.sign(
        { 
            userId, 
            type: 'session',
            timestamp: Date.now()
        }, 
        process.env.JWT_TOKEN, 
        { expiresIn: '7d' }
    );
    
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const device = getDeviceInfo(userAgent);
    const location = getLocationFromIP(ip);
    
    const session = {
        sessionId,
        userId,
        ip,
        device,
        location,
        userAgent,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        lastActivity: Date.now(),
        isActive: true
    };
    
    activeSessions.set(sessionId, session);
    
    // Update user's active sessions in database
    await User.findByIdAndUpdate(userId, {
        $push: {
            activeSessions: {
                sessionId,
                ip,
                device,
                location,
                loginTime: new Date(),
                lastActive: new Date()
            }
        },
        $set: {
            lastKnownIp: ip,
            lastKnownDevice: device
        }
    });
    
    return session;
};

// Check for suspicious login
export const checkSuspiciousLogin = async (userId, ip, device) => {
    const user = await User.findById(userId);
    if (!user) return { isSuspicious: false };
    
    const isSuspicious = (
        user.lastKnownIp && user.lastKnownIp !== ip
    ) || (
        user.lastKnownDevice && user.lastKnownDevice !== device
    );
    
    return {
        isSuspicious,
        reason: isSuspicious ? 'New IP or device detected' : null,
        previousIp: user.lastKnownIp,
        previousDevice: user.lastKnownDevice
    };
};

// Enforce role-based session limits
export const enforceSessionLimits = async (userId, userRole) => {
    const limit = SESSION_LIMITS[userRole] || SESSION_LIMITS.user;
    const user = await User.findById(userId);
    
    if (!user || !user.activeSessions) return 0;
    
    if (user.activeSessions.length >= limit) {
        // Sort by lastActive and remove oldest sessions
        const sortedSessions = user.activeSessions.sort((a, b) => 
            new Date(a.lastActive) - new Date(b.lastActive)
        );
        
        const sessionsToRemove = sortedSessions.slice(0, user.activeSessions.length - limit + 1);
        
        // Remove from database
        const sessionIdsToRemove = sessionsToRemove.map(s => s.sessionId);
        await User.findByIdAndUpdate(userId, {
            $pull: {
                activeSessions: {
                    sessionId: { $in: sessionIdsToRemove }
                }
            }
        });
        
        // Remove from active sessions map
        sessionsToRemove.forEach(session => {
            revokeSession(session.sessionId);
        });
        
        // Log session cleanup
        await SessionAuditLog.create({
            userId,
            action: 'session_cleaned',
            role: userRole,
            sessionId: 'multiple',
            ip: 'system',
            device: 'system',
            additionalInfo: `Removed ${sessionsToRemove.length} old sessions to enforce ${limit} session limit`
        });
        
        return sessionsToRemove.length;
    }
    
    return 0;
};

// Log session action
export const logSessionAction = async (userId, action, sessionId, ip, device, location, additionalInfo = null, isSuspicious = false, suspiciousReason = null, performedBy = null) => {
    const user = await User.findById(userId);
    if (!user) return;
    
    await SessionAuditLog.create({
        userId,
        action,
        role: user.role,
        sessionId,
        ip,
        device,
        location,
        additionalInfo,
        isSuspicious,
        suspiciousReason,
        performedBy
    });
};

// Clean up old sessions (role-based)
export const cleanupOldSessions = async (userId, userRole) => {
    const limit = SESSION_LIMITS[userRole] || SESSION_LIMITS.user;
    const user = await User.findById(userId);
    
    if (!user || !user.activeSessions) return 0;
    
    if (user.activeSessions.length > limit) {
        // Sort by last activity and keep only the most recent
        const sortedSessions = user.activeSessions.sort((a, b) => 
            new Date(b.lastActive) - new Date(a.lastActive)
        );
        const sessionsToRevoke = sortedSessions.slice(limit);
        
        // Remove from database
        const sessionIdsToRemove = sessionsToRevoke.map(s => s.sessionId);
        await User.findByIdAndUpdate(userId, {
            $pull: {
                activeSessions: {
                    sessionId: { $in: sessionIdsToRemove }
                }
            }
        });
        
        // Remove from active sessions map
        sessionsToRevoke.forEach(session => {
            revokeSession(session.sessionId);
        });
        
        // Log session cleanup
        await logSessionAction(
            userId, 
            'session_cleaned', 
            'multiple', 
            'system', 
            'system', 
            'system',
            `Removed ${sessionsToRevoke.length} old sessions to enforce ${limit} session limit`
        );
        
        return sessionsToRevoke.length;
    }
    
    return 0;
};

// Get user's active sessions from database
export const getUserActiveSessions = async (userId) => {
    const user = await User.findById(userId).select('activeSessions');
    if (!user || !user.activeSessions) return [];
    
    return user.activeSessions.map(session => ({
        sessionId: session.sessionId,
        ip: session.ip,
        device: session.device,
        location: session.location,
        loginTime: session.loginTime,
        lastActive: session.lastActive,
        isCurrent: false // Will be set by caller
    }));
};

// Revoke session from database
export const revokeSessionFromDB = async (userId, sessionId) => {
    await User.findByIdAndUpdate(userId, {
        $pull: {
            activeSessions: { sessionId }
        }
    });
    
    // Also remove from active sessions map
    revokeSession(sessionId);
};

// Revoke all user sessions from database
export const revokeAllUserSessionsFromDB = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.activeSessions) return 0;
    
    const sessionCount = user.activeSessions.length;
    
    // Clear from database
    await User.findByIdAndUpdate(userId, {
        $set: { activeSessions: [] }
    });
    
    // Clear from active sessions map
    user.activeSessions.forEach(session => {
        revokeSession(session.sessionId);
    });
    
    return sessionCount;
};

// Update session activity in database
export const updateSessionActivityInDB = async (userId, sessionId) => {
    await User.findOneAndUpdate(
        { 
            _id: userId, 
            'activeSessions.sessionId': sessionId 
        },
        { 
            $set: { 
                'activeSessions.$.lastActive': new Date() 
            } 
        }
    );
    
    // Also update in memory
    updateSessionActivity(sessionId);
};

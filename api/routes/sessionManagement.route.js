import express from 'express';
import { verifyToken } from '../utils/verify.js';
import { 
  getUserActiveSessions, 
  revokeSessionFromDB, 
  revokeAllUserSessionsFromDB,
  logSessionAction,
  updateSessionActivityInDB,
  getDeviceInfo,
  getLocationFromIP
} from '../utils/sessionManager.js';
import User from '../models/user.model.js';
import SessionAuditLog from '../models/sessionAuditLog.model.js';
import { sendForcedLogoutEmail } from '../utils/emailService.js';

const router = express.Router();

// Get user's own active sessions (Device Management)
router.get('/my-sessions', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sessions = await getUserActiveSessions(userId);
    
    // Mark current session
    const currentSessionId = req.headers['x-session-id'] || req.cookies.session_id;
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.sessionId === currentSessionId
    }));
    
    res.json({
      success: true,
      sessions: sessionsWithCurrent,
      sessionLimit: req.user.role === 'user' ? 5 : req.user.role === 'admin' ? 2 : 1
    });
  } catch (error) {
    next(error);
  }
});

// Revoke a specific session
router.post('/revoke-session', verifyToken, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }
    
    // Check if session belongs to user
    const user = await User.findById(userId);
    const sessionExists = user.activeSessions.some(s => s.sessionId === sessionId);
    
    if (!sessionExists) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    // Revoke session
    await revokeSessionFromDB(userId, sessionId);
    
  // Notify target session via socket to logout immediately; also user room with targeted sessionId as fallback
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(`session_${sessionId}`).emit('forceLogout', { reason: 'Session revoked by user' });
      io.to(userId.toString()).emit('forceLogoutSession', { sessionId, reason: 'Session revoked by user' });
    }
  } catch (_) {}

    // Log action
    await logSessionAction(
      userId, 
      'logout', 
      sessionId, 
      req.ip, 
      getDeviceInfo(req.get('User-Agent')),
      getLocationFromIP(req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip),
      'User revoked session'
    );
    
    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    next(error);
  }
});

// Revoke all sessions
router.post('/revoke-all-sessions', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sessionCount = await revokeAllUserSessionsFromDB(userId);
    
  // Notify all (except possibly current) sessions to logout immediately
  try {
    const io = req.app.get('io');
    if (io) {
      // Broadcast to all of user's session rooms: we don't track rooms list, so emit by user room
      io.to(userId.toString()).emit('forceLogout', { reason: 'All sessions revoked by user' });
    }
  } catch (_) {}

    // Log action
    await logSessionAction(
      userId, 
      'logout', 
      'all', 
      req.ip, 
      getDeviceInfo(req.get('User-Agent')),
      getLocationFromIP(req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip),
      `User revoked all ${sessionCount} sessions`
    );
    
    res.json({ 
      success: true, 
      message: `All ${sessionCount} sessions revoked successfully` 
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all user sessions (Session Management)
router.get('/admin/all-sessions', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { page = 1, limit = 20, role = 'all' } = req.query;
    const skip = (page - 1) * limit;
    
    let userFilter = {};
    if (role !== 'all') {
      userFilter.role = role;
    }
    
    // Get users with their active sessions
    const users = await User.find(userFilter)
      .select('username email role activeSessions')
      .skip(skip)
      .limit(parseInt(limit));
    
    const sessionsWithUserInfo = [];
    users.forEach(user => {
      if (user.activeSessions && user.activeSessions.length > 0) {
        user.activeSessions.forEach(session => {
          sessionsWithUserInfo.push({
            sessionId: session.sessionId,
            userId: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            ip: session.ip,
            device: session.device,
            location: session.location,
            loginTime: session.loginTime,
            lastActive: session.lastActive
          });
        });
      }
    });
    
    res.json({
      success: true,
      sessions: sessionsWithUserInfo,
      total: sessionsWithUserInfo.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Force logout user session
router.post('/admin/force-logout', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { userId, sessionId, reason = 'Admin action' } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({ success: false, message: 'User ID and Session ID are required' });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if session exists
    const sessionExists = targetUser.activeSessions.some(s => s.sessionId === sessionId);
    if (!sessionExists) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    // Revoke session
    await revokeSessionFromDB(userId, sessionId);
    
  // Notify target session for immediate logout; also notify user room with targeted sessionId as fallback
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(`session_${sessionId}`).emit('forceLogout', { reason });
      io.to(userId.toString()).emit('forceLogoutSession', { sessionId, reason });
    }
  } catch (_) {}

    // Send notification email
    await sendForcedLogoutEmail(
      targetUser.email, 
      reason, 
      `${req.user.username} (${req.user.role})`
    );
    
    // Log action
    await logSessionAction(
      userId, 
      'forced_logout', 
      sessionId, 
      req.ip, 
      getDeviceInfo(req.get('User-Agent')),
      getLocationFromIP(req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip),
      `Forced logout by ${req.user.username}: ${reason}`,
      false,
      null,
      req.user._id
    );
    
    res.json({ success: true, message: 'Session force logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Admin: Force logout all user sessions
router.post('/admin/force-logout-all', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { userId, reason = 'Admin action' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const sessionCount = await revokeAllUserSessionsFromDB(userId);
    
  // Notify all sessions of this user
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('forceLogout', { reason });
    }
  } catch (_) {}

    // Send notification email
    await sendForcedLogoutEmail(
      targetUser.email, 
      reason, 
      `${req.user.username} (${req.user.role})`
    );
    
    // Log action
    await logSessionAction(
      userId, 
      'forced_logout', 
      'all', 
      req.ip, 
      getDeviceInfo(req.get('User-Agent')),
      getLocationFromIP(req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip),
      `Forced logout all sessions by ${req.user.username}: ${reason}`,
      false,
      null,
      req.user._id
    );
    
    res.json({ 
      success: true, 
      message: `All ${sessionCount} sessions force logged out successfully` 
    });
  } catch (error) {
    next(error);
  }
});

// Root Admin: Get session audit logs
router.get('/admin/audit-logs', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'rootadmin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { page = 1, limit = 50, action, isSuspicious, userId } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (action) filter.action = action;
    if (isSuspicious !== undefined && isSuspicious !== '') filter.isSuspicious = isSuspicious === 'true';
    if (userId) {
      // Validate ObjectId-like string (24 hex chars) to avoid CastError on each keystroke
      const isObjectIdLike = /^[a-fA-F0-9]{24}$/.test(String(userId));
      if (isObjectIdLike) {
        filter.userId = userId;
      } else {
        // If not a valid ObjectId yet, return empty result early to avoid DB error
        return res.json({ success: true, logs: [], total: 0, page: parseInt(page), limit: parseInt(limit) });
      }
    }
    
    const logs = await SessionAuditLog.find(filter)
      .populate('userId', 'username email role')
      .populate('performedBy', 'username email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await SessionAuditLog.countDocuments(filter);
    
    res.json({
      success: true,
      logs,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
});

// Root Admin: Clear all session audit logs
router.delete('/admin/audit-logs', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'rootadmin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { action, isSuspicious, userId } = req.query;

    // Optional scoped deletion via query (defaults to ALL)
    const filter = {};
    if (action) filter.action = action;
    if (isSuspicious !== undefined && isSuspicious !== '') {
      filter.isSuspicious = isSuspicious === 'true';
    }
    if (userId) {
      const isObjectIdLike = /^[a-fA-F0-9]{24}$/.test(String(userId));
      if (isObjectIdLike) {
        filter.userId = userId;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
      }
    }

    const result = await SessionAuditLog.deleteMany(filter);

    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount || 0} audit log(s)`
    });
  } catch (error) {
    next(error);
  }
});

// Update session activity (called on each request)
router.post('/update-activity', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sessionId = req.headers['x-session-id'] || req.cookies.session_id;
    
    if (sessionId) {
      await updateSessionActivityInDB(userId, sessionId);
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
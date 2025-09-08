import express from 'express';
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markAllNotificationsAsReadForAllAdmins,
  getUnreadNotificationCount,
  deleteNotification,
  deleteAllNotifications,
  adminSendNotification,
  getAllUsersForNotifications,
  adminSendNotificationToAll,
  reportChatMessage,
  reportChatConversation,
  notifyAdminsGeneric,
} from '../controllers/notification.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// Create notification (admin only)
router.post('/create', verifyToken, createNotification);

// Get user notifications
router.get('/user/:userId', verifyToken, getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', verifyToken, markNotificationAsRead);

// Mark all notifications as read
router.put('/user/:userId/read-all', verifyToken, markAllNotificationsAsRead);

// Mark all notifications as read for all admins (admin sync)
router.put('/admin/read-all', verifyToken, markAllNotificationsAsReadForAllAdmins);

// Get unread notification count
router.get('/user/:userId/unread-count', verifyToken, getUnreadNotificationCount);

// Delete notification
router.delete('/:notificationId', verifyToken, deleteNotification);

// Delete all notifications for a user
router.delete('/user/:userId/all', verifyToken, deleteAllNotifications);

// Admin routes for notification management
router.post('/admin/send', verifyToken, adminSendNotification);
router.post('/admin/send-all', verifyToken, adminSendNotificationToAll);
router.get('/admin/users', verifyToken, getAllUsersForNotifications);

// Report chat message (any authenticated user)
router.post('/report-chat', verifyToken, reportChatMessage);

// Report entire chat conversation (any authenticated user)
router.post('/report-chat-conversation', verifyToken, reportChatConversation);

// Generic: notify all admins (user-initiated requests)
router.post('/notify-admins', verifyToken, notifyAdminsGeneric);

export default router; 
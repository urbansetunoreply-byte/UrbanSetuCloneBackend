const express = require('express');
const router = express.Router();
const Notification = require('../models/notification.model');
const auth = require('../middleware/auth');

// Get notifications for a user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access these notifications
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Verify user owns this notification
    if (notification.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Create notification
router.post('/', auth, async (req, res) => {
  try {
    const { userId, title, message, type, data } = req.body;
    
    const notification = new Notification({
      userId,
      title,
      message,
      type: type || 'info',
      data: data || {},
      isRead: false
    });

    await notification.save();

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// Get unread notification count
router.get('/unread-count/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const count = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

module.exports = router;

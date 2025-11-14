const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'booking', 'payment', 'review'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actionUrl: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, limit = 50, skip = 0) {
  try {
    const notifications = await this.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    return notifications;
  } catch (error) {
    throw new Error(`Failed to get user notifications: ${error.message}`);
  }
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  try {
    const notification = await this.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    
    return notification;
  } catch (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    const count = await this.countDocuments({ 
      userId, 
      isRead: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    return count;
  } catch (error) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }
};

// Static method to clean expired notifications
notificationSchema.statics.cleanExpired = async function() {
  try {
    const result = await this.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    return result.deletedCount;
  } catch (error) {
    throw new Error(`Failed to clean expired notifications: ${error.message}`);
  }
};

module.exports = mongoose.model('Notification', notificationSchema);

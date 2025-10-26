// Test script to verify review report notification creation
import mongoose from 'mongoose';
import Notification from './api/models/notification.model.js';
import User from './api/models/user.model.js';

async function testReviewReportCreation() {
  try {
    // Connect to MongoDB (you'll need to update this connection string)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbansetu');
    
    console.log('Connected to MongoDB');
    
    // Find a sample user to use as reporter
    const reporter = await User.findOne().select('_id email phone role username');
    if (!reporter) {
      console.log('No users found in database');
      return;
    }
    
    console.log('Sample reporter:', {
      id: reporter._id,
      email: reporter.email,
      phone: reporter.phone,
      role: reporter.role,
      username: reporter.username
    });
    
    // Create a test notification
    const testNotification = await Notification.create({
      userId: reporter._id, // Using reporter as both user and admin for test
      type: 'review_reported',
      title: 'Review Reported',
      message: `A review for property "Test Property" was reported by ${reporter.username} for: Test Category - Test Details`,
      listingId: new mongoose.Types.ObjectId(),
      adminId: reporter._id,
      meta: { 
        reviewId: new mongoose.Types.ObjectId(), 
        reporterId: reporter._id,
        reporterEmail: reporter.email,
        reporterPhone: reporter.phone,
        reporterRole: reporter.role,
        category: 'Test Category',
        reason: 'Test Details'
      }
    });
    
    console.log('Created test notification:', JSON.stringify(testNotification, null, 2));
    
    // Test the parsing function
    const parseReviewReportFromNotification = (n) => {
      const message = n.message || '';
      const propertyMatch = message.match(/property "([^"]+)"/);
      const reporterMatch = message.match(/reported by ([^\\s]+)/);
      const categoryMatch = message.match(/for: ([^-]+)/);
      const detailsMatch = message.match(/- (.+)$/);
      
      return {
        notificationId: n._id,
        type: 'review',
        propertyName: propertyMatch ? propertyMatch[1] : 'Unknown Property',
        reporter: reporterMatch ? reporterMatch[1] : 'Unknown User',
        category: categoryMatch ? categoryMatch[1].trim() : 'Unknown Category',
        details: detailsMatch ? detailsMatch[1].trim() : '',
        reviewId: n.meta?.reviewId || null,
        listingId: n.listingId || null,
        reporterId: n.meta?.reporterId || null,
        reporterEmail: n.meta?.reporterEmail || null,
        reporterPhone: n.meta?.reporterPhone || null,
        reporterRole: n.meta?.reporterRole || null,
        createdAt: n.createdAt,
        isRead: n.isRead,
      };
    };
    
    const parsedReport = parseReviewReportFromNotification(testNotification);
    console.log('Parsed report:', JSON.stringify(parsedReport, null, 2));
    
    // Clean up test notification
    await Notification.findByIdAndDelete(testNotification._id);
    console.log('Test notification cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testReviewReportCreation();
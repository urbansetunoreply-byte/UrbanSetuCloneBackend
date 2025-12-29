import express from "express";
import CallHistory from "../models/callHistory.model.js";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import { verifyToken } from '../utils/verify.js';
import { sendCallInitiatedEmail, sendCallMissedEmail, sendCallEndedEmail, sendAdminCallTerminationEmail } from '../utils/emailService.js';

const router = express.Router();

// Generate unique call ID
const generateCallId = () => {
  return `CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to format duration
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// GET: Get call history for user
router.get("/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId, limit = 50, page = 1 } = req.query;

    const query = {
      $or: [{ callerId: userId }, { receiverId: userId }]
    };

    if (appointmentId) {
      query.appointmentId = appointmentId;
    }

    const calls = await CallHistory.find(query)
      .populate('callerId', 'username email')
      .populate('receiverId', 'username email')
      .populate('appointmentId', 'propertyName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await CallHistory.countDocuments(query);

    res.json({
      calls,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error("Error fetching call history:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Get call history for specific appointment
router.get("/history/:appointmentId", verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this appointment
    const appointment = await Booking.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.buyerId.toString() !== userId &&
      appointment.sellerId.toString() !== userId &&
      req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const calls = await CallHistory.find({ appointmentId })
      .populate('callerId', 'username email')
      .populate('receiverId', 'username email')
      .sort({ createdAt: -1 });

    res.json({ calls });
  } catch (err) {
    console.error("Error fetching appointment call history:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE: Delete all call history for a specific appointment (permanent)
router.delete("/history/:appointmentId", verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Booking.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      appointment.buyerId.toString() !== userId &&
      appointment.sellerId.toString() !== userId &&
      req.user.role !== "admin" &&
      req.user.role !== "rootadmin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await CallHistory.deleteMany({ appointmentId });

    res.json({ success: true, message: "Call history deleted for this appointment." });
  } catch (err) {
    console.error("Error deleting appointment call history:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE: Delete a single call history record for an appointment (permanent)
router.delete("/history/:appointmentId/:callId", verifyToken, async (req, res) => {
  try {
    const { appointmentId, callId } = req.params;
    const userId = req.user.id;

    const appointment = await Booking.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      appointment.buyerId.toString() !== userId &&
      appointment.sellerId.toString() !== userId &&
      req.user.role !== "admin" &&
      req.user.role !== "rootadmin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const call = await CallHistory.findOne({
      appointmentId,
      $or: [{ _id: callId }, { callId }],
    });

    if (!call) {
      return res.status(404).json({ message: "Call history record not found" });
    }

    await CallHistory.deleteOne({ _id: call._id });

    res.json({ success: true, message: "Call history record deleted." });
  } catch (err) {
    console.error("Error deleting single call history record:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Admin - Get all call history with stats
router.get("/admin/history", verifyToken, async (req, res) => {
  try {
    // Check admin authorization
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { callType, status, limit = 100, page = 1 } = req.query;

    const query = {};
    if (callType && callType !== 'all') {
      query.callType = callType;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const calls = await CallHistory.find(query)
      .populate('callerId', 'username email')
      .populate('receiverId', 'username email')
      .populate('appointmentId', 'propertyName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Calculate statistics
    const total = await CallHistory.countDocuments({});
    const audioCount = await CallHistory.countDocuments({ callType: 'audio' });
    const videoCount = await CallHistory.countDocuments({ callType: 'video' });
    const missedCount = await CallHistory.countDocuments({ status: 'missed' });

    // Calculate average duration for ended calls
    const endedCalls = await CallHistory.find({ status: 'ended', duration: { $gt: 0 } });
    const avgDuration = endedCalls.length > 0
      ? Math.floor(endedCalls.reduce((sum, call) => sum + call.duration, 0) / endedCalls.length)
      : 0;

    res.json({
      calls,
      stats: {
        total,
        audio: audioCount,
        video: videoCount,
        missed: missedCount,
        averageDuration: avgDuration
      },
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error("Error fetching admin call history:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: End call (manual or automatic)
router.post("/end", verifyToken, async (req, res) => {
  try {
    const { callId } = req.body;
    const userId = req.user.id;

    const call = await CallHistory.findOne({ callId });
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    // Check authorization
    if (call.callerId.toString() !== userId &&
      call.receiverId.toString() !== userId &&
      req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (call.status === 'ended') {
      return res.json({ message: "Call already ended", call });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime - call.startTime) / 1000);

    call.status = 'ended';
    call.endTime = endTime;
    call.duration = duration;
    call.endedBy = userId;
    await call.save();

    // Emit call ended event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${call.callerId}`).emit('call-ended', { callId, duration });
      io.to(`user_${call.receiverId}`).emit('call-ended', { callId, duration });
      io.to(`appointment_${call.appointmentId}`).emit('call-ended', { callId, duration });
    }

    // Send call ended email to both parties
    try {
      const caller = await User.findById(call.callerId);
      const receiver = await User.findById(call.receiverId);
      const appointment = await Booking.findById(call.appointmentId)
        .populate('listingId', 'name');

      if (caller && receiver && appointment) {
        // Check if caller is admin
        const isCallerAdmin = caller.role === 'admin' || caller.role === 'rootadmin';
        const isReceiverAdmin = receiver.role === 'admin' || receiver.role === 'rootadmin';

        await sendCallEndedEmail(caller.email, {
          callType: call.callType,
          duration: formatDuration(duration),
          callerName: caller.username,
          receiverName: receiver.username,
          propertyName: appointment.listingId?.name || appointment.propertyName,
          appointmentId: call.appointmentId.toString(),
          isReceiverAdmin: isCallerAdmin
        });

        await sendCallEndedEmail(receiver.email, {
          callType: call.callType,
          duration: formatDuration(duration),
          callerName: caller.username,
          receiverName: receiver.username,
          propertyName: appointment.listingId?.name || appointment.propertyName,
          appointmentId: call.appointmentId.toString(),
          isReceiverAdmin: isReceiverAdmin
        });
      }
    } catch (emailError) {
      console.error("Error sending call ended email:", emailError);
    }

    res.json({ message: "Call ended", call });
  } catch (err) {
    console.error("Error ending call:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Admin - Send termination notification emails
router.post("/admin/terminate-notification", verifyToken, async (req, res) => {
  try {
    // Check admin authorization
    if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    const {
      appointmentId,
      callId,
      buyerId,
      sellerId,
      buyerEmail,
      sellerEmail,
      buyerName,
      sellerName,
      propertyName,
      reason,
      appointmentDate,
      appointmentTime
    } = req.body;

    // Validate required fields
    if (!buyerEmail || !sellerEmail || !propertyName) {
      return res.status(400).json({
        message: "Missing required fields: buyerEmail, sellerEmail, and propertyName are required"
      });
    }

    console.log('Sending termination emails to buyer and seller...');

    // Send email to buyer
    const buyerEmailResult = await sendAdminCallTerminationEmail(
      buyerEmail,
      buyerName || 'Buyer',
      {
        propertyName,
        reason: reason || 'Administrative action',
        appointmentDate: appointmentDate || new Date(),
        appointmentTime: appointmentTime || 'N/A',
        otherPartyName: sellerName || 'Seller',
        isForBuyer: true
      }
    );

    // Send email to seller
    const sellerEmailResult = await sendAdminCallTerminationEmail(
      sellerEmail,
      sellerName || 'Seller',
      {
        propertyName,
        reason: reason || 'Administrative action',
        appointmentDate: appointmentDate || new Date(),
        appointmentTime: appointmentTime || 'N/A',
        otherPartyName: buyerName || 'Buyer',
        isForBuyer: false
      }
    );

    // Check if both emails were sent successfully
    const buyerSuccess = buyerEmailResult?.success || false;
    const sellerSuccess = sellerEmailResult?.success || false;

    if (buyerSuccess && sellerSuccess) {
      console.log('✅ Termination emails sent successfully to both parties');
      return res.json({
        success: true,
        message: "Termination emails sent successfully to both buyer and seller",
        buyerEmailSent: true,
        sellerEmailSent: true
      });
    } else if (buyerSuccess || sellerSuccess) {
      console.warn('⚠️ Partial success - one email failed');
      return res.status(207).json({
        success: false,
        message: "Partial success - one or more emails failed",
        buyerEmailSent: buyerSuccess,
        sellerEmailSent: sellerSuccess,
        errors: {
          buyer: buyerSuccess ? null : buyerEmailResult?.error,
          seller: sellerSuccess ? null : sellerEmailResult?.error
        }
      });
    } else {
      console.error('❌ Both emails failed');
      return res.status(500).json({
        success: false,
        message: "Failed to send termination emails to both parties",
        buyerEmailSent: false,
        sellerEmailSent: false,
        errors: {
          buyer: buyerEmailResult?.error || 'Unknown error',
          seller: sellerEmailResult?.error || 'Unknown error'
        }
      });
    }

  } catch (err) {
    console.error("Error sending termination notification emails:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while sending termination emails",
      error: err.message
    });
  }
});

export { generateCallId };
export default router;


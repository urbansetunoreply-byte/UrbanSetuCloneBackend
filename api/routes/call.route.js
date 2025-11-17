import express from "express";
import CallHistory from "../models/callHistory.model.js";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import { verifyToken } from '../utils/verify.js';
import { sendCallInitiatedEmail, sendCallMissedEmail, sendCallEndedEmail } from '../utils/emailService.js';

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

// GET: Admin - Get all call history with stats
router.get("/admin/calls/history", verifyToken, async (req, res) => {
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
        await sendCallEndedEmail(caller.email, {
          callType: call.callType,
          duration: formatDuration(duration),
          receiverName: receiver.username,
          propertyName: appointment.listingId?.name || appointment.propertyName
        });
        
        await sendCallEndedEmail(receiver.email, {
          callType: call.callType,
          duration: formatDuration(duration),
          callerName: caller.username,
          propertyName: appointment.listingId?.name || appointment.propertyName
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

export { generateCallId };
export default router;


# Audio/Video Calls Implementation Plan - WhatsApp Style

## 📋 Table of Contents
1. [Overview: How WhatsApp-Style Calls Work](#overview)
2. [Architecture & Technology Stack](#architecture)
3. [Complete Requirements List](#requirements)
4. [Step-by-Step Implementation Guide](#implementation)
5. [Database Models](#database)
6. [Backend APIs](#backend)
7. [Frontend Components](#frontend)
8. [Email Notifications](#email)
9. [Admin Features](#admin)
10. [Testing & Deployment](#testing)

---

## 📱 Overview: How WhatsApp-Style Calls Work

### Key Concepts:

**1. WebRTC (Web Real-Time Communication)**
- Direct peer-to-peer connection between browsers/devices
- No server in the media path (low latency, efficient)
- Handles audio/video streaming, encoding/decoding
- Works through NAT/firewalls with ICE (Interactive Connectivity Establishment)

**2. Signaling (Socket.IO)**
- WebRTC needs a signaling server to exchange connection information
- Used for: call initiation, call acceptance/rejection, ICE candidates, session description protocol (SDP)
- Your existing Socket.IO setup is perfect for this

**3. Call Flow (Like WhatsApp)**
```
User A clicks "Video Call" 
  → Frontend sends "call-initiate" via Socket.IO
  → Backend creates call record, sends notification to User B
  → User B receives "incoming-call" event
  → User B accepts → Exchange WebRTC offers/answers via Socket.IO
  → Establish peer-to-peer connection
  → Start audio/video streaming directly
  → When call ends → Save call history, send email notification
```

---

## 🏗️ Architecture & Technology Stack

### Technology Stack:
1. **WebRTC API** (Browser native - no library needed)
   - `RTCPeerConnection` - Main WebRTC API
   - `getUserMedia()` - Access microphone/camera
   - `MediaStream` - Handle audio/video streams

2. **Socket.IO** (Already in place ✅)
   - Signaling server for WebRTC
   - Real-time notifications
   - Call state management

3. **Simple Peer** (Optional - simplifies WebRTC, recommended)
   - `npm install simple-peer`
   - Easier WebRTC wrapper
   - Handles ICE candidates automatically

4. **Backend Requirements:**
   - Socket.IO server (✅ Already exists)
   - Call history storage (MongoDB)
   - Email service (✅ Already exists)
   - STUN/TURN servers (for NAT traversal)

---

## ✅ Complete Requirements List

### 1. Database Requirements:
- [ ] Create `CallHistory` model (MongoDB)
- [ ] Store: caller, receiver, appointmentId, callType (audio/video), startTime, endTime, duration, status (initiated/accepted/rejected/ended/missed)

### 2. Backend Requirements:
- [ ] Socket.IO events: `call-initiate`, `call-accept`, `call-reject`, `call-end`, `call-cancel`, `webrtc-offer`, `webrtc-answer`, `ice-candidate`
- [ ] REST APIs: 
  - `GET /api/calls/history` - Get call history
  - `GET /api/calls/history/:appointmentId` - Get calls for appointment
  - `POST /api/calls/end` - Manually end call (admin)
- [ ] Email notification service: Send email when call is made/received/ended
- [ ] STUN server configuration (public STUN servers available)

### 3. Frontend Requirements:
- [ ] Call button in chatbox (audio & video icons)
- [ ] Incoming call modal/popup
- [ ] Active call screen with controls (mute, video on/off, end call)
- [ ] Call history page: `/user/call-history`
- [ ] Call history in chatbox (show past calls in chat)
- [ ] Admin call history page: `/admin/call-history`

### 4. WebRTC Requirements:
- [ ] Media permissions (microphone/camera access)
- [ ] Peer connection establishment
- [ ] ICE candidate exchange
- [ ] Audio/video stream handling
- [ ] Call state management (connecting, ringing, active, ended)

### 5. UI/UX Requirements:
- [ ] Call buttons in chat header (similar to WhatsApp)
- [ ] Incoming call notification with caller name/avatar
- [ ] Call duration timer
- [ ] Mute/unmute button
- [ ] Video on/off toggle
- [ ] Screen sharing option (optional)
- [ ] Call quality indicators

### 6. Email Notifications:
- [ ] Email when call is initiated (to receiver)
- [ ] Email when call is missed (to receiver)
- [ ] Email when call ends (summary to both parties)
- [ ] Email when call is declined (to caller)

---

## 🛠️ Step-by-Step Implementation Guide

### **PHASE 1: Database Setup** (1-2 hours)

#### Step 1.1: Create CallHistory Model
```javascript
// api/models/callHistory.model.js
import mongoose from "mongoose";

const callHistorySchema = new mongoose.Schema({
  callId: { type: String, unique: true, required: true }, // Unique call ID
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true 
  },
  callerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  callType: { 
    type: String, 
    enum: ['audio', 'video'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['initiated', 'ringing', 'accepted', 'rejected', 'ended', 'missed', 'cancelled'], 
    default: 'initiated' 
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // Duration in seconds
  callerIP: { type: String },
  receiverIP: { type: String },
  // Optional: Record call (if legal)
  recordingUrl: { type: String },
  recordingEnabled: { type: Boolean, default: false },
  // Call quality metrics (optional)
  qualityMetrics: {
    averageLatency: Number,
    packetLoss: Number,
    jitter: Number
  },
  // Metadata
  callerDevice: String, // Browser, mobile app, etc.
  receiverDevice: String,
  endedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // Who ended the call
  // Admin notes
  adminNotes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

callHistorySchema.index({ appointmentId: 1, createdAt: -1 });
callHistorySchema.index({ callerId: 1, createdAt: -1 });
callHistorySchema.index({ receiverId: 1, createdAt: -1 });

const CallHistory = mongoose.model("CallHistory", callHistorySchema);
export default CallHistory;
```

---

### **PHASE 2: Backend API Setup** (3-4 hours)

#### Step 2.1: Create Call Route (`api/routes/call.route.js`)
```javascript
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

export default router;
```

#### Step 2.2: Add Socket.IO Call Handlers (`api/index.js` or separate file)
```javascript
// Add to api/index.js in io.on('connection', ...)

// Store active calls (in-memory)
const activeCalls = new Map(); // callId -> { callerSocketId, receiverSocketId, appointmentId, ... }

socket.on('call-initiate', async ({ appointmentId, receiverId, callType }) => {
  try {
    const callerId = socket.user?._id?.toString();
    if (!callerId) {
      return socket.emit('call-error', { message: 'Not authenticated' });
    }
    
    // Validate appointment and authorization
    const appointment = await Booking.findById(appointmentId);
    if (!appointment) {
      return socket.emit('call-error', { message: 'Appointment not found' });
    }
    
    // Check if caller is buyer or seller
    if (appointment.buyerId.toString() !== callerId && 
        appointment.sellerId.toString() !== callerId) {
      return socket.emit('call-error', { message: 'Unauthorized' });
    }
    
    // Determine receiver
    const actualReceiverId = appointment.buyerId.toString() === callerId 
      ? appointment.sellerId.toString() 
      : appointment.buyerId.toString();
    
    if (actualReceiverId !== receiverId) {
      return socket.emit('call-error', { message: 'Invalid receiver' });
    }
    
    // Create call record
    const callId = generateCallId();
    const callHistory = new CallHistory({
      callId,
      appointmentId,
      callerId,
      receiverId: actualReceiverId,
      callType,
      status: 'initiated',
      callerIP: socket.handshake.address
    });
    await callHistory.save();
    
    // Store active call
    activeCalls.set(callId, {
      callerSocketId: socket.id,
      receiverId: actualReceiverId,
      appointmentId,
      callType,
      startTime: new Date()
    });
    
    // Send call invitation to receiver
    io.to(`user_${actualReceiverId}`).emit('incoming-call', {
      callId,
      appointmentId,
      callerId,
      callType,
      callerName: socket.user?.username || 'Unknown'
    });
    
    // Send confirmation to caller
    socket.emit('call-initiated', { callId, status: 'ringing' });
    
    // Set timeout for missed call (30 seconds)
    setTimeout(async () => {
      const call = await CallHistory.findOne({ callId });
      if (call && call.status === 'initiated' || call.status === 'ringing') {
        call.status = 'missed';
        call.endTime = new Date();
        await call.save();
        
        // Remove from active calls
        activeCalls.delete(callId);
        
        // Emit missed call event
        io.to(`user_${callerId}`).emit('call-missed', { callId });
        io.to(`user_${actualReceiverId}`).emit('call-missed', { callId });
        
        // Send missed call email
        try {
          const receiver = await User.findById(actualReceiverId);
          const appointment = await Booking.findById(appointmentId)
            .populate('listingId', 'name');
          const caller = await User.findById(callerId);
          
          if (receiver && appointment && caller) {
            await sendCallMissedEmail(receiver.email, {
              callType,
              callerName: caller.username,
              propertyName: appointment.listingId?.name || appointment.propertyName,
              appointmentDate: appointment.date
            });
          }
        } catch (emailError) {
          console.error("Error sending missed call email:", emailError);
        }
      }
    }, 30000); // 30 seconds timeout
    
  } catch (err) {
    console.error("Error initiating call:", err);
    socket.emit('call-error', { message: 'Failed to initiate call' });
  }
});

socket.on('call-accept', async ({ callId }) => {
  try {
    const receiverId = socket.user?._id?.toString();
    if (!receiverId) {
      return socket.emit('call-error', { message: 'Not authenticated' });
    }
    
    const call = await CallHistory.findOne({ callId });
    if (!call) {
      return socket.emit('call-error', { message: 'Call not found' });
    }
    
    if (call.receiverId.toString() !== receiverId) {
      return socket.emit('call-error', { message: 'Unauthorized' });
    }
    
    // Update call status
    call.status = 'accepted';
    call.receiverIP = socket.handshake.address;
    await call.save();
    
    // Update active call
    const activeCall = activeCalls.get(callId);
    if (activeCall) {
      activeCall.receiverSocketId = socket.id;
      activeCalls.set(callId, activeCall);
      
      // Notify caller that call was accepted
      io.to(activeCall.callerSocketId).emit('call-accepted', {
        callId,
        receiverSocketId: socket.id
      });
      
      // Notify receiver
      socket.emit('call-accepted', { callId });
      
      // Send call initiated email to receiver
      try {
        const caller = await User.findById(call.callerId);
        const appointment = await Booking.findById(call.appointmentId)
          .populate('listingId', 'name');
        
        if (caller && appointment) {
          await sendCallInitiatedEmail(call.receiverId, {
            callType: call.callType,
            callerName: caller.username,
            propertyName: appointment.listingId?.name || appointment.propertyName
          });
        }
      } catch (emailError) {
        console.error("Error sending call initiated email:", emailError);
      }
    }
  } catch (err) {
    console.error("Error accepting call:", err);
    socket.emit('call-error', { message: 'Failed to accept call' });
  }
});

socket.on('call-reject', async ({ callId }) => {
  try {
    const receiverId = socket.user?._id?.toString();
    const call = await CallHistory.findOne({ callId });
    
    if (call && call.receiverId.toString() === receiverId) {
      call.status = 'rejected';
      call.endTime = new Date();
      await call.save();
      
      const activeCall = activeCalls.get(callId);
      if (activeCall) {
        io.to(activeCall.callerSocketId).emit('call-rejected', { callId });
        activeCalls.delete(callId);
      }
    }
  } catch (err) {
    console.error("Error rejecting call:", err);
  }
});

socket.on('call-cancel', async ({ callId }) => {
  try {
    const callerId = socket.user?._id?.toString();
    const call = await CallHistory.findOne({ callId });
    
    if (call && call.callerId.toString() === callerId && call.status === 'initiated') {
      call.status = 'cancelled';
      call.endTime = new Date();
      await call.save();
      
      const activeCall = activeCalls.get(callId);
      if (activeCall) {
        io.to(`user_${call.receiverId}`).emit('call-cancelled', { callId });
        activeCalls.delete(callId);
      }
    }
  } catch (err) {
    console.error("Error cancelling call:", err);
  }
});

// WebRTC signaling events
socket.on('webrtc-offer', ({ callId, offer }) => {
  const activeCall = activeCalls.get(callId);
  if (activeCall && socket.id === activeCall.callerSocketId) {
    io.to(activeCall.receiverSocketId).emit('webrtc-offer', { callId, offer });
  }
});

socket.on('webrtc-answer', ({ callId, answer }) => {
  const activeCall = activeCalls.get(callId);
  if (activeCall && socket.id === activeCall.receiverSocketId) {
    io.to(activeCall.callerSocketId).emit('webrtc-answer', { callId, answer });
  }
});

socket.on('ice-candidate', ({ callId, candidate }) => {
  const activeCall = activeCalls.get(callId);
  if (activeCall) {
    const targetSocketId = socket.id === activeCall.callerSocketId 
      ? activeCall.receiverSocketId 
      : activeCall.callerSocketId;
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', { callId, candidate });
    }
  }
});

// Cleanup on disconnect
socket.on('disconnect', () => {
  // End any active calls
  for (const [callId, activeCall] of activeCalls.entries()) {
    if (activeCall.callerSocketId === socket.id || 
        activeCall.receiverSocketId === socket.id) {
      // Mark call as ended
      CallHistory.findOne({ callId }).then(call => {
        if (call && call.status !== 'ended') {
          const endTime = new Date();
          const duration = Math.floor((endTime - call.startTime) / 1000);
          call.status = 'ended';
          call.endTime = endTime;
          call.duration = duration;
          call.save();
        }
      });
      
      // Notify other party
      const otherSocketId = activeCall.callerSocketId === socket.id 
        ? activeCall.receiverSocketId 
        : activeCall.callerSocketId;
      if (otherSocketId) {
        io.to(otherSocketId).emit('call-ended', { callId });
      }
      
      activeCalls.delete(callId);
    }
  }
});
```

#### Step 2.3: Add Email Service Functions (`api/utils/emailService.js`)
```javascript
// Add these functions to emailService.js

export const sendCallInitiatedEmail = async (toEmail, { callType, callerName, propertyName }) => {
  try {
    const subject = `${callerName} is calling you - ${callType === 'video' ? 'Video' : 'Audio'} Call`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Incoming ${callType === 'video' ? 'Video' : 'Audio'} Call</h2>
        <p><strong>${callerName}</strong> is calling you regarding property: <strong>${propertyName}</strong></p>
        <p>Please check your UrbanSetu chat to answer the call.</p>
        <p style="color: #666; font-size: 12px;">This is an automated notification from UrbanSetu.</p>
      </div>
    `;
    
    await sendEmail(toEmail, subject, html);
  } catch (error) {
    console.error('Error sending call initiated email:', error);
    throw error;
  }
};

export const sendCallMissedEmail = async (toEmail, { callType, callerName, propertyName, appointmentDate }) => {
  try {
    const subject = `Missed ${callType === 'video' ? 'Video' : 'Audio'} Call from ${callerName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Missed Call</h2>
        <p>You missed a ${callType === 'video' ? 'video' : 'audio'} call from <strong>${callerName}</strong>.</p>
        <p><strong>Property:</strong> ${propertyName}</p>
        ${appointmentDate ? `<p><strong>Appointment Date:</strong> ${new Date(appointmentDate).toLocaleDateString()}</p>` : ''}
        <p>You can call back or send a message through your UrbanSetu chat.</p>
        <p style="color: #666; font-size: 12px;">This is an automated notification from UrbanSetu.</p>
      </div>
    `;
    
    await sendEmail(toEmail, subject, html);
  } catch (error) {
    console.error('Error sending missed call email:', error);
    throw error;
  }
};

export const sendCallEndedEmail = async (toEmail, { callType, duration, callerName, receiverName, propertyName }) => {
  try {
    const otherPersonName = receiverName || callerName;
    const subject = `Call Ended - ${callType === 'video' ? 'Video' : 'Audio'} Call Summary`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Call Summary</h2>
        <p>Your ${callType === 'video' ? 'video' : 'audio'} call with <strong>${otherPersonName}</strong> has ended.</p>
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Duration:</strong> ${duration}</p>
        <p>You can view the call history in your UrbanSetu account.</p>
        <p style="color: #666; font-size: 12px;">This is an automated notification from UrbanSetu.</p>
      </div>
    `;
    
    await sendEmail(toEmail, subject, html);
  } catch (error) {
    console.error('Error sending call ended email:', error);
    throw error;
  }
};
```

---

### **PHASE 3: Frontend Implementation** (8-10 hours)

#### Step 3.1: Install Dependencies
```bash
npm install simple-peer  # Optional but recommended for easier WebRTC
```

#### Step 3.2: Create Call Context/Hook (`web/src/hooks/useCall.js` or `web/src/contexts/CallContext.jsx`)
```javascript
// web/src/hooks/useCall.js
import { useState, useRef, useEffect } from 'react';
import { socket } from '../utils/socket';
import SimplePeer from 'simple-peer';

export const useCall = () => {
  const [callState, setCallState] = useState(null); // null, 'initiating', 'ringing', 'active', 'ended'
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Listen for incoming calls
  useEffect(() => {
    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      // Show notification/play sound
    };
    
    const handleCallAccepted = (data) => {
      if (incomingCall && incomingCall.callId === data.callId) {
        setIncomingCall(null);
        startCall(data.callId, 'accepted');
      }
    };
    
    const handleCallRejected = (data) => {
      if (incomingCall && incomingCall.callId === data.callId) {
        setIncomingCall(null);
        endCall();
      }
    };
    
    const handleCallEnded = (data) => {
      endCall();
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('ice-candidate', handleICECandidate);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('ice-candidate', handleICECandidate);
    };
  }, [incomingCall]);

  // Initialize call
  const initiateCall = async (appointmentId, receiverId, callType) => {
    try {
      setCallState('initiating');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: stream
      });
      
      peer.on('signal', (data) => {
        socket.emit('webrtc-offer', {
          callId: activeCall.callId,
          offer: data
        });
      });
      
      peer.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });
      
      peerRef.current = peer;
      
      // Emit call initiation
      socket.emit('call-initiate', {
        appointmentId,
        receiverId,
        callType
      });
      
      setCallState('ringing');
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallState(null);
      throw error;
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === 'video'
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: stream
      });
      
      peer.on('signal', (data) => {
        socket.emit('webrtc-answer', {
          callId: incomingCall.callId,
          answer: data
        });
      });
      
      peer.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });
      
      peerRef.current = peer;
      
      socket.emit('call-accept', { callId: incomingCall.callId });
      
      setCallState('active');
      setIncomingCall(null);
      startCallTimer();
    } catch (error) {
      console.error('Error accepting call:', error);
      rejectCall();
    }
  };

  // Reject call
  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('call-reject', { callId: incomingCall.callId });
      setIncomingCall(null);
    }
    endCall();
  };

  // End call
  const endCall = async () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Stop remote stream
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    
    // Destroy peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    // Stop timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    setCallState(null);
    setCallDuration(0);
    callStartTimeRef.current = null;
    
    // Notify backend
    if (activeCall?.callId) {
      await fetch(`${API_BASE_URL}/api/calls/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ callId: activeCall.callId })
      });
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Start call timer
  const startCallTimer = () => {
    callStartTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      setCallDuration(duration);
    }, 1000);
  };

  return {
    callState,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    callDuration,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  };
};
```

#### Step 3.3: Add Call Buttons to Chatbox (In `MyAppointments.jsx` AppointmentRow)
```javascript
// Add call buttons in chat header
<div className="flex items-center gap-2">
  {/* Audio Call Button */}
  <button
    onClick={() => handleInitiateCall('audio')}
    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
    title="Audio Call"
  >
    <FaPhone />
  </button>
  
  {/* Video Call Button */}
  <button
    onClick={() => handleInitiateCall('video')}
    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
    title="Video Call"
  >
    <FaVideo />
  </button>
</div>
```

#### Step 3.4: Create Incoming Call Modal Component
```javascript
// web/src/components/IncomingCallModal.jsx
import React from 'react';
import { FaPhone, FaVideo, FaTimes } from 'react-icons/fa';

const IncomingCallModal = ({ call, onAccept, onReject }) => {
  if (!call) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 text-center max-w-md w-full mx-4">
        <div className="mb-6">
          <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            {call.callType === 'video' ? (
              <FaVideo className="text-white text-4xl" />
            ) : (
              <FaPhone className="text-white text-4xl" />
            )}
          </div>
          <h3 className="text-2xl font-bold mb-2">{call.callerName}</h3>
          <p className="text-gray-600">
            {call.callType === 'video' ? 'Video' : 'Audio'} Call
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onReject}
            className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <FaTimes className="text-2xl" />
          </button>
          <button
            onClick={onAccept}
            className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600"
          >
            <FaPhone className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
```

#### Step 3.5: Create Active Call Component
```javascript
// web/src/components/ActiveCallModal.jsx
import React from 'react';
import { FaPhone, FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaTimes } from 'react-icons/fa';

const ActiveCallModal = ({ 
  callType, 
  otherPartyName,
  isMuted,
  isVideoEnabled,
  callDuration,
  localVideoRef,
  remoteVideoRef,
  onToggleMute,
  onToggleVideo,
  onEndCall
}) => {
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Remote Video/Audio */}
      <div className="flex-1 relative">
        {callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FaPhone className="text-6xl" />
              </div>
              <h3 className="text-3xl font-bold mb-2">{otherPartyName}</h3>
              <p className="text-xl">{formatDuration(callDuration)}</p>
            </div>
          </div>
        )}
        
        {/* Local Video (Picture-in-Picture) */}
        {callType === 'video' && (
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
      
      {/* Call Controls */}
      <div className="bg-black bg-opacity-50 p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isMuted ? 'bg-red-500' : 'bg-gray-700'
            } text-white hover:bg-gray-600`}
          >
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          
          {/* Video On/Off (only for video calls) */}
          {callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isVideoEnabled ? 'bg-gray-700' : 'bg-red-500'
              } text-white hover:bg-gray-600`}
            >
              {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
            </button>
          )}
          
          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <FaPhone className="rotate-135" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveCallModal;
```

#### Step 3.6: Create Call History Page
```javascript
// web/src/pages/CallHistory.jsx
import React, { useState, useEffect } from 'react';
import { FaPhone, FaVideo, FaClock, FaCheckCircle, FaTimesCircle, FaUser } from 'react-icons/fa';

const CallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, audio, video, missed
  const [appointmentFilter, setAppointmentFilter] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchCallHistory();
  }, [filter, appointmentFilter]);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (appointmentFilter) params.append('appointmentId', appointmentFilter);
      params.append('limit', '50');
      params.append('page', '1');

      const response = await fetch(`${API_BASE_URL}/api/calls/history?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        let filteredCalls = data.calls;
        
        if (filter === 'audio') {
          filteredCalls = filteredCalls.filter(call => call.callType === 'audio');
        } else if (filter === 'video') {
          filteredCalls = filteredCalls.filter(call => call.callType === 'video');
        } else if (filter === 'missed') {
          filteredCalls = filteredCalls.filter(call => call.status === 'missed');
        }
        
        setCalls(filteredCalls);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
      case 'ended':
        return <FaCheckCircle className="text-green-500" />;
      case 'missed':
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Call History</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('audio')}
                className={`px-4 py-2 rounded ${filter === 'audio' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Audio
              </button>
              <button
                onClick={() => setFilter('video')}
                className={`px-4 py-2 rounded ${filter === 'video' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Video
              </button>
              <button
                onClick={() => setFilter('missed')}
                className={`px-4 py-2 rounded ${filter === 'missed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Missed
              </button>
            </div>
          </div>
        </div>

        {/* Call List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading call history...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No call history found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <div key={call._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Call Type Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      call.callType === 'video' ? 'bg-blue-500' : 'bg-green-500'
                    } text-white`}>
                      {call.callType === 'video' ? <FaVideo /> : <FaPhone />}
                    </div>
                    
                    {/* Call Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {call.callerId?.username || 'Unknown'} → {call.receiverId?.username || 'Unknown'}
                        </h3>
                        {getStatusIcon(call.status)}
                      </div>
                      <p className="text-gray-600 text-sm">
                        {call.appointmentId?.propertyName || 'N/A'}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{formatDate(call.startTime)}</span>
                        {call.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <FaClock /> {formatDuration(call.duration)}
                          </span>
                        )}
                        <span className="capitalize">{getStatusText(call.status)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistory;
```

#### Step 3.7: Integrate Call History in Chatbox
```javascript
// Add to MyAppointments.jsx - Show call history in chat messages
const [callHistory, setCallHistory] = useState([]);

// Fetch call history for appointment
useEffect(() => {
  if (appointment?._id) {
    fetch(`${API_BASE_URL}/api/calls/history/${appointment._id}`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.calls) {
          setCallHistory(data.calls);
        }
      })
      .catch(err => console.error('Error fetching call history:', err));
  }
}, [appointment?._id]);

// Render call history in chat
{callHistory.map((call) => (
  <div key={call._id} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg mb-2">
    {call.callType === 'video' ? <FaVideo /> : <FaPhone />}
    <div className="flex-1">
      <p className="text-sm">
        <span className="font-semibold">
          {call.callerId?.username === currentUser?.username ? 'You' : call.callerId?.username}
        </span>
        {' '}called{' '}
        <span className="font-semibold">
          {call.receiverId?.username === currentUser?.username ? 'you' : call.receiverId?.username}
        </span>
      </p>
      <p className="text-xs text-gray-600">
        {new Date(call.startTime).toLocaleString()} • {formatDuration(call.duration)} • {call.status}
      </p>
    </div>
  </div>
))}
```

#### Step 3.8: Add Call Buttons to Chatbox Header
```javascript
// In MyAppointments.jsx AppointmentRow component, add to chat header:
<div className="flex items-center justify-between p-4 border-b">
  <h3 className="font-semibold">Chat with {otherPartyName}</h3>
  <div className="flex items-center gap-2">
    {/* Audio Call Button */}
    <button
      onClick={() => handleInitiateCall('audio')}
      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
      title="Audio Call"
      disabled={callState === 'active' || callState === 'ringing'}
    >
      <FaPhone />
    </button>
    
    {/* Video Call Button */}
    <button
      onClick={() => handleInitiateCall('video')}
      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
      title="Video Call"
      disabled={callState === 'active' || callState === 'ringing'}
    >
      <FaVideo />
    </button>
  </div>
</div>

// Handle initiate call
const handleInitiateCall = async (callType) => {
  try {
    const receiverId = appointment.buyerId._id === currentUser._id 
      ? appointment.sellerId._id 
      : appointment.buyerId._id;
    
    await initiateCall(appointment._id, receiverId, callType);
    setShowActiveCall(true);
  } catch (error) {
    console.error('Error initiating call:', error);
    toast.error('Failed to initiate call. Please check your microphone/camera permissions.');
  }
};
```

#### Step 3.9: Update App.jsx Routes
```javascript
// Add route for call history
import CallHistory from './pages/CallHistory';
import AdminCallHistory from './pages/AdminCallHistory';

// In routes:
<Route path="/call-history" element={<CallHistory />} />
<Route path="/admin/call-history" element={<AdminCallHistory />} />
```

---

## 📧 Email Notifications

### Email Templates Already Defined in Step 2.3

The email service functions (`sendCallInitiatedEmail`, `sendCallMissedEmail`, `sendCallEndedEmail`) are defined in Phase 2, Step 2.3. These will automatically send emails when:
- A call is initiated (to receiver)
- A call is missed (to receiver)
- A call ends (to both parties)

### Integration Points:
- **Call Initiation**: Email sent when `call-initiate` socket event is handled
- **Missed Call**: Email sent after 30-second timeout if call not accepted
- **Call Ended**: Email sent when `call-end` API is called or socket disconnect occurs

---

## 👨‍💼 Admin Features

### **PHASE 4: Admin Call History Page** (2-3 hours)

#### Step 4.1: Create Admin Call History Component
```javascript
// web/src/pages/AdminCallHistory.jsx
import React, { useState, useEffect } from 'react';
import { FaPhone, FaVideo, FaClock, FaCheckCircle, FaTimesCircle, FaUser, FaFilter } from 'react-icons/fa';

const AdminCallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    callType: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [stats, setStats] = useState({
    total: 0,
    audio: 0,
    video: 0,
    missed: 0,
    averageDuration: 0
  });

  useEffect(() => {
    fetchAllCallHistory();
  }, [filters]);

  const fetchAllCallHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.callType !== 'all') params.append('callType', filters.callType);
      if (filters.status !== 'all') params.append('status', filters.status);

      const response = await fetch(`${API_BASE_URL}/api/admin/calls/history?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCalls(data.calls);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin - Call History</h1>
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Calls</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Audio Calls</p>
            <p className="text-2xl font-bold text-green-600">{stats.audio}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Video Calls</p>
            <p className="text-2xl font-bold text-blue-600">{stats.video}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Missed Calls</p>
            <p className="text-2xl font-bold text-red-600">{stats.missed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={filters.callType}
              onChange={(e) => setFilters({ ...filters, callType: e.target.value })}
              className="px-4 py-2 border rounded"
            >
              <option value="all">All Types</option>
              <option value="audio">Audio Only</option>
              <option value="video">Video</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded"
            >
              <option value="all">All Status</option>
              <option value="ended">Ended</option>
              <option value="missed">Missed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Call List Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Call Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receiver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">No calls found</td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {call.callType === 'video' ? (
                        <FaVideo className="text-blue-500" />
                      ) : (
                        <FaPhone className="text-green-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{call.callerId?.username || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{call.receiverId?.username || 'N/A'}</td>
                    <td className="px-6 py-4">{call.appointmentId?.propertyName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(call.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {call.duration > 0 ? formatDuration(call.duration) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        call.status === 'ended' ? 'bg-green-100 text-green-800' :
                        call.status === 'missed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCallHistory;
```

#### Step 4.2: Add Admin Call History API Route
```javascript
// Add to api/routes/call.route.js

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
```

#### Step 4.3: Add Admin Call Monitoring (Optional)
```javascript
// Add real-time call monitoring in AdminAppointments.jsx

useEffect(() => {
  if (socket) {
    const handleCallInitiated = (data) => {
      // Show notification in admin panel
      toast.info(`Call initiated: ${data.callerId} → ${data.receiverId}`);
    };
    
    const handleCallEnded = (data) => {
      // Update call history in admin panel
      fetchAllCallHistory();
    };
    
    socket.on('call-initiated', handleCallInitiated);
    socket.on('call-ended', handleCallEnded);
    
    return () => {
      socket.off('call-initiated', handleCallInitiated);
      socket.off('call-ended', handleCallEnded);
    };
  }
}, [socket]);
```

---

## 🌐 STUN/TURN Server Configuration

### **PHASE 5: WebRTC Server Setup** (1-2 hours)

#### Step 5.1: STUN Server Configuration
```javascript
// For SimplePeer configuration (frontend)
import SimplePeer from 'simple-peer';

// Use public STUN servers (free)
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

// In useCall.js hook:
const peer = new SimplePeer({
  initiator: true,
  trickle: false,
  stream: stream,
  config: {
    iceServers: STUN_SERVERS
  }
});
```

#### Step 5.2: TURN Server (Optional - for difficult networks)
```javascript
// For production, consider using a TURN server for better connectivity
// Services: Twilio, Xirsys, Metered.ca (free tier available)

const TURN_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
  ]
};
```

#### Step 5.3: Environment Variables (Optional)

**Note**: STUN servers are already hardcoded in `useCall.js`. Only configure these if you want to use custom STUN/TURN servers via environment variables.

```javascript
// .env file (in web/ directory)
// For Vite, use VITE_ prefix instead of REACT_APP_
VITE_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
VITE_TURN_SERVER_URL=                  // Optional: Only if you need TURN (e.g., turn:your-server.metered.ca:80)
VITE_TURN_USERNAME=                    // Optional: Your TURN server username
VITE_TURN_CREDENTIAL=                  // Optional: Your TURN server password
```

**How to Get TURN Server Credentials:**
- **Metered.ca** (Free tier): https://www.metered.ca/tools/openrelay/ ⭐ Recommended
- **Twilio**: https://www.twilio.com/try-twilio
- **Xirsys**: https://xirsys.com/
- **Run your own**: Install coturn on a VPS

**See `STUN_TURN_SETUP_GUIDE.md` for detailed instructions.**

**Current Status**: STUN servers are already configured and working. TURN is optional and only needed if you experience connection issues in strict networks.

---

## 🧪 Testing & Deployment

### **PHASE 6: Testing Checklist** (4-6 hours)

#### Step 6.1: Functional Testing
- [ ] **Call Initiation**
  - [ ] Audio call can be initiated from buyer side
  - [ ] Video call can be initiated from buyer side
  - [ ] Audio call can be initiated from seller side
  - [ ] Video call can be initiated from seller side
  - [ ] Call initiation requires microphone/camera permissions
  - [ ] Error handling when permissions denied
  
- [ ] **Call Reception**
  - [ ] Incoming call modal appears for receiver
  - [ ] Call can be accepted
  - [ ] Call can be rejected
  - [ ] Call notification sound plays (optional)
  - [ ] Email notification sent on call initiation
  
- [ ] **Call Management**
  - [ ] Mute/unmute works correctly
  - [ ] Video on/off toggle works
  - [ ] Call duration timer displays correctly
  - [ ] Call can be ended by either party
  - [ ] Local video displays correctly (picture-in-picture)
  - [ ] Remote video/audio streams correctly
  
- [ ] **Call History**
  - [ ] Call history displays in user's call history page
  - [ ] Call history shows in chatbox for appointment
  - [ ] Admin can view all call history
  - [ ] Filters work correctly (audio/video/missed)
  - [ ] Call duration is recorded accurately
  - [ ] Call status is updated correctly

#### Step 6.2: Edge Cases Testing
- [ ] **Network Issues**
  - [ ] Call handles disconnection gracefully
  - [ ] Reconnection attempt on network restore
  - [ ] Call marked as ended on disconnect
  - [ ] Email notification sent on disconnect
  
- [ ] **Timeout Scenarios**
  - [ ] Missed call after 30 seconds
  - [ ] Email notification sent for missed call
  - [ ] Call history shows missed call status
  
- [ ] **Multiple Calls**
  - [ ] Cannot initiate multiple calls simultaneously
  - [ ] Second call attempt is blocked if one is active
  - [ ] Previous call ended when new call is initiated
  
- [ ] **Permissions**
  - [ ] Error message when microphone denied
  - [ ] Error message when camera denied (for video)
  - [ ] Call can proceed with audio only if video denied

#### Step 6.3: Cross-Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if supported)
- [ ] Edge
- [ ] Mobile browsers (if applicable)

#### Step 6.4: Performance Testing
- [ ] Call connection time < 5 seconds
- [ ] Low latency during call (< 500ms)
- [ ] No memory leaks after multiple calls
- [ ] CPU usage acceptable during video calls
- [ ] Network bandwidth usage reasonable

#### Step 6.5: Security Testing
- [ ] Only authorized users can initiate calls
- [ ] Only appointment participants can call each other
- [ ] Admin can view all calls
- [ ] Call history is properly secured
- [ ] WebRTC connections are properly secured (DTLS)

---

### **PHASE 7: Deployment Checklist** (2-3 hours)

#### Step 7.1: Backend Deployment
- [ ] Call routes registered in main server file
- [ ] Socket.IO call handlers integrated
- [ ] CallHistory model synced with database
- [ ] Email service configured and tested
- [ ] Environment variables set (API URLs, email config)

#### Step 7.2: Frontend Deployment
- [ ] All call components built and tested
- [ ] Routes added to App.jsx
- [ ] Call buttons integrated in chatbox
- [ ] Dependencies installed (simple-peer)
- [ ] Environment variables configured
- [ ] Build passes without errors

#### Step 7.3: Database Migration
- [ ] CallHistory collection created
- [ ] Indexes created for performance
- [ ] Initial test data inserted (optional)

#### Step 7.4: Monitoring & Logging
- [ ] Call initiation logged
- [ ] Call errors logged
- [ ] WebRTC connection issues logged
- [ ] Email delivery status monitored

#### Step 7.5: Documentation
- [ ] API documentation updated
- [ ] User guide for making calls
- [ ] Admin guide for monitoring calls
- [ ] Troubleshooting guide

---

## 📝 Additional Notes

### Browser Compatibility
- **WebRTC Support**: Most modern browsers support WebRTC
- **Safari**: Limited support, may require polyfills
- **Mobile**: iOS Safari has limitations, may need native app for better support

### Performance Considerations
- **Video Quality**: Adjust video resolution based on network conditions
- **Bandwidth**: Monitor bandwidth usage, especially for video calls
- **Scalability**: Socket.IO server can handle multiple concurrent calls
- **Database**: Index call history for fast queries

### Future Enhancements
1. **Call Recording**: Implement call recording (requires legal compliance)
2. **Screen Sharing**: Add screen sharing capability
3. **Group Calls**: Support multiple participants
4. **Call Transfer**: Transfer calls between appointments
5. **Call Scheduling**: Schedule calls in advance
6. **Mobile App**: Native mobile app for better call experience
7. **Push Notifications**: Push notifications for incoming calls
8. **Call Analytics**: Advanced analytics and reporting

### Legal Considerations
- **Recording**: Check local laws before implementing call recording
- **Privacy**: Ensure GDPR/privacy compliance for call data
- **Consent**: Obtain user consent for microphone/camera access
- **Data Retention**: Define call history retention policy

### Security Best Practices
- **Authentication**: All calls require authentication
- **Authorization**: Verify users can only call within their appointments
- **Encryption**: WebRTC uses DTLS/SRTP for encryption
- **Rate Limiting**: Implement rate limiting for call initiation
- **Input Validation**: Validate all call-related inputs

---

## 🎯 Implementation Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| Phase 1 | Database Setup | 1-2 hours |
| Phase 2 | Backend API Setup | 3-4 hours |
| Phase 3 | Frontend Implementation | 8-10 hours |
| Phase 4 | Admin Features | 2-3 hours |
| Phase 5 | STUN/TURN Setup | 1-2 hours |
| Phase 6 | Testing | 4-6 hours |
| Phase 7 | Deployment | 2-3 hours |
| **Total** | | **21-30 hours** |

---

## 🚀 Quick Start Guide

1. **Install Dependencies**
   ```bash
   cd web
   npm install simple-peer
   ```

2. **Create Database Model**
   - Create `api/models/callHistory.model.js`
   - Sync with MongoDB

3. **Create Backend Routes**
   - Create `api/routes/call.route.js`
   - Register routes in main server file
   - Add Socket.IO handlers

4. **Create Frontend Components**
   - Create `web/src/hooks/useCall.js`
   - Create `web/src/components/IncomingCallModal.jsx`
   - Create `web/src/components/ActiveCallModal.jsx`
   - Create `web/src/pages/CallHistory.jsx`

5. **Integrate in Chatbox**
   - Add call buttons to `MyAppointments.jsx`
   - Add call history display
   - Add admin call history page

6. **Test & Deploy**
   - Test all call flows
   - Deploy backend and frontend
   - Monitor and fix issues

---

## ✅ Final Checklist

- [ ] Database model created and synced
- [ ] Backend API routes implemented
- [ ] Socket.IO handlers integrated
- [ ] Email notifications configured
- [ ] Frontend call hook created
- [ ] Call modals created
- [ ] Call buttons added to chatbox
- [ ] Call history page created
- [ ] Admin call history page created
- [ ] Routes configured in App.jsx
- [ ] STUN servers configured
- [ ] Testing completed
- [ ] Documentation updated
- [ ] Deployed to production

---

**End of Implementation Plan**
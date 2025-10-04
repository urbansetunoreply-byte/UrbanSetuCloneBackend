import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/user.route.js'
import authRouter from './routes/auth.route.js'
import listingRouter from './routes/listing.route.js'
import bookingRouter from "./routes/booking.route.js";
import { registerUserAppointmentsSocket } from './routes/booking.route.js';
import Booking from './models/booking.model.js';
import aboutRouter from "./routes/about.route.js";
import adminRouter from "./routes/admin.route.js";
import contactRouter from "./routes/contact.route.js";
import wishlistRouter from "./routes/wishlist.route.js";
import propertyWatchlistRouter from "./routes/propertyWatchlist.route.js";
import imageFavoriteRouter from "./routes/imageFavorite.route.js";
import notificationRouter from "./routes/notification.route.js";
import requestRouter from "./routes/request.route.js";
import reviewRouter from "./routes/review.route.js";
import aiRouter from "./routes/ai.route.js";
import geminiRouter from "./routes/gemini.route.js";
import chatHistoryRouter from "./routes/chatHistory.route.js";
import uploadRouter from "./routes/upload.route.js";
import paymentRouter from "./routes/payment.route.js";
import sessionRouter from "./routes/session.route.js";
import sessionManagementRouter from "./routes/sessionManagement.route.js";
import fraudRouter from "./routes/fraud.route.js";
import emailMonitorRouter from "./routes/emailMonitor.route.js";
import accountRevocationRouter from "./routes/accountRevocation.route.js";
import appointmentReminderRouter from "./routes/appointmentReminder.route.js";
import priceDropAlertRouter from "./routes/priceDropAlert.route.js";
import statisticsRouter from "./routes/statistics.route.js";
import configRouter from "./routes/config.route.js";
import deploymentRouter from "./routes/deployment-s3.route.js";
import { startScheduler } from "./services/schedulerService.js";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import path from 'path'
import User from './models/user.model.js';
import bcryptjs from 'bcryptjs';

dotenv.config();

console.log("MongoDB URI:", process.env.MONGO);

if (!process.env.MONGO) {
    console.error("Error: MONGO URI is not defined in .env file!");
    process.exit(1);
}

// MongoDB connection options (cleaned)
const mongoOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxPoolSize: 10,
    retryWrites: true,
    w: 'majority',
};

// Function to connect to MongoDB with retry logic (minimal logs)
const connectToMongoDB = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose.connect(process.env.MONGO, mongoOptions);
            console.log("Connected to MongoDB!");
            
            // Run migration to fix refundId index
            await fixRefundIdIndex();
            
            return;
        } catch (error) {
            if (i === retries - 1) {
                console.error("Failed to connect to MongoDB:", error.message);
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

// Migration function to fix refundId index
const fixRefundIdIndex = async () => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('refundrequests');

        // Check if the problematic index exists
        const indexes = await collection.indexes();
        const refundIdIndex = indexes.find(index => index.name === 'refundId_1' && index.unique && !index.sparse);
        
        if (refundIdIndex) {
            console.log("Found problematic refundId index, fixing...");
            
            // Drop the existing unique index on refundId
            await collection.dropIndex('refundId_1');
            console.log("✅ Dropped existing refundId_1 index");
            
            // Create a new sparse unique index on refundId
            await collection.createIndex({ refundId: 1 }, { unique: true, sparse: true });
            console.log("✅ Created new sparse unique index on refundId");
        } else {
            console.log("RefundId index is already correct or doesn't exist");
        }
    } catch (error) {
        console.error("Error during refundId index migration:", error.message);
        // Don't exit the process, just log the error
    }
};

// Connect to MongoDB
connectToMongoDB();

const __dirname=path.resolve();

let PORT = process.env.PORT || 3000;

const app = express();

// Trust proxy headers (needed to get real client IP behind proxies/load balancers)
app.set('trust proxy', true);

// Increase payload size limit for large file uploads
app.use((req, res, next) => {
  if (req.url.includes('/api/deployment/upload')) {
    req.setTimeout(600000); // 10 minutes timeout for file uploads
    res.setTimeout(600000);
  }
  next();
});

// Configure body parsers with appropriate limits for large file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());


const allowedOrigins = [
    'https://urbansetu.vercel.app',
    'http://localhost:5173', // for local development
];

app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.indexOf(origin) !== -1 ||
            /^https:\/\/urbansetu.*\.vercel\.app$/.test(origin)
        ) {
            return callback(null, true);
        }
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-CSRF-Token', 'x-csrf-token', 'X-Csrf-Token']
}));

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'UrbanSetu API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      user: '/api/user',
      listing: '/api/listing',
      bookings: '/api/bookings',
      admin: '/api/admin',
      contact: '/api/contact',
      wishlist: '/api/wishlist',
      about: '/api/about'
    }
  });
});

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true
  }
});

app.set('io', io);

// Make onlineUsers available to routes for checking recipient online status
let onlineUsers = new Set();
let lastSeenTimes = new Map(); // Track last seen times for users
app.set('onlineUsers', onlineUsers);
app.set('lastSeenTimes', lastSeenTimes);

// Register user appointments socket logic for delivered ticks
registerUserAppointmentsSocket(io);

io.use(async (socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
  if (token) {
    try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    const user = await User.findById(decoded.id);
      if (user) {
    socket.user = user;
    socket.join(user._id.toString());
      }
  } catch (error) {
      // Invalid token, treat as public user
    }
  }
  // Allow connection for both public and authenticated users
  next();
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id, 'UserID:', socket.user?._id?.toString());
  // Broadcast forced logout to a specific session
  socket.on('forceLogoutSession', ({ userId, sessionId }) => {
    // Server-originated event: admins will not emit this; backend emits to room directly below
  });

  // Allow server to emit to a particular session room for immediate logout
  // Clients should join a room named by their session id after login
  socket.on('registerSession', ({ sessionId }) => {
    if (sessionId) {
      socket.join(`session_${sessionId}`);
    }
  });

  // Track which user this socket belongs to
  let thisUserId = null;

  // Listen for presence pings
  socket.on('userAppointmentsActive', async ({ userId }) => {
    thisUserId = userId;
    const wasOffline = !onlineUsers.has(userId);
    onlineUsers.add(userId);
    lastSeenTimes.delete(userId); // Remove last seen when user comes online
    
    // IMPORTANT: Join user to their personal room for direct messaging
    socket.join(userId);
    
    io.emit('userOnlineUpdate', { userId, online: true });
    
    // If user was offline and just came online, mark all pending messages as delivered
    if (wasOffline) {
      try {
        // Find all bookings where this user is buyer or seller
        const bookings = await Booking.find({
          $or: [ { buyerId: userId }, { sellerId: userId } ]
        });
        
        for (const appt of bookings) {
          let updated = false;
          for (const comment of appt.comments) {
            // Only mark as delivered if:
            // 1. Comment is not from this user 
            // 2. Comment status is "sent" (meaning it was sent while recipient was offline)
            // 3. Comment is not already delivered or read
            if (comment.sender.toString() !== userId && 
                comment.status === 'sent' && 
                !comment.readBy?.includes(userId)) {
              comment.status = 'delivered';
              comment.deliveredAt = new Date();
              updated = true;
              io.emit('commentDelivered', { appointmentId: appt._id.toString(), commentId: comment._id.toString() });
            }
          }
          if (updated) await appt.save();
        }
      } catch (err) {
        console.error('Error marking comments as delivered when user came online:', err);
      }
    }
    
    if (socket.onlineTimeout) clearTimeout(socket.onlineTimeout);
    socket.onlineTimeout = setTimeout(() => {
      onlineUsers.delete(userId);
      lastSeenTimes.set(userId, new Date().toISOString()); // Store last seen time
      io.emit('userOnlineUpdate', { userId, online: false, lastSeen: lastSeenTimes.get(userId) });
    }, 5000); // 5 seconds of inactivity = offline
  });

  // Listen for admin appointments active
  socket.on('adminAppointmentsActive', async ({ adminId, role }) => {
    thisUserId = adminId;
    
    // IMPORTANT: Join admin to their personal room for direct messaging
    socket.join(adminId);
    
    // Join admin to all appointment rooms to receive real-time updates
    try {
      const allBookings = await Booking.find({});
      
      for (const appt of allBookings) {
        // Join admin to each appointment room
        socket.join(`appointment_${appt._id}`);
      }
      
      // Also join admin to a general admin room
      socket.join(`admin_${adminId}`);
      
      // Store admin socket reference for future use
      socket.adminId = adminId;
      socket.adminRole = role;
      
    } catch (err) {
      console.error('Error joining admin to appointment rooms:', err);
    }
  });

  // Listen for online status checks
  socket.on('checkUserOnline', ({ userId }) => {
    const isOnline = onlineUsers.has(userId);
    const lastSeen = lastSeenTimes.get(userId);
    socket.emit('userOnlineStatus', { userId, online: isOnline, lastSeen });
  });

  socket.on('typing', ({ toUserId, fromUserId, appointmentId }) => {
    io.to(toUserId).emit('typing', { fromUserId, appointmentId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, 'UserID:', socket.user?._id?.toString());
    if (thisUserId) {
      onlineUsers.delete(thisUserId);
      lastSeenTimes.set(thisUserId, new Date().toISOString()); // Store last seen time
      io.emit('userOnlineUpdate', { userId: thisUserId, online: false, lastSeen: lastSeenTimes.get(thisUserId) });
    }
    
    // Clean up admin room memberships
    if (socket.adminId) {
      // Leave all appointment rooms
      Booking.find({}).then(bookings => {
        for (const appt of bookings) {
          socket.leave(`appointment_${appt._id}`);
        }
      }).catch(err => {
        console.error('Error cleaning up admin appointment rooms:', err);
      });
      
      // Leave admin room
      socket.leave(`admin_${socket.adminId}`);
    }
    
    if (socket.onlineTimeout) clearTimeout(socket.onlineTimeout);
  });

  // Example: Listen for a new comment event from client (optional)
  socket.on('newComment', (data) => {
    io.emit('commentUpdate', data);
  });

  // Listen for new appointments to join admin to new appointment rooms
  socket.on('appointmentCreated', (data) => {
    // Find all admin sockets and join them to the new appointment room
    const adminSockets = Array.from(io.sockets.sockets.values()).filter(s => 
      s.user && (s.user.role === 'admin' || s.user.role === 'rootadmin')
    );
    
    for (const adminSocket of adminSockets) {
      adminSocket.join(`appointment_${data.appointment._id}`);
    }
  });
});

// Health check endpoint for Render deployment
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    routes: 'image-favorites-enabled',
    version: '2.0-with-image-favorites'
  });
});

// Simple status endpoint to verify deployment
app.get('/api/status', (req, res) => {
  res.status(200).json({
    server: 'UrbanSetu API',
    status: 'running',
    features: ['image-favorites', 'wishlist', 'bookings', 'listings'],
    imageFavoritesEndpoint: '/api/image-favorites/*',
    timestamp: new Date().toISOString(),
    deploymentVersion: 'v2.0-image-favorites-fix'
  });
});

// Debug endpoint to check routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ 
    message: 'Available routes',
    routes,
    imageFavoritesRegistered: true,
    timestamp: new Date().toISOString()
  });
});

// Register all routes before starting the server
console.log('Registering API routes...');
app.use("/api/user",userRouter);
app.use("/api/auth",authRouter);
app.use("/api/listing",listingRouter)
app.use("/api/bookings", bookingRouter);
app.use("/api/about", aboutRouter);
app.use("/api/admin", adminRouter);
app.use("/api/contact", contactRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/watchlist", propertyWatchlistRouter);
app.use("/api/image-favorites", imageFavoriteRouter);
console.log('✅ Image favorites routes registered at /api/image-favorites');
app.use("/api/notifications", notificationRouter);
app.use("/api/requests", requestRouter);
app.use("/api/review", reviewRouter);
app.use("/api/gemini", geminiRouter);
app.use("/api/chat-history", chatHistoryRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/ai", aiRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/session-management", sessionManagementRouter);
app.use("/api/fraud", fraudRouter);
app.use("/api/email-monitor", emailMonitorRouter);
app.use("/api/auth", accountRevocationRouter);
app.use("/api/appointment-reminders", appointmentReminderRouter);
app.use("/api/price-drop-alerts", priceDropAlertRouter);
app.use("/api/statistics", statisticsRouter);
app.use("/api/config", configRouter);
app.use("/api/deployment", deploymentRouter);
console.log('All API routes registered successfully');

// Catch-all route for 404s - must be after all other routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

const startServer = () => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!!!`);
    
    // Start the appointment reminder scheduler
    startScheduler(app);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
      PORT++;
      startServer();
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer();

// Global error handler (should be after all routes)
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  if (status === 401 || err.message === 'Access token not found') {
    console.info(`[401] ${err.message}`);
    return res.status(401).json({ success: false, message: err.message || 'Unauthorized' });
  }
  if (status >= 400 && status < 500) {
    console.warn(`[${status}] ${err.message}`);
  } else {
    console.error(err.stack || err);
  }
  res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
});

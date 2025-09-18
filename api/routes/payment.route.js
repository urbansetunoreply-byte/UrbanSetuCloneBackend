import express from "express";
import mongoose from "mongoose";
import Payment from "../models/payment.model.js";
import Booking from "../models/booking.model.js";
import Listing from "../models/listing.model.js";
import User from "../models/user.model.js";
import { verifyToken } from '../utils/verify.js';
import crypto from 'crypto';
import { createPayPalOrder, capturePayPalOrder, getPayPalAccessToken } from '../controllers/paypalController.js';

const router = express.Router();

// Generate unique payment ID
const generatePaymentId = () => {
  return 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Generate receipt number
const generateReceiptNumber = () => {
  return 'RCP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
};

// Razorpay removed

// POST: Create payment intent (advance payment for booking)
router.post("/create-intent", verifyToken, async (req, res) => {
  try {
    const { appointmentId, amount, paymentType = 'advance' } = req.body;
    const userId = req.user.id;

    // Validate appointment
    const appointment = await Booking.findById(appointmentId)
      .populate('listingId', 'name regularPrice discountPrice offer')
      .populate('buyerId', 'username email')
      .populate('sellerId', 'username email');

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Check if user is authorized
    if (appointment.buyerId._id.toString() !== userId) {
      return res.status(403).json({ message: "You can only make payments for your own appointments." });
    }

    // Advance amount: Flat $5 per property (updated requirement)
    const listing = appointment.listingId;
    const advanceAmount = 5;
    
    // Create payment record
    const payment = new Payment({
      paymentId: generatePaymentId(),
      appointmentId,
      userId,
      listingId: listing._id,
      amount: advanceAmount,
      paymentType,
      gateway: 'paypal',
      status: 'pending',
      receiptNumber: generateReceiptNumber()
    });

    await payment.save();

    // For PayPal, client will create order using amount. Return necessary info only.
    res.status(201).json({
      message: "Payment intent created successfully",
      payment: payment,
      paypal: { amount: advanceAmount, currency: 'USD' }
    });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Verify payment (PayPal capture webhook-like endpoint)
router.post("/verify", verifyToken, async (req, res) => {
  try {
    const { paymentId, paypalOrderId, clientIp, userAgent } = req.body;

    // Update payment record
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = 'completed';
    payment.gatewayPaymentId = paypalOrderId;
    payment.gatewayOrderId = paypalOrderId;
    payment.gatewaySignature = undefined;
    payment.completedAt = new Date();
    payment.clientIp = clientIp || req.ip;
    payment.userAgent = userAgent || req.headers['user-agent'];

    await payment.save();

    // Update appointment status/payment flags
    await Booking.findByIdAndUpdate(payment.appointmentId, {
      paymentConfirmed: true
    });

    // Generate receipt URL (mock). Fall back to API URL if CLIENT_URL missing
    const baseClient = process.env.CLIENT_URL || process.env.FRONTEND_URL || '';
    const receiptUrl = baseClient
      ? `${baseClient}/receipt/${payment.receiptNumber}`
      : `/api/payments/${payment.paymentId}/receipt`;
    payment.receiptUrl = receiptUrl;
    await payment.save();

    res.status(200).json({
      message: "Payment verified successfully",
      payment: payment,
      receiptUrl: receiptUrl
    });
  } catch (err) {
    console.error("Error verifying payment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Create monthly rent payment
router.post("/monthly-rent", verifyToken, async (req, res) => {
  try {
    const { appointmentId, amount, month, year } = req.body;
    const userId = req.user.id;

    const appointment = await Booking.findById(appointmentId)
      .populate('listingId', 'name regularPrice')
      .populate('buyerId', 'username email');

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.buyerId._id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const payment = new Payment({
      paymentId: generatePaymentId(),
      appointmentId,
      userId,
      listingId: appointment.listingId._id,
      amount,
      paymentType: 'monthly_rent',
      gateway: 'paypal',
      status: 'pending',
      receiptNumber: generateReceiptNumber(),
      metadata: {
        month,
        year,
        rentType: 'monthly'
      }
    });

    await payment.save();

    res.status(201).json({
      message: "Monthly rent payment created",
      payment: payment
    });
  } catch (err) {
    console.error("Error creating monthly rent payment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Create split payment (for shared PG/flatmates)
router.post("/split-payment", verifyToken, async (req, res) => {
  try {
    const { appointmentId, totalAmount, splitDetails } = req.body;
    const userId = req.user.id;

    const appointment = await Booking.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const payment = new Payment({
      paymentId: generatePaymentId(),
      appointmentId,
      userId,
      listingId: appointment.listingId,
      amount: totalAmount,
      paymentType: 'split_payment',
      gateway: 'paypal',
      status: 'pending',
      receiptNumber: generateReceiptNumber(),
      splitPayments: splitDetails.map(split => ({
        userId: split.userId,
        amount: split.amount,
        status: 'pending'
      }))
    });

    await payment.save();

    res.status(201).json({
      message: "Split payment created",
      payment: payment
    });
  } catch (err) {
    console.error("Error creating split payment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Process refund
router.post("/refund", verifyToken, async (req, res) => {
  try {
    const { paymentId, refundAmount, reason } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if user is authorized (buyer, seller, or admin)
    const appointment = await Booking.findById(payment.appointmentId);
    const isBuyer = appointment.buyerId.toString() === userId;
    const isSeller = appointment.sellerId.toString() === userId;
    
    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user.role === 'admin' || user.role === 'rootadmin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to process refund" });
    }

    if (refundAmount > payment.amount) {
      return res.status(400).json({ message: "Refund amount cannot exceed payment amount" });
    }

    // Process refund (mock implementation)
    const refundId = `refund_${Date.now()}`;
    
    payment.refundAmount = refundAmount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    payment.refundId = refundId;
    payment.status = refundAmount === payment.amount ? 'refunded' : 'partially_refunded';

    await payment.save();

    // Update appointment status if fully refunded
    if (payment.status === 'refunded') {
      await Booking.findByIdAndUpdate(payment.appointmentId, {
        status: 'cancelledByAdmin',
        cancelReason: `Payment refunded: ${reason}`,
        paymentRefunded: true
      });
    }

    res.status(200).json({
      message: "Refund processed successfully",
      refundId: refundId,
      refundAmount: refundAmount
    });
  } catch (err) {
    console.error("Error processing refund:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Get payment history for user
router.get("/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, paymentType, appointmentId } = req.query;

    let query = { userId };
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    if (appointmentId) query.appointmentId = appointmentId;
    
    const payments = await Payment.find(query)
      .populate('appointmentId', 'propertyName date status')
      .populate('listingId', 'name address')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error("Error fetching payment history:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Get payment details by ID
router.get("/:paymentId", verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({ paymentId })
      .populate('appointmentId', 'propertyName date status buyerId sellerId')
      .populate('listingId', 'name address regularPrice')
      .populate('userId', 'username email');

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check authorization
    const appointment = payment.appointmentId;
    const isBuyer = appointment.buyerId._id.toString() === userId;
    const isSeller = appointment.sellerId._id.toString() === userId;
    const user = await User.findById(userId);
    const isAdmin = user.role === 'admin' || user.role === 'rootadmin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json({ payment });
  } catch (err) {
    console.error("Error fetching payment details:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Get payment statistics (admin only)
router.get("/stats/overview", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (user.role !== 'admin' && user.role !== 'rootadmin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const stats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalRefunds: { $sum: '$refundAmount' },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    const monthlyStats = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      overview: stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        totalRefunds: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0
      },
      monthlyStats
    });
  } catch (err) {
    console.error("Error fetching payment stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

// PayPal helper endpoints
router.post('/paypal/create-order', verifyToken, createPayPalOrder);
router.post('/paypal/capture-order', verifyToken, capturePayPalOrder);

// PayPal debug endpoint to verify credentials and token acquisition
router.get('/paypal/debug', verifyToken, async (req, res) => {
  try {
    const clientIdMasked = process.env.PAYPAL_CLIENT_ID
      ? process.env.PAYPAL_CLIENT_ID.slice(0, 6) + '...' + process.env.PAYPAL_CLIENT_ID.slice(-4)
      : null;
    const baseUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
    const hasSecret = Boolean(process.env.PAYPAL_SECRET);
    const { accessToken } = await getPayPalAccessToken();
    return res.json({
      ok: true,
      baseUrl,
      clientIdMasked,
      hasSecret,
      tokenSample: accessToken ? accessToken.slice(0, 8) + '...' : null
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

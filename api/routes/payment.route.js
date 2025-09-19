import express from "express";
import mongoose from "mongoose";
import Payment from "../models/payment.model.js";
import Booking from "../models/booking.model.js";
import Listing from "../models/listing.model.js";
import User from "../models/user.model.js";
import { verifyToken } from '../utils/verify.js';
import crypto from 'crypto';
import { createPayPalOrder, capturePayPalOrder, getPayPalAccessToken } from '../controllers/paypalController.js';
import fetch from 'node-fetch';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Generate unique payment ID
const generatePaymentId = () => {
  return 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Generate receipt number
const generateReceiptNumber = () => {
  return 'RCP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
};

// Razorpay helpers
const getRazorpayAuthHeader = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Missing Razorpay credentials. Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.');
  }
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  return { keyId, authHeader: `Basic ${auth}` };
};

// POST: Create payment intent (advance payment for booking)
router.post("/create-intent", verifyToken, async (req, res) => {
  try {
    const { appointmentId, amount, paymentType = 'advance', gateway = 'paypal' } = req.body;
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

    const listing = appointment.listingId;
    // Determine gateway and amounts
    if (gateway === 'razorpay') {
      // INR ₹100 advance via Razorpay
      const advanceAmountInr = 100; // rupees
      const payment = new Payment({
        paymentId: generatePaymentId(),
        appointmentId,
        userId,
        listingId: listing._id,
        amount: advanceAmountInr,
        currency: 'INR',
        paymentType,
        gateway: 'razorpay',
        status: 'pending',
        receiptNumber: generateReceiptNumber()
      });
      await payment.save();

      // Create Razorpay order (amount in paise)
      const { keyId, authHeader } = getRazorpayAuthHeader();
      const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          amount: advanceAmountInr * 100,
          currency: 'INR',
          receipt: payment.receiptNumber,
          payment_capture: 1,
          notes: { appointmentId: String(appointmentId), paymentId: payment.paymentId }
        })
      });
      const orderText = await orderRes.text();
      let order;
      try { order = JSON.parse(orderText); } catch (e) {
        console.error('Razorpay create-order non-JSON:', orderText);
        return res.status(500).json({ message: 'Error creating Razorpay order', details: orderText });
      }
      if (!orderRes.ok) {
        console.error('Razorpay create-order error:', order);
        return res.status(500).json({ message: 'Error creating Razorpay order', details: order });
      }
      payment.gatewayOrderId = order.id;
      await payment.save();

      return res.status(201).json({
        message: 'Payment intent (Razorpay) created successfully',
        payment,
        razorpay: { orderId: order.id, amount: advanceAmountInr * 100, currency: 'INR', keyId }
      });
    } else {
      // Default PayPal USD $5 advance
      const advanceAmountUsd = 5;
      const payment = new Payment({
        paymentId: generatePaymentId(),
        appointmentId,
        userId,
        listingId: listing._id,
        amount: advanceAmountUsd,
        currency: 'USD',
        paymentType,
        gateway: 'paypal',
        status: 'pending',
        receiptNumber: generateReceiptNumber()
      });
      await payment.save();
      return res.status(201).json({
        message: 'Payment intent created successfully',
        payment,
        paypal: { amount: advanceAmountUsd, currency: 'USD' }
      });
    }
  } catch (err) {
    console.error("Error creating payment intent:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Stream PDF receipt
router.get('/:paymentId/receipt', verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findOne({ paymentId })
      .populate('appointmentId', 'propertyName date time status buyerId sellerId')
      .populate('listingId', 'name address')
      .populate('userId', 'username email');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Authorization: buyer, seller, or admin
    const user = await User.findById(req.user.id);
    const isAdmin = user && (user.role === 'admin' || user.role === 'rootadmin');
    const appt = payment.appointmentId;
    const isBuyer = appt && ((appt.buyerId?._id || appt.buyerId)?.toString() === req.user.id);
    const isSeller = appt && ((appt.sellerId?._id || appt.sellerId)?.toString() === req.user.id);
    if (!isAdmin && !isBuyer && !isSeller) return res.status(403).json({ message: 'Unauthorized' });

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt_${payment.paymentId}.pdf"`);
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    doc.on('error', (e) => {
      try { res.end(); } catch {}
    });
    const stream = doc.pipe(res);
    stream.on('error', () => { try { res.end(); } catch {} });

    // Header
    doc.fontSize(20).fillColor('#1f2937').text('UrbanSetu Payment Receipt', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#6b7280').text(new Date().toLocaleString('en-IN')); doc.moveDown();

    // Payment summary
    const currencySymbol = (payment.currency || 'USD') === 'INR' ? '₹' : '$';
    const amountText = `${currencySymbol} ${Number(payment.amount).toFixed(2)}`;
    doc.fontSize(12).fillColor('#111827').text(`Payment ID: ${payment.paymentId}`);
    doc.text(`Status: ${payment.status}${payment.status === 'completed' ? '' : ' (Not Completed)'}`);
    doc.text(`Gateway: ${payment.gateway?.toUpperCase()}`);
    doc.text(`Amount: ${amountText}`);
    if (payment.refundAmount > 0) doc.text(`Refunded: ${currencySymbol} ${Number(payment.refundAmount).toFixed(2)}`);
    doc.moveDown();

    // Appointment/listing info
    doc.fontSize(12).text(`Property: ${payment.appointmentId?.propertyName || payment.listingId?.name || 'N/A'}`);
    if (payment.appointmentId?.date) doc.text(`Appointment Date: ${new Date(payment.appointmentId.date).toLocaleDateString('en-IN')}`);
    if (payment.appointmentId?.time) doc.text(`Appointment Time: ${payment.appointmentId.time}`);
    doc.text(`Buyer: ${payment.userId?.username || ''}`);
    doc.text(`Generated For: ${user.username || user.email}`);
    doc.moveDown();

    // Trust/verification note
    let note = '';
    if (payment.gateway === 'razorpay') {
      note = payment.status === 'completed' ? 'Paid via Razorpay (verified)' : 'Pending via Razorpay';
    } else if (payment.gateway === 'paypal') {
      note = payment.status === 'completed' ? 'Paid via PayPal (verified)' : 'Pending via PayPal';
    } else {
      note = payment.status === 'completed' ? 'Marked paid by Admin (approved)' : 'Marked pending by Admin';
    }
    doc.fontSize(11).fillColor('#065f46').text(note);

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#6b7280').text('This is a system-generated receipt from UrbanSetu.', { align: 'center' });

    doc.end();
  } catch (e) {
    console.error('Receipt PDF error:', e);
    return res.status(500).json({ message: 'Server error' });
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
    const base = `${req.protocol}://${req.get('host')}`;
    const receiptUrl = `${base}/api/payments/${payment.paymentId}/receipt`;
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

// Razorpay: Verify payment
router.post('/razorpay/verify', verifyToken, async (req, res) => {
  try {
    const { paymentId, razorpay_payment_id, razorpay_order_id, razorpay_signature, clientIp, userAgent } = req.body;
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (payment.gateway !== 'razorpay') {
      return res.status(400).json({ message: 'Invalid gateway for this payment' });
    }

    // Verify signature: hmac_sha256(order_id + '|' + payment_id)
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ message: 'Razorpay secret not configured' });
    }
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Signature verification failed' });
    }

    payment.status = 'completed';
    payment.gatewayPaymentId = razorpay_payment_id;
    payment.gatewayOrderId = razorpay_order_id;
    payment.gatewaySignature = razorpay_signature;
    payment.completedAt = new Date();
    payment.clientIp = clientIp || req.ip;
    payment.userAgent = userAgent || req.headers['user-agent'];
    await payment.save();

    await Booking.findByIdAndUpdate(payment.appointmentId, { paymentConfirmed: true });

    const base = `${req.protocol}://${req.get('host')}`;
    const receiptUrl = `${base}/api/payments/${payment.paymentId}/receipt`;
    payment.receiptUrl = receiptUrl;
    await payment.save();

    return res.json({ message: 'Payment verified successfully', payment, receiptUrl });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    return res.status(500).json({ message: 'Server error' });
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
    const { page = 1, limit = 10, status, paymentType, appointmentId, gateway, currency, q, fromDate, toDate } = req.query;

    let query = { userId };
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    if (appointmentId) query.appointmentId = appointmentId;
    if (gateway) query.gateway = gateway;
    if (currency) query.currency = currency.toUpperCase();
    if (q) {
      const rx = new RegExp(q, 'i');
      query.$or = [
        { paymentId: rx },
        { receiptNumber: rx },
        { 'appointmentId.propertyName': rx },
        { 'listingId.name': rx }
      ];
    }
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }
    
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

// User: Export own payments CSV (placed before dynamic :paymentId route)
router.get('/export-csv', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, gateway, q, fromDate, toDate } = req.query;
    const query = { userId };
    if (status) query.status = status;
    if (gateway) query.gateway = gateway;
    if (q) {
      query.$or = [
        { paymentId: new RegExp(q, 'i') },
        { receiptNumber: new RegExp(q, 'i') }
      ];
    }
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }
    const payments = await Payment.find(query)
      .populate('appointmentId', 'propertyName date status')
      .populate('listingId', 'name address')
      .sort({ createdAt: -1 });
    const headers = ['PaymentID','Currency','Amount','Status','Gateway','Property','AppointmentDate','CreatedAt','Receipt'];
    const formatDMY = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    const rows = payments.map(p => [
      p.paymentId,
      p.currency || 'USD',
      p.amount,
      p.status,
      p.gateway,
      p.appointmentId?.propertyName || '',
      formatDMY(p.appointmentId?.date),
      formatDMY(p.createdAt),
      p.receiptUrl || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="my_payments.csv"');
    return res.send(csv);
  } catch (e) {
    console.error('User export payments error:', e);
    return res.status(500).json({ message: 'Server error' });
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
          totalAmountUsd: { $sum: { $cond: [{ $eq: ['$currency', 'USD'] }, '$amount', 0] } },
          totalAmountInr: { $sum: { $cond: [{ $eq: ['$currency', 'INR'] }, '$amount', 0] } },
          totalRefunds: { $sum: '$refundAmount' },
          totalRefundsUsd: { $sum: { $cond: [{ $eq: ['$currency', 'USD'] }, '$refundAmount', 0] } },
          totalRefundsInr: { $sum: { $cond: [{ $eq: ['$currency', 'INR'] }, '$refundAmount', 0] } },
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
          amount: { $sum: '$amount' },
          amountUsd: { $sum: { $cond: [{ $eq: ['$currency', 'USD'] }, '$amount', 0] } },
          amountInr: { $sum: { $cond: [{ $eq: ['$currency', 'INR'] }, '$amount', 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      overview: stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        totalAmountUsd: 0,
        totalAmountInr: 0,
        totalRefunds: 0,
        totalRefundsUsd: 0,
        totalRefundsInr: 0,
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

// Admin: Mark appointment as paid (create/update Payment and set receipt)
router.post('/admin/mark-paid', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'rootadmin')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { appointmentId, currency, amount, gateway } = req.body;
    if (!appointmentId) return res.status(400).json({ message: 'appointmentId is required' });

    const appointment = await Booking.findById(appointmentId).populate('listingId', 'name');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Find latest payment for this appointment
    let payment = await Payment.findOne({ appointmentId }).sort({ createdAt: -1 });

    if (!payment) {
      // Create default advance payment if none exists
      const resolvedCurrency = (currency || 'USD').toUpperCase();
      const resolvedAmount = typeof amount === 'number' ? amount : (resolvedCurrency === 'INR' ? 100 : 5);
      const resolvedGateway = gateway || (resolvedCurrency === 'INR' ? 'razorpay' : 'paypal');
      payment = new Payment({
        paymentId: generatePaymentId(),
        appointmentId,
        userId: appointment.buyerId,
        listingId: appointment.listingId,
        amount: resolvedAmount,
        currency: resolvedCurrency,
        paymentType: 'advance',
        gateway: resolvedGateway,
        status: 'pending',
        receiptNumber: generateReceiptNumber()
      });
    }

    // Mark as completed
    payment.status = 'completed';
    payment.completedAt = new Date();
    if (currency) payment.currency = currency.toUpperCase();
    if (typeof amount === 'number') payment.amount = amount;
    if (gateway) payment.gateway = gateway;

    // Set receipt URL
    const base = `${req.protocol}://${req.get('host')}`;
    const receiptUrl = `${base}/api/payments/${payment.paymentId}/receipt`;
    payment.receiptUrl = receiptUrl;
    await payment.save();

    // Mark appointment flag
    await Booking.findByIdAndUpdate(appointmentId, { paymentConfirmed: true });

    return res.json({ ok: true, payment, receiptUrl });
  } catch (e) {
    console.error('Admin mark-paid error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Mark appointment as unpaid (revert latest payment to pending)
router.post('/admin/mark-unpaid', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'rootadmin')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ message: 'appointmentId is required' });

    const payment = await Payment.findOne({ appointmentId }).sort({ createdAt: -1 });
    if (payment) {
      payment.status = 'pending';
      payment.completedAt = undefined;
      payment.receiptUrl = undefined;
      await payment.save();
    }

    await Booking.findByIdAndUpdate(appointmentId, { paymentConfirmed: false });

    return res.json({ ok: true, updated: Boolean(payment) });
  } catch (e) {
    console.error('Admin mark-unpaid error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// User: Export own payments CSV
router.get('/export', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, gateway, q, fromDate, toDate } = req.query;
    const query = { userId };
    if (status) query.status = status;
    if (gateway) query.gateway = gateway;
    if (q) {
      query.$or = [
        { paymentId: new RegExp(q, 'i') },
        { receiptNumber: new RegExp(q, 'i') }
      ];
    }
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }
    const payments = await Payment.find(query)
      .populate('appointmentId', 'propertyName date status')
      .populate('listingId', 'name address')
      .sort({ createdAt: -1 });
    const headers = ['PaymentID','Currency','Amount','Status','Gateway','Property','AppointmentDate','CreatedAt','Receipt'];
    const rows = payments.map(p => [
      p.paymentId,
      p.currency || 'USD',
      p.amount,
      p.status,
      p.gateway,
      p.appointmentId?.propertyName || '',
      p.appointmentId?.date ? new Date(p.appointmentId.date).toISOString() : '',
      p.createdAt ? new Date(p.createdAt).toISOString() : '',
      p.receiptUrl || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="my_payments.csv"');
    return res.send(csv);
  } catch (e) {
    console.error('User export payments error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});
// Admin: Export payments CSV
router.get('/admin/export', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (user.role !== 'admin' && user.role !== 'rootadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { currency, status, gateway, q, fromDate, toDate } = req.query;
    const query = {};
    if (currency) query.currency = currency.toUpperCase();
    if (status) query.status = status;
    if (gateway) query.gateway = gateway;
    if (q) {
      query.$or = [
        { paymentId: new RegExp(q, 'i') },
        { receiptNumber: new RegExp(q, 'i') }
      ];
    }
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const payments = await Payment.find(query)
      .populate('appointmentId', 'propertyName date status')
      .populate('listingId', 'name address')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    const headers = ['PaymentID', 'Currency', 'Amount', 'Status', 'Gateway', 'User', 'Email', 'Property', 'AppointmentDate', 'CreatedAt', 'Receipt'];
    const formatDMY = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    const rows = payments.map(p => [
      p.paymentId,
      p.currency || 'USD',
      p.amount,
      p.status,
      p.gateway,
      p.userId?.username || '',
      p.userId?.email || '',
      p.appointmentId?.propertyName || '',
      formatDMY(p.appointmentId?.date),
      formatDMY(p.createdAt),
      p.receiptUrl || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payments_export.csv"');
    return res.send(csv);
  } catch (e) {
    console.error('Admin export payments error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin: List all payments with optional currency filter
router.get('/admin/list', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (user.role !== 'admin' && user.role !== 'rootadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { currency, status, gateway, page = 1, limit = 20, q, fromDate, toDate } = req.query;
    const query = {};
    if (currency) query.currency = currency.toUpperCase();
    if (status) query.status = status;
    if (gateway) query.gateway = gateway;
    if (q) {
      const rx = new RegExp(q, 'i');
      query.$or = [
        { paymentId: rx },
        { receiptNumber: rx },
        { 'userId.username': rx },
        { 'appointmentId.propertyName': rx },
        { 'listingId.name': rx }
      ];
    }
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const payments = await Payment.find(query)
      .populate('appointmentId', 'propertyName date status buyerId sellerId')
      .populate('listingId', 'name address')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    const total = await Payment.countDocuments(query);
    return res.json({ payments, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (e) {
    console.error('Admin list payments error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

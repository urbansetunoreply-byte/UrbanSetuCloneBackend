import express from "express";
import mongoose from "mongoose";
import Payment from "../models/payment.model.js";
import Booking from "../models/booking.model.js";
import Listing from "../models/listing.model.js";
import User from "../models/user.model.js";
import RefundRequest from "../models/RefundRequest.js";
import Notification from "../models/notification.model.js";
import { verifyToken } from '../utils/verify.js';
import crypto from 'crypto';
import { createPayPalOrder, capturePayPalOrder, getPayPalAccessToken } from '../controllers/paypalController.js';
import { sendPaymentSuccessEmail, sendPaymentFailedEmail, sendSellerPaymentNotificationEmail, sendRefundRequestApprovedEmail, sendRefundRequestRejectedEmail } from '../utils/emailService.js';
import fetch from 'node-fetch';
import PDFDocument from 'pdfkit';

const router = express.Router();

// GET: Get Razorpay key for mobile app
router.get("/razorpay-key", (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      return res.status(500).json({ message: 'Razorpay key not configured' });
    }
    res.json({ key: keyId });
  } catch (err) {
    console.error('Error getting Razorpay key:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

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

// GET: Stream PDF receipt (public - no auth required for email access)
router.get('/:paymentId/receipt', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { admin } = req.query; // Check if admin parameter is present
    const payment = await Payment.findOne({ paymentId })
      .populate('appointmentId', 'propertyName date time status buyerId sellerId')
      .populate('listingId', 'name address')
      .populate('userId', 'username email');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt_${payment.paymentId}.pdf"`);
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    doc.on('error', (e) => {
      try { res.end(); } catch {}
    });
    const stream = doc.pipe(res);
    stream.on('error', () => { try { res.end(); } catch {} });

    // Header with enhanced styling
    doc.fontSize(28).fillColor('#1f2937').text('Payment Receipt', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor('#6b7280').text('UrbanSetu', { align: 'center' });
    doc.moveDown(0.8);
    
    // Success indicator with checkmark
    const headerY = doc.y;
    doc.save();
    doc.circle(doc.page.width / 2, headerY + 15, 20).fill('#10b981');
    doc.fillColor('#ffffff').fontSize(24).text('✓', doc.page.width / 2 - 8, headerY + 3);
    doc.restore();
    doc.moveDown(1.2);
    
    // Status and date
    doc.fontSize(14).fillColor('#10b981').text('Payment Successful', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#6b7280').text(`Generated on ${new Date().toLocaleString('en-GB')}`, { align: 'center' });
    doc.moveDown(1);

    // Payment summary box with enhanced styling
    doc.moveDown();
    const boxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const boxHeight = 120;
    const boxX = doc.page.margins.left;
    const boxY = doc.y;
    
    // Background with gradient effect
    doc.save();
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 8).fill('#f3f4f6');
    doc.restore();
    
    // Border
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 8).stroke('#e5e7eb');
    
    // Header
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor('#1f2937').text('Payment Details', boxX + 15, doc.y);
    doc.moveDown(0.8);
    
    const currencySymbol = (payment.currency || 'USD') === 'INR' ? '₹' : '$';
    const amountText = `${currencySymbol} ${Number(payment.amount).toFixed(2)}`;
    
    // Payment info in two columns
    const leftX = boxX + 15;
    const rightX = boxX + boxWidth / 2;
    const lineHeight = 15;
    
    doc.fontSize(11).fillColor('#6b7280').text('Payment ID:', leftX, doc.y);
    doc.fillColor('#1f2937').text(payment.paymentId, leftX + 60, doc.y);
    doc.y += lineHeight;
    
    doc.fillColor('#6b7280').text('Status:', leftX, doc.y);
    doc.fillColor('#10b981').text(payment.status === 'completed' ? 'Completed' : 'Pending', leftX + 60, doc.y);
    doc.y += lineHeight;
    
    doc.fillColor('#6b7280').text('Gateway:', leftX, doc.y);
    doc.fillColor('#1f2937').text(payment.gateway?.toUpperCase() || 'N/A', leftX + 60, doc.y);
    doc.y += lineHeight;
    
    doc.fillColor('#6b7280').text('Amount:', leftX, doc.y);
    doc.fontSize(12).fillColor('#1f2937').text(amountText, leftX + 60, doc.y);
    doc.fontSize(11);
    
    if (payment.refundAmount > 0) {
      doc.y += lineHeight;
      doc.fillColor('#6b7280').text('Refunded:', leftX, doc.y);
      doc.fillColor('#ef4444').text(`${currencySymbol} ${Number(payment.refundAmount).toFixed(2)}`, leftX + 60, doc.y);
      if (payment.refundedAt) {
        doc.y += lineHeight;
        const refundedAt = new Date(payment.refundedAt);
        doc.fillColor('#6b7280').text('Refund Date:', leftX, doc.y);
        doc.fillColor('#1f2937').text(`${refundedAt.toLocaleDateString('en-GB')} ${refundedAt.toLocaleTimeString('en-GB')}`, leftX + 60, doc.y);
      }
    }
    
    doc.moveDown(1.2);

    // Appointment/listing info with enhanced styling
    const infoBoxY = doc.y;
    const infoBoxHeight = 100;
    
    // Background
    doc.save();
    doc.roundedRect(boxX, infoBoxY, boxWidth, infoBoxHeight, 8).fill('#f9fafb');
    doc.restore();
    doc.roundedRect(boxX, infoBoxY, boxWidth, infoBoxHeight, 8).stroke('#e5e7eb');
    
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor('#1f2937').text('Appointment Details', boxX + 15, doc.y);
    doc.moveDown(0.8);
    
    doc.fontSize(11).fillColor('#6b7280').text('Property:', leftX, doc.y);
    doc.fillColor('#1f2937').text(payment.appointmentId?.propertyName || payment.listingId?.name || 'N/A', leftX + 60, doc.y);
    doc.y += lineHeight;
    
    if (payment.appointmentId?.date) {
      doc.fillColor('#6b7280').text('Appointment Date:', leftX, doc.y);
      doc.fillColor('#1f2937').text(new Date(payment.appointmentId.date).toLocaleDateString('en-GB'), leftX + 60, doc.y);
      doc.y += lineHeight;
    }
    
    if (payment.appointmentId?.time) {
      doc.fillColor('#6b7280').text('Appointment Time:', leftX, doc.y);
      doc.fillColor('#1f2937').text(payment.appointmentId.time, leftX + 60, doc.y);
      doc.y += lineHeight;
    }
    
    if (payment.completedAt) {
      const paidAt = new Date(payment.completedAt);
      doc.fillColor('#6b7280').text('Payment Date:', leftX, doc.y);
      doc.fillColor('#1f2937').text(`${paidAt.toLocaleDateString('en-GB')} ${paidAt.toLocaleTimeString('en-GB')}`, leftX + 60, doc.y);
      doc.y += lineHeight;
    }
    
    doc.fillColor('#6b7280').text('Buyer:', leftX, doc.y);
    doc.fillColor('#1f2937').text(payment.userId?.username || payment.userId?.email || 'N/A', leftX + 60, doc.y);
    doc.y += lineHeight;
    
    // Show different "Generated For" text based on admin access
    if (admin === 'true') {
      doc.fillColor('#6b7280').text('Generated For:', leftX, doc.y);
      doc.fillColor('#ef4444').text('Admin (Administrative Access)', leftX + 60, doc.y);
    } else {
      doc.fillColor('#6b7280').text('Generated For:', leftX, doc.y);
      doc.fillColor('#10b981').text('User (Trusted Access)', leftX + 60, doc.y);
    }
    
    doc.moveDown(1.5);

    // Trust/verification note with enhanced styling
    const noteBoxY = doc.y;
    const noteBoxHeight = 40;
    
    // Background for note
    doc.save();
    doc.roundedRect(boxX, noteBoxY, boxWidth, noteBoxHeight, 8).fill('#eff6ff');
    doc.restore();
    doc.roundedRect(boxX, noteBoxY, boxWidth, noteBoxHeight, 8).stroke('#3b82f6');
    
    doc.moveDown(0.2);
    doc.fontSize(12).fillColor('#1e40af').text('Verification Status', boxX + 15, doc.y);
    doc.moveDown(0.3);
    
    let note = '';
    if (payment.gateway === 'razorpay') {
      note = payment.status === 'completed' ? '✓ Paid via Razorpay (verified)' : '⏳ Pending via Razorpay';
    } else if (payment.gateway === 'paypal') {
      note = payment.status === 'completed' ? '✓ Paid via PayPal (verified)' : '⏳ Pending via PayPal';
    } else {
      note = payment.status === 'completed' ? '✓ Marked paid by Admin (approved)' : '⏳ Marked pending by Admin';
    }
    doc.fontSize(11).fillColor('#1e40af').text(note, boxX + 15, doc.y);

    // Gateway badge with enhanced styling
    doc.moveDown(1.5);
    const badge = payment.gateway === 'razorpay' ? 'Razorpay' : (payment.gateway === 'paypal' ? 'PayPal' : 'Admin Approved');
    const badgeColor = payment.gateway === 'razorpay' ? '#0ea5e9' : (payment.gateway === 'paypal' ? '#2563eb' : '#10b981');
    const x = doc.page.margins.left;
    const y = doc.y;
    const badgeWidth = 140;
    const badgeHeight = 25;
    
    doc.save();
    doc.roundedRect(x, y, badgeWidth, badgeHeight, 12).fill(badgeColor);
    doc.fillColor('#ffffff').fontSize(11).text(`Platform: ${badge}`, x + 8, y + 7);
    doc.restore();
    
    // Amount highlight on right
    const amt = `${currencySymbol} ${Number(payment.amount).toFixed(2)}`;
    doc.fontSize(14).fillColor('#1f2937').text(amt, doc.page.width - doc.page.margins.right - 100, y + 5, { width: 100, align: 'right' });

    // Enhanced footer
    doc.moveDown(2.5);
    const footerY = doc.y;
    const footerHeight = 30;
    
    // Footer background
    doc.save();
    doc.rect(doc.page.margins.left, footerY, boxWidth, footerHeight).fill('#f9fafb');
    doc.restore();
    doc.rect(doc.page.margins.left, footerY, boxWidth, footerHeight).stroke('#e5e7eb');
    
    doc.moveDown(0.3);
    const footerText = 'This is a system-generated receipt from UrbanSetu.';
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    doc.fontSize(10).fillColor('#6b7280').text(footerText, doc.page.margins.left, doc.y, { width: contentWidth, align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor('#9ca3af').text(`© ${new Date().getFullYear()} UrbanSetu. All rights reserved.`, doc.page.margins.left, doc.y, { width: contentWidth, align: 'center' });

    doc.end();
  } catch (e) {
    console.error('Receipt PDF error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST: Verify payment (PayPal capture webhook-like endpoint)
router.post("/verify", verifyToken, async (req, res) => {
  try {
    const { paymentId, paypalOrderId, clientIp, userAgent, paymentStatus } = req.body;

    // Update payment record
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Get appointment and user details for email
    const appointment = await Booking.findById(payment.appointmentId)
      .populate('buyerId', 'email username')
      .populate('listingId', 'name');
    
    const user = appointment.buyerId;
    const listing = appointment.listingId;

    // Check if payment was successful or failed
    if (paymentStatus === 'failed' || !paypalOrderId) {
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.clientIp = clientIp || req.ip;
      payment.userAgent = userAgent || req.headers['user-agent'];
      await payment.save();

      // Send payment failed email
      try {
        await sendPaymentFailedEmail(user.email, {
          paymentId: payment.paymentId,
          amount: payment.amount,
          currency: payment.currency,
          propertyName: listing.name,
          appointmentDate: appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A',
          paymentType: payment.paymentType,
          gateway: payment.gateway,
          reason: 'Payment was declined or failed during processing'
        });
      } catch (emailError) {
        console.error('Error sending payment failed email:', emailError);
      }

      return res.status(400).json({
        message: "Payment failed",
        payment: payment
      });
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

    // Send payment success email to buyer
    try {
      await sendPaymentSuccessEmail(user.email, {
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        propertyName: listing.name,
        appointmentDate: appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A',
        receiptUrl: receiptUrl,
        paymentType: payment.paymentType,
        gateway: payment.gateway
      });
      console.log(`✅ Payment success email sent to buyer: ${user.email}`);
    } catch (emailError) {
      console.error('Error sending payment success email:', emailError);
    }

    // Send payment notification email to seller
    try {
      // Get seller details
      await appointment.populate('sellerId', 'email username firstName lastName');
      const seller = appointment.sellerId;
      
      await sendSellerPaymentNotificationEmail(seller.email, {
        appointmentId: appointment._id,
        propertyName: listing.name,
        propertyDescription: listing.description,
        propertyAddress: listing.address,
        propertyPrice: listing.regularPrice || listing.discountPrice,
        propertyImages: listing.imageUrls || [],
        date: appointment.date,
        time: appointment.time,
        buyerName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username,
        paymentAmount: payment.amount,
        paymentCurrency: payment.currency,
        paymentGateway: payment.gateway,
        listingId: listing._id
      });
      console.log(`✅ Seller payment notification email sent to: ${seller.email}`);
    } catch (sellerEmailError) {
      console.error('Error sending seller payment notification email:', sellerEmailError);
    }

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
    const { paymentId, razorpay_payment_id, razorpay_order_id, razorpay_signature, clientIp, userAgent, paymentStatus } = req.body;
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (payment.gateway !== 'razorpay') {
      return res.status(400).json({ message: 'Invalid gateway for this payment' });
    }

    // Get appointment and user details for email
    const appointment = await Booking.findById(payment.appointmentId)
      .populate('buyerId', 'email username')
      .populate('listingId', 'name');
    
    const user = appointment.buyerId;
    const listing = appointment.listingId;

    // Check if payment was successful or failed
    if (paymentStatus === 'failed' || !razorpay_payment_id) {
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.clientIp = clientIp || req.ip;
      payment.userAgent = userAgent || req.headers['user-agent'];
      await payment.save();

      // Send payment failed email
      try {
        await sendPaymentFailedEmail(user.email, {
          paymentId: payment.paymentId,
          amount: payment.amount,
          currency: payment.currency,
          propertyName: listing.name,
          appointmentDate: appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A',
          paymentType: payment.paymentType,
          gateway: payment.gateway,
          reason: 'Payment was declined or failed during processing'
        });
      } catch (emailError) {
        console.error('Error sending payment failed email:', emailError);
      }

      return res.status(400).json({
        message: "Payment failed",
        payment: payment
      });
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
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.clientIp = clientIp || req.ip;
      payment.userAgent = userAgent || req.headers['user-agent'];
      await payment.save();

      // Send payment failed email for signature verification failure
      try {
        await sendPaymentFailedEmail(user.email, {
          paymentId: payment.paymentId,
          amount: payment.amount,
          currency: payment.currency,
          propertyName: listing.name,
          appointmentDate: appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A',
          paymentType: payment.paymentType,
          gateway: payment.gateway,
          reason: 'Payment signature verification failed'
        });
      } catch (emailError) {
        console.error('Error sending payment failed email:', emailError);
      }

      return res.status(400).json({ 
        message: 'Signature verification failed',
        payment: payment
      });
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

    // Send payment success email to buyer (reusing existing appointment, user, listing variables)
    try {
      await sendPaymentSuccessEmail(user.email, {
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        propertyName: listing.name,
        appointmentDate: appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A',
        receiptUrl: receiptUrl,
        paymentType: payment.paymentType,
        gateway: payment.gateway
      });
      console.log(`✅ Payment success email sent to buyer: ${user.email}`);
    } catch (emailError) {
      console.error('Error sending payment success email:', emailError);
    }

    // Send payment notification email to seller
    try {
      // Get seller details
      await appointment.populate('sellerId', 'email username firstName lastName');
      const seller = appointment.sellerId;
      
      await sendSellerPaymentNotificationEmail(seller.email, {
        appointmentId: appointment._id,
        propertyName: listing.name,
        propertyDescription: listing.description,
        propertyAddress: listing.address,
        propertyPrice: listing.regularPrice || listing.discountPrice,
        propertyImages: listing.imageUrls || [],
        date: appointment.date,
        time: appointment.time,
        buyerName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username,
        paymentAmount: payment.amount,
        paymentCurrency: payment.currency,
        paymentGateway: payment.gateway,
        listingId: listing._id
      });
      console.log(`✅ Seller payment notification email sent to: ${seller.email}`);
    } catch (sellerEmailError) {
      console.error('Error sending seller payment notification email:', sellerEmailError);
    }

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

// POST: Submit refund request
router.post("/refund-request", verifyToken, async (req, res) => {
  try {
    const { paymentId, appointmentId, reason, requestedAmount, type } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!paymentId || !appointmentId || !reason || !requestedAmount || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if payment exists and belongs to user
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if user is authorized (buyer or seller of the appointment)
    const appointment = await Booking.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const isBuyer = appointment.buyerId && appointment.buyerId.toString() === userId;
    const isSeller = appointment.sellerId && appointment.sellerId.toString() === userId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: "Unauthorized to request refund for this appointment" });
    }

    // Check if payment is completed
    if (payment.status !== 'completed') {
      return res.status(400).json({ message: "Only completed payments can be refunded" });
    }

    // Check if appointment status allows refund
    const eligibleStatuses = ['rejected', 'cancelledByBuyer', 'cancelledBySeller', 'cancelledByAdmin'];
    if (!eligibleStatuses.includes(appointment.status)) {
      return res.status(400).json({ message: "Appointment status does not allow refund requests" });
    }

    // Check if refund amount is valid
    if (requestedAmount > payment.amount) {
      return res.status(400).json({ message: "Requested refund amount cannot exceed payment amount" });
    }

    // Check if there's already a pending refund request for this payment
    const existingRequest = await RefundRequest.findOne({
      paymentId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: "A refund request already exists for this payment" });
    }

    // Create refund request
    const refundRequest = new RefundRequest({
      paymentId,
      appointmentId,
      userId,
      requestedAmount,
      type,
      reason
    });

    await refundRequest.save();

    res.status(201).json({
      message: "Refund request submitted successfully",
      refundRequestId: refundRequest._id
    });
  } catch (err) {
    console.error("Error creating refund request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Get user's refund request status by payment ID
router.get("/refund-request-status/:paymentId", verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    // Find the refund request for this payment and user
    const refundRequest = await RefundRequest.findOne({
      paymentId: paymentId,
      userId: userId
    }).populate('appointmentId', 'propertyName date status buyerId sellerId');

    if (!refundRequest) {
      return res.status(200).json({ refundRequest: null });
    }

    res.status(200).json({ refundRequest });
  } catch (err) {
    console.error("Error fetching refund request status:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Get refund requests (admin only)
router.get("/refund-requests", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, search } = req.query;

    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user.role === 'admin' || user.role === 'rootadmin';

    if (!isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { paymentId: new RegExp(search, 'i') },
        { reason: new RegExp(search, 'i') },
        { 'appointmentId.propertyName': new RegExp(search, 'i') }
      ];
    }

    const refundRequests = await RefundRequest.find(query)
      .populate('appointmentId', 'propertyName date status buyerId sellerId')
      .populate('userId', 'name email')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Manually populate payment data since paymentId is a string, not ObjectId
    const refundRequestsWithPayments = await Promise.all(
      refundRequests.map(async (request) => {
        const payment = await Payment.findOne({ paymentId: request.paymentId });
        return {
          ...request.toObject(),
          paymentId: payment
        };
      })
    );

    const totalRequests = await RefundRequest.countDocuments(query);

    res.status(200).json({
      refundRequests: refundRequestsWithPayments,
      totalPages: Math.ceil(totalRequests / limit),
      currentPage: parseInt(page),
      totalRequests
    });
  } catch (err) {
    console.error("Error fetching refund requests:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: Update refund request status (admin only)
router.put("/refund-request/:requestId", verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNotes, adminRefundAmount } = req.body;
    const userId = req.user.id;

    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user.role === 'admin' || user.role === 'rootadmin';

    if (!isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const refundRequest = await RefundRequest.findById(requestId)
      .populate('appointmentId');

    if (!refundRequest) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    if (!['pending', 'approved', 'rejected', 'processed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update refund request
    refundRequest.status = status;
    refundRequest.adminNotes = adminNotes;
    if (adminRefundAmount !== undefined) {
      refundRequest.adminRefundAmount = adminRefundAmount;
    }
    refundRequest.processedBy = userId;
    refundRequest.processedAt = new Date();

    await refundRequest.save();

    // If approved, process the actual refund
    if (status === 'approved') {
      const payment = await Payment.findOne({ paymentId: refundRequest.paymentId });
      
      // Use admin override amount if provided, otherwise use requested amount
      const finalRefundAmount = adminRefundAmount !== undefined ? adminRefundAmount : refundRequest.requestedAmount;
      
      // Validate refund amount
      if (finalRefundAmount < 0 || finalRefundAmount > payment.amount) {
        return res.status(400).json({ message: "Invalid refund amount" });
      }
      
      // Update payment record
      payment.refundAmount = finalRefundAmount;
      payment.refundReason = refundRequest.reason;
      payment.refundedAt = new Date();
      payment.refundId = `refund_${Date.now()}`;
      payment.status = finalRefundAmount === payment.amount ? 'refunded' : 'partially_refunded';

      await payment.save();

      // Update appointment status if fully refunded
      if (payment.status === 'refunded') {
        await Booking.findByIdAndUpdate(refundRequest.appointmentId, {
          paymentRefunded: true
        });
      }

      // Update refund request status to processed
      refundRequest.status = 'processed';
      await refundRequest.save();

      // Send refund approved email to user
      try {
        // Get user and appointment details for email
        const user = await User.findById(refundRequest.userId);
        const appointment = await Booking.findById(refundRequest.appointmentId).populate('listingId');
        const listing = appointment.listingId;

        if (user && appointment && listing) {
          await sendRefundRequestApprovedEmail(user.email, {
            propertyName: appointment.propertyName,
            propertyAddress: listing.address,
            propertyPrice: listing.regularPrice || listing.discountPrice,
            propertyImage: listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[0] : '',
            appointmentDate: appointment.date,
            appointmentTime: appointment.time,
            buyerName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
            requestedAmount: refundRequest.requestedAmount,
            approvedAmount: finalRefundAmount,
            originalAmount: payment.amount,
            currency: payment.currency,
            refundType: refundRequest.type,
            refundReason: refundRequest.reason,
            adminNotes: adminNotes,
            refundId: payment.refundId,
            processedAt: refundRequest.processedAt,
            appointmentId: appointment._id,
            listingId: listing._id
          });
          console.log(`✅ Refund approved email sent to user: ${user.email}`);
        }
      } catch (emailError) {
        console.error('Error sending refund approved email:', emailError);
      }
    }

    // Send refund rejected email if status is rejected
    if (status === 'rejected') {
      try {
        // Get user and appointment details for email
        const user = await User.findById(refundRequest.userId);
        const appointment = await Booking.findById(refundRequest.appointmentId).populate('listingId');
        const listing = appointment.listingId;

        if (user && appointment && listing) {
          await sendRefundRequestRejectedEmail(user.email, {
            propertyName: appointment.propertyName,
            propertyAddress: listing.address,
            propertyPrice: listing.regularPrice || listing.discountPrice,
            propertyImage: listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[0] : '',
            appointmentDate: appointment.date,
            appointmentTime: appointment.time,
            buyerName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
            requestedAmount: refundRequest.requestedAmount,
            originalAmount: refundRequest.originalAmount || 0,
            currency: refundRequest.currency || 'INR',
            refundType: refundRequest.type,
            refundReason: refundRequest.reason,
            adminNotes: adminNotes,
            processedAt: refundRequest.processedAt,
            appointmentId: appointment._id,
            listingId: listing._id
          });
          console.log(`❌ Refund rejected email sent to user: ${user.email}`);
        }
      } catch (emailError) {
        console.error('Error sending refund rejected email:', emailError);
      }
    }

    res.status(200).json({
      message: "Refund request updated successfully",
      refundRequest
    });
  } catch (err) {
    console.error("Error updating refund request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Get payment history for user
router.get("/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, paymentType, appointmentId, gateway, currency, q, fromDate, toDate } = req.query;

    let query = {};
    
    // If appointmentId is provided, allow both buyer and seller to see payment data
    if (appointmentId) {
      // First, find the appointment to check if user is buyer or seller
      const appointment = await Booking.findById(appointmentId);
      if (appointment) {
        const isBuyer = appointment.buyerId && appointment.buyerId.toString() === userId;
        const isSeller = appointment.sellerId && appointment.sellerId.toString() === userId;
        
        if (isBuyer || isSeller) {
          query.appointmentId = appointmentId;
        } else {
          // User is not involved in this appointment, return empty result
          return res.json({ payments: [], totalPages: 0, currentPage: 1 });
        }
      } else {
        return res.status(404).json({ message: 'Appointment not found' });
      }
    } else {
      // For general payment history, only show user's own payments
      query.userId = userId;
    }
    
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
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
    const headers = ['PaymentID','Currency','Amount','Status','Gateway','Property','AppointmentDate','CreatedDate','CreatedTime','PaidDate','PaidTime','Receipt'];
    const formatDMY = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    const formatTime = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      return dt.toLocaleTimeString('en-GB');
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
      formatTime(p.createdAt),
      p.completedAt ? formatDMY(p.completedAt) : '',
      p.completedAt ? formatTime(p.completedAt) : '',
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
          // Only count completed payments in totals
          totalAmount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
          totalAmountUsd: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $eq: ['$currency', 'USD'] }] }, '$amount', 0] } },
          totalAmountInr: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $eq: ['$currency', 'INR'] }] }, '$amount', 0] } },
          // Only count refunds from completed payments
          totalRefunds: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$refundAmount', 0] } },
          totalRefundsUsd: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $eq: ['$currency', 'USD'] }] }, '$refundAmount', 0] } },
          totalRefundsInr: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $eq: ['$currency', 'INR'] }] }, '$refundAmount', 0] } },
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
          status: 'completed', // Only count completed payments
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
          amountInr: { $sum: { $cond: [{ $eq: ['$currency', 'INR'] }, '$amount', 0] } },
          refunds: { $sum: '$refundAmount' },
          refundsUsd: { $sum: { $cond: [{ $eq: ['$currency', 'USD'] }, '$refundAmount', 0] } },
          refundsInr: { $sum: { $cond: [{ $eq: ['$currency', 'INR'] }, '$refundAmount', 0] } }
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

// POST: Submit appeal for rejected refund request
router.post("/refund-appeal", verifyToken, async (req, res) => {
  try {
    const { refundRequestId, appealReason, appealText } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!refundRequestId || !appealReason || !appealText) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find the refund request
    const refundRequest = await RefundRequest.findById(refundRequestId)
      .populate('appointmentId', 'propertyName date status buyerId sellerId')
      .populate('userId', 'name email');

    if (!refundRequest) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    // Check if user is authorized (only the original requester can appeal)
    if (refundRequest.userId._id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to appeal this refund request" });
    }

    // Check if refund request is rejected
    if (refundRequest.status !== 'rejected') {
      return res.status(400).json({ message: "Only rejected refund requests can be appealed" });
    }

    // Check if already appealed
    if (refundRequest.isAppealed) {
      return res.status(400).json({ message: "This refund request has already been appealed" });
    }

    // Update refund request with appeal information
    refundRequest.appealReason = appealReason;
    refundRequest.appealText = appealText;
    refundRequest.appealSubmittedAt = new Date();
    refundRequest.isAppealed = true;

    await refundRequest.save();

    // Create notification for all admins
    const admins = await User.find({
      $or: [
        { role: 'admin' },
        { role: 'rootadmin' },
        { isDefaultAdmin: true },
        { isAdmin: true }
      ]
    });

    const notifications = admins.map(admin => ({
      userId: admin._id,
      type: 'refund_appeal_submitted',
      title: 'New Refund Appeal Submitted',
      message: `A refund appeal has been submitted for payment ${refundRequest.paymentId} by ${refundRequest.userId.name || refundRequest.userId.email}. Property: ${refundRequest.appointmentId.propertyName}. Appeal Reason: ${appealReason}`,
      adminId: userId,
      isRead: false
    }));

    await Notification.insertMany(notifications);

    res.status(200).json({
      message: "Appeal submitted successfully. Please wait for response.",
      appealSubmittedAt: refundRequest.appealSubmittedAt
    });
  } catch (err) {
    console.error("Error submitting appeal:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: Reopen case for rejected refund request (admin only)
router.put("/refund-request/:requestId/reopen", verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Check if user is admin
    const user = await User.findById(userId);
    const isAdmin = user.role === 'admin' || user.role === 'rootadmin' || user.isDefaultAdmin || user.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const refundRequest = await RefundRequest.findById(requestId)
      .populate('appointmentId')
      .populate('userId', 'name email');

    if (!refundRequest) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    // Check if refund request is rejected
    if (refundRequest.status !== 'rejected') {
      return res.status(400).json({ message: "Only rejected refund requests can be reopened" });
    }

    // Update refund request to reopen case
    refundRequest.caseReopened = true;
    refundRequest.caseReopenedAt = new Date();
    refundRequest.caseReopenedBy = userId;
    refundRequest.status = 'pending'; // Reset status to pending for review

    await refundRequest.save();

    res.status(200).json({
      message: "Case reopened successfully",
      refundRequest: refundRequest
    });
  } catch (err) {
    console.error("Error reopening case:", err);
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
    
    // Set metadata to indicate admin marked this payment
    if (!payment.metadata) payment.metadata = {};
    payment.metadata.adminMarked = true;

    // Set receipt URL
    const base = `${req.protocol}://${req.get('host')}`;
    const receiptUrl = `${base}/api/payments/${payment.paymentId}/receipt`;
    payment.receiptUrl = receiptUrl;
    await payment.save();

    // Mark appointment flag
    await Booking.findByIdAndUpdate(appointmentId, { paymentConfirmed: true });

    // Get user details for email (appointment already populated with listingId)
    await appointment.populate('buyerId', 'email username');
    const buyer = appointment.buyerId;
    const listing = appointment.listingId;

    // Send payment success email to buyer (admin marked as paid)
    try {
      await sendPaymentSuccessEmail(buyer.email, {
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        propertyName: listing.name,
        appointmentDate: appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A',
        receiptUrl: receiptUrl,
        paymentType: payment.paymentType,
        gateway: payment.gateway
      });
      console.log(`✅ Admin payment success email sent to buyer: ${buyer.email}`);
    } catch (emailError) {
      console.error('Error sending payment success email:', emailError);
    }

    // Send payment notification email to seller (admin marked as paid)
    try {
      // Get seller details
      await appointment.populate('sellerId', 'email username firstName lastName');
      const seller = appointment.sellerId;
      
      await sendSellerPaymentNotificationEmail(seller.email, {
        appointmentId: appointment._id,
        propertyName: listing.name,
        propertyDescription: listing.description,
        propertyAddress: listing.address,
        propertyPrice: listing.regularPrice || listing.discountPrice,
        propertyImages: listing.imageUrls || [],
        date: appointment.date,
        time: appointment.time,
        buyerName: buyer.firstName && buyer.lastName 
          ? `${buyer.firstName} ${buyer.lastName}` 
          : buyer.username,
        paymentAmount: payment.amount,
        paymentCurrency: payment.currency,
        paymentGateway: payment.gateway,
        listingId: listing._id
      });
      console.log(`✅ Admin seller payment notification email sent to: ${seller.email}`);
    } catch (sellerEmailError) {
      console.error('Error sending seller payment notification email:', sellerEmailError);
    }

    // Emit socket event for real-time payment status update
    const io = req.app.get('io');
    if (io) {
      io.emit('paymentStatusUpdated', { appointmentId, paymentConfirmed: true });
      io.to('admin_*').emit('paymentStatusUpdated', { appointmentId, paymentConfirmed: true });
    }

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
      
      // Clear admin marked flag
      if (payment.metadata) {
        payment.metadata.adminMarked = false;
      }
      
      await payment.save();
    }

    await Booking.findByIdAndUpdate(appointmentId, { paymentConfirmed: false });

    // Emit socket event for real-time payment status update
    const io = req.app.get('io');
    if (io) {
      io.emit('paymentStatusUpdated', { appointmentId, paymentConfirmed: false });
      io.to('admin_*').emit('paymentStatusUpdated', { appointmentId, paymentConfirmed: false });
    }

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
    const headers = ['PaymentID','Currency','Amount','Status','Gateway','Property','AppointmentDate','CreatedDate','CreatedTime','PaidDate','PaidTime','Receipt'];
    const formatDMY = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    const formatTime = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      return dt.toLocaleTimeString('en-GB');
    };
    const rows = payments.map(p => [
      p.paymentId,
      p.currency || 'USD',
      p.amount,
      p.status,
      p.gateway,
      p.appointmentId?.propertyName || '',
      p.appointmentId?.date ? new Date(p.appointmentId.date).toISOString() : '',
      formatDMY(p.createdAt),
      formatTime(p.createdAt),
      p.completedAt ? formatDMY(p.completedAt) : '',
      p.completedAt ? formatTime(p.completedAt) : '',
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

    const headers = ['PaymentID', 'Currency', 'Amount', 'Status', 'Gateway', 'User', 'Email', 'Property', 'AppointmentDate', 'CreatedDate', 'CreatedTime', 'PaidDate', 'PaidTime', 'Receipt'];
    const formatDMY = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    const formatTime = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      return dt.toLocaleTimeString('en-GB');
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
      formatTime(p.createdAt),
      p.completedAt ? formatDMY(p.completedAt) : '',
      p.completedAt ? formatTime(p.completedAt) : '',
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

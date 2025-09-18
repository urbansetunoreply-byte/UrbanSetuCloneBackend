import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  // Basic payment info
  paymentId: {
    type: String,
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentType: {
    type: String,
    enum: ['advance', 'monthly_rent', 'security_deposit', 'booking_fee', 'emi', 'split_payment', 'refund'],
    required: true
  },
  
  // Payment gateway info
  gateway: {
    type: String,
    enum: ['paypal', 'stripe', 'payu', 'paytm', 'phonepe', 'razorpay'],
    required: true
  },
  gatewayPaymentId: String,
  gatewayOrderId: String,
  gatewaySignature: String,
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  
  // Refund info
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: String,
  refundedAt: Date,
  refundId: String,
  
  // Split payment info (for shared PG/flatmates)
  splitPayments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    },
    paidAt: Date
  }],
  
  // EMI info
  emiDetails: {
    totalAmount: Number,
    emiAmount: Number,
    tenure: Number, // in months
    interestRate: Number,
    bankName: String,
    loanId: String
  },
  
  // Receipt info
  receiptNumber: String,
  receiptUrl: String,
  // Security & telemetry
  clientIp: String,
  userAgent: String,
  riskScore: { type: Number, min: 0, max: 100, default: 0 },
  threeDS: {
    enrolled: { type: Boolean, default: false },
    version: String,
    status: String,
    eci: String
  },
  checksumVerified: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  
  // Additional metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

// Indexes for better performance
paymentSchema.index({ paymentId: 1 }, { unique: true });
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ gatewayPaymentId: 1 });

// Pre-save middleware to update updatedAt
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;

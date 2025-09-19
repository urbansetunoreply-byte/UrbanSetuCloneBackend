const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    ref: 'Payment'
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Booking'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['full', 'partial'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  refundId: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
refundRequestSchema.index({ paymentId: 1 });
refundRequestSchema.index({ appointmentId: 1 });
refundRequestSchema.index({ userId: 1 });
refundRequestSchema.index({ status: 1 });
refundRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RefundRequest', refundRequestSchema);
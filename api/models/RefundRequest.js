import mongoose from 'mongoose';

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
  adminRefundAmount: {
    type: Number,
    min: 0
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  refundId: {
    type: String
  },
  appealReason: {
    type: String,
    trim: true
  },
  appealText: {
    type: String,
    trim: true
  },
  appealSubmittedAt: {
    type: Date
  },
  isAppealed: {
    type: Boolean,
    default: false
  },
  caseReopened: {
    type: Boolean,
    default: false
  },
  caseReopenedAt: {
    type: Date
  },
  caseReopenedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
refundRequestSchema.index({ refundId: 1 }, { unique: true, sparse: true });

export default mongoose.model('RefundRequest', refundRequestSchema);
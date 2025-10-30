import mongoose from 'mongoose';

const visitorLogSchema = new mongoose.Schema({
  // Visitor fingerprint (IP + User-Agent hash for uniqueness per day)
  fingerprint: {
    type: String,
    required: true,
    index: true
  },
  ip: {
    type: String,
    required: true
  },
  device: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: false,
    default: 'Unknown'
  },
  userAgent: {
    type: String,
    required: true
  },
  // Cookie preferences accepted
  cookiePreferences: {
    necessary: { type: Boolean, default: true },
    analytics: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    functional: { type: Boolean, default: false }
  },
  // Date of visit (for daily statistics)
  visitDate: {
    type: Date,
    required: true,
    index: true
  },
  // Timestamp of when visitor accepted cookies
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Referrer URL
  referrer: {
    type: String,
    required: false
  },
  // Page visited when consent was given
  page: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Compound index to ensure unique visitors per day
visitorLogSchema.index({ fingerprint: 1, visitDate: 1 }, { unique: true });

// Index for efficient daily queries
visitorLogSchema.index({ visitDate: 1, timestamp: -1 });

const VisitorLog = mongoose.model('VisitorLog', visitorLogSchema);

export default VisitorLog;

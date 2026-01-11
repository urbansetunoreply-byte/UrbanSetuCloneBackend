import mongoose from 'mongoose';

const sessionAuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'login', 'logout', 'suspicious_login', 'forced_logout', 'session_expired', 'session_cleaned',
      'view_property', 'search', 'contact_agent', 'download_route', 'profile_update',
      'create_listing', 'update_listing', 'delete_listing'
    ],
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'rootadmin'],
    required: true
  },
  sessionId: {
    type: String,
    required: true
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
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  additionalInfo: {
    type: String,
    required: false
  },
  isSuspicious: {
    type: Boolean,
    default: false
  },
  suspiciousReason: {
    type: String,
    required: false
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // For forced logout actions
  }
}, { timestamps: true });

// Index for efficient queries
sessionAuditLogSchema.index({ userId: 1, timestamp: -1 });
sessionAuditLogSchema.index({ action: 1, timestamp: -1 });
sessionAuditLogSchema.index({ isSuspicious: 1, timestamp: -1 });
sessionAuditLogSchema.index({ ip: 1, timestamp: -1 });

const SessionAuditLog = mongoose.model('SessionAuditLog', sessionAuditLogSchema);

export default SessionAuditLog;
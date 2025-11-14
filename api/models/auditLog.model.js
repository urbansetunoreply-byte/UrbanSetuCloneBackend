import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, enum: ['soft_delete', 'restore', 'purge'], required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'DeletedAccount', required: true },
  targetEmail: { type: String, required: false, lowercase: true },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;


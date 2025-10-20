import mongoose from 'mongoose';

const reportAuditSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    kind: { type: String, enum: ['message', 'chat'], required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reportAuditSchema.index({ userId: 1, appointmentId: 1, kind: 1, createdAt: 1 });

const ReportAudit = mongoose.model('ReportAudit', reportAuditSchema);
export default ReportAudit;



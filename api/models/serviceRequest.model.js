import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterName: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  services: [{ type: String, required: true }],
  preferredDate: { type: String, required: true },
  address: { type: String, required: true },
  notes: { type: String },
  status: { type: String, enum: ['pending','in_progress','completed','cancelled'], default: 'pending' },
}, { timestamps: true });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

export default ServiceRequest;


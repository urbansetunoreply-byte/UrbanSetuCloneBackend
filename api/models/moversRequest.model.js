import mongoose from 'mongoose';

const moversRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterName: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  fromAddress: { type: String, required: true },
  toAddress: { type: String, required: true },
  moveDate: { type: String, required: true },
  size: { type: String, required: true },
  notes: { type: String },
  status: { type: String, enum: ['pending','in_progress','completed','cancelled'], default: 'pending' },
}, { timestamps: true });

const MoversRequest = mongoose.model('MoversRequest', moversRequestSchema);

export default MoversRequest;


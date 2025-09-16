import mongoose from 'mongoose';

const deletedAccountSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, index: true },
  role: { type: String, enum: ['user', 'admin'], required: true, index: true },
  deletedAt: { type: Date, default: Date.now, index: true },
  deletedBy: { type: mongoose.Schema.Types.Mixed, required: true }, // ObjectId of admin/rootadmin or string 'self'
  originalData: { type: mongoose.Schema.Types.Mixed }
  reason: { type: String, default: '' }
}, { timestamps: true });

const DeletedAccount = mongoose.model('DeletedAccount', deletedAccountSchema);
export default DeletedAccount;


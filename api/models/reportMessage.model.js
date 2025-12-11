import mongoose from 'mongoose';

const reportMessageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
    },
    messageContent: {
        type: String,
        required: true,
    },
    prompt: {
        type: String,
        required: false,
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    category: {
        type: String,
        required: true,
    },
    subCategory: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false, // "Please tell us more" field
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending',
    },
    adminNotes: {
        type: String,
        default: '',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    }
}, { timestamps: true });

const ReportMessage = mongoose.model('ReportMessage', reportMessageSchema);

export default ReportMessage;

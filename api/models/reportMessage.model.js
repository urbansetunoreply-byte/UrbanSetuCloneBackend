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
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
        required: true, // "Please tell us more" field
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending',
    },
    adminNotes: {
        type: String,
        default: '',
    }
}, { timestamps: true });

const ReportMessage = mongoose.model('ReportMessage', reportMessageSchema);

export default ReportMessage;

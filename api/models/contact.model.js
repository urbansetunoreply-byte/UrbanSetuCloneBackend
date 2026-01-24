import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'replied'],
        default: 'unread'
    },
    // Reply fields
    adminReply: {
        type: String,
        trim: true,
        default: null
    },
    adminReplyAt: {
        type: Date,
        default: null
    },
    adminRepliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    readAt: {
        type: Date,
        default: null
    },
    repliedAt: {
        type: Date,
        default: null
    },
    attachments: {
        type: [String],
        default: []
    }
}, { timestamps: true });

// Static method to generate unique ticket ID
contactSchema.statics.generateTicketId = async function () {
    try {
        // Get the count of total documents
        const count = await this.countDocuments();
        const ticketNumber = String(count + 1).padStart(5, '0');
        const ticketId = `TKT-${ticketNumber}`;
        return ticketId;
    } catch (error) {
        console.error('Error generating ticket ID:', error);
        throw error;
    }
};

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;

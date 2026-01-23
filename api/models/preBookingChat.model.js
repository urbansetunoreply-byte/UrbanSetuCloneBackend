import mongoose from 'mongoose';

const preBookingChatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: false
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        read: {
            type: Boolean,
            default: false
        }
    }],
    lastMessage: {
        content: String,
        timestamp: Date,
        sender: mongoose.Schema.Types.ObjectId,
        read: Boolean
    },
    clearedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        clearedAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastEmailSentAt: {
        type: Date
    }
}, { timestamps: true });

// Index for efficient querying by user and listing
preBookingChatSchema.index({ participants: 1, listingId: 1 });
preBookingChatSchema.index({ ownerId: 1 });

const PreBookingChat = mongoose.model('PreBookingChat', preBookingChatSchema);

export default PreBookingChat;

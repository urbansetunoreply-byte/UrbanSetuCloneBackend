import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    status: {
        type: String,
        enum: ['verifying', 'pending', 'approved', 'rejected', 'revoked', 'opted_out'],
        default: 'pending'
    },
    preferences: {
        blog: { type: Boolean, default: false },
        guide: { type: Boolean, default: false }
    },
    rejectionReason: {
        type: String,
        default: null
    },
    verificationOtp: {
        type: String,
        select: false
    },
    verificationOtpExpires: {
        type: Date,
        select: false
    },
    source: {
        type: String,
        default: 'guides_page'
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;

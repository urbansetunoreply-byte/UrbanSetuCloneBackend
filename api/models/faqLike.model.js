import mongoose from 'mongoose';

const faqLikeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    faqId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FAQ',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'dislike'],
        required: true
    }
}, {
    timestamps: true
});

// Create compound index to ensure one like/dislike per user per FAQ
faqLikeSchema.index({ userId: 1, faqId: 1 }, { unique: true });

export default mongoose.model('FAQLike', faqLikeSchema);

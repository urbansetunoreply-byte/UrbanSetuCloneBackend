import mongoose from 'mongoose';

const blogLikeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    blogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    }
}, {
    timestamps: true
});

// Create compound index to ensure one like per user per blog
blogLikeSchema.index({ userId: 1, blogId: 1 }, { unique: true });

export default mongoose.model('BlogLike', blogLikeSchema);

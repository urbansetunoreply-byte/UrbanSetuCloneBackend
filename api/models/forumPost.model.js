import mongoose from 'mongoose';

const forumCommentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxLength: 1000
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    replies: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        replyToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        parentReplyId: { type: mongoose.Schema.Types.ObjectId }, // For infinite nesting
        content: { type: String, required: true },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        reports: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reason: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }],
        createdAt: { type: Date, default: Date.now },
        isEdited: { type: Boolean, default: false }
    }],
    reports: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const forumPostSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 150
    },
    content: {
        type: String,
        required: true,
        maxLength: 5000
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        enum: ['General', 'Neighborhood', 'Events', 'Safety', 'Recommendations', 'Marketplace'],
        default: 'General'
    },
    location: {
        city: { type: String, trim: true },
        neighborhood: { type: String, trim: true }
    },
    images: [{
        type: String // URLs
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [forumCommentSchema],
    viewCount: {
        type: Number,
        default: 0
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    reports: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Index for efficient searching by location
forumPostSchema.index({ 'location.city': 1, 'location.neighborhood': 1 });

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

export default ForumPost;

import mongoose from 'mongoose';

const { Schema } = mongoose;

const blogViewSchema = new Schema({
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for public users
    },
    fingerprint: {
        type: String,
        default: null // IP + User-Agent hash for public users
    },
    viewedAt: {
        type: Date,
        default: Date.now
    },
    userAgent: {
        type: String,
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Compound index to ensure unique views per user per blog
blogViewSchema.index({ blogId: 1, userId: 1 }, { 
    unique: true, 
    partialFilterExpression: { userId: { $ne: null } } 
});

// Compound index to ensure unique views per fingerprint per blog (for public users)
blogViewSchema.index({ blogId: 1, fingerprint: 1 }, { 
    unique: true, 
    partialFilterExpression: { fingerprint: { $ne: null } } 
});

// Index for cleanup of old views (24+ hours)
blogViewSchema.index({ viewedAt: 1 });

// Index for analytics queries
blogViewSchema.index({ blogId: 1, viewedAt: -1 });

const BlogView = mongoose.model('BlogView', blogViewSchema);

export default BlogView;

import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        maxlength: 500
    },
    author: {
        type: String,
        default: 'UrbanSetu Team'
    },
    tags: [{
        type: String,
        trim: true
    }],
    category: {
        type: String,
        enum: ['Real Estate Tips', 'Market Updates', 'Investment Guide', 'Home Buying', 'Home Selling', 'Property Management', 'Legal', 'Finance'],
        default: 'Real Estate Tips'
    },
    featuredImage: {
        type: String
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for search functionality
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ category: 1 });

export default mongoose.model('Blog', blogSchema);

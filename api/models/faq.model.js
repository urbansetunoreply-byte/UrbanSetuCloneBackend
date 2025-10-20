import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        default: null // null = global FAQ
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['General', 'Property Search', 'Buying Process', 'Selling Process', 'Investment', 'Legal', 'Finance', 'Property Management', 'Technical Support'],
        default: 'General'
    },
    priority: {
        type: Number,
        default: 0 // Higher number = higher priority
    },
    tags: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isGlobal: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    helpful: {
        type: Number,
        default: 0
    },
    notHelpful: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for search functionality
faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });
faqSchema.index({ category: 1, priority: -1 });
faqSchema.index({ isActive: 1 });
faqSchema.index({ propertyId: 1, isActive: 1 });
faqSchema.index({ isGlobal: 1, isActive: 1 });

export default mongoose.model('FAQ', faqSchema);

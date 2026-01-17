import mongoose from "mongoose";

const helpArticleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            "Account & Profile",
            "Buying Property",
            "Renting Property",
            "Selling Property",
            "Wishlist & Saved Properties",
            "Security & Privacy",
            "Payments & Fees",
            "Technical Issues"
        ]
    },
    content: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
        maxLength: 300
    },
    tags: [{
        type: String,
        trim: true
    }],
    helpfulCount: {
        type: Number,
        default: 0
    },
    notHelpfulCount: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    votedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        voteType: {
            type: String,
            enum: ['helpful', 'not_helpful']
        }
    }]
}, { timestamps: true });

// Index for search
helpArticleSchema.index({ title: 'text', content: 'text', tags: 'text' });

const HelpArticle = mongoose.model("HelpArticle", helpArticleSchema);

export default HelpArticle;

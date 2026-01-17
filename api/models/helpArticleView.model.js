import mongoose from "mongoose";

const helpArticleViewSchema = new mongoose.Schema({
    articleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HelpArticle",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Check strictly for user + article + day range in controller, 
// or simpler: store a "dateString" field like "YYYY-MM-DD" and compound unique index it.

// Let's use a "day" field for easy uniqueness
helpArticleViewSchema.add({
    day: {
        type: String, // Format: YYYY-MM-DD
        required: true
    }
});

// Compound index to enforce one view per user per article per day at DB level
helpArticleViewSchema.index({ articleId: 1, userId: 1, day: 1 }, { unique: true });

const HelpArticleView = mongoose.model("HelpArticleView", helpArticleViewSchema);

export default HelpArticleView;

import HelpArticle from "../models/helpArticle.model.js";
import { errorHandler } from "../utils/error.js";

// Generate slug from title
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/\s+/g, "-");
};

export const getArticles = async (req, res, next) => {
    try {
        const { category, search, limit, slug, sort } = req.query;

        const limitNum = parseInt(limit) || 20;

        if (sort === 'popular') {
            const pipeline = [
                { $match: { isPublished: true } }
            ];

            if (category) {
                pipeline.push({ $match: { category } });
            }

            // If search is present, we might want to prioritize text usage, 
            // but usually 'popular' combined with search is just search sorted by popularity.
            // For simple implementation, if search exists, we handle it in the match or separate flow.
            // Current requirement implies "Popular Articles" section which usually has no search term.
            if (search) {
                pipeline.push({ $match: { $text: { $search: search } } });
            }

            // Calculate Score: Views(1x) + Helpful(10x) - NotHelpful(5x)
            // This weights user interaction much higher than passive views
            pipeline.push({
                $addFields: {
                    popularityScore: {
                        $add: [
                            "$views",
                            { $multiply: ["$helpfulCount", 10] },
                            { $multiply: ["$notHelpfulCount", -5] }
                        ]
                    }
                }
            });

            pipeline.push({ $sort: { popularityScore: -1 } });
            pipeline.push({ $limit: limitNum });

            const articles = await HelpArticle.aggregate(pipeline);
            return res.status(200).json(articles);
        }

        // Default / Standard Search Flow
        const query = { isPublished: true };

        if (category) query.category = category;
        if (slug) query.slug = slug;
        if (search) query.$text = { $search: search };

        const articles = await HelpArticle.find(query)
            .sort({ createdAt: -1 }) // Newest first
            .limit(limitNum);

        res.status(200).json(articles);
    } catch (error) {
        next(error);
    }
};

import HelpArticleView from "../models/helpArticleView.model.js";

export const getArticleBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const article = await HelpArticle.findOne({ slug, isPublished: true });

        if (!article) {
            return next(errorHandler(404, "Article not found"));
        }

        // VIEW COUNTING LOGIC
        // Only count if user is logged in
        if (req.user) {
            const userId = req.user.id;
            const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

            try {
                // Check if user has already viewed this article today
                // We use findOneAndUpdate with upsert to atomicly handle concurrency
                // But simple check is enough for this non-critical stat
                const existingView = await HelpArticleView.findOne({
                    articleId: article._id,
                    userId: userId,
                    day: today
                });

                if (!existingView) {
                    // Create new view record
                    await HelpArticleView.create({
                        articleId: article._id,
                        userId: userId,
                        day: today
                    });

                    // Increment article view count
                    article.views += 1;
                    await article.save();
                }
            } catch (err) {
                // Ignore duplicate key error (race condition) or other minor view tracking errors
                console.log("View tracking skipped:", err.message);
            }
        }

        // Check if current user has voted
        let userVote = null;
        if (req.user && article.votedBy && article.votedBy.length > 0) {
            const voteRecord = article.votedBy.find(v => v.userId.toString() === req.user.id);
            if (voteRecord) {
                userVote = voteRecord.voteType;
            }
        }

        // Return article with user's vote status injected
        // Need to convert to object to inject custom field not in schema if simple .json() is strict
        // But Mongoose documents .toObject() usually happens on JSON stringify. 
        // Safer to return explicit object for the UI to know user's vote.
        const articleData = article.toObject();
        articleData.userVote = userVote;

        res.status(200).json(articleData);
    } catch (error) {
        next(error);
    }
};

// ... existing admin methods ...

export const voteArticle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'helpful' or 'not_helpful'
        const userId = req.user.id;

        if (!['helpful', 'not_helpful'].includes(type)) {
            return next(errorHandler(400, "Invalid vote type"));
        }

        const article = await HelpArticle.findById(id);
        if (!article) {
            return next(errorHandler(404, "Article not found"));
        }

        // Check if user already voted
        const existingVoteIndex = article.votedBy.findIndex(v => v.userId.toString() === userId);

        if (existingVoteIndex !== -1) {
            const existingVote = article.votedBy[existingVoteIndex];

            // Case 1: Promoting same vote (Toggle OFF)
            if (existingVote.voteType === type) {
                // Remove vote
                article.votedBy.splice(existingVoteIndex, 1);
                if (type === 'helpful') article.helpfulCount = Math.max(0, article.helpfulCount - 1);
                else article.notHelpfulCount = Math.max(0, article.notHelpfulCount - 1);
            }
            // Case 2: Changing vote (Swap)
            else {
                // Update vote type
                existingVote.voteType = type;
                if (type === 'helpful') {
                    article.helpfulCount++;
                    article.notHelpfulCount = Math.max(0, article.notHelpfulCount - 1);
                } else {
                    article.notHelpfulCount++;
                    article.helpfulCount = Math.max(0, article.helpfulCount - 1);
                }
            }
        } else {
            // Case 3: New Vote
            article.votedBy.push({ userId, voteType: type });
            if (type === 'helpful') article.helpfulCount++;
            else article.notHelpfulCount++;
        }

        await article.save();

        // Return updated stats and user's new vote status
        const currentVote = article.votedBy.find(v => v.userId.toString() === userId);

        res.status(200).json({
            helpfulCount: article.helpfulCount,
            notHelpfulCount: article.notHelpfulCount,
            userVote: currentVote ? currentVote.voteType : null,
            message: currentVote ? "Vote recorded" : "Vote removed"
        });
    } catch (error) {
        next(error);
    }
};

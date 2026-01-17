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
        const { category, search, limit, slug } = req.query;

        const query = { isPublished: true };

        if (category) {
            query.category = category;
        }

        if (slug) {
            query.slug = slug;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const articles = await HelpArticle.find(query)
            .sort({ createdAt: -1 }) // Newest first
            .limit(parseInt(limit) || 50);

        res.status(200).json(articles);
    } catch (error) {
        next(error);
    }
};

export const getArticleBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const article = await HelpArticle.findOne({ slug, isPublished: true });

        if (!article) {
            return next(errorHandler(404, "Article not found"));
        }

        // Increment views
        article.views += 1;
        await article.save();

        res.status(200).json(article);
    } catch (error) {
        next(error);
    }
};

// Admin: Get all articles (including drafts)
export const getAllArticlesAdmin = async (req, res, next) => {
    try {
        const articles = await HelpArticle.find().sort({ createdAt: -1 });
        res.status(200).json(articles);
    } catch (error) {
        next(error);
    }
};

export const createArticle = async (req, res, next) => {
    try {
        const { title, content, category, description, tags, isPublished } = req.body;

        if (!title || !content || !category || !description) {
            return next(errorHandler(400, "Please provide all required fields"));
        }

        const slug = generateSlug(title);

        // Check if slug exists
        const existingArticle = await HelpArticle.findOne({ slug });
        if (existingArticle) {
            return next(errorHandler(400, "Article with this title already exists. Please choose a different title."));
        }

        const newArticle = new HelpArticle({
            title,
            slug,
            content,
            category,
            description,
            tags: tags || [],
            isPublished: isPublished !== undefined ? isPublished : true,
            lastUpdatedBy: req.user.id
        });

        const savedArticle = await newArticle.save();
        res.status(201).json(savedArticle);
    } catch (error) {
        next(error);
    }
};

export const updateArticle = async (req, res, next) => {
    try {
        const article = await HelpArticle.findById(req.params.id);
        if (!article) {
            return next(errorHandler(404, "Article not found"));
        }

        const updateData = {
            ...req.body,
            lastUpdatedBy: req.user.id
        };

        if (req.body.title && req.body.title !== article.title) {
            updateData.slug = generateSlug(req.body.title);
            // Check collision if title changed
            const existing = await HelpArticle.findOne({ slug: updateData.slug, _id: { $ne: article._id } });
            if (existing) {
                return next(errorHandler(400, "Article with this title already exists."));
            }
        }

        const updatedArticle = await HelpArticle.findByIdAndUpdate(
            req.params.id,
            {
                $set: updateData
            },
            { new: true }
        );

        res.status(200).json(updatedArticle);
    } catch (error) {
        next(error);
    }
};

export const deleteArticle = async (req, res, next) => {
    try {
        const article = await HelpArticle.findById(req.params.id);
        if (!article) {
            return next(errorHandler(404, "Article not found"));
        }

        await HelpArticle.findByIdAndDelete(req.params.id);
        res.status(200).json("Article has been deleted");
    } catch (error) {
        next(error);
    }
};

export const voteArticle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'helpful' or 'not_helpful'

        if (!['helpful', 'not_helpful'].includes(type)) {
            return next(errorHandler(400, "Invalid vote type"));
        }

        const update = type === 'helpful'
            ? { $inc: { helpfulCount: 1 } }
            : { $inc: { notHelpfulCount: 1 } };

        const updatedArticle = await HelpArticle.findByIdAndUpdate(
            id,
            update,
            { new: true }
        );

        if (!updatedArticle) {
            return next(errorHandler(404, "Article not found"));
        }

        res.status(200).json(updatedArticle);
    } catch (error) {
        next(error);
    }
};

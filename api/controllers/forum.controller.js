import ForumPost from '../models/forumPost.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

export const createPost = async (req, res, next) => {
    try {
        const { title, content, category, location, images } = req.body;

        const newPost = new ForumPost({
            author: req.user.id,
            title,
            content,
            category,
            location,
            images
        });

        const savedPost = await newPost.save();

        // Populate author details
        const populatedPost = await ForumPost.findById(savedPost._id)
            .populate('author', 'username avatar email type isVerified')
            .exec();

        req.app.get('io').emit('forum:postCreated', populatedPost);

        res.status(201).json(populatedPost);
    } catch (error) {
        next(error);
    }
};

export const getPosts = async (req, res, next) => {
    try {
        const { city, neighborhood, category, sort, limit = 10, skip = 0 } = req.query;

        let query = {};

        if (city) query['location.city'] = { $regex: city, $options: 'i' };
        if (neighborhood) query['location.neighborhood'] = { $regex: neighborhood, $options: 'i' };
        if (req.query.searchTerm) {
            query.$or = [
                { title: { $regex: req.query.searchTerm, $options: 'i' } },
                { content: { $regex: req.query.searchTerm, $options: 'i' } }
            ];
        }
        if (category === 'Reported') {
            query.reports = { $exists: true, $not: { $size: 0 } };
        } else if (category && category !== 'All') {
            query.category = category;
        }

        const sortOption = sort === 'popular' ? { 'likes': -1, createdAt: -1 } : { createdAt: -1 };

        const posts = await ForumPost.find(query)
            .populate('author', 'username avatar email type isVerified')
            .populate('comments.user', 'username avatar')
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await ForumPost.countDocuments(query);

        res.status(200).json({ posts, total, hasMore: total > parseInt(skip) + posts.length });
    } catch (error) {
        next(error);
    }
};

export const getPostById = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id)
            .populate('author', 'username avatar email type isVerified')
            .populate('comments.user', 'username avatar');

        if (!post) return next(errorHandler(404, 'Post not found'));

        // Increment view count
        post.viewCount += 1;
        await post.save();

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

export const deletePost = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        if (req.user.id !== post.author.toString() && req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'You are not allowed to delete this post'));
        }

        await ForumPost.findByIdAndDelete(req.params.id);
        req.app.get('io').emit('forum:postDeleted', req.params.id);
        res.status(200).json('The post has been deleted');
    } catch (error) {
        next(error);
    }
};

export const togglePin = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'You are not allowed to pin posts'));
        }

        post.isPinned = !post.isPinned;
        await post.save();
        await post.populate('author', 'username avatar email type isVerified');
        req.app.get('io').emit('forum:postUpdated', post);
        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

export const likePost = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const index = post.likes.indexOf(req.user.id);
        if (index === -1) {
            post.likes.push(req.user.id);
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();
        await post.populate('author', 'username avatar type');
        req.app.get('io').emit('forum:postUpdated', post);
        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

export const addComment = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));
        if (post.isLocked && req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'This discussion is locked'));
        }

        const { content } = req.body;
        const newComment = {
            user: req.user.id,
            content,
        };

        post.comments.push(newComment);
        await post.save();

        // Re-fetch to populate user
        const updatedPost = await ForumPost.findById(req.params.id)
            .populate('comments.user', 'username avatar');

        // Return the last added comment (which is now populated)
        const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

        req.app.get('io').emit('forum:commentAdded', { postId: req.params.id, comment: addedComment });

        res.status(200).json(addedComment);
    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return next(errorHandler(404, 'Comment not found'));

        if (req.user.id !== comment.user.toString() && req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'You are not allowed to delete this comment'));
        }

        comment.deleteOne();
        await post.save();
        req.app.get('io').emit('forum:commentDeleted', { postId: req.params.id, commentId: req.params.commentId });
        res.status(200).json('Comment has been deleted');
    } catch (error) {
        next(error);
    }
};

export const addReply = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        if (post.isLocked && req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'This discussion is locked'));
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return next(errorHandler(404, 'Comment not found'));

        const { content, replyToUser } = req.body;
        const newReply = {
            user: req.user.id,
            replyToUser: replyToUser || null,
            content
        };

        comment.replies.push(newReply);
        await post.save();

        const updatedPost = await ForumPost.findById(req.params.id)
            .populate('comments.replies.user', 'username avatar')
            .populate('comments.replies.replyToUser', 'username');

        const updatedComment = updatedPost.comments.id(req.params.commentId);
        const addedReply = updatedComment.replies[updatedComment.replies.length - 1];

        req.app.get('io').emit('forum:replyAdded', { postId: req.params.id, commentId: req.params.commentId, reply: addedReply });

        res.status(200).json(addedReply);
    } catch (error) {
        next(error);
    }
};

export const deleteReply = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return next(errorHandler(404, 'Comment not found'));

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) return next(errorHandler(404, 'Reply not found'));

        if (req.user.id !== reply.user.toString() && req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'Not authorized'));
        }

        reply.deleteOne();
        await post.save();
        req.app.get('io').emit('forum:replyDeleted', { postId: req.params.id, commentId: req.params.commentId, replyId: req.params.replyId });
        res.status(200).json('Reply deleted');
    } catch (error) {
        next(error);
    }
};

export const getCommunityStats = async (req, res, next) => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dailyPosts = await ForumPost.countDocuments({ createdAt: { $gte: oneDayAgo } });

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const eventsThisWeek = await ForumPost.countDocuments({ category: 'Events', createdAt: { $gte: sevenDaysAgo } });

        // Get accurate user count from User model as requested
        const activeMembers = await User.countDocuments();

        // Get top 3 trending topics based on likes + comments count
        const trendingTopics = await ForumPost.aggregate([
            {
                $addFields: {
                    interactionCount: {
                        $add: [{ $size: "$likes" }, { $size: "$comments" }]
                    }
                }
            },
            { $sort: { interactionCount: -1 } },
            { $limit: 3 },
            { $project: { title: 1, _id: 1 } }
        ]);

        res.status(200).json({
            activeMembers: activeMembers || 0,
            dailyPosts,
            eventsThisWeek,
            trendingTopics
        });
    } catch (error) {
        next(error);
    }
};



export const lockPost = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'Not authorized'));
        }

        post.isLocked = !post.isLocked;
        await post.save();
        await post.populate('author', 'username avatar email type isVerified');
        req.app.get('io').emit('forum:postUpdated', post);
        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

export const reportPost = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const existingReport = post.reports.find(r => r.user.toString() === req.user.id);
        if (existingReport) return next(errorHandler(400, 'You have already reported this post'));

        post.reports.push({
            user: req.user.id,
            reason: req.body.reason || 'Spam/Inappropriate'
        });
        await post.save();
        res.status(200).json('Post reported successfully');
    } catch (error) {
        next(error);
    }
};

export const getSuggestions = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(200).json([]);

        const posts = await ForumPost.find({
            title: { $regex: q, $options: 'i' }
        }).select('title').limit(5);

        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
};

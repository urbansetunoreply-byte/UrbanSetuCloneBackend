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
            query.$or = [
                { reports: { $exists: true, $not: { $size: 0 } } },
                { 'comments.reports': { $exists: true, $not: { $size: 0 } } },
                { 'comments.replies.reports': { $exists: true, $not: { $size: 0 } } }
            ];
        } else if (category && category !== 'All') {
            query.category = category;
        }

        const sortOption = sort === 'popular' ? { 'likes': -1, createdAt: -1 } : { createdAt: -1 };

        const posts = await ForumPost.find(query)
            .populate('author', 'username avatar email type isVerified')
            .populate('comments.user', 'username avatar')
            .populate('comments.replies.user', 'username avatar')
            .populate('comments.replies.replyToUser', 'username')
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
            .populate('comments.user', 'username avatar')
            .populate('comments.replies.user', 'username avatar')
            .populate('comments.replies.replyToUser', 'username');

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

        const likeIndex = post.likes.indexOf(req.user.id);
        const dislikeIndex = post.dislikes?.indexOf(req.user.id) ?? -1;

        if (likeIndex === -1) {
            post.likes.push(req.user.id);
            // Remove from dislikes if present
            if (dislikeIndex !== -1) {
                post.dislikes.splice(dislikeIndex, 1);
            }
        } else {
            post.likes.splice(likeIndex, 1);
        }

        await post.save();
        await post.populate('author', 'username avatar type');
        req.app.get('io').emit('forum:postUpdated', post);
        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

export const dislikePost = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const dislikeIndex = post.dislikes.indexOf(req.user.id);
        const likeIndex = post.likes.indexOf(req.user.id);

        if (dislikeIndex === -1) {
            post.dislikes.push(req.user.id);
            // Remove from likes if present
            if (likeIndex !== -1) {
                post.likes.splice(likeIndex, 1);
            }
        } else {
            post.dislikes.splice(dislikeIndex, 1);
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

export const updateComment = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return next(errorHandler(404, 'Comment not found'));

        if (req.user.id !== comment.user.toString() && req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return next(errorHandler(403, 'You are not allowed to edit this comment'));
        }

        comment.content = req.body.content;
        await post.save();

        // Re-fetch to populate user (and ensure fresh data)
        const updatedPost = await ForumPost.findById(req.params.id).populate('comments.user', 'username avatar');
        const updatedComment = updatedPost.comments.id(req.params.commentId);

        req.app.get('io').emit('forum:commentUpdated', { postId: req.params.id, comment: updatedComment });
        res.status(200).json(updatedComment);
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

        const { content, replyToUser, parentReplyId } = req.body;
        const newReply = {
            user: req.user.id,
            replyToUser: replyToUser || null,
            parentReplyId: parentReplyId || null,
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

export const updateReply = async (req, res, next) => {
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

        reply.content = req.body.content;
        await post.save();

        const updatedPost = await ForumPost.findById(req.params.id)
            .populate('comments.replies.user', 'username avatar');

        const updatedComment = updatedPost.comments.id(req.params.commentId);
        const updatedReply = updatedComment.replies.id(req.params.replyId);

        req.app.get('io').emit('forum:replyUpdated', { postId: req.params.id, commentId: req.params.commentId, reply: updatedReply });
        res.status(200).json(updatedReply);
    } catch (error) {
        next(error);
    }
};

export const likeComment = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return next(errorHandler(404, 'Comment not found'));

        const likeIndex = comment.likes.indexOf(req.user.id);
        const dislikeIndex = comment.dislikes?.indexOf(req.user.id) ?? -1;

        if (likeIndex === -1) {
            comment.likes.push(req.user.id);
            if (dislikeIndex !== -1) {
                comment.dislikes.splice(dislikeIndex, 1);
            }
        } else {
            comment.likes.splice(likeIndex, 1);
        }

        await post.save();
        await post.populate('author', 'username avatar email type isVerified');
        await post.populate('comments.user', 'username avatar');
        await post.populate('comments.replies.user', 'username avatar');
        await post.populate('comments.replies.replyToUser', 'username');
        req.app.get('io').emit('forum:postUpdated', post);
        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

export const dislikeComment = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return next(errorHandler(404, 'Comment not found'));

        const dislikeIndex = comment.dislikes.indexOf(req.user.id);
        const likeIndex = comment.likes.indexOf(req.user.id);

        if (dislikeIndex === -1) {
            comment.dislikes.push(req.user.id);
            if (likeIndex !== -1) {
                comment.likes.splice(likeIndex, 1);
            }
        } else {
            comment.dislikes.splice(dislikeIndex, 1);
        }

        await post.save();
        await post.populate('author', 'username avatar email type isVerified');
        await post.populate('comments.user', 'username avatar');
        await post.populate('comments.replies.user', 'username avatar');
        await post.populate('comments.replies.replyToUser', 'username');
        req.app.get('io').emit('forum:postUpdated', post);
        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

export const likeReply = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return next(errorHandler(404, 'Comment not found'));

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) return next(errorHandler(404, 'Reply not found'));

        const likeIndex = reply.likes.indexOf(req.user.id);
        const dislikeIndex = reply.dislikes?.indexOf(req.user.id) ?? -1;

        if (likeIndex === -1) {
            reply.likes.push(req.user.id);
            if (dislikeIndex !== -1) {
                reply.dislikes.splice(dislikeIndex, 1);
            }
        } else {
            reply.likes.splice(likeIndex, 1);
        }

        await post.save();
        await post.populate('author', 'username avatar email type isVerified');
        await post.populate('comments.user', 'username avatar');
        await post.populate('comments.replies.user', 'username avatar');
        await post.populate('comments.replies.replyToUser', 'username');
        req.app.get('io').emit('forum:postUpdated', post);
        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

export const dislikeReply = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return next(errorHandler(404, 'Comment not found'));

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) return next(errorHandler(404, 'Reply not found'));

        const dislikeIndex = reply.dislikes.indexOf(req.user.id);
        const likeIndex = reply.likes.indexOf(req.user.id);

        if (dislikeIndex === -1) {
            reply.dislikes.push(req.user.id);
            if (likeIndex !== -1) {
                reply.likes.splice(likeIndex, 1);
            }
        } else {
            reply.dislikes.splice(dislikeIndex, 1);
        }

        await post.save();
        await post.populate('author', 'username avatar email type isVerified');
        await post.populate('comments.user', 'username avatar');
        await post.populate('comments.replies.user', 'username avatar');
        await post.populate('comments.replies.replyToUser', 'username');
        req.app.get('io').emit('forum:postUpdated', post);
        res.status(200).json(post);
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

export const reportComment = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return next(errorHandler(404, 'Comment not found'));

        const existingReport = comment.reports?.find(r => r.user.toString() === req.user.id);
        if (existingReport) return next(errorHandler(400, 'You have already reported this comment'));

        comment.reports.push({
            user: req.user.id,
            reason: req.body.reason || 'Spam/Inappropriate'
        });
        await post.save();
        res.status(200).json('Comment reported successfully');
    } catch (error) {
        next(error);
    }
};

export const reportReply = async (req, res, next) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return next(errorHandler(404, 'Post not found'));

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return next(errorHandler(404, 'Comment not found'));

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) return next(errorHandler(404, 'Reply not found'));

        const existingReport = reply.reports?.find(r => r.user.toString() === req.user.id);
        if (existingReport) return next(errorHandler(400, 'You have already reported this reply'));

        reply.reports.push({
            user: req.user.id,
            reason: req.body.reason || 'Spam/Inappropriate'
        });
        await post.save();
        res.status(200).json('Reply reported successfully');
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
e x p o r t   c o n s t   u p d a t e P o s t   =   a s y n c   ( r e q ,   r e s ,   n e x t )   = >   {  
         t r y   {  
                 c o n s t   p o s t   =   a w a i t   F o r u m P o s t . f i n d B y I d ( r e q . p a r a m s . i d ) ;  
                 i f   ( ! p o s t )   r e t u r n   n e x t ( e r r o r H a n d l e r ( 4 0 4 ,   ' P o s t   n o t   f o u n d ' ) ) ;  
  
                 i f   ( r e q . u s e r . i d   ! = =   p o s t . a u t h o r . t o S t r i n g ( )   & &   r e q . u s e r . r o l e   ! = =   ' a d m i n '   & &   r e q . u s e r . r o l e   ! = =   ' r o o t a d m i n ' )   {  
                         r e t u r n   n e x t ( e r r o r H a n d l e r ( 4 0 3 ,   ' Y o u   a r e   n o t   a l l o w e d   t o   u p d a t e   t h i s   p o s t ' ) ) ;  
                 }  
  
                 c o n s t   {   t i t l e ,   c o n t e n t   }   =   r e q . b o d y ;  
                 i f   ( t i t l e )   p o s t . t i t l e   =   t i t l e ;  
                 i f   ( c o n t e n t )   p o s t . c o n t e n t   =   c o n t e n t ;  
  
                 a w a i t   p o s t . s a v e ( ) ;  
  
                 / /   F u l l y   p o p u l a t e   t o   p r e v e n t   d a t a   l o s s   o n   f r o n t e n d  
                 a w a i t   p o s t . p o p u l a t e ( ' a u t h o r ' ,   ' u s e r n a m e   a v a t a r   e m a i l   t y p e   i s V e r i f i e d ' ) ;  
                 a w a i t   p o s t . p o p u l a t e ( ' c o m m e n t s . u s e r ' ,   ' u s e r n a m e   a v a t a r ' ) ;  
                 a w a i t   p o s t . p o p u l a t e ( ' c o m m e n t s . r e p l i e s . u s e r ' ,   ' u s e r n a m e   a v a t a r ' ) ;  
                 a w a i t   p o s t . p o p u l a t e ( ' c o m m e n t s . r e p l i e s . r e p l y T o U s e r ' ,   ' u s e r n a m e ' ) ;  
  
                 r e q . a p p . g e t ( ' i o ' ) . e m i t ( ' f o r u m : p o s t U p d a t e d ' ,   p o s t ) ;  
                 r e s . s t a t u s ( 2 0 0 ) . j s o n ( p o s t ) ;  
         }   c a t c h   ( e r r o r )   {  
                 n e x t ( e r r o r ) ;  
         }  
 } ;  
 
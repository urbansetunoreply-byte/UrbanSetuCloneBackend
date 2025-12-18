import express from 'express';
import { verifyToken } from '../utils/verify.js';
import {
    createPost,
    getPosts,
    getPostById,
    deletePost,
    likePost,
    dislikePost,
    addComment,
    deleteComment,
    likeComment,
    dislikeComment,
    addReply,
    deleteReply,
    likeReply,
    dislikeReply,
    getCommunityStats,
    togglePin,
    lockPost,
    reportPost,
    getSuggestions
} from '../controllers/forum.controller.js';

const router = express.Router();

router.post('/create', verifyToken, createPost);
router.get('/', getPosts);
router.get('/stats', getCommunityStats);
router.get('/search/suggestions', getSuggestions);
router.get('/:id', getPostById);
router.delete('/:id', verifyToken, deletePost);

// Reactions
router.put('/like/:id', verifyToken, likePost);
router.put('/dislike/:id', verifyToken, dislikePost);
router.put('/comment/:id/:commentId/like', verifyToken, likeComment);
router.put('/comment/:id/:commentId/dislike', verifyToken, dislikeComment);
router.put('/comment/:id/:commentId/reply/:replyId/like', verifyToken, likeReply);
router.put('/comment/:id/:commentId/reply/:replyId/dislike', verifyToken, dislikeReply);

router.post('/comment/:id', verifyToken, addComment);
router.delete('/comment/:id/:commentId', verifyToken, deleteComment);
router.post('/comment/:id/:commentId/reply', verifyToken, addReply);
router.delete('/comment/:id/:commentId/reply/:replyId', verifyToken, deleteReply);
router.put('/pin/:id', verifyToken, togglePin);
router.put('/lock/:id', verifyToken, lockPost);
router.post('/report/:id', verifyToken, reportPost);


export default router;

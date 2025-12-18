import express from 'express';
import { verifyToken } from '../utils/verify.js';
import {
    createPost,
    getPosts,
    getPostById,
    deletePost,
    likePost,
    addComment,
    deleteComment,
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
router.put('/like/:id', verifyToken, likePost);
router.post('/comment/:id', verifyToken, addComment);
router.delete('/comment/:id/:commentId', verifyToken, deleteComment);
router.put('/pin/:id', verifyToken, togglePin);
router.put('/lock/:id', verifyToken, lockPost);
router.post('/report/:id', verifyToken, reportPost);


export default router;

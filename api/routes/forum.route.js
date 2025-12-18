import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
    createPost,
    getPosts,
    getPostById,
    deletePost,
    likePost,
    addComment,
    deleteComment
} from '../controllers/forum.controller.js';

const router = express.Router();

router.post('/create', verifyToken, createPost);
router.get('/', getPosts);
router.get('/:id', getPostById);
router.delete('/:id', verifyToken, deletePost);
router.put('/like/:id', verifyToken, likePost);
router.post('/comment/:id', verifyToken, addComment);
router.delete('/comment/:id/:commentId', verifyToken, deleteComment);

export default router;

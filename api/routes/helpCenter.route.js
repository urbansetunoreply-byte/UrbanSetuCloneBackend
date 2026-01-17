import express from 'express';
import {
    createArticle,
    deleteArticle,
    getAllArticlesAdmin,
    getArticleBySlug,
    getArticles,
    updateArticle,
    voteArticle
} from '../controllers/helpCenter.controller.js';
import { verifyToken, verifyAdmin } from '../utils/verify.js';

const router = express.Router();

// Public routes
router.get('/', getArticles); // Get articles (filter by category/search)
router.get('/article/:slug', getArticleBySlug); // Get single article by slug
router.post('/:id/vote', voteArticle); // Vote helpful/not helpful

// Admin routes
router.get('/admin/all', verifyToken, verifyAdmin, getAllArticlesAdmin); // Get all (including unpublished)
router.post('/admin/create', verifyToken, verifyAdmin, createArticle); // Create new
router.put('/admin/update/:id', verifyToken, verifyAdmin, updateArticle); // Update
router.delete('/admin/delete/:id', verifyToken, verifyAdmin, deleteArticle); // Delete

export default router;

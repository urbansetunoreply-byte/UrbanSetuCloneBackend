import express from 'express';
import { 
    getBlogs, 
    getBlog, 
    createBlog, 
    updateBlog, 
    deleteBlog, 
    likeBlog, 
    addComment,
    getBlogCategories,
    getBlogTags
} from '../controllers/blog.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// Public routes
router.get('/', getBlogs); // GET /api/blogs?propertyId=123&category=Real Estate Tips&tag=investment
router.get('/categories', getBlogCategories); // GET /api/blogs/categories
router.get('/tags', getBlogTags); // GET /api/blogs/tags
router.get('/:id', getBlog); // GET /api/blogs/:id (by ID or slug)
router.post('/:id/like', likeBlog); // POST /api/blogs/:id/like

// Protected routes (require authentication)
router.post('/:id/comment', verifyToken, addComment); // POST /api/blogs/:id/comment

// Admin routes (protected)
router.post('/', verifyToken, createBlog); // POST /api/blogs
router.put('/:id', verifyToken, updateBlog); // PUT /api/blogs/:id
router.delete('/:id', verifyToken, deleteBlog); // DELETE /api/blogs/:id

export default router;

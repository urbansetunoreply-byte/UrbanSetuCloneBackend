import express from 'express';
import { verifyToken, verifyAdmin } from '../utils/verify.js';
import { getUserYearInReview, getAdminYearInReview, uploadYearInReviewImage } from '../controllers/yearInReview.controller.js';

const router = express.Router();

router.get('/user/:year', verifyToken, getUserYearInReview);
router.get('/admin/:year', verifyToken, verifyAdmin, getAdminYearInReview);
router.post('/upload', verifyToken, uploadYearInReviewImage);

export default router;

import express from 'express';
import { getAbout, updateAbout, migrateAbout } from '../controllers/about.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// GET: Get About content (public)
router.get('/', getAbout);

// POST: Migrate About content with new fields (public)
router.post('/migrate', migrateAbout);

// PUT: Update About content (admin only)
router.put('/', verifyToken, updateAbout);

export default router; 
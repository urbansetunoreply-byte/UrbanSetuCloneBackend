import express from 'express';
import { getTurnCredentials } from '../controllers/turn.controller.js';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// Endpoint to secure TURN credentials
// Protected by verifyToken to ensuring only logged-in users drain your quota
router.get('/turn-credentials', verifyToken, getTurnCredentials);

export default router;

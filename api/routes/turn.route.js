import express from 'express';
import { getTurnCredentials } from '../controllers/turn.controller.js';
import { verifyToken } from '../utils/verifyUser.js'; // Updated to match likely verifying middleware location/name from user.route.js pattern or standard imports

const router = express.Router();

// Endpoint to secure TURN credentials
// Protected by verifyToken to ensuring only logged-in users drain your quota
router.get('/turn-credentials', verifyToken, getTurnCredentials);

export default router;

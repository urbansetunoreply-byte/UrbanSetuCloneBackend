import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
    createSharedChat,
    getSharedChat,
    getShareInfo,
    updateSharedChat,
    deleteSharedChat
} from '../controllers/sharedChat.controller.js';

const router = express.Router();

// Public route to view
router.get('/view/:shareToken', getSharedChat);

// Protected Management routes
router.post('/create', verifyToken, createSharedChat);
router.get('/manage/:sessionId', verifyToken, getShareInfo);
router.put('/:shareToken', verifyToken, updateSharedChat);
router.delete('/:shareToken', verifyToken, deleteSharedChat);

export default router;

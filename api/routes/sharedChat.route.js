import express from 'express';
import { verifyToken } from '../utils/verify.js';
import {
    createSharedChat,
    getSharedChat,
    getShareInfo,
    updateSharedChat,
    deleteSharedChat,
    importSharedChat
} from '../controllers/sharedChat.controller.js';

const router = express.Router();

// Public route to view
router.get('/view/:shareToken', getSharedChat);

// Protected Management routes
router.post('/create', verifyToken, createSharedChat);
router.post('/import/:shareToken', verifyToken, importSharedChat);
router.get('/manage/:sessionId', verifyToken, getShareInfo);
router.put('/:shareToken', verifyToken, updateSharedChat);
router.delete('/:shareToken', verifyToken, deleteSharedChat);

export default router;

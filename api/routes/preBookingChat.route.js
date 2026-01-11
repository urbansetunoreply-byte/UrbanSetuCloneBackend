import express from 'express';
import { verifyToken } from '../utils/verify.js';
import {
    initiateOrGetChat,
    sendMessage,
    getUserChats,
    getChatDetails,
    clearChat,
    deleteChats
} from '../controllers/preBookingChat.controller.js';

const router = express.Router();

router.post('/initiate', verifyToken, initiateOrGetChat);
router.post('/send', verifyToken, sendMessage);
router.get('/user-chats', verifyToken, getUserChats);
router.get('/:chatId', verifyToken, getChatDetails);
router.delete('/:chatId', verifyToken, clearChat);
router.post('/delete-batch', verifyToken, deleteChats);

export default router;

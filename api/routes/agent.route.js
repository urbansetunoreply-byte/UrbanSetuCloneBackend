import express from 'express';
import {
    getAgents,
    getAgent,
    applyAgent,
    getAllAgentsAdmin,
    updateAgentStatus,
    deleteAgent,
    checkMyAgentStatus
} from '../controllers/agent.controller.js';
import { verifyToken, verifyAdmin } from '../utils/verify.js';

const router = express.Router();

// Public Routes
router.get('/', getAgents);
router.get('/profile/:id', getAgent); // Public profile view

// User Routes
router.get('/status/me', verifyToken, checkMyAgentStatus);
router.post('/apply', verifyToken, applyAgent);

// Admin Routes
router.get('/admin/all', verifyToken, verifyAdmin, getAllAgentsAdmin);
router.patch('/admin/status/:id', verifyToken, verifyAdmin, updateAgentStatus);
router.delete('/admin/delete/:id', verifyToken, verifyAdmin, deleteAgent);

export default router;

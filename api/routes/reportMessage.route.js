import express from 'express';
import { verifyToken, optionalAuth } from '../utils/verify.js';
import { createReport, getReports, updateReportStatus, deleteReport } from '../controllers/reportMessage.controller.js';

const router = express.Router();

router.post('/create', optionalAuth, createReport);
router.get('/getreports', verifyToken, getReports);
router.put('/update/:reportId', verifyToken, updateReportStatus);
router.delete('/delete/:reportId', verifyToken, deleteReport);

export default router;

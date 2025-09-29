import express from 'express';
import { 
  createRevocationToken, 
  verifyRevocationToken, 
  restoreAccount, 
  getRevocationStatus 
} from '../controllers/accountRevocation.controller.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/verify-revocation-token/:token', verifyRevocationToken);
router.post('/restore-account', restoreAccount);

// Admin routes (authentication required)
router.post('/create-token', createRevocationToken);
router.get('/status/:email', getRevocationStatus);

export default router;

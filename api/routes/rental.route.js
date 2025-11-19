import express from "express";
import { verifyToken } from '../utils/verify.js';
import {
  createContract,
  getContract,
  listContracts,
  signContract,
  getWallet,
  updateAutoDebit,
  downloadContractPDF,
  createMoveInOutChecklist,
  getMoveInOutChecklist,
  updateMoveInCondition,
  approveMoveInChecklist,
  updateMoveOutCondition,
  assessDamages,
  createDispute,
  getDispute,
  listDisputes,
  updateDisputeStatus,
  addDisputeComment,
  resolveDispute,
  requestVerification,
  getVerificationStatus,
  approveVerification,
  rejectVerification
} from '../controllers/rental.controller.js';

const router = express.Router();

// Rent-Lock Contract Routes
router.post("/contracts/create", verifyToken, createContract);
router.get("/contracts", verifyToken, listContracts);
router.get("/contracts/:contractId", verifyToken, getContract);
router.post("/contracts/:contractId/sign", verifyToken, signContract);
router.get("/contracts/:contractId/download", verifyToken, downloadContractPDF);

// Rent Wallet Routes
router.get("/wallet/:contractId", verifyToken, getWallet);
router.put("/wallet/:contractId/auto-debit", verifyToken, updateAutoDebit);

// Payment Reminder Routes (can be called by cron job or manually)
router.post("/reminders/send", verifyToken, async (req, res, next) => {
  try {
    // Only allow admin or cron job (with secret key) to trigger reminders
    if (req.user.role !== 'admin' && req.body.secretKey !== process.env.CRON_SECRET_KEY) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const { sendPaymentReminders } = await import('../controllers/rental.controller.js');
    const result = await sendPaymentReminders();

    res.json({
      success: true,
      message: "Payment reminders sent",
      ...result
    });
  } catch (error) {
    next(error);
  }
});

// Move-In/Move-Out Checklist Routes
router.post("/checklist/:contractId", verifyToken, createMoveInOutChecklist);
router.get("/checklist/:contractId", verifyToken, getMoveInOutChecklist);
router.put("/checklist/move-in/:checklistId", verifyToken, updateMoveInCondition);
router.post("/checklist/move-in/:checklistId/approve", verifyToken, approveMoveInChecklist);
router.put("/checklist/move-out/:checklistId", verifyToken, updateMoveOutCondition);
router.post("/checklist/:contractId/assess-damages", verifyToken, assessDamages);

// Dispute Resolution Routes
router.post("/disputes/:contractId", verifyToken, createDispute);
router.get("/disputes", verifyToken, listDisputes);
router.get("/disputes/:disputeId", verifyToken, getDispute);
router.put("/disputes/:disputeId/status", verifyToken, updateDisputeStatus);
router.post("/disputes/:disputeId/comments", verifyToken, addDisputeComment);
router.post("/disputes/:disputeId/resolve", verifyToken, resolveDispute);

// Property Verification Routes
router.post("/verification/:listingId", verifyToken, requestVerification);
router.get("/verification/:listingId", verifyToken, getVerificationStatus);
router.post("/verification/:verificationId/approve", verifyToken, approveVerification);
router.post("/verification/:verificationId/reject", verifyToken, rejectVerification);

export default router;


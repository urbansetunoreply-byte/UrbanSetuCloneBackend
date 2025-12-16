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
  listAllChecklists,
  deleteChecklist,
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
  rejectVerification,
  listAllVerifications,
  submitRentalRating,
  getRentalRating,
  listRentalRatings,
  getPropertyRatings,
  applyForRentalLoan,
  getRentalLoan,
  listRentalLoans,
  approveRentalLoan,
  rejectRentalLoan,
  disburseRentalLoan,
  generateRentPrediction,
  getRentPrediction,
  getLocalityScore,
  listAllRatings,
  listAllContracts,
  updateContractStatus,
  getRentalLoanDocument,
  getPublicRentalLoanDocument,
  proxyDocumentDownload
} from '../controllers/rental.controller.js';

const router = express.Router();

// ... existing code ...

// Rental Loans Routes
router.get("/public/documents/:documentId", getPublicRentalLoanDocument);
router.post("/loans/:contractId", verifyToken, applyForRentalLoan);
router.get("/loans/documents/:documentId/download", verifyToken, proxyDocumentDownload);
router.get("/loans/documents/:documentId", verifyToken, getRentalLoanDocument);
router.get("/loans/:loanId", verifyToken, getRentalLoan);
router.get("/loans", verifyToken, listRentalLoans);
// ... existing code ...
router.post("/loans/:loanId/approve", verifyToken, approveRentalLoan);
router.post("/loans/:loanId/reject", verifyToken, rejectRentalLoan);
router.post("/loans/:loanId/disburse", verifyToken, disburseRentalLoan);

// AI Rent Prediction & Locality Score Routes
router.post("/predictions/:listingId", verifyToken, generateRentPrediction);
router.get("/predictions/:listingId", getRentPrediction); // Public endpoint
router.get("/locality-score/:listingId", getLocalityScore); // Public endpoint

export default router;


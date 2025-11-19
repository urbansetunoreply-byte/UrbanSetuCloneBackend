import express from "express";
import { verifyToken } from '../utils/verify.js';
import {
  createContract,
  getContract,
  listContracts,
  signContract,
  getWallet,
  updateAutoDebit
} from '../controllers/rental.controller.js';

const router = express.Router();

// Rent-Lock Contract Routes
router.post("/contracts/create", verifyToken, createContract);
router.get("/contracts", verifyToken, listContracts);
router.get("/contracts/:contractId", verifyToken, getContract);
router.post("/contracts/:contractId/sign", verifyToken, signContract);

// Rent Wallet Routes
router.get("/wallet/:contractId", verifyToken, getWallet);
router.put("/wallet/:contractId/auto-debit", verifyToken, updateAutoDebit);

export default router;


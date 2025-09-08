import express from 'express';
import { verifyToken } from '../utils/verify.js';
import MoversRequest from '../models/moversRequest.model.js';
import ServiceRequest from '../models/serviceRequest.model.js';

const router = express.Router();

// Create movers request
router.post('/movers', verifyToken, async (req, res, next) => {
  try {
    const { fromAddress, toAddress, moveDate, size, notes } = req.body;
    if (!fromAddress || !toAddress || !moveDate || !size) return res.status(400).json({ message: 'Missing fields' });
    const doc = await MoversRequest.create({
      userId: req.user.id,
      requesterName: req.user.username,
      requesterEmail: req.user.email,
      fromAddress, toAddress, moveDate, size, notes
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

// List movers requests (user sees own, admin sees all)
router.get('/movers', verifyToken, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'rootadmin';
    const docs = await MoversRequest.find(isAdmin ? {} : { userId: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (e) { next(e); }
});

// Update status (admin only or owner can cancel)
router.patch('/movers/:id', verifyToken, async (req, res, next) => {
  try {
    const { status } = req.body;
    const doc = await MoversRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isAdmin = req.user.role === 'admin' || req.user.role === 'rootadmin';
    const isOwner = doc.userId.toString() === req.user.id;
    const allowed = isAdmin || (isOwner && status === 'cancelled');
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });
    doc.status = status;
    await doc.save();
    res.json(doc);
  } catch (e) { next(e); }
});

// Create service request
router.post('/services', verifyToken, async (req, res, next) => {
  try {
    const { services, preferredDate, address, notes } = req.body;
    if (!services || services.length === 0 || !preferredDate || !address) return res.status(400).json({ message: 'Missing fields' });
    const doc = await ServiceRequest.create({
      userId: req.user.id,
      requesterName: req.user.username,
      requesterEmail: req.user.email,
      services, preferredDate, address, notes
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

// List service requests
router.get('/services', verifyToken, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'rootadmin';
    const docs = await ServiceRequest.find(isAdmin ? {} : { userId: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (e) { next(e); }
});

// Update service request status
router.patch('/services/:id', verifyToken, async (req, res, next) => {
  try {
    const { status } = req.body;
    const doc = await ServiceRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isAdmin = req.user.role === 'admin' || req.user.role === 'rootadmin';
    const isOwner = doc.userId.toString() === req.user.id;
    const allowed = isAdmin || (isOwner && status === 'cancelled');
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });
    doc.status = status;
    await doc.save();
    res.json(doc);
  } catch (e) { next(e); }
});

export default router;


import express from 'express';
import PlatformUpdate from '../models/platformUpdate.model.js';
import { verifyToken } from '../utils/verify.js'; // Assuming you have verifyToken middleware

const router = express.Router();

// Get all public updates
router.get('/public', async (req, res, next) => {
    try {
        const { limit = 10, page = 1, category } = req.query;
        const query = { isActive: true };

        if (category) {
            query.category = category;
        }

        const updates = await PlatformUpdate.find(query)
            .sort({ releaseDate: -1 }) // Newest first
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await PlatformUpdate.countDocuments(query);

        res.status(200).json({
            success: true,
            data: updates,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                count: total
            }
        });
    } catch (error) {
        next(error);
    }
});

// Create a new update (Admin only)
router.post('/', verifyToken, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const newUpdate = new PlatformUpdate({
            ...req.body,
            author: req.user.id
        });

        const savedUpdate = await newUpdate.save();
        res.status(201).json({ success: true, data: savedUpdate });
    } catch (error) {
        next(error);
    }
});

// Get all updates (Admin only)
router.get('/', verifyToken, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const updates = await PlatformUpdate.find()
            .sort({ releaseDate: -1 });

        res.status(200).json({ success: true, data: updates });
    } catch (error) {
        next(error);
    }
});

// Update an existing update (Admin only)
router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const updatedUpdate = await PlatformUpdate.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true }
        );

        if (!updatedUpdate) {
            return res.status(404).json({ success: false, message: 'Update not found' });
        }

        res.status(200).json({ success: true, data: updatedUpdate });
    } catch (error) {
        next(error);
    }
});

// Delete an update (Admin only)
router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rootadmin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const deletedUpdate = await PlatformUpdate.findByIdAndDelete(req.params.id);

        if (!deletedUpdate) {
            return res.status(404).json({ success: false, message: 'Update not found' });
        }

        res.status(200).json({ success: true, message: 'Update has been deleted' });
    } catch (error) {
        next(error);
    }
});

export default router;

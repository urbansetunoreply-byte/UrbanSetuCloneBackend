import express from 'express';
import CalculationHistory from '../models/calculationHistory.model.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get user's calculation history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { calculationType, limit = 50, page = 1 } = req.query;
    const userId = req.user.id;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { userId };
    if (calculationType) {
      query.calculationType = calculationType;
    }
    
    const [calculations, totalCount] = await Promise.all([
      CalculationHistory.find(query)
        .populate('propertyId', 'name price city state type bedrooms area')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CalculationHistory.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        calculations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: skip + calculations.length < totalCount,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching calculation history:', error);
    res.status(500).json({ error: 'Failed to fetch calculation history' });
  }
});

// Save a new calculation
router.post('/save', verifyToken, async (req, res) => {
  try {
    const {
      calculationType,
      inputData,
      resultData,
      propertyId,
      location,
      tags = [],
      notes = ''
    } = req.body;
    
    const userId = req.user.id;
    
    const calculation = new CalculationHistory({
      userId,
      calculationType,
      inputData,
      resultData,
      propertyId,
      location,
      tags,
      notes
    });
    
    await calculation.save();
    
    res.json({
      success: true,
      data: calculation,
      message: 'Calculation saved successfully'
    });
  } catch (error) {
    console.error('Error saving calculation:', error);
    res.status(500).json({ error: 'Failed to save calculation' });
  }
});

// Update calculation (favorite, notes, tags)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isFavorite, notes, tags } = req.body;
    const userId = req.user.id;
    
    const calculation = await CalculationHistory.findOneAndUpdate(
      { _id: id, userId },
      { isFavorite, notes, tags },
      { new: true }
    );
    
    if (!calculation) {
      return res.status(404).json({ error: 'Calculation not found' });
    }
    
    res.json({
      success: true,
      data: calculation,
      message: 'Calculation updated successfully'
    });
  } catch (error) {
    console.error('Error updating calculation:', error);
    res.status(500).json({ error: 'Failed to update calculation' });
  }
});

// Delete calculation
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const calculation = await CalculationHistory.findOneAndDelete({ _id: id, userId });
    
    if (!calculation) {
      return res.status(404).json({ error: 'Calculation not found' });
    }
    
    res.json({
      success: true,
      message: 'Calculation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calculation:', error);
    res.status(500).json({ error: 'Failed to delete calculation' });
  }
});

// Get calculation statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await CalculationHistory.getUserStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching calculation stats:', error);
    res.status(500).json({ error: 'Failed to fetch calculation statistics' });
  }
});

// Search calculations
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q: searchTerm, calculationType } = req.query;
    const userId = req.user.id;
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    const calculations = await CalculationHistory.searchCalculations(
      userId, 
      searchTerm, 
      calculationType
    );
    
    res.json({
      success: true,
      data: calculations
    });
  } catch (error) {
    console.error('Error searching calculations:', error);
    res.status(500).json({ error: 'Failed to search calculations' });
  }
});

// Get calculation by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const calculation = await CalculationHistory.findOne({ _id: id, userId })
      .populate('propertyId', 'name price city state type bedrooms area');
    
    if (!calculation) {
      return res.status(404).json({ error: 'Calculation not found' });
    }
    
    res.json({
      success: true,
      data: calculation
    });
  } catch (error) {
    console.error('Error fetching calculation:', error);
    res.status(500).json({ error: 'Failed to fetch calculation' });
  }
});

export default router;
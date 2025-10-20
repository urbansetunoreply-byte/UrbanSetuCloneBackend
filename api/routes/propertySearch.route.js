import express from 'express';
import { searchPropertiesForSuggestions, getPropertyById } from '../controllers/propertySearch.controller.js';

const router = express.Router();

// Search properties for @ suggestions
router.get('/search', searchPropertiesForSuggestions);

// Get property details by ID
router.get('/:id', getPropertyById);

export default router;

import express from 'express';
import { searchPropertiesForSuggestions, getPropertyById, resolvePropertyFromUrl } from '../controllers/propertySearch.controller.js';

const router = express.Router();

// Search properties for @ suggestions
router.get('/search', searchPropertiesForSuggestions);

// Get property details by ID
router.get('/:id', getPropertyById);
router.get('/resolve/url', resolvePropertyFromUrl);

export default router;

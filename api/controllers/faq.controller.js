import FAQ from '../models/faq.model.js';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';

// Get FAQs with filtering
export const getFAQs = async (req, res, next) => {
    try {
        const { propertyId, isGlobal, category, search, page = 1, limit = 10 } = req.query;
        
        // Build query
        const query = { isActive: true };
        
        if (propertyId) {
            if (propertyId === 'null') {
                // Filter for global FAQs (no propertyId)
                query.propertyId = { $exists: false };
            } else if (propertyId === 'exists') {
                // Filter for property-specific FAQs (has propertyId)
                query.propertyId = { $exists: true, $ne: null };
            } else {
                // Filter for specific property
                query.propertyId = propertyId;
            }
        } else if (isGlobal === 'true') {
            query.isGlobal = true;
        }
        
        if (category) {
            query.category = category;
        }
        
        if (search) {
            query.$text = { $search: search };
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get FAQs with pagination
        const faqs = await FAQ.find(query)
            .populate('propertyId', 'name city state')
            .populate('createdBy', 'username')
            .sort({ priority: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get total count for pagination
        const total = await FAQ.countDocuments(query);
        
        res.status(200).json({
            success: true,
            data: faqs,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single FAQ
export const getFAQ = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const faq = await FAQ.findById(id)
            .populate('propertyId', 'name city state')
            .populate('createdBy', 'username');
        
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }
        
        // Increment view count
        faq.views += 1;
        await faq.save();
        
        res.status(200).json({
            success: true,
            data: faq
        });
    } catch (error) {
        next(error);
    }
};

// Create FAQ (Admin only)
export const createFAQ = async (req, res, next) => {
    try {
        const { question, answer, category, propertyId, isGlobal, tags, priority } = req.body;
        const createdBy = req.user.id;
        
        // Validate required fields
        if (!question || !answer) {
            return res.status(400).json({
                success: false,
                message: 'Question and answer are required'
            });
        }
        
        // Validate property exists if propertyId provided
        if (propertyId) {
            const property = await Listing.findById(propertyId);
            if (!property) {
                return res.status(400).json({
                    success: false,
                    message: 'Property not found'
                });
            }
        }
        
        const faqData = {
            question,
            answer,
            category: category || 'General',
            propertyId: propertyId || null,
            isGlobal: isGlobal || false,
            tags: tags || [],
            priority: priority || 0,
            createdBy
        };
        
        const faq = await FAQ.create(faqData);
        
        // Populate the created FAQ
        await faq.populate([
            { path: 'propertyId', select: 'name city state' },
            { path: 'createdBy', select: 'username' }
        ]);
        
        res.status(201).json({
            success: true,
            message: 'FAQ created successfully',
            data: faq
        });
    } catch (error) {
        next(error);
    }
};

// Update FAQ (Admin only)
export const updateFAQ = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { question, answer, category, propertyId, isGlobal, tags, priority, isActive } = req.body;
        
        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }
        
        // Validate property exists if propertyId provided
        if (propertyId) {
            const property = await Listing.findById(propertyId);
            if (!property) {
                return res.status(400).json({
                    success: false,
                    message: 'Property not found'
                });
            }
        }
        
        // Update fields
        if (question) faq.question = question;
        if (answer) faq.answer = answer;
        if (category) faq.category = category;
        if (propertyId !== undefined) faq.propertyId = propertyId;
        if (isGlobal !== undefined) faq.isGlobal = isGlobal;
        if (tags) faq.tags = tags;
        if (priority !== undefined) faq.priority = priority;
        if (isActive !== undefined) faq.isActive = isActive;
        
        await faq.save();
        
        // Populate the updated FAQ
        await faq.populate([
            { path: 'propertyId', select: 'name city state' },
            { path: 'createdBy', select: 'username' }
        ]);
        
        res.status(200).json({
            success: true,
            message: 'FAQ updated successfully',
            data: faq
        });
    } catch (error) {
        next(error);
    }
};

// Delete FAQ (Admin only)
export const deleteFAQ = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }
        
        await FAQ.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'FAQ deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Rate FAQ helpfulness
export const rateFAQ = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { helpful } = req.body; // true for helpful, false for not helpful
        
        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }
        
        if (helpful === true) {
            faq.helpful += 1;
        } else if (helpful === false) {
            faq.notHelpful += 1;
        }
        
        await faq.save();
        
        res.status(200).json({
            success: true,
            message: 'FAQ rating updated',
            data: {
                helpful: faq.helpful,
                notHelpful: faq.notHelpful
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get FAQ categories
export const getFAQCategories = async (req, res, next) => {
    try {
        const categories = await FAQ.distinct('category', { isActive: true });
        
        // If no categories exist, provide default ones
        const defaultCategories = [
            'General',
            'Property Search',
            'Buying Process',
            'Selling Process',
            'Investment',
            'Legal',
            'Finance',
            'Property Management',
            'Technical Support'
        ];
        
        // Always return all default categories, plus any additional categories from existing FAQs
        const allCategories = [...new Set([...defaultCategories, ...categories])];
        const finalCategories = allCategories;
        
        res.status(200).json({
            success: true,
            data: finalCategories
        });
    } catch (error) {
        next(error);
    }
};

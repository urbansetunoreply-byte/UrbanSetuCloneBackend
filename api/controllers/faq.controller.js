import FAQ from '../models/faq.model.js';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import FAQLike from '../models/faqLike.model.js';

// Get FAQs with filtering
export const getFAQs = async (req, res, next) => {
    try {
        const { propertyId, isGlobal, category, search, page = 1, limit = 10 } = req.query;

        // Debug logging
        console.log('🔍 getFAQs Debug Info:');
        console.log('  - req.user:', req.user ? { id: req.user.id, role: req.user.role } : 'null');
        console.log('  - User role:', req.user?.role);
        console.log('  - Is admin:', req.user?.role === 'admin' || req.user?.role === 'rootadmin');

        // Build query
        const query = {};

        // Only filter by isActive for non-admin users
        // Admins should see all FAQs (both active and inactive) for management
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'rootadmin')) {
            query.isActive = true;
            console.log('  - Filtering by isActive=true (non-admin user)');
        } else {
            console.log('  - Showing all FAQs (admin user)');
        }

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
            // Support multi-select categories (comma-separated)
            const categories = category.split(',').map(c => c.trim()).filter(Boolean);
            if (categories.length > 0) {
                query.category = { $in: categories };
            }
        }

        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            const searchQuery = [
                { question: searchRegex },
                { answer: searchRegex },
                { tags: searchRegex }
            ];

            if (query.$or) {
                query.$and = [
                    { $or: query.$or },
                    { $or: searchQuery }
                ];
                delete query.$or;
            } else {
                query.$or = searchQuery;
            }
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        console.log('  - Final query:', JSON.stringify(query, null, 2));
        console.log('  - Pagination: skip=', skip, 'limit=', parseInt(limit));

        // Get FAQs with pagination
        const faqs = await FAQ.find(query)
            .populate('propertyId', 'name city state')
            .populate('createdBy', 'username email')
            .sort({ priority: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        console.log('  - Found FAQs:', faqs.length);

        // Transform FAQs to hide sensitive info for non-rootadmins
        const transformedFaqs = faqs.map(faq => {
            const faqObj = faq.toObject();
            if (!req.user || req.user.role !== 'rootadmin') {
                if (faqObj.createdBy) {
                    delete faqObj.createdBy.email;
                }
            }
            return faqObj;
        });

        // Get total count for pagination
        const total = await FAQ.countDocuments(query);
        console.log('  - Total count:', total);

        res.status(200).json({
            success: true,
            data: transformedFaqs,
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
            .populate('createdBy', 'username email');

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        // Increment view count
        faq.views += 1;
        await faq.save();

        const faqObj = faq.toObject();
        if (!req.user || req.user.role !== 'rootadmin') {
            if (faqObj.createdBy) {
                delete faqObj.createdBy.email;
            }
        }

        res.status(200).json({
            success: true,
            data: faqObj
        });
    } catch (error) {
        next(error);
    }
};

// Create FAQ (Admin only)
export const createFAQ = async (req, res, next) => {
    try {
        const { question, answer, category, propertyId, isGlobal, tags, priority, isActive } = req.body;
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
            isActive: isActive !== undefined ? isActive : true, // Default to true if not specified
            createdBy
        };

        const faq = await FAQ.create(faqData);

        // Populate the created FAQ
        await faq.populate([
            { path: 'propertyId', select: 'name city state' },
            { path: 'createdBy', select: 'username email' }
        ]);

        const faqObj = faq.toObject();
        if (!req.user || req.user.role !== 'rootadmin') {
            if (faqObj.createdBy) {
                delete faqObj.createdBy.email;
            }
        }

        res.status(201).json({
            success: true,
            message: 'FAQ created successfully',
            data: faqObj
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

        console.log('🔍 updateFAQ Debug Info:');
        console.log('  - FAQ ID:', id);
        console.log('  - Update data:', { question, isActive, isGlobal, category });
        console.log('  - req.user:', req.user ? { id: req.user.id, role: req.user.role } : 'null');

        const faq = await FAQ.findById(id);
        if (!faq) {
            console.log('  - FAQ not found in database');
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        console.log('  - Found FAQ:', { id: faq._id, isActive: faq.isActive, question: faq.question.substring(0, 20) + '...' });

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
        console.log('  - Updating fields...');
        if (question) faq.question = question;
        if (answer) faq.answer = answer;
        if (category) faq.category = category;
        if (propertyId !== undefined) faq.propertyId = propertyId;
        if (isGlobal !== undefined) faq.isGlobal = isGlobal;
        if (tags) faq.tags = tags;
        if (priority !== undefined) faq.priority = priority;
        if (isActive !== undefined) faq.isActive = isActive;

        console.log('  - Before save - FAQ isActive:', faq.isActive);
        await faq.save();
        console.log('  - After save - FAQ isActive:', faq.isActive);

        // Populate the updated FAQ
        await faq.populate([
            { path: 'propertyId', select: 'name city state' },
            { path: 'createdBy', select: 'username email' }
        ]);

        const faqObj = faq.toObject();
        if (!req.user || req.user.role !== 'rootadmin') {
            if (faqObj.createdBy) {
                delete faqObj.createdBy.email;
            }
        }

        console.log('  - Sending response - FAQ isActive:', faq.isActive);
        res.status(200).json({
            success: true,
            message: 'FAQ updated successfully',
            data: faqObj
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
        // Admins should see all categories (from both active and inactive FAQs)
        // Non-admin users should only see categories from active FAQs
        const categoryQuery = (!req.user || (req.user.role !== 'admin' && req.user.role !== 'rootadmin'))
            ? { isActive: true }
            : {};
        const categories = await FAQ.distinct('category', categoryQuery);

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

// Check if user has liked/disliked a FAQ
export const checkUserFAQReaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const existingReaction = await FAQLike.findOne({ userId, faqId: id });

        res.status(200).json({
            success: true,
            data: {
                reaction: existingReaction ? existingReaction.type : null
            }
        });
    } catch (error) {
        next(error);
    }
};

// Like/Dislike FAQ
export const reactToFAQ = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'like' or 'dislike'
        const userId = req.user.id;

        if (!type || !['like', 'dislike'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reaction type. Must be "like" or "dislike"'
            });
        }

        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        // Check if user has already reacted to this FAQ
        const existingReaction = await FAQLike.findOne({ userId, faqId: id });

        if (existingReaction) {
            if (existingReaction.type === type) {
                // Same reaction - remove it
                await FAQLike.deleteOne({ userId, faqId: id });

                if (type === 'like') {
                    faq.helpful = Math.max(0, faq.helpful - 1);
                } else {
                    faq.notHelpful = Math.max(0, faq.notHelpful - 1);
                }

                await faq.save();

                res.status(200).json({
                    success: true,
                    message: `FAQ ${type} removed`,
                    data: {
                        helpful: faq.helpful,
                        notHelpful: faq.notHelpful,
                        reaction: null
                    }
                });
            } else {
                // Different reaction - update it
                const oldType = existingReaction.type;
                existingReaction.type = type;
                await existingReaction.save();

                // Update counts
                if (oldType === 'like') {
                    faq.helpful = Math.max(0, faq.helpful - 1);
                } else {
                    faq.notHelpful = Math.max(0, faq.notHelpful - 1);
                }

                if (type === 'like') {
                    faq.helpful += 1;
                } else {
                    faq.notHelpful += 1;
                }

                await faq.save();

                res.status(200).json({
                    success: true,
                    message: `FAQ ${type}d`,
                    data: {
                        helpful: faq.helpful,
                        notHelpful: faq.notHelpful,
                        reaction: type
                    }
                });
            }
        } else {
            // New reaction
            await FAQLike.create({ userId, faqId: id, type });

            if (type === 'like') {
                faq.helpful += 1;
            } else {
                faq.notHelpful += 1;
            }

            await faq.save();

            res.status(200).json({
                success: true,
                message: `FAQ ${type}d`,
                data: {
                    helpful: faq.helpful,
                    notHelpful: faq.notHelpful,
                    reaction: type
                }
            });
        }
    } catch (error) {
        next(error);
    }
};

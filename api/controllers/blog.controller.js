import Blog from '../models/blog.model.js';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';

// Get blogs with filtering
export const getBlogs = async (req, res, next) => {
    try {
        const { 
            propertyId, 
            category, 
            tag, 
            search, 
            published,
            page = 1, 
            limit = 10 
        } = req.query;
        
        // Build query
        const query = {};
        
        
        if (published === 'true') {
            query.published = true;
        } else if (published === 'false') {
            query.published = false;
        } else if (published === 'all') {
            // Don't add any published filter for 'all'
        } else if (!published) {
            // Default to published only if no published parameter is provided
            query.published = true;
        }
        
        if (propertyId) {
            if (propertyId === 'null') {
                // Filter for global blogs (no propertyId or propertyId is null)
                query.$or = [
                    { propertyId: { $exists: false } },
                    { propertyId: null }
                ];
            } else if (propertyId === 'exists') {
                // Filter for property-specific blogs (has propertyId and not null)
                query.propertyId = { $exists: true, $ne: null };
            } else {
                // Filter for specific property
                query.propertyId = propertyId;
            }
        }
        
        if (category) {
            query.category = category;
        }
        
        if (tag) {
            query.tags = { $in: [tag] };
        }
        
        if (search) {
            query.$text = { $search: search };
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        

        // Get blogs with pagination
        const blogs = await Blog.find(query)
            .populate('propertyId', 'name city state')
            .populate('author', 'username role')
            .sort({ publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        
        // Get total count for pagination
        const total = await Blog.countDocuments(query);
        
        // Transform author names for admin/rootadmin users
        const transformedBlogs = blogs.map(blog => {
            const blogObj = blog.toObject();
            if (blogObj.author && (blogObj.author.role === 'admin' || blogObj.author.role === 'rootadmin')) {
                blogObj.author.username = 'UrbanSetuBlogManagement';
            }
            return blogObj;
        });
        
        res.status(200).json({
            success: true,
            data: transformedBlogs,
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

// Get single blog by ID or slug
export const getBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        let blog = null;
        
        // Check if id is a valid ObjectId (24 hex characters)
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        
        if (isValidObjectId) {
            // Try to find by ID first
            blog = await Blog.findById(id)
                .populate('propertyId', 'name city state')
                .populate('author', 'username role')
                .populate('comments.user', 'username role');
        }
        
        if (!blog) {
            // Try to find by slug
            blog = await Blog.findOne({ slug: id })
                .populate('propertyId', 'name city state')
                .populate('author', 'username role')
                .populate('comments.user', 'username role');
        }
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Only show published blogs to non-admin users
        if (!blog.published && req.user?.role !== 'admin') {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Increment view count
        blog.views += 1;
        await blog.save();
        
        // Transform author and comment user names for admin/rootadmin users
        const blogObj = blog.toObject();
        if (blogObj.author && (blogObj.author.role === 'admin' || blogObj.author.role === 'rootadmin')) {
            blogObj.author.username = 'UrbanSetuBlogManagement';
        }
        
        // Transform comment user names for admin/rootadmin users
        if (blogObj.comments) {
            blogObj.comments = blogObj.comments.map(comment => {
                if (comment.user && (comment.user.role === 'admin' || comment.user.role === 'rootadmin')) {
                    comment.user.username = 'UrbanSetuBlogManagement';
                }
                return comment;
            });
        }
        
        res.status(200).json({
            success: true,
            data: blogObj
        });
    } catch (error) {
        next(error);
    }
};

// Create blog (Admin only)
export const createBlog = async (req, res, next) => {
    try {
        const { 
            title, 
            content, 
            excerpt, 
            thumbnail, 
            imageUrls,
            videoUrls,
            propertyId, 
            tags, 
            category, 
            published 
        } = req.body;
        const author = req.user.id;
        
        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
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
        
        const blogData = {
            title,
            content,
            excerpt: excerpt || content.slice(0, 200) + '...',
            thumbnail,
            imageUrls: imageUrls || [],
            videoUrls: videoUrls || [],
            propertyId: propertyId || null,
            author,
            tags: tags || [],
            category: category || 'Real Estate Tips',
            published: published || false,
            publishedAt: published ? new Date() : null
        };
        
        const blog = await Blog.create(blogData);
        
        // Populate the created blog
        await blog.populate([
            { path: 'propertyId', select: 'name city state' },
            { path: 'author', select: 'username' }
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            data: blog
        });
    } catch (error) {
        next(error);
    }
};

// Update blog (Admin only)
export const updateBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            content, 
            excerpt, 
            thumbnail, 
            imageUrls,
            videoUrls,
            propertyId, 
            tags, 
            category, 
            published 
        } = req.body;
        
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
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
        if (title) blog.title = title;
        if (content) blog.content = content;
        if (excerpt) blog.excerpt = excerpt;
        if (thumbnail) blog.thumbnail = thumbnail;
        if (imageUrls !== undefined) blog.imageUrls = imageUrls;
        if (videoUrls !== undefined) blog.videoUrls = videoUrls;
        if (propertyId !== undefined) blog.propertyId = propertyId;
        if (tags) blog.tags = tags;
        if (category) blog.category = category;
        if (published !== undefined) {
            blog.published = published;
            if (published && !blog.publishedAt) {
                blog.publishedAt = new Date();
            }
        }
        
        await blog.save();
        
        // Populate the updated blog
        await blog.populate([
            { path: 'propertyId', select: 'name city state' },
            { path: 'author', select: 'username' }
        ]);
        
        res.status(200).json({
            success: true,
            message: 'Blog updated successfully',
            data: blog
        });
    } catch (error) {
        next(error);
    }
};

// Delete blog (Admin only)
export const deleteBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        await Blog.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Like blog
export const likeBlog = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        blog.likes += 1;
        await blog.save();
        
        res.status(200).json({
            success: true,
            message: 'Blog liked',
            data: {
                likes: blog.likes
            }
        });
    } catch (error) {
        next(error);
    }
};

// Add comment to blog
export const addComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Comment content is required'
            });
        }
        
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        const newComment = {
            user: userId,
            content,
            isApproved: false // Comments need approval
        };
        
        blog.comments.push(newComment);
        await blog.save();
        
        // Populate the comment
        await blog.populate('comments.user', 'username role');
        
        // Transform the comment user name for admin/rootadmin users
        const commentData = blog.comments[blog.comments.length - 1].toObject();
        if (commentData.user && (commentData.user.role === 'admin' || commentData.user.role === 'rootadmin')) {
            commentData.user.username = 'UrbanSetuBlogManagement';
        }
        
        res.status(201).json({
            success: true,
            message: 'Comment added successfully (pending approval)',
            data: commentData
        });
    } catch (error) {
        next(error);
    }
};

// Get blog categories
export const getBlogCategories = async (req, res, next) => {
    try {
        const categories = await Blog.distinct('category', { published: true });
        
        // If no categories exist, provide default ones
        const defaultCategories = [
            'Real Estate Tips',
            'Market Updates', 
            'Investment Guide',
            'Home Buying',
            'Home Selling',
            'Property Management',
            'Legal',
            'Finance',
            'Rent',
            'Investment'
        ];
        
        // Always return all default categories, plus any additional categories from existing blogs
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

// Get blog tags
export const getBlogTags = async (req, res, next) => {
    try {
        const tags = await Blog.distinct('tags', { published: true });
        
        res.status(200).json({
            success: true,
            data: tags
        });
    } catch (error) {
        next(error);
    }
};

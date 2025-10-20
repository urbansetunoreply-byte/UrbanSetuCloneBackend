import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';
import Blog from '../models/blog.model.js';
import FAQ from '../models/faq.model.js';

/**
 * Data Synchronization Service
 * Automatically keeps chatbot data up-to-date with website changes
 */

// Cache for storing indexed data
let dataCache = {
    properties: new Map(),
    blogs: new Map(),
    faqs: new Map(),
    lastSync: null,
    totalProperties: 0,
    totalBlogs: 0,
    totalFAQs: 0
};

/**
 * Index all properties for chatbot
 */
export const indexAllProperties = async () => {
    try {
        console.log('🔄 Indexing all properties for chatbot...');
        
        const properties = await Listing.find({})
            .select('name city district state regularPrice discountPrice type bedrooms bathrooms area description imageUrls createdAt updatedAt')
            .lean();

        // Clear existing properties cache
        dataCache.properties.clear();
        
        // Index properties
        properties.forEach(prop => {
            const propertyData = {
                id: prop._id.toString(),
                name: prop.name,
                location: `${prop.city}, ${prop.state}`,
                price: prop.discountPrice || prop.regularPrice,
                originalPrice: prop.regularPrice,
                type: prop.type,
                bedrooms: prop.bedrooms,
                bathrooms: prop.bathrooms,
                area: prop.area,
                description: prop.description,
                image: prop.imageUrls?.[0] || null,
                createdAt: prop.createdAt,
                updatedAt: prop.updatedAt,
                indexedAt: new Date()
            };
            
            dataCache.properties.set(prop._id.toString(), propertyData);
        });

        dataCache.totalProperties = properties.length;
        dataCache.lastSync = new Date();
        
        console.log(`✅ Indexed ${properties.length} properties for chatbot`);
        return { success: true, count: properties.length };
    } catch (error) {
        console.error('❌ Error indexing properties:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Index all blogs for chatbot
 */
export const indexAllBlogs = async () => {
    try {
        console.log('🔄 Indexing all blogs for chatbot...');
        
        const blogs = await Blog.find({ status: 'published' })
            .select('title content excerpt author tags category publishedAt views likes')
            .lean();

        // Clear existing blogs cache
        dataCache.blogs.clear();
        
        // Index blogs
        blogs.forEach(blog => {
            const blogData = {
                id: blog._id.toString(),
                title: blog.title,
                content: blog.content,
                excerpt: blog.excerpt || blog.content?.slice(0, 200) + '...',
                author: blog.author,
                tags: blog.tags || [],
                category: blog.category,
                publishedAt: blog.publishedAt,
                views: blog.views,
                likes: blog.likes,
                indexedAt: new Date()
            };
            
            dataCache.blogs.set(blog._id.toString(), blogData);
        });

        dataCache.totalBlogs = blogs.length;
        dataCache.lastSync = new Date();
        
        console.log(`✅ Indexed ${blogs.length} blogs for chatbot`);
        return { success: true, count: blogs.length };
    } catch (error) {
        console.error('❌ Error indexing blogs:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Index all FAQs for chatbot
 */
export const indexAllFAQs = async () => {
    try {
        console.log('🔄 Indexing all FAQs for chatbot...');
        
        const faqs = await FAQ.find({ isActive: true })
            .select('question answer category priority tags views helpful notHelpful')
            .lean();

        // Clear existing FAQs cache
        dataCache.faqs.clear();
        
        // Index FAQs
        faqs.forEach(faq => {
            const faqData = {
                id: faq._id.toString(),
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                priority: faq.priority,
                tags: faq.tags || [],
                views: faq.views,
                helpful: faq.helpful,
                notHelpful: faq.notHelpful,
                indexedAt: new Date()
            };
            
            dataCache.faqs.set(faq._id.toString(), faqData);
        });

        dataCache.totalFAQs = faqs.length;
        dataCache.lastSync = new Date();
        
        console.log(`✅ Indexed ${faqs.length} FAQs for chatbot`);
        return { success: true, count: faqs.length };
    } catch (error) {
        console.error('❌ Error indexing FAQs:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Index all website data
 */
export const indexAllWebsiteData = async () => {
    try {
        console.log('🚀 Starting full website data indexing...');
        
        const [propertiesResult, blogsResult, faqsResult] = await Promise.all([
            indexAllProperties(),
            indexAllBlogs(),
            indexAllFAQs()
        ]);

        const totalIndexed = propertiesResult.count + blogsResult.count + faqsResult.count;
        
        console.log(`🎉 Full indexing completed: ${totalIndexed} items indexed`);
        console.log(`📊 Breakdown: ${propertiesResult.count} properties, ${blogsResult.count} blogs, ${faqsResult.count} FAQs`);
        
        return {
            success: true,
            totalIndexed,
            breakdown: {
                properties: propertiesResult.count,
                blogs: blogsResult.count,
                faqs: faqsResult.count
            },
            lastSync: dataCache.lastSync
        };
    } catch (error) {
        console.error('❌ Error in full indexing:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get cached data for chatbot
 */
export const getCachedData = () => {
    return {
        properties: Array.from(dataCache.properties.values()),
        blogs: Array.from(dataCache.blogs.values()),
        faqs: Array.from(dataCache.faqs.values()),
        stats: {
            totalProperties: dataCache.totalProperties,
            totalBlogs: dataCache.totalBlogs,
            totalFAQs: dataCache.totalFAQs,
            lastSync: dataCache.lastSync
        }
    };
};

/**
 * Search cached properties
 */
export const searchCachedProperties = (query, limit = 5) => {
    const properties = Array.from(dataCache.properties.values());
    
    if (!query || query.trim().length === 0) {
        return properties.slice(0, limit);
    }

    const searchTerm = query.toLowerCase();
    const filtered = properties.filter(prop => 
        prop.name.toLowerCase().includes(searchTerm) ||
        prop.location.toLowerCase().includes(searchTerm) ||
        prop.type.toLowerCase().includes(searchTerm) ||
        prop.description.toLowerCase().includes(searchTerm)
    );

    return filtered.slice(0, limit);
};

/**
 * Get relevant cached data for user query
 */
export const getRelevantCachedData = (userMessage, selectedProperties = []) => {
    const keywords = extractKeywords(userMessage);
    const cachedData = getCachedData();
    
    let contextData = '';
    
    // Add website info
    contextData += `COMPANY: UrbanSetu\n`;
    contextData += `TOTAL PROPERTIES: ${cachedData.stats.totalProperties}\n`;
    contextData += `TOTAL BLOGS: ${cachedData.stats.totalBlogs}\n`;
    contextData += `TOTAL FAQs: ${cachedData.stats.totalFAQs}\n`;
    contextData += `LAST SYNC: ${cachedData.stats.lastSync?.toISOString() || 'Never'}\n`;
    contextData += `SERVICES: Property Search, Home Buying, Investment Guidance, Property Management, Legal & Documentation Support\n\n`;

    // Add selected properties first (if any)
    if (selectedProperties.length > 0) {
        contextData += 'USER-SELECTED PROPERTIES (Referenced in message):\n';
        selectedProperties.forEach((prop, index) => {
            contextData += `${index + 1}. ${prop.name} - ${prop.location}\n`;
            contextData += `   Price: ₹${prop.price.toLocaleString()} | Type: ${prop.type}\n`;
            contextData += `   ${prop.bedrooms}BHK | ${prop.bathrooms} Bath | ${prop.area} sq ft\n`;
            contextData += `   Description: ${prop.description || 'Property details available'}\n`;
            contextData += '\n';
        });
    }

    // Add relevant properties from cache
    const relevantProperties = searchCachedProperties(keywords.join(' '), 3);
    if (relevantProperties.length > 0) {
        contextData += 'RELEVANT PROPERTIES:\n';
        relevantProperties.forEach((prop, index) => {
            contextData += `${index + 1}. ${prop.name} - ${prop.location}\n`;
            contextData += `   Price: ₹${prop.price.toLocaleString()} | Type: ${prop.type}\n`;
            contextData += `   ${prop.bedrooms}BHK | ${prop.bathrooms} Bath | ${prop.area} sq ft\n`;
            contextData += `   Description: ${prop.description?.slice(0, 200)}...\n`;
            contextData += '\n';
        });
    }

    // Add relevant blogs from cache
    const relevantBlogs = cachedData.blogs.filter(blog => 
        keywords.some(keyword => 
            blog.title.toLowerCase().includes(keyword) ||
            blog.content.toLowerCase().includes(keyword) ||
            blog.tags.some(tag => tag.toLowerCase().includes(keyword))
        )
    ).slice(0, 2);

    if (relevantBlogs.length > 0) {
        contextData += 'RELEVANT ARTICLES:\n';
        relevantBlogs.forEach((blog, index) => {
            contextData += `${index + 1}. ${blog.title}\n`;
            contextData += `   ${blog.excerpt}\n`;
            if (blog.tags.length > 0) {
                contextData += `   Tags: ${blog.tags.join(', ')}\n`;
            }
            contextData += '\n';
        });
    }

    // Add relevant FAQs from cache
    const relevantFAQs = cachedData.faqs.filter(faq => 
        keywords.some(keyword => 
            faq.question.toLowerCase().includes(keyword) ||
            faq.answer.toLowerCase().includes(keyword) ||
            faq.tags.some(tag => tag.toLowerCase().includes(keyword))
        )
    ).slice(0, 2);

    if (relevantFAQs.length > 0) {
        contextData += 'FREQUENTLY ASKED QUESTIONS:\n';
        relevantFAQs.forEach((faq, index) => {
            contextData += `Q${index + 1}. ${faq.question}\n`;
            contextData += `A${index + 1}. ${faq.answer?.slice(0, 200)}...\n\n`;
        });
    }

    return contextData;
};

/**
 * Extract keywords from user message
 */
const extractKeywords = (message) => {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'];
    
    return message
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word))
        .slice(0, 10);
};

/**
 * Check if data needs re-indexing
 */
export const needsReindexing = () => {
    if (!dataCache.lastSync) return true;
    
    // Re-index if data is older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return dataCache.lastSync < oneHourAgo;
};

/**
 * Get sync status
 */
export const getSyncStatus = () => {
    return {
        lastSync: dataCache.lastSync,
        totalProperties: dataCache.totalProperties,
        totalBlogs: dataCache.totalBlogs,
        totalFAQs: dataCache.totalFAQs,
        needsReindexing: needsReindexing()
    };
};

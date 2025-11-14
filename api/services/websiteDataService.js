import Listing from '../models/listing.model.js';
import Blog from '../models/blog.model.js'; // Assuming you have a blog model
import FAQ from '../models/faq.model.js'; // Assuming you have an FAQ model

/**
 * Extract keywords from user message for database queries
 */
const extractKeywords = (message) => {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'];
    
    return message
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word))
        .slice(0, 10); // Limit to 10 keywords
};

/**
 * Get relevant properties based on user query
 */
export const getRelevantProperties = async (userMessage, limit = 5) => {
    try {
        const keywords = extractKeywords(userMessage);
        
        if (keywords.length === 0) {
            return [];
        }

        // Create search query
        const searchQuery = {
            $or: keywords.map(keyword => ({
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { city: { $regex: keyword, $options: 'i' } },
                    { district: { $regex: keyword, $options: 'i' } },
                    { state: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { type: { $regex: keyword, $options: 'i' } }
                ]
            }))
        };

        const properties = await Listing.find(searchQuery)
            .select('name city district state regularPrice discountPrice type bedrooms bathrooms area description imageUrls')
            .limit(limit)
            .lean();

        return properties.map(prop => ({
            type: 'property',
            title: prop.name,
            location: `${prop.city}, ${prop.state}`,
            price: prop.discountPrice || prop.regularPrice,
            originalPrice: prop.regularPrice,
            propertyType: prop.type,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            area: prop.area,
            description: prop.description?.slice(0, 200) + '...',
            image: prop.imageUrls?.[0] || null
        }));
    } catch (error) {
        console.error('Error fetching relevant properties:', error);
        return [];
    }
};

/**
 * Get relevant blog posts
 */
export const getRelevantBlogs = async (userMessage, limit = 3) => {
    try {
        const keywords = extractKeywords(userMessage);
        
        if (keywords.length === 0) {
            return [];
        }

        const searchQuery = {
            $or: keywords.map(keyword => ({
                $or: [
                    { title: { $regex: keyword, $options: 'i' } },
                    { content: { $regex: keyword, $options: 'i' } },
                    { tags: { $regex: keyword, $options: 'i' } }
                ]
            }))
        };

        const blogs = await Blog.find(searchQuery)
            .select('title content excerpt tags publishedAt')
            .limit(limit)
            .lean();

        return blogs.map(blog => ({
            type: 'blog',
            title: blog.title,
            excerpt: blog.excerpt || blog.content?.slice(0, 150) + '...',
            tags: blog.tags || [],
            publishedAt: blog.publishedAt
        }));
    } catch (error) {
        console.error('Error fetching relevant blogs:', error);
        return [];
    }
};

/**
 * Get relevant FAQs
 */
export const getRelevantFAQs = async (userMessage, limit = 3) => {
    try {
        const keywords = extractKeywords(userMessage);
        
        if (keywords.length === 0) {
            return [];
        }

        const searchQuery = {
            $or: keywords.map(keyword => ({
                $or: [
                    { question: { $regex: keyword, $options: 'i' } },
                    { answer: { $regex: keyword, $options: 'i' } },
                    { category: { $regex: keyword, $options: 'i' } }
                ]
            }))
        };

        const faqs = await FAQ.find(searchQuery)
            .select('question answer category')
            .limit(limit)
            .lean();

        return faqs.map(faq => ({
            type: 'faq',
            question: faq.question,
            answer: faq.answer?.slice(0, 200) + '...',
            category: faq.category
        }));
    } catch (error) {
        console.error('Error fetching relevant FAQs:', error);
        return [];
    }
};

/**
 * Get general website information
 */
export const getWebsiteInfo = async () => {
    try {
        // Get some basic stats about your website
        const totalProperties = await Listing.countDocuments();
        const propertyTypes = await Listing.distinct('type');
        const locations = await Listing.distinct('city');
        
        return {
            totalProperties,
            propertyTypes: propertyTypes.slice(0, 10),
            locations: locations.slice(0, 10),
            companyName: 'UrbanSetu',
            services: [
                'Property Search & Recommendations',
                'Home Buying & Selling Assistance',
                'Investment Guidance',
                'Property Management',
                'Legal & Documentation Support'
            ]
        };
    } catch (error) {
        console.error('Error fetching website info:', error);
        return {
            companyName: 'UrbanSetu',
            services: [
                'Property Search & Recommendations',
                'Home Buying & Selling Assistance',
                'Investment Guidance',
                'Property Management',
                'Legal & Documentation Support'
            ]
        };
    }
};

/**
 * Main function to get all relevant website data
 */
export const getRelevantWebsiteData = async (userMessage, selectedProperties = []) => {
    try {
        const [properties, blogs, faqs, websiteInfo] = await Promise.all([
            getRelevantProperties(userMessage, 3),
            getRelevantBlogs(userMessage, 2),
            getRelevantFAQs(userMessage, 2),
            getWebsiteInfo()
        ]);

        let contextData = '';

        // Add website info
        contextData += `COMPANY: ${websiteInfo.companyName}\n`;
        contextData += `TOTAL PROPERTIES: ${websiteInfo.totalProperties}\n`;
        contextData += `SERVICES: ${websiteInfo.services.join(', ')}\n\n`;

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

        // Add relevant properties
        if (properties.length > 0) {
            contextData += 'RELEVANT PROPERTIES:\n';
            properties.forEach((prop, index) => {
                contextData += `${index + 1}. ${prop.title} - ${prop.location}\n`;
                contextData += `   Price: ₹${prop.price} | Type: ${prop.propertyType}\n`;
                contextData += `   ${prop.bedrooms}BHK | ${prop.bathrooms} Bath | ${prop.area} sq ft\n`;
                contextData += `   Description: ${prop.description}\n`;
                if (prop.amenities && prop.amenities.length > 0) {
                    contextData += `   Amenities: ${prop.amenities.join(', ')}\n`;
                }
                contextData += '\n';
            });
        }

        // Add relevant blogs
        if (blogs.length > 0) {
            contextData += 'RELEVANT ARTICLES:\n';
            blogs.forEach((blog, index) => {
                contextData += `${index + 1}. ${blog.title}\n`;
                contextData += `   ${blog.excerpt}\n`;
                if (blog.tags.length > 0) {
                    contextData += `   Tags: ${blog.tags.join(', ')}\n`;
                }
                contextData += '\n';
            });
        }

        // Add relevant FAQs
        if (faqs.length > 0) {
            contextData += 'FREQUENTLY ASKED QUESTIONS:\n';
            faqs.forEach((faq, index) => {
                contextData += `Q${index + 1}. ${faq.question}\n`;
                contextData += `A${index + 1}. ${faq.answer}\n\n`;
            });
        }

        return contextData;
    } catch (error) {
        console.error('Error getting relevant website data:', error);
        return 'Website data temporarily unavailable.';
    }
};

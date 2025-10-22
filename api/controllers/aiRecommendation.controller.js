import { 
    getPropertyRecommendations, 
    getSimilarProperties, 
    getTrendingProperties,
    getHomepageRecommendations,
    getRecommendationInsights
} from '../services/aiRecommendationService.js';
import { errorHandler } from '../utils/error.js';

/**
 * AI Recommendation Controller
 * Handles all AI-powered property recommendation endpoints
 */

// Get personalized property recommendations for a user
export const getRecommendations = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { limit = 10, type = 'personalized' } = req.query;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required for personalized recommendations'
            });
        }
        
        let recommendations = [];
        
        switch (type) {
            case 'personalized':
                recommendations = await getPropertyRecommendations(userId, parseInt(limit));
                break;
            case 'trending':
                recommendations = await getTrendingProperties(parseInt(limit));
                break;
            case 'homepage':
                recommendations = await getHomepageRecommendations(userId, parseInt(limit));
                break;
            default:
                recommendations = await getPropertyRecommendations(userId, parseInt(limit));
        }
        
        res.status(200).json({
            success: true,
            data: recommendations,
            count: recommendations.length,
            type: type,
            message: `Found ${recommendations.length} ${type} recommendations`
        });
        
    } catch (error) {
        console.error('Error in getRecommendations:', error);
        next(error);
    }
};

// Get similar properties to a specific property
export const getSimilar = async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const { limit = 6 } = req.query;
        
        if (!propertyId) {
            return res.status(400).json({
                success: false,
                message: 'Property ID is required'
            });
        }
        
        const similarProperties = await getSimilarProperties(propertyId, parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: similarProperties,
            count: similarProperties.length,
            message: `Found ${similarProperties.length} similar properties`
        });
        
    } catch (error) {
        console.error('Error in getSimilar:', error);
        next(error);
    }
};

// Get trending properties
export const getTrending = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;
        
        const trendingProperties = await getTrendingProperties(parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: trendingProperties,
            count: trendingProperties.length,
            message: `Found ${trendingProperties.length} trending properties`
        });
        
    } catch (error) {
        console.error('Error in getTrending:', error);
        next(error);
    }
};

// Get homepage recommendations (mix of personalized and trending)
export const getHomepage = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { limit = 8 } = req.query;
        
        const recommendations = await getHomepageRecommendations(userId, parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: recommendations,
            count: recommendations.length,
            message: `Found ${recommendations.length} homepage recommendations`
        });
        
    } catch (error) {
        console.error('Error in getHomepage:', error);
        next(error);
    }
};

// Get recommendation insights for admin dashboard
export const getRecommendationInsights = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        // Get user's recommendation history and preferences
        const personalizedRecs = await getPropertyRecommendations(userId, 20);
        const trendingRecs = await getTrendingProperties(10);
        
        // Calculate insights
        const insights = {
            totalRecommendations: personalizedRecs.length,
            recommendationTypes: {
                personalized: personalizedRecs.filter(r => r.recommendationType === 'hybrid').length,
                contentBased: personalizedRecs.filter(r => r.recommendationType === 'content-based').length,
                collaborative: personalizedRecs.filter(r => r.recommendationType === 'collaborative').length,
                popularity: personalizedRecs.filter(r => r.recommendationType === 'popularity').length
            },
            averageScore: personalizedRecs.length > 0 ? 
                personalizedRecs.reduce((sum, rec) => sum + (rec.recommendationScore || 0), 0) / personalizedRecs.length : 0,
            topCategories: {},
            topCities: {},
            priceRange: {
                min: personalizedRecs.length > 0 ? Math.min(...personalizedRecs.map(r => r.regularPrice || 0)) : 0,
                max: personalizedRecs.length > 0 ? Math.max(...personalizedRecs.map(r => r.regularPrice || 0)) : 0
            },
            trendingCount: trendingRecs.length
        };
        
        // Calculate category and city distribution
        personalizedRecs.forEach(rec => {
            insights.topCategories[rec.type] = (insights.topCategories[rec.type] || 0) + 1;
            insights.topCities[rec.city] = (insights.topCities[rec.city] || 0) + 1;
        });
        
        res.status(200).json({
            success: true,
            data: insights,
            message: 'Recommendation insights retrieved successfully'
        });
        
    } catch (error) {
        console.error('Error in getRecommendationInsights:', error);
        next(error);
    }
};

// Get recommendation insights (alias for getRecommendationInsights)
export const getInsights = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return next(errorHandler(401, 'You must be logged in to get insights!'));
        }

        const userId = req.user.id;
        const insights = await getRecommendationInsights(userId);

        res.status(200).json({
            success: true,
            data: insights,
            message: 'Recommendation insights retrieved successfully'
        });

    } catch (error) {
        console.error('Error in getInsights:', error);
        next(error);
    }
};

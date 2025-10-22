import Listing from '../models/listing.model.js';
import Wishlist from '../models/wishlist.model.js';
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import Review from '../models/review.model.js';
import BlogView from '../models/blogView.model.js';
import ChatHistory from '../models/chatHistory.model.js';

/**
 * AI Property Recommendation Service
 * Combines Collaborative Filtering + Content-Based Filtering
 */

// Feature extraction for content-based filtering
const extractPropertyFeatures = (property) => {
    return {
        price: property.regularPrice || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        area: property.area || 0,
        type: property.type || 'unknown',
        city: property.city || 'unknown',
        state: property.state || 'unknown',
        furnished: property.furnished ? 1 : 0,
        parking: property.parking ? 1 : 0,
        offer: property.offer ? 1 : 0,
        discountPrice: property.discountPrice || 0,
        // Normalize price per sq ft
        pricePerSqFt: property.area > 0 ? (property.regularPrice || 0) / property.area : 0
    };
};

// User preference extraction
const extractUserPreferences = async (userId) => {
    try {
        // Get user's wishlist properties
        const wishlistItems = await Wishlist.find({ userId }).populate('listingId');
        const wishlistProperties = wishlistItems.map(item => item.listingId).filter(Boolean);
        
        // Get user's booking history
        const bookings = await Booking.find({ buyerId: userId }).populate('listingId');
        const bookedProperties = bookings.map(booking => booking.listingId).filter(Boolean);
        
        // Get user's review history
        const reviews = await Review.find({ userId }).populate('listingId');
        const reviewedProperties = reviews.map(review => review.listingId).filter(Boolean);
        
        // Combine all user interactions
        const allProperties = [...wishlistProperties, ...bookedProperties, ...reviewedProperties];
        
        if (allProperties.length === 0) {
            return null;
        }
        
        // Calculate user preferences
        const preferences = {
            avgPrice: 0,
            avgBedrooms: 0,
            avgBathrooms: 0,
            avgArea: 0,
            preferredTypes: {},
            preferredCities: {},
            preferredStates: {},
            priceRange: { min: Infinity, max: 0 },
            totalInteractions: allProperties.length
        };
        
        let totalPrice = 0, totalBedrooms = 0, totalBathrooms = 0, totalArea = 0;
        
        allProperties.forEach(property => {
            if (property) {
                const price = property.regularPrice || 0;
                totalPrice += price;
                totalBedrooms += property.bedrooms || 0;
                totalBathrooms += property.bathrooms || 0;
                totalArea += property.area || 0;
                
                // Track preferences
                preferences.preferredTypes[property.type] = (preferences.preferredTypes[property.type] || 0) + 1;
                preferences.preferredCities[property.city] = (preferences.preferredCities[property.city] || 0) + 1;
                preferences.preferredStates[property.state] = (preferences.preferredStates[property.state] || 0) + 1;
                
                // Price range
                preferences.priceRange.min = Math.min(preferences.priceRange.min, price);
                preferences.priceRange.max = Math.max(preferences.priceRange.max, price);
            }
        });
        
        preferences.avgPrice = totalPrice / allProperties.length;
        preferences.avgBedrooms = totalBedrooms / allProperties.length;
        preferences.avgBathrooms = totalBathrooms / allProperties.length;
        preferences.avgArea = totalArea / allProperties.length;
        
        return preferences;
    } catch (error) {
        console.error('Error extracting user preferences:', error);
        return null;
    }
};

// Collaborative Filtering: Find similar users
const findSimilarUsers = async (userId, limit = 10) => {
    try {
        const currentUserWishlist = await Wishlist.find({ userId }).populate('listingId');
        const currentUserProperties = currentUserWishlist.map(item => item.listingId._id.toString());
        
        if (currentUserProperties.length === 0) {
            return [];
        }
        
        // Find users with similar wishlist items
        const similarUsers = await Wishlist.aggregate([
            {
                $match: {
                    userId: { $ne: userId },
                    listingId: { $in: currentUserProperties }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    commonProperties: { $sum: 1 },
                    totalProperties: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'wishlists',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'allWishlistItems'
                }
            },
            {
                $addFields: {
                    totalProperties: { $size: '$allWishlistItems' }
                }
            },
            {
                $addFields: {
                    similarity: {
                        $divide: ['$commonProperties', { $add: ['$totalProperties', currentUserProperties.length, { $multiply: ['$commonProperties', -1] }] }]
                    }
                }
            },
            {
                $match: {
                    similarity: { $gte: 0.1 } // Minimum 10% similarity
                }
            },
            {
                $sort: { similarity: -1 }
            },
            {
                $limit: limit
            }
        ]);
        
        return similarUsers;
    } catch (error) {
        console.error('Error finding similar users:', error);
        return [];
    }
};

// Content-Based Filtering: Calculate property similarity
const calculatePropertySimilarity = (property1, property2) => {
    const features1 = extractPropertyFeatures(property1);
    const features2 = extractPropertyFeatures(property2);
    
    // Weighted similarity calculation
    const weights = {
        price: 0.3,
        bedrooms: 0.2,
        bathrooms: 0.15,
        area: 0.15,
        type: 0.1,
        city: 0.05,
        state: 0.05
    };
    
    let similarity = 0;
    let totalWeight = 0;
    
    // Numerical features (Euclidean distance)
    const numericalFeatures = ['price', 'bedrooms', 'bathrooms', 'area'];
    numericalFeatures.forEach(feature => {
        if (weights[feature]) {
            const diff = Math.abs(features1[feature] - features2[feature]);
            const maxDiff = Math.max(features1[feature], features2[feature]) || 1;
            const normalizedDiff = Math.min(diff / maxDiff, 1);
            similarity += weights[feature] * (1 - normalizedDiff);
            totalWeight += weights[feature];
        }
    });
    
    // Categorical features (exact match)
    const categoricalFeatures = ['type', 'city', 'state'];
    categoricalFeatures.forEach(feature => {
        if (weights[feature]) {
            if (features1[feature] === features2[feature]) {
                similarity += weights[feature];
            }
            totalWeight += weights[feature];
        }
    });
    
    return totalWeight > 0 ? similarity / totalWeight : 0;
};

// Hybrid Recommendation Algorithm
export const getPropertyRecommendations = async (userId, limit = 10) => {
    try {
        console.log(`🤖 Generating AI recommendations for user: ${userId}`);
        
        // Get user preferences
        const userPreferences = await extractUserPreferences(userId);
        
        // Get all available properties
        const allProperties = await Listing.find({}).limit(1000); // Limit for performance
        
        if (allProperties.length === 0) {
            return [];
        }
        
        // Get user's current wishlist to exclude
        const userWishlist = await Wishlist.find({ userId });
        const wishlistPropertyIds = userWishlist.map(item => item.listingId.toString());
        
        // Filter out properties already in wishlist
        const availableProperties = allProperties.filter(
            property => !wishlistPropertyIds.includes(property._id.toString())
        );
        
        let recommendations = [];
        
        if (userPreferences && userPreferences.totalInteractions >= 3) {
            // User has enough data for personalized recommendations
            
            // 1. Content-Based Filtering (70% weight)
            const contentBasedScores = availableProperties.map(property => {
                const features = extractPropertyFeatures(property);
                let score = 0;
                
                // Price similarity (inverse distance)
                const priceDiff = Math.abs(features.price - userPreferences.avgPrice);
                const priceScore = Math.max(0, 1 - (priceDiff / userPreferences.avgPrice));
                score += priceScore * 0.3;
                
                // Bedroom similarity
                const bedroomDiff = Math.abs(features.bedrooms - userPreferences.avgBedrooms);
                const bedroomScore = Math.max(0, 1 - (bedroomDiff / Math.max(userPreferences.avgBedrooms, 1)));
                score += bedroomScore * 0.2;
                
                // Bathroom similarity
                const bathroomDiff = Math.abs(features.bathrooms - userPreferences.avgBathrooms);
                const bathroomScore = Math.max(0, 1 - (bathroomDiff / Math.max(userPreferences.avgBathrooms, 1)));
                score += bathroomScore * 0.15;
                
                // Area similarity
                const areaDiff = Math.abs(features.area - userPreferences.avgArea);
                const areaScore = Math.max(0, 1 - (areaDiff / Math.max(userPreferences.avgArea, 1)));
                score += areaScore * 0.15;
                
                // Type preference
                const typeScore = userPreferences.preferredTypes[features.type] ? 
                    userPreferences.preferredTypes[features.type] / userPreferences.totalInteractions : 0;
                score += typeScore * 0.1;
                
                // Location preference
                const cityScore = userPreferences.preferredCities[features.city] ? 
                    userPreferences.preferredCities[features.city] / userPreferences.totalInteractions : 0;
                score += cityScore * 0.05;
                
                const stateScore = userPreferences.preferredStates[features.state] ? 
                    userPreferences.preferredStates[features.state] / userPreferences.totalInteractions : 0;
                score += stateScore * 0.05;
                
                return {
                    property,
                    score: score * 0.7, // 70% weight for content-based
                    type: 'content-based'
                };
            });
            
            // 2. Collaborative Filtering (30% weight)
            const similarUsers = await findSimilarUsers(userId, 5);
            const collaborativeScores = availableProperties.map(property => {
                let score = 0;
                let totalWeight = 0;
                
                similarUsers.forEach(similarUser => {
                    // Check if similar user has this property in wishlist
                    // This is a simplified version - in production, you'd cache this
                    score += similarUser.similarity * 0.1; // Simplified scoring
                    totalWeight += similarUser.similarity;
                });
                
                return {
                    property,
                    score: totalWeight > 0 ? (score / totalWeight) * 0.3 : 0, // 30% weight for collaborative
                    type: 'collaborative'
                };
            });
            
            // Combine scores
            recommendations = availableProperties.map(property => {
                const contentScore = contentBasedScores.find(item => 
                    item.property._id.toString() === property._id.toString()
                )?.score || 0;
                
                const collaborativeScore = collaborativeScores.find(item => 
                    item.property._id.toString() === property._id.toString()
                )?.score || 0;
                
                return {
                    property,
                    score: contentScore + collaborativeScore,
                    contentScore,
                    collaborativeScore,
                    type: 'hybrid'
                };
            });
            
        } else {
            // New user or insufficient data - use popularity-based recommendations
            console.log('📊 Using popularity-based recommendations for new user');
            
            // Get popular properties based on wishlist count and views
            const popularProperties = await Listing.aggregate([
                {
                    $lookup: {
                        from: 'wishlists',
                        localField: '_id',
                        foreignField: 'listingId',
                        as: 'wishlistCount'
                    }
                },
                {
                    $lookup: {
                        from: 'bookings',
                        localField: '_id',
                        foreignField: 'listingId',
                        as: 'bookingCount'
                    }
                },
                {
                    $addFields: {
                        popularityScore: {
                            $add: [
                                { $multiply: [{ $size: '$wishlistCount' }, 2] },
                                { $multiply: [{ $size: '$bookingCount' }, 1] },
                                { $multiply: ['$viewCount', 0.1] }
                            ]
                        }
                    }
                },
                {
                    $sort: { popularityScore: -1 }
                },
                {
                    $limit: limit * 2 // Get more to filter out wishlist items
                }
            ]);
            
            recommendations = popularProperties
                .filter(item => !wishlistPropertyIds.includes(item._id.toString()))
                .map(item => ({
                    property: item,
                    score: item.popularityScore,
                    type: 'popularity'
                }));
        }
        
        // Sort by score and return top recommendations
        const sortedRecommendations = recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => ({
                ...item.property.toObject(),
                recommendationScore: item.score,
                recommendationType: item.type,
                contentScore: item.contentScore,
                collaborativeScore: item.collaborativeScore
            }));
        
        console.log(`✅ Generated ${sortedRecommendations.length} AI recommendations`);
        return sortedRecommendations;
        
    } catch (error) {
        console.error('❌ Error generating recommendations:', error);
        return [];
    }
};

// Get similar properties to a specific property
export const getSimilarProperties = async (propertyId, limit = 6) => {
    try {
        const targetProperty = await Listing.findById(propertyId);
        if (!targetProperty) {
            return [];
        }
        
        const allProperties = await Listing.find({ _id: { $ne: propertyId } }).limit(500);
        
        const similarProperties = allProperties.map(property => ({
            property,
            similarity: calculatePropertySimilarity(targetProperty, property)
        }))
        .filter(item => item.similarity > 0.3) // Minimum 30% similarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => ({
            ...item.property.toObject(),
            similarityScore: item.similarity
        }));
        
        return similarProperties;
    } catch (error) {
        console.error('Error finding similar properties:', error);
        return [];
    }
};

// Get trending properties based on recent activity
export const getTrendingProperties = async (limit = 10) => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const trendingProperties = await Listing.aggregate([
            {
                $lookup: {
                    from: 'wishlists',
                    localField: '_id',
                    foreignField: 'listingId',
                    as: 'recentWishlists',
                    pipeline: [
                        {
                            $match: {
                                createdAt: { $gte: sevenDaysAgo }
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'listingId',
                    as: 'recentBookings',
                    pipeline: [
                        {
                            $match: {
                                createdAt: { $gte: sevenDaysAgo }
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    trendingScore: {
                        $add: [
                            { $multiply: [{ $size: '$recentWishlists' }, 3] },
                            { $multiply: [{ $size: '$recentBookings' }, 2] },
                            { $multiply: ['$viewCount', 0.1] }
                        ]
                    }
                }
            },
            {
                $sort: { trendingScore: -1 }
            },
            {
                $limit: limit
            }
        ]);
        
        return trendingProperties.map(item => ({
            ...item,
            trendingScore: item.trendingScore
        }));
    } catch (error) {
        console.error('Error getting trending properties:', error);
        return [];
    }
};

// Get personalized recommendations for homepage
export const getHomepageRecommendations = async (userId, limit = 8) => {
    try {
        const recommendations = await getPropertyRecommendations(userId, limit);
        
        // If not enough personalized recommendations, fill with trending
        if (recommendations.length < limit) {
            const trending = await getTrendingProperties(limit - recommendations.length);
            recommendations.push(...trending);
        }
        
        return recommendations.slice(0, limit);
    } catch (error) {
        console.error('Error getting homepage recommendations:', error);
        return [];
    }
};

// Get recommendation insights and analytics
export const getRecommendationInsights = async (userId) => {
    try {
        const recommendations = await getPropertyRecommendations(userId, 20);
        const trending = await getTrendingProperties(10);
        
        // Calculate insights
        const totalRecommendations = recommendations.length;
        const averageScore = recommendations.length > 0 ? 
            recommendations.reduce((sum, rec) => sum + (rec.recommendationScore || 0), 0) / recommendations.length : 0;
        
        const trendingCount = trending.length;
        
        // Price range analysis
        const prices = recommendations.map(rec => rec.regularPrice).filter(price => price > 0);
        const priceRange = prices.length > 0 ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
            average: prices.reduce((sum, price) => sum + price, 0) / prices.length
        } : { min: 0, max: 0, average: 0 };
        
        // Recommendation types analysis
        const recommendationTypes = {};
        recommendations.forEach(rec => {
            const type = rec.recommendationType || 'unknown';
            recommendationTypes[type] = (recommendationTypes[type] || 0) + 1;
        });
        
        return {
            totalRecommendations,
            averageScore,
            trendingCount,
            priceRange,
            recommendationTypes
        };
    } catch (error) {
        console.error('Error getting recommendation insights:', error);
        return {
            totalRecommendations: 0,
            averageScore: 0,
            trendingCount: 0,
            priceRange: { min: 0, max: 0, average: 0 },
            recommendationTypes: {}
        };
    }
};

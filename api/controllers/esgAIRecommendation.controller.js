import { getESGAwareRecommendations, learnESGPreferences } from '../services/esgAIRecommendationService.js';
import { getAdvancedESGAnalytics } from '../services/esgAnalyticsService.js';
import { errorHandler } from '../utils/error.js';

/**
 * ESG AI Recommendation Controller
 * Integrates ESG factors with AI recommendation system
 * Based on base paper methodology with advanced analytics
 */

// Test endpoint for debugging
export const testESGAuth = async (req, res, next) => {
    try {
        console.log('🌱 ESG Test - Auth check:', {
            hasUser: !!req.user,
            userId: req.user?.id,
            cookies: req.cookies,
            headers: req.headers.authorization
        });

        return res.status(200).json({
            success: true,
            message: 'ESG Auth test successful',
            user: req.user ? { id: req.user.id, email: req.user.email } : null
        });
    } catch (error) {
        console.error('Error in ESG auth test:', error);
        next(error);
    }
};

// Get ESG-Aware AI Recommendations
export const getESGRecommendations = async (req, res, next) => {
    try {
        console.log('🌱 ESG Recommendations - Auth check:', {
            hasUser: !!req.user,
            userId: req.user?.id,
            cookies: req.cookies,
            headers: req.headers.authorization
        });

        const { userId } = req.user;
        const { limit = 10, includeExplanation = true } = req.query;

        if (!userId) {
            console.log('🌱 ESG Recommendations - No userId found');
            return next(errorHandler(401, 'User authentication required'));
        }

        console.log(`🌱 Getting ESG-aware recommendations for user: ${userId}`);

        // Get ESG-aware recommendations
        const recommendations = await getESGAwareRecommendations(userId, parseInt(limit));

        if (!recommendations || recommendations.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No ESG-aware recommendations available',
                esgEnabled: true
            });
        }

        // Format recommendations with ESG insights
        const formattedRecommendations = recommendations.map(rec => ({
            property: {
                _id: rec.property._id,
                name: rec.property.name,
                description: rec.property.description,
                city: rec.property.city,
                state: rec.property.state,
                regularPrice: rec.property.regularPrice,
                discountPrice: rec.property.discountPrice,
                imageUrls: rec.property.imageUrls,
                type: rec.property.type,
                bedrooms: rec.property.bedrooms,
                bathrooms: rec.property.bathrooms,
                area: rec.property.area,
                esg: rec.property.esg
            },
            recommendationScore: rec.score,
            recommendationType: 'esg-aware',
            confidenceLevel: rec.confidence,
            sustainabilityScore: rec.sustainabilityScore,
            esgMatch: rec.match,
            esgBreakdown: rec.breakdown,
            explanation: includeExplanation === 'true' ? rec.explanation : [],
            modelExplanation: 'ESG-Aware AI Recommendation: This property matches your sustainability preferences based on Environmental, Social, and Governance factors.',
            aiInsights: generateESGInsights(rec),
            timestamp: new Date().toISOString()
        }));

        res.status(200).json({
            success: true,
            data: formattedRecommendations,
            esgEnabled: true,
            totalRecommendations: formattedRecommendations.length,
            averageSustainabilityScore: Math.round(
                formattedRecommendations.reduce((sum, rec) => sum + rec.sustainabilityScore, 0) / 
                formattedRecommendations.length
            )
        });

    } catch (error) {
        console.error('Error in ESG recommendations:', error);
        next(error);
    }
};

// Get User ESG Preferences
export const getUserESGPreferences = async (req, res, next) => {
    try {
        const { userId } = req.user;

        if (!userId) {
            return next(errorHandler(401, 'User authentication required'));
        }

        console.log(`🌱 Getting ESG preferences for user: ${userId}`);

        // Learn user's ESG preferences
        const esgPreferences = await learnESGPreferences(userId);

        if (!esgPreferences) {
            return res.status(200).json({
                success: true,
                data: {
                    environmental: { score: 0, preferences: {} },
                    social: { score: 0, preferences: {} },
                    governance: { score: 0, preferences: {} },
                    overall: {
                        esgScore: 0,
                        esgRating: 'Not Rated',
                        sustainabilityFocus: false,
                        greenPreference: false,
                        socialImpact: false,
                        governanceImportance: false
                    }
                },
                message: 'No ESG preferences learned yet. Interact with properties to build your ESG profile.'
            });
        }

        res.status(200).json({
            success: true,
            data: esgPreferences,
            message: 'ESG preferences retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting ESG preferences:', error);
        next(error);
    }
};

// Get ESG Analytics Dashboard
export const getESGAnalytics = async (req, res, next) => {
    try {
        const { timeframe = '30d' } = req.query;

        console.log(`🌱 Getting ESG analytics for timeframe: ${timeframe}`);

        const analytics = await getAdvancedESGAnalytics(timeframe);

        res.status(200).json({
            success: true,
            data: analytics,
            timeframe,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting ESG analytics:', error);
        next(error);
    }
};

// Get ESG Property Insights
export const getESGPropertyInsights = async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const { userId } = req.user;

        if (!propertyId) {
            return next(errorHandler(400, 'Property ID is required'));
        }

        console.log(`🌱 Getting ESG insights for property: ${propertyId}`);

        // Get property with ESG data
        const property = await Listing.findById(propertyId).select('name city state esg');
        
        if (!property) {
            return next(errorHandler(404, 'Property not found'));
        }

        if (!property.esg) {
            return res.status(200).json({
                success: true,
                data: {
                    property: {
                        _id: property._id,
                        name: property.name,
                        location: `${property.city}, ${property.state}`,
                        esg: null
                    },
                    insights: ['ESG data not available for this property'],
                    recommendations: ['Add ESG data to get sustainability insights'],
                    sustainabilityScore: 0,
                    esgRating: 'Not Rated'
                },
                message: 'ESG data not available'
            });
        }

        // Calculate ESG insights
        const insights = generatePropertyESGInsights(property.esg);
        const recommendations = generatePropertyESGRecommendations(property.esg);
        const sustainabilityScore = property.esg.esgScore || 0;
        const esgRating = property.esg.esgRating || 'Not Rated';

        res.status(200).json({
            success: true,
            data: {
                property: {
                    _id: property._id,
                    name: property.name,
                    location: `${property.city}, ${property.state}`,
                    esg: property.esg
                },
                insights,
                recommendations,
                sustainabilityScore,
                esgRating,
                breakdown: {
                    environmental: calculateEnvironmentalScore(property.esg.environmental),
                    social: calculateSocialScore(property.esg.social),
                    governance: calculateGovernanceScore(property.esg.governance)
                }
            }
        });

    } catch (error) {
        console.error('Error getting ESG property insights:', error);
        next(error);
    }
};

// Get ESG Comparison
export const getESGComparison = async (req, res, next) => {
    try {
        const { propertyIds } = req.body;

        if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length < 2) {
            return next(errorHandler(400, 'At least 2 property IDs are required for comparison'));
        }

        console.log(`🌱 Comparing ESG factors for properties: ${propertyIds.join(', ')}`);

        // Get properties with ESG data
        const properties = await Listing.find({
            _id: { $in: propertyIds },
            'esg.esgScore': { $exists: true, $ne: 0 }
        }).select('name city state esg');

        if (properties.length < 2) {
            return next(errorHandler(400, 'Insufficient properties with ESG data for comparison'));
        }

        // Generate comparison data
        const comparison = properties.map(property => ({
            property: {
                _id: property._id,
                name: property.name,
                location: `${property.city}, ${property.state}`
            },
            esg: property.esg,
            sustainabilityScore: property.esg?.esgScore || 0,
            esgRating: property.esg?.esgRating || 'Not Rated',
            breakdown: {
                environmental: calculateEnvironmentalScore(property.esg?.environmental),
                social: calculateSocialScore(property.esg?.social),
                governance: calculateGovernanceScore(property.esg?.governance)
            },
            strengths: getESGStrengths(property.esg),
            improvements: getESGImprovements(property.esg)
        }));

        // Sort by sustainability score
        comparison.sort((a, b) => b.sustainabilityScore - a.sustainabilityScore);

        res.status(200).json({
            success: true,
            data: {
                comparison,
                summary: {
                    bestPerformer: comparison[0],
                    averageScore: Math.round(
                        comparison.reduce((sum, prop) => sum + prop.sustainabilityScore, 0) / 
                        comparison.length
                    ),
                    totalProperties: comparison.length
                }
            }
        });

    } catch (error) {
        console.error('Error getting ESG comparison:', error);
        next(error);
    }
};

// Helper Functions

// Generate ESG Insights
const generateESGInsights = (recommendation) => {
    const insights = [];
    
    if (recommendation.sustainabilityScore > 80) {
        insights.push('High sustainability score indicates excellent ESG performance');
    } else if (recommendation.sustainabilityScore > 60) {
        insights.push('Good sustainability score with room for improvement');
    } else {
        insights.push('Sustainability score could be improved with ESG enhancements');
    }

    if (recommendation.breakdown.environmental > 80) {
        insights.push('Strong environmental credentials');
    }

    if (recommendation.breakdown.social > 80) {
        insights.push('Excellent social impact factors');
    }

    if (recommendation.breakdown.governance > 80) {
        insights.push('High governance standards');
    }

    return insights;
};

// Generate Property ESG Insights
const generatePropertyESGInsights = (esg) => {
    const insights = [];

    if (!esg) return ['ESG data not available'];

    // Environmental insights
    if (esg.environmental?.energyRating && esg.environmental.energyRating !== 'Not Rated') {
        insights.push(`Energy efficiency rating: ${esg.environmental.energyRating}`);
    }

    if (esg.environmental?.renewableEnergy) {
        insights.push('Renewable energy features present');
    }

    if (esg.environmental?.greenCertification && esg.environmental.greenCertification !== 'None') {
        insights.push(`Green certification: ${esg.environmental.greenCertification}`);
    }

    // Social insights
    if (esg.social?.accessibility && esg.social.accessibility !== 'Not Rated') {
        insights.push(`Accessibility: ${esg.social.accessibility}`);
    }

    if (esg.social?.affordableHousing) {
        insights.push('Affordable housing designation');
    }

    if (esg.social?.communityImpact > 70) {
        insights.push('High community impact score');
    }

    // Governance insights
    if (esg.governance?.transparency && esg.governance.transparency !== 'Not Rated') {
        insights.push(`Transparency: ${esg.governance.transparency}`);
    }

    if (esg.governance?.compliance && esg.governance.compliance !== 'Not Rated') {
        insights.push(`Compliance: ${esg.governance.compliance}`);
    }

    return insights.length > 0 ? insights : ['Basic ESG data available'];
};

// Generate Property ESG Recommendations
const generatePropertyESGRecommendations = (esg) => {
    const recommendations = [];

    if (!esg) return ['Add ESG data to get recommendations'];

    // Environmental recommendations
    if (esg.environmental?.energyRating === 'Not Rated') {
        recommendations.push('Obtain energy efficiency certification');
    }

    if (!esg.environmental?.renewableEnergy) {
        recommendations.push('Consider installing renewable energy sources');
    }

    if (esg.environmental?.greenCertification === 'None') {
        recommendations.push('Apply for green building certification');
    }

    // Social recommendations
    if (esg.social?.accessibility === 'Not Rated') {
        recommendations.push('Improve accessibility features');
    }

    if (esg.social?.communityImpact < 50) {
        recommendations.push('Enhance community impact initiatives');
    }

    // Governance recommendations
    if (esg.governance?.transparency === 'Not Rated') {
        recommendations.push('Improve transparency in business practices');
    }

    if (esg.governance?.compliance === 'Not Rated') {
        recommendations.push('Ensure regulatory compliance');
    }

    return recommendations.length > 0 ? recommendations : ['ESG factors are well managed'];
};

// Calculate Environmental Score
const calculateEnvironmentalScore = (env) => {
    if (!env) return 0;
    
    let score = 0;
    let factors = 0;

    if (env.energyRating && env.energyRating !== 'Not Rated') {
        score += getEnergyRatingScore(env.energyRating);
        factors++;
    }

    if (env.renewableEnergy) {
        score += 100;
        factors++;
    }

    if (env.greenCertification && env.greenCertification !== 'None') {
        score += 100;
        factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
};

// Calculate Social Score
const calculateSocialScore = (social) => {
    if (!social) return 0;
    
    let score = 0;
    let factors = 0;

    if (social.accessibility && social.accessibility !== 'Not Rated') {
        score += getAccessibilityScore(social.accessibility);
        factors++;
    }

    if (social.communityImpact !== undefined) {
        score += Math.min(social.communityImpact, 100);
        factors++;
    }

    if (social.affordableHousing) {
        score += 100;
        factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
};

// Calculate Governance Score
const calculateGovernanceScore = (gov) => {
    if (!gov) return 0;
    
    let score = 0;
    let factors = 0;

    if (gov.transparency && gov.transparency !== 'Not Rated') {
        score += getRatingScore(gov.transparency);
        factors++;
    }

    if (gov.compliance && gov.compliance !== 'Not Rated') {
        score += getComplianceScore(gov.compliance);
        factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
};

// Get ESG Strengths
const getESGStrengths = (esg) => {
    const strengths = [];

    if (!esg) return strengths;

    if (esg.environmental?.energyRating && ['A+', 'A', 'B'].includes(esg.environmental.energyRating)) {
        strengths.push('High energy efficiency');
    }

    if (esg.environmental?.renewableEnergy) {
        strengths.push('Renewable energy');
    }

    if (esg.social?.accessibility === 'Fully Accessible') {
        strengths.push('Full accessibility');
    }

    if (esg.social?.affordableHousing) {
        strengths.push('Affordable housing');
    }

    if (esg.governance?.compliance === 'Fully Compliant') {
        strengths.push('Full compliance');
    }

    return strengths;
};

// Get ESG Improvements
const getESGImprovements = (esg) => {
    const improvements = [];

    if (!esg) return improvements;

    if (esg.environmental?.energyRating === 'Not Rated') {
        improvements.push('Energy efficiency certification');
    }

    if (!esg.environmental?.renewableEnergy) {
        improvements.push('Renewable energy sources');
    }

    if (esg.social?.accessibility === 'Not Rated') {
        improvements.push('Accessibility features');
    }

    if (esg.governance?.transparency === 'Not Rated') {
        improvements.push('Transparency improvements');
    }

    return improvements;
};

// Helper Functions (same as in other services)
const getEnergyRatingScore = (rating) => {
    const scores = { 'A+': 100, 'A': 90, 'B': 80, 'C': 70, 'D': 60, 'E': 50, 'F': 40, 'G': 30 };
    return scores[rating] || 0;
};

const getRatingScore = (rating) => {
    const scores = { 'Excellent': 100, 'Good': 80, 'Average': 60, 'Poor': 40 };
    return scores[rating] || 0;
};

const getAccessibilityScore = (accessibility) => {
    const scores = { 'Fully Accessible': 100, 'Partially Accessible': 60, 'Not Accessible': 20 };
    return scores[accessibility] || 0;
};

const getComplianceScore = (compliance) => {
    const scores = { 'Fully Compliant': 100, 'Mostly Compliant': 80, 'Partially Compliant': 60, 'Non-Compliant': 20 };
    return scores[compliance] || 0;
};

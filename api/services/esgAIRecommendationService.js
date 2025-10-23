import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import Review from '../models/review.model.js';
import { calculateAdvancedESGScore } from './esgAnalyticsService.js';

/**
 * ESG-Aware AI Recommendation Service
 * Integrates ESG factors with existing AI recommendation system
 * Based on base paper methodology with Random Forest-inspired approach
 */

// ESG Weight Configuration for AI Recommendations
const ESG_AI_WEIGHTS = {
    environmental: 0.40,  // 40% weight for environmental factors
    social: 0.30,        // 30% weight for social factors
    governance: 0.30     // 30% weight for governance factors
};

// ESG Preference Learning
export const learnESGPreferences = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return null;

        // Get user's interaction history
        const wishlist = await Listing.find({ 
            _id: { $in: user.wishlist || [] } 
        }).select('esg');

        const bookings = await Booking.find({ 
            buyerId: userId 
        }).populate('listingId', 'esg');

        const reviews = await Review.find({ 
            userId: userId 
        }).populate('listingId', 'esg');

        // Analyze ESG preferences
        const esgPreferences = {
            environmental: analyzeEnvironmentalPreferences(wishlist, bookings, reviews),
            social: analyzeSocialPreferences(wishlist, bookings, reviews),
            governance: analyzeGovernancePreferences(wishlist, bookings, reviews),
            overall: {
                esgScore: 0,
                esgRating: 'Not Rated',
                sustainabilityFocus: false,
                greenPreference: false,
                socialImpact: false,
                governanceImportance: false
            }
        };

        // Calculate overall ESG preference score
        const totalScore = (
            esgPreferences.environmental.score * ESG_AI_WEIGHTS.environmental +
            esgPreferences.social.score * ESG_AI_WEIGHTS.social +
            esgPreferences.governance.score * ESG_AI_WEIGHTS.governance
        );

        esgPreferences.overall.esgScore = Math.round(totalScore);
        esgPreferences.overall.esgRating = getESGRating(Math.round(totalScore));
        esgPreferences.overall.sustainabilityFocus = totalScore > 70;
        esgPreferences.overall.greenPreference = esgPreferences.environmental.score > 70;
        esgPreferences.overall.socialImpact = esgPreferences.social.score > 70;
        esgPreferences.overall.governanceImportance = esgPreferences.governance.score > 70;

        return esgPreferences;
    } catch (error) {
        console.error('Error learning ESG preferences:', error);
        return null;
    }
};

// Environmental Preference Analysis
const analyzeEnvironmentalPreferences = (wishlist, bookings, reviews) => {
    const preferences = {
        score: 0,
        energyEfficiency: 0,
        renewableEnergy: 0,
        greenCertification: 0,
        carbonFootprint: 0,
        waterEfficiency: 0,
        wasteManagement: 0
    };

    const allProperties = [...wishlist, ...bookings.map(b => b.listingId), ...reviews.map(r => r.listingId)];
    const validProperties = allProperties.filter(p => p && p.esg && p.esg.environmental);

    if (validProperties.length === 0) return preferences;

    let energyCount = 0, renewableCount = 0, certCount = 0, carbonTotal = 0, waterCount = 0, wasteCount = 0;

    validProperties.forEach(property => {
        const env = property.esg.environmental;

        if (env.energyRating && env.energyRating !== 'Not Rated') {
            preferences.energyEfficiency += getEnergyRatingScore(env.energyRating);
            energyCount++;
        }

        if (env.renewableEnergy) {
            renewableCount++;
        }

        if (env.greenCertification && env.greenCertification !== 'None') {
            certCount++;
        }

        if (env.carbonFootprint !== undefined) {
            carbonTotal += env.carbonFootprint;
        }

        if (env.waterEfficiency && env.waterEfficiency !== 'Not Rated') {
            preferences.waterEfficiency += getRatingScore(env.waterEfficiency);
            waterCount++;
        }

        if (env.wasteManagement && env.wasteManagement !== 'Not Rated') {
            preferences.wasteManagement += getRatingScore(env.wasteManagement);
            wasteCount++;
        }
    });

    preferences.energyEfficiency = energyCount > 0 ? Math.round(preferences.energyEfficiency / energyCount) : 0;
    preferences.renewableEnergy = Math.round((renewableCount / validProperties.length) * 100);
    preferences.greenCertification = Math.round((certCount / validProperties.length) * 100);
    preferences.carbonFootprint = validProperties.length > 0 ? Math.round(carbonTotal / validProperties.length) : 0;
    preferences.waterEfficiency = waterCount > 0 ? Math.round(preferences.waterEfficiency / waterCount) : 0;
    preferences.wasteManagement = wasteCount > 0 ? Math.round(preferences.wasteManagement / wasteCount) : 0;

    // Calculate overall environmental score
    preferences.score = Math.round((
        preferences.energyEfficiency * 0.25 +
        preferences.renewableEnergy * 0.20 +
        preferences.greenCertification * 0.20 +
        (100 - preferences.carbonFootprint / 10) * 0.15 +
        preferences.waterEfficiency * 0.10 +
        preferences.wasteManagement * 0.10
    ));

    return preferences;
};

// Social Preference Analysis
const analyzeSocialPreferences = (wishlist, bookings, reviews) => {
    const preferences = {
        score: 0,
        accessibility: 0,
        communityImpact: 0,
        affordableHousing: 0,
        localEmployment: 0,
        socialAmenities: 0,
        diversityInclusion: 0
    };

    const allProperties = [...wishlist, ...bookings.map(b => b.listingId), ...reviews.map(r => r.listingId)];
    const validProperties = allProperties.filter(p => p && p.esg && p.esg.social);

    if (validProperties.length === 0) return preferences;

    let accessCount = 0, communityTotal = 0, affordableCount = 0, employmentTotal = 0, amenityCount = 0, diversityCount = 0;

    validProperties.forEach(property => {
        const social = property.esg.social;

        if (social.accessibility && social.accessibility !== 'Not Rated') {
            preferences.accessibility += getAccessibilityScore(social.accessibility);
            accessCount++;
        }

        if (social.communityImpact !== undefined) {
            communityTotal += social.communityImpact;
        }

        if (social.affordableHousing) {
            affordableCount++;
        }

        if (social.localEmployment !== undefined) {
            employmentTotal += social.localEmployment;
        }

        if (social.socialAmenities && social.socialAmenities.length > 0) {
            amenityCount += social.socialAmenities.length;
        }

        if (social.diversityInclusion && social.diversityInclusion !== 'Not Rated') {
            preferences.diversityInclusion += getRatingScore(social.diversityInclusion);
            diversityCount++;
        }
    });

    preferences.accessibility = accessCount > 0 ? Math.round(preferences.accessibility / accessCount) : 0;
    preferences.communityImpact = validProperties.length > 0 ? Math.round(communityTotal / validProperties.length) : 0;
    preferences.affordableHousing = Math.round((affordableCount / validProperties.length) * 100);
    preferences.localEmployment = validProperties.length > 0 ? Math.round(employmentTotal / validProperties.length) : 0;
    preferences.socialAmenities = validProperties.length > 0 ? Math.round(amenityCount / validProperties.length) : 0;
    preferences.diversityInclusion = diversityCount > 0 ? Math.round(preferences.diversityInclusion / diversityCount) : 0;

    // Calculate overall social score
    preferences.score = Math.round((
        preferences.accessibility * 0.30 +
        preferences.communityImpact * 0.25 +
        preferences.affordableHousing * 0.20 +
        preferences.localEmployment * 0.15 +
        preferences.socialAmenities * 0.10
    ));

    return preferences;
};

// Governance Preference Analysis
const analyzeGovernancePreferences = (wishlist, bookings, reviews) => {
    const preferences = {
        score: 0,
        transparency: 0,
        ethicalStandards: 0,
        compliance: 0,
        riskManagement: 0,
        stakeholderEngagement: 0
    };

    const allProperties = [...wishlist, ...bookings.map(b => b.listingId), ...reviews.map(r => r.listingId)];
    const validProperties = allProperties.filter(p => p && p.esg && p.esg.governance);

    if (validProperties.length === 0) return preferences;

    let transCount = 0, ethicsCount = 0, complianceCount = 0, riskCount = 0, stakeholderCount = 0;

    validProperties.forEach(property => {
        const gov = property.esg.governance;

        if (gov.transparency && gov.transparency !== 'Not Rated') {
            preferences.transparency += getRatingScore(gov.transparency);
            transCount++;
        }

        if (gov.ethicalStandards && gov.ethicalStandards !== 'Not Rated') {
            preferences.ethicalStandards += getRatingScore(gov.ethicalStandards);
            ethicsCount++;
        }

        if (gov.compliance && gov.compliance !== 'Not Rated') {
            preferences.compliance += getComplianceScore(gov.compliance);
            complianceCount++;
        }

        if (gov.riskManagement && gov.riskManagement !== 'Not Rated') {
            preferences.riskManagement += getRatingScore(gov.riskManagement);
            riskCount++;
        }

        if (gov.stakeholderEngagement && gov.stakeholderEngagement !== 'Not Rated') {
            preferences.stakeholderEngagement += getRatingScore(gov.stakeholderEngagement);
            stakeholderCount++;
        }
    });

    preferences.transparency = transCount > 0 ? Math.round(preferences.transparency / transCount) : 0;
    preferences.ethicalStandards = ethicsCount > 0 ? Math.round(preferences.ethicalStandards / ethicsCount) : 0;
    preferences.compliance = complianceCount > 0 ? Math.round(preferences.compliance / complianceCount) : 0;
    preferences.riskManagement = riskCount > 0 ? Math.round(preferences.riskManagement / riskCount) : 0;
    preferences.stakeholderEngagement = stakeholderCount > 0 ? Math.round(preferences.stakeholderEngagement / stakeholderCount) : 0;

    // Calculate overall governance score
    preferences.score = Math.round((
        preferences.transparency * 0.25 +
        preferences.ethicalStandards * 0.25 +
        preferences.compliance * 0.30 +
        preferences.riskManagement * 0.20
    ));

    return preferences;
};

// ESG-Aware Property Recommendations
export const getESGAwareRecommendations = async (userId, limit = 10) => {
    try {
        console.log(`🌱 ESG Service - Getting recommendations for user: ${userId}, limit: ${limit}`);
        
        // Learn user's ESG preferences
        const esgPreferences = await learnESGPreferences(userId);
        console.log(`🌱 ESG Service - User preferences learned:`, esgPreferences ? 'Yes' : 'No');
        
        if (!esgPreferences) {
            console.log(`🌱 ESG Service - No preferences found, using default recommendations`);
            return getDefaultESGRecommendations(limit);
        }

        // Get all properties with ESG data
        const allProperties = await Listing.find({
            'esg.esgScore': { $exists: true, $ne: 0 }
        }).limit(1000);

        if (allProperties.length === 0) {
            return getDefaultESGRecommendations(limit);
        }

        // Calculate ESG similarity scores
        const scoredProperties = allProperties.map(property => {
            const esgScore = calculateESGSimilarity(property.esg, esgPreferences);
            return {
                property,
                esgScore,
                esgMatch: esgScore > 70,
                sustainabilityScore: property.esg?.esgScore || 0,
                environmentalMatch: calculateEnvironmentalMatch(property.esg?.environmental, esgPreferences.environmental),
                socialMatch: calculateSocialMatch(property.esg?.social, esgPreferences.social),
                governanceMatch: calculateGovernanceMatch(property.esg?.governance, esgPreferences.governance)
            };
        });

        // Sort by ESG similarity score
        const recommendations = scoredProperties
            .sort((a, b) => b.esgScore - a.esgScore)
            .slice(0, limit)
            .map(item => ({
                property: item.property,
                score: item.esgScore,
                match: item.esgMatch,
                sustainabilityScore: item.sustainabilityScore,
                breakdown: {
                    environmental: item.environmentalMatch,
                    social: item.socialMatch,
                    governance: item.governanceMatch
                },
                explanation: generateESGExplanation(item.property, esgPreferences),
                confidence: calculateESGConfidence(item.esgScore, item.sustainabilityScore)
            }));

        console.log(`🌱 ESG Service - Returning ${recommendations.length} recommendations`);
        return recommendations;
    } catch (error) {
        console.error('🌱 ESG Service - Error getting ESG-aware recommendations:', error);
        console.error('🌱 ESG Service - Error details:', error.message);
        return getDefaultESGRecommendations(limit);
    }
};

// ESG Similarity Calculation (Random Forest-inspired)
const calculateESGSimilarity = (propertyESG, userPreferences) => {
    if (!propertyESG || !userPreferences) return 0;

    let similarity = 0;
    let factors = 0;

    // Environmental similarity
    if (propertyESG.environmental && userPreferences.environmental) {
        const envSimilarity = calculateEnvironmentalMatch(propertyESG.environmental, userPreferences.environmental);
        similarity += envSimilarity * ESG_AI_WEIGHTS.environmental;
        factors += ESG_AI_WEIGHTS.environmental;
    }

    // Social similarity
    if (propertyESG.social && userPreferences.social) {
        const socialSimilarity = calculateSocialMatch(propertyESG.social, userPreferences.social);
        similarity += socialSimilarity * ESG_AI_WEIGHTS.social;
        factors += ESG_AI_WEIGHTS.social;
    }

    // Governance similarity
    if (propertyESG.governance && userPreferences.governance) {
        const govSimilarity = calculateGovernanceMatch(propertyESG.governance, userPreferences.governance);
        similarity += govSimilarity * ESG_AI_WEIGHTS.governance;
        factors += ESG_AI_WEIGHTS.governance;
    }

    return factors > 0 ? Math.round(similarity / factors) : 0;
};

// Environmental Match Calculation
const calculateEnvironmentalMatch = (propertyEnv, userEnv) => {
    if (!propertyEnv || !userEnv) return 0;

    let match = 0;
    let factors = 0;

    // Energy efficiency match
    if (propertyEnv.energyRating && propertyEnv.energyRating !== 'Not Rated') {
        const propertyScore = getEnergyRatingScore(propertyEnv.energyRating);
        const userScore = userEnv.energyEfficiency;
        match += Math.abs(100 - Math.abs(propertyScore - userScore));
        factors++;
    }

    // Renewable energy match
    if (propertyEnv.renewableEnergy === true && userEnv.renewableEnergy > 50) {
        match += 100;
        factors++;
    }

    // Green certification match
    if (propertyEnv.greenCertification && propertyEnv.greenCertification !== 'None') {
        if (userEnv.greenCertification > 50) {
            match += 100;
        }
        factors++;
    }

    return factors > 0 ? Math.round(match / factors) : 0;
};

// Social Match Calculation
const calculateSocialMatch = (propertySocial, userSocial) => {
    if (!propertySocial || !userSocial) return 0;

    let match = 0;
    let factors = 0;

    // Accessibility match
    if (propertySocial.accessibility && propertySocial.accessibility !== 'Not Rated') {
        const propertyScore = getAccessibilityScore(propertySocial.accessibility);
        const userScore = userSocial.accessibility;
        match += Math.abs(100 - Math.abs(propertyScore - userScore));
        factors++;
    }

    // Community impact match
    if (propertySocial.communityImpact !== undefined) {
        const userScore = userSocial.communityImpact;
        match += Math.abs(100 - Math.abs(propertySocial.communityImpact - userScore));
        factors++;
    }

    // Affordable housing match
    if (propertySocial.affordableHousing === true && userSocial.affordableHousing > 50) {
        match += 100;
        factors++;
    }

    return factors > 0 ? Math.round(match / factors) : 0;
};

// Governance Match Calculation
const calculateGovernanceMatch = (propertyGov, userGov) => {
    if (!propertyGov || !userGov) return 0;

    let match = 0;
    let factors = 0;

    // Transparency match
    if (propertyGov.transparency && propertyGov.transparency !== 'Not Rated') {
        const propertyScore = getRatingScore(propertyGov.transparency);
        const userScore = userGov.transparency;
        match += Math.abs(100 - Math.abs(propertyScore - userScore));
        factors++;
    }

    // Compliance match
    if (propertyGov.compliance && propertyGov.compliance !== 'Not Rated') {
        const propertyScore = getComplianceScore(propertyGov.compliance);
        const userScore = userGov.compliance;
        match += Math.abs(100 - Math.abs(propertyScore - userScore));
        factors++;
    }

    return factors > 0 ? Math.round(match / factors) : 0;
};

// Generate ESG Explanation
const generateESGExplanation = (property, userPreferences) => {
    const explanations = [];
    const esg = property.esg;

    if (!esg) return ['ESG data not available'];

    // Environmental explanations
    if (esg.environmental?.energyRating && esg.environmental.energyRating !== 'Not Rated') {
        if (userPreferences.environmental.energyEfficiency > 70) {
            explanations.push(`High energy efficiency (${esg.environmental.energyRating}) matches your preference for sustainable properties`);
        }
    }

    if (esg.environmental?.renewableEnergy && userPreferences.environmental.renewableEnergy > 50) {
        explanations.push('Renewable energy features align with your environmental preferences');
    }

    // Social explanations
    if (esg.social?.accessibility && esg.social.accessibility !== 'Not Rated') {
        if (userPreferences.social.accessibility > 70) {
            explanations.push(`Accessibility features (${esg.social.accessibility}) match your social impact preferences`);
        }
    }

    if (esg.social?.affordableHousing && userPreferences.social.affordableHousing > 50) {
        explanations.push('Affordable housing designation aligns with your social values');
    }

    // Governance explanations
    if (esg.governance?.transparency && esg.governance.transparency !== 'Not Rated') {
        if (userPreferences.governance.transparency > 70) {
            explanations.push(`High transparency (${esg.governance.transparency}) matches your governance preferences`);
        }
    }

    return explanations.length > 0 ? explanations : ['ESG factors align with your preferences'];
};

// Calculate ESG Confidence
const calculateESGConfidence = (similarityScore, sustainabilityScore) => {
    const confidence = (similarityScore * 0.6 + sustainabilityScore * 0.4) / 100;
    return Math.min(Math.max(confidence, 0.1), 1.0);
};

// Default ESG Recommendations
const getDefaultESGRecommendations = async (limit) => {
    try {
        const properties = await Listing.find({
            'esg.esgScore': { $exists: true, $ne: 0 }
        })
        .sort({ 'esg.esgScore': -1 })
        .limit(limit);

        return properties.map(property => ({
            property,
            score: property.esg?.esgScore || 0,
            match: true,
            sustainabilityScore: property.esg?.esgScore || 0,
            breakdown: {
                environmental: property.esg?.environmental ? 80 : 0,
                social: property.esg?.social ? 80 : 0,
                governance: property.esg?.governance ? 80 : 0
            },
            explanation: ['High sustainability score based on ESG factors'],
            confidence: 0.8
        }));
    } catch (error) {
        console.error('Error getting default ESG recommendations:', error);
        return [];
    }
};

// Helper Functions (same as in esgAnalyticsService.js)
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

const getESGRating = (score) => {
    if (score >= 90) return 'AAA';
    if (score >= 80) return 'AA';
    if (score >= 70) return 'A';
    if (score >= 60) return 'BBB';
    if (score >= 50) return 'BB';
    if (score >= 40) return 'B';
    if (score >= 30) return 'CCC';
    if (score >= 20) return 'CC';
    if (score >= 10) return 'C';
    return 'D';
};

export default {
    learnESGPreferences,
    getESGAwareRecommendations
};

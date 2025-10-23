import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

/**
 * ESG Analytics Controller
 * Provides comprehensive ESG analytics and reporting
 */

// Get ESG Analytics Dashboard Data
export const getESGAnalytics = async (req, res, next) => {
    try {
        const { timeframe = '30d' } = req.query;
        
        // Calculate date range based on timeframe
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Get all properties with ESG data
        const properties = await Listing.find({
            'esg.esgScore': { $exists: true, $ne: 0 }
        }).select('name city state esg createdAt');

        const totalProperties = await Listing.countDocuments();
        const esgRatedProperties = properties.length;

        // Calculate average ESG score
        const averageEsgScore = esgRatedProperties > 0 
            ? properties.reduce((sum, prop) => sum + (prop.esg?.esgScore || 0), 0) / esgRatedProperties 
            : 0;

        // Environmental Metrics
        const environmentalMetrics = {
            energyEfficiency: calculateMetricPercentage(properties, 'esg.environmental.energyRating', ['A+', 'A', 'B']),
            renewableEnergy: calculateMetricPercentage(properties, 'esg.environmental.renewableEnergy', [true]),
            wasteManagement: calculateMetricPercentage(properties, 'esg.environmental.wasteManagement', ['Excellent', 'Good']),
            greenCertifications: calculateMetricPercentage(properties, 'esg.environmental.greenCertification', ['LEED', 'BREEAM', 'GRIHA', 'IGBC'])
        };

        // Social Metrics
        const socialMetrics = {
            accessibility: calculateMetricPercentage(properties, 'esg.social.accessibility', ['Fully Accessible', 'Partially Accessible']),
            communityImpact: calculateAverageScore(properties, 'esg.social.communityImpact'),
            affordableHousing: calculateMetricPercentage(properties, 'esg.social.affordableHousing', [true]),
            diversityInclusion: calculateMetricPercentage(properties, 'esg.social.diversityInclusion', ['Excellent', 'Good'])
        };

        // Governance Metrics
        const governanceMetrics = {
            transparency: calculateMetricPercentage(properties, 'esg.governance.transparency', ['Excellent', 'Good']),
            ethicalStandards: calculateMetricPercentage(properties, 'esg.governance.ethicalStandards', ['Excellent', 'Good']),
            compliance: calculateMetricPercentage(properties, 'esg.governance.compliance', ['Fully Compliant', 'Mostly Compliant']),
            riskManagement: calculateMetricPercentage(properties, 'esg.governance.riskManagement', ['Excellent', 'Good'])
        };

        // Top Performers
        const topPerformers = properties
            .filter(prop => prop.esg?.esgScore > 0)
            .sort((a, b) => (b.esg?.esgScore || 0) - (a.esg?.esgScore || 0))
            .slice(0, 5)
            .map(prop => ({
                name: prop.name,
                location: `${prop.city}, ${prop.state}`,
                esgScore: prop.esg?.esgScore || 0,
                esgRating: prop.esg?.esgRating || 'Not Rated'
            }));

        // Improvement Areas (properties with low ESG scores)
        const improvementAreas = properties
            .filter(prop => (prop.esg?.esgScore || 0) < 50)
            .slice(0, 5)
            .map(prop => ({
                category: 'ESG Score',
                description: `${prop.name} - ${prop.city}`,
                priority: 'High'
            }));

        // Trends (simplified - in real implementation, compare with previous period)
        const trends = {
            overall: Math.random() * 20 - 10, // Placeholder - would calculate actual trends
            environmental: Math.random() * 20 - 10,
            social: Math.random() * 20 - 10,
            governance: Math.random() * 20 - 10
        };

        res.status(200).json({
            success: true,
            data: {
                totalProperties,
                esgRatedProperties,
                averageEsgScore,
                environmentalMetrics,
                socialMetrics,
                governanceMetrics,
                topPerformers,
                improvementAreas,
                trends
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get ESG Performance by Category
export const getESGPerformanceByCategory = async (req, res, next) => {
    try {
        const { category } = req.params; // 'environmental', 'social', 'governance'
        
        const properties = await Listing.find({
            [`esg.${category}`]: { $exists: true }
        }).select(`name city state esg.${category} esg.esgScore`);

        const performanceData = properties.map(prop => ({
            name: prop.name,
            location: `${prop.city}, ${prop.state}`,
            categoryData: prop.esg?.[category] || {},
            esgScore: prop.esg?.esgScore || 0
        }));

        res.status(200).json({
            success: true,
            data: performanceData
        });

    } catch (error) {
        next(error);
    }
};

// Get ESG Trends Over Time
export const getESGTrends = async (req, res, next) => {
    try {
        const { timeframe = '1y' } = req.query;
        
        // Calculate date range
        const now = new Date();
        const startDate = new Date(now.getTime() - (timeframe === '1y' ? 365 : 90) * 24 * 60 * 60 * 1000);

        // Get properties created in the timeframe with ESG data
        const properties = await Listing.find({
            createdAt: { $gte: startDate },
            'esg.esgScore': { $exists: true, $ne: 0 }
        }).select('esg createdAt').sort({ createdAt: 1 });

        // Group by month and calculate trends
        const monthlyData = {};
        properties.forEach(prop => {
            const month = prop.createdAt.toISOString().substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
                monthlyData[month] = {
                    count: 0,
                    totalScore: 0,
                    environmental: 0,
                    social: 0,
                    governance: 0
                };
            }
            
            monthlyData[month].count++;
            monthlyData[month].totalScore += prop.esg?.esgScore || 0;
            // Add category-specific calculations here
        });

        // Convert to array format for charts
        const trends = Object.entries(monthlyData).map(([month, data]) => ({
            month,
            averageScore: data.count > 0 ? data.totalScore / data.count : 0,
            propertyCount: data.count
        }));

        res.status(200).json({
            success: true,
            data: trends
        });

    } catch (error) {
        next(error);
    }
};

// Update ESG Score for a Property
export const updateESGScore = async (req, res, next) => {
    try {
        const { listingId } = req.params;
        const { esgData } = req.body;

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return next(errorHandler(404, 'Property not found'));
        }

        // Calculate overall ESG score
        const esgScore = calculateOverallESGScore(esgData);
        const esgRating = getESGRating(esgScore);

        // Update the listing
        const updatedListing = await Listing.findByIdAndUpdate(
            listingId,
            {
                $set: {
                    'esg': {
                        ...esgData,
                        esgScore,
                        esgRating,
                        lastEsgUpdate: new Date()
                    }
                }
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: updatedListing.esg
        });

    } catch (error) {
        next(error);
    }
};

// Helper Functions
const calculateMetricPercentage = (properties, fieldPath, goodValues) => {
    if (properties.length === 0) return 0;
    
    const goodCount = properties.filter(prop => {
        const value = getNestedValue(prop, fieldPath);
        return goodValues.includes(value);
    }).length;
    
    return Math.round((goodCount / properties.length) * 100);
};

const calculateAverageScore = (properties, fieldPath) => {
    if (properties.length === 0) return 0;
    
    const total = properties.reduce((sum, prop) => {
        const value = getNestedValue(prop, fieldPath);
        return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    
    return Math.round(total / properties.length);
};

const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

const calculateOverallESGScore = (esgData) => {
    // Simplified calculation - in real implementation, use weighted scoring
    let score = 0;
    let factors = 0;

    // Environmental factors
    if (esgData.environmental?.energyRating) {
        const energyScore = getEnergyRatingScore(esgData.environmental.energyRating);
        score += energyScore;
        factors++;
    }

    if (esgData.environmental?.renewableEnergy) {
        score += 20;
        factors++;
    }

    // Social factors
    if (esgData.social?.communityImpact) {
        score += Math.min(esgData.social.communityImpact, 20);
        factors++;
    }

    if (esgData.social?.affordableHousing) {
        score += 15;
        factors++;
    }

    // Governance factors
    if (esgData.governance?.transparency) {
        const transparencyScore = getRatingScore(esgData.governance.transparency);
        score += transparencyScore;
        factors++;
    }

    return factors > 0 ? Math.min(Math.round(score / factors * 5), 100) : 0;
};

const getEnergyRatingScore = (rating) => {
    const scores = {
        'A+': 20, 'A': 18, 'B': 15, 'C': 10, 'D': 5, 'E': 2, 'F': 1, 'G': 0
    };
    return scores[rating] || 0;
};

const getRatingScore = (rating) => {
    const scores = {
        'Excellent': 20, 'Good': 15, 'Average': 10, 'Poor': 5
    };
    return scores[rating] || 0;
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

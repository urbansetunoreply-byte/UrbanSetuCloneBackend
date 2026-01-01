import express from 'express';
import { verifyToken } from '../utils/verify.js';
import realTimeDataService from '../services/realTimeDataService.js';
import Listing from '../models/listing.model.js';

const router = express.Router();

// Get property market data
router.get('/property/:id/market-data', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get property details
    const property = await Listing.findById(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const location = {
      city: property.city,
      district: property.district,
      state: property.state,
      address: property.address,
      type: property.type,
      bedrooms: property.bedrooms,
      latitude: property.latitude,
      longitude: property.longitude
    };

    const marketData = await realTimeDataService.getPropertyMarketData(id, location);

    res.json({
      success: true,
      data: marketData
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Get location intelligence
router.get('/location/intelligence', verifyToken, async (req, res) => {
  try {
    const { city, district, state, latitude, longitude } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    const location = {
      city,
      district,
      state,
      latitude: parseFloat(latitude) || null,
      longitude: parseFloat(longitude) || null
    };

    const locationData = await realTimeDataService.getLocationIntelligence(location);

    res.json({
      success: true,
      data: locationData
    });
  } catch (error) {
    console.error('Error fetching location intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch location intelligence' });
  }
});

// Get market trends
router.get('/market/trends', verifyToken, async (req, res) => {
  try {
    const { city, type } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    const location = { city, type };
    const trends = await realTimeDataService.getMarketTrends(location);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching market trends:', error);
    res.status(500).json({ error: 'Failed to fetch market trends' });
  }
});

// Get investment analysis
router.get('/property/:id/investment-analysis', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get property details
    const property = await Listing.findById(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const location = {
      city: property.city,
      district: property.district,
      state: property.state,
      address: property.address,
      type: property.type,
      bedrooms: property.bedrooms,
      latitude: property.latitude,
      longitude: property.longitude
    };

    // Get market data and location data
    const [marketData, locationData] = await Promise.all([
      realTimeDataService.getPropertyMarketData(id, location),
      realTimeDataService.getLocationIntelligence(location)
    ]);

    // Calculate investment analysis
    const investmentAnalysis = await realTimeDataService.getInvestmentAnalysis(
      property,
      marketData,
      locationData
    );

    res.json({
      success: true,
      data: {
        property: {
          id: property._id,
          name: property.name,
          price: property.offer ? property.discountPrice : property.regularPrice,
          type: property.type,
          bedrooms: property.bedrooms,
          area: property.area
        },
        marketData,
        locationData,
        investmentAnalysis
      }
    });
  } catch (error) {
    console.error('Error fetching investment analysis:', error);
    res.status(500).json({ error: 'Failed to fetch investment analysis' });
  }
});

// Get weather data
router.get('/location/weather', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    const weatherData = await realTimeDataService.getWeatherData(location);

    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get comprehensive property analytics
router.get('/property/:id/analytics', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get property details
    const property = await Listing.findById(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const location = {
      city: property.city,
      district: property.district,
      state: property.state,
      address: property.address,
      type: property.type,
      bedrooms: property.bedrooms,
      latitude: property.latitude,
      longitude: property.longitude
    };

    // Get all analytics data
    const [
      marketData,
      locationData,
      weatherData,
      trendsData
    ] = await Promise.all([
      realTimeDataService.getPropertyMarketData(id, location),
      realTimeDataService.getLocationIntelligence(location),
      realTimeDataService.getWeatherData(location),
      realTimeDataService.getMarketTrends(location)
    ]);

    // Calculate investment analysis
    const investmentAnalysis = await realTimeDataService.getInvestmentAnalysis(
      property,
      marketData,
      locationData
    );

    res.json({
      success: true,
      data: {
        property: {
          id: property._id,
          name: property.name,
          price: property.offer ? property.discountPrice : property.regularPrice,
          type: property.type,
          bedrooms: property.bedrooms,
          area: property.area,
          address: property.address,
          city: property.city,
          state: property.state
        },
        marketData,
        locationData,
        weatherData,
        trendsData,
        investmentAnalysis,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    res.status(500).json({ error: 'Failed to fetch comprehensive analytics' });
  }
});

// POST endpoint for property analytics (used by Investment Tools)
router.post('/property/analytics', verifyToken, async (req, res) => {
  try {
    const { location, filters, propertyData, analysisType } = req.body;

    if (!location || !analysisType) {
      return res.status(400).json({ error: 'Location and analysisType are required' });
    }

    let result;

    if (analysisType === 'market') {
      // Market analysis
      const { city, district, state, latitude, longitude } = location;
      const { propertyType, timeFrame } = filters || {};

      const locationData = {
        city,
        district,
        state,
        latitude: parseFloat(latitude) || null,
        longitude: parseFloat(longitude) || null,
        type: propertyType || 'apartment',
        bedrooms: 2 // Default assumption for general market check
      };

      // Get market trends, property market data (general), and location intelligence
      const [marketTrends, propertyMarketInfo, locationIntelligence] = await Promise.all([
        realTimeDataService.getMarketTrends(locationData),
        realTimeDataService.getPropertyMarketData('000000000000000000000000', locationData),
        realTimeDataService.getLocationIntelligence(locationData)
      ]);

      // Dynamic Calculations using Service Methods
      const marketScore = realTimeDataService.calculateMarketScore(city, state, propertyType || 'apartment');
      const demandLevel = realTimeDataService.calculateDemandLevel(city, state, propertyType || 'apartment');
      const supplyLevel = realTimeDataService.calculateSupplyLevel(city, state, propertyType || 'apartment');
      const riskLevel = realTimeDataService.calculateRiskLevel(city, state, propertyType || 'apartment');
      const averageDays = realTimeDataService.calculateDaysOnMarket(city, state, propertyType || 'apartment');

      const priceGrowthVal = marketTrends && marketTrends.priceGrowth !== undefined ? marketTrends.priceGrowth : 0;
      const priceTrendStr = `${priceGrowthVal > 0 ? '+' : ''}${priceGrowthVal.toFixed(1)}%`;

      const recommendation = realTimeDataService.getRecommendation(marketScore, priceGrowthVal);

      // Calculate avg price per sq ft from property market info if available
      let pricePerSqFtStr = '₹8,500'; // Default fallback
      if (propertyMarketInfo && propertyMarketInfo.averagePrice) {
        // Estimate avg area (e.g. 1000 sqft) if not available, or just use raw price average
        // propertyMarketInfo.pricePerSqft is an array of objects
        const ppsfArr = propertyMarketInfo.pricePerSqft || [];
        if (ppsfArr.length > 0) {
          const avgPpsf = ppsfArr.reduce((sum, item) => sum + item.price, 0) / ppsfArr.length;
          pricePerSqFtStr = `₹${Math.round(avgPpsf).toLocaleString()}`;
        }
      }

      // Calculate market analysis
      result = {
        priceTrend: priceTrendStr,
        marketScore: `${marketScore}/100`,
        demandLevel: demandLevel,
        supplyLevel: supplyLevel,
        averageDaysOnMarket: averageDays,
        pricePerSqFt: pricePerSqFtStr,
        recommendation: recommendation,
        riskLevel: riskLevel,
        lastUpdated: new Date()
      };

    } else if (analysisType === 'risk') {
      // Risk assessment
      const { city, state } = location;
      const { propertyValue, marketVolatility, tenantStability, maintenanceHistory, neighborhoodGrowth } = propertyData || {};

      // Calculate risk score
      let riskScore = 0;

      // Market volatility scoring
      const volatilityScores = { low: 1, medium: 3, high: 5 };
      riskScore += volatilityScores[marketVolatility] || 3;

      // Tenant stability scoring
      const stabilityScores = { high: 1, medium: 3, low: 5 };
      riskScore += stabilityScores[tenantStability] || 3;

      // Maintenance history scoring
      const maintenanceScores = { excellent: 1, good: 2, fair: 3, poor: 4, unknown: 5 };
      riskScore += maintenanceScores[maintenanceHistory] || 3;

      // Neighborhood growth scoring
      const growthScores = { growing: 1, stable: 2, declining: 4 };
      riskScore += growthScores[neighborhoodGrowth] || 2;

      // Location risk
      const cityRisks = {
        'Mumbai': 1, 'Delhi': 1, 'Bangalore': 2, 'Chennai': 2,
        'Hyderabad': 2, 'Pune': 3, 'Kolkata': 3
      };
      riskScore += cityRisks[city] || 4;

      riskScore = Math.min(20, Math.max(1, riskScore));

      // Determine risk level
      let riskLevel;
      if (riskScore <= 5) riskLevel = 'Low';
      else if (riskScore <= 10) riskLevel = 'Medium';
      else if (riskScore <= 15) riskLevel = 'High';
      else riskLevel = 'Very High';

      // Get risk color
      const riskColors = {
        'Low': 'text-green-600',
        'Medium': 'text-yellow-600',
        'High': 'text-orange-600',
        'Very High': 'text-red-600'
      };

      // Get recommendation
      let recommendation;
      if (riskScore <= 5) recommendation = 'Low risk investment with good potential';
      else if (riskScore <= 10) recommendation = 'Moderate risk, consider market conditions';
      else if (riskScore <= 15) recommendation = 'High risk, thorough due diligence required';
      else recommendation = 'Very high risk, consider alternative investments';

      // Get risk factors
      const riskFactors = [];
      if (marketVolatility === 'high') riskFactors.push('High market volatility');
      if (tenantStability === 'low') riskFactors.push('Low tenant stability');
      if (maintenanceHistory === 'poor') riskFactors.push('Poor maintenance history');
      if (neighborhoodGrowth === 'declining') riskFactors.push('Declining neighborhood');
      if (riskScore >= 15) riskFactors.push('High overall risk score');

      if (riskFactors.length === 0) riskFactors.push('No significant risk factors identified');

      // Get mitigation strategies
      const strategies = {
        'Low': ['Regular market monitoring', 'Maintain property condition'],
        'Medium': ['Diversify portfolio', 'Regular market monitoring', 'Maintain property condition', 'Consider insurance'],
        'High': ['Thorough due diligence', 'Diversify portfolio', 'Regular market monitoring', 'Comprehensive insurance', 'Professional property management'],
        'Very High': ['Avoid investment', 'Consider alternative investments', 'Seek professional advice', 'Thorough market research']
      };

      result = {
        riskScore,
        riskLevel,
        recommendation,
        riskColor: riskColors[riskLevel],
        riskFactors,
        mitigationStrategies: strategies[riskLevel] || strategies['Medium'],
        lastUpdated: new Date()
      };

    } else {
      return res.status(400).json({ error: 'Invalid analysisType. Must be "market" or "risk"' });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error processing analytics request:', error);
    res.status(500).json({ error: 'Failed to process analytics request' });
  }
});

export default router;

import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import realTimeDataService from '../services/realTimeDataService.js';
import { Listing } from '../models/listing.model.js';

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

export default router;

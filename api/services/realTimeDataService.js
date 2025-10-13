import axios from 'axios';
import Listing from '../models/listing.model.js';

class RealTimeDataService {
  constructor() {
    this.apiKeys = {
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY,
      mapbox: process.env.MAPBOX_ACCESS_TOKEN,
      openWeather: process.env.OPENWEATHER_API_KEY,
      foursquare: process.env.FOURSQUARE_API_KEY,
      // Add more API keys as needed
    };
    
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  // Get cached data or fetch new data
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const data = await fetchFunction();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // 1. Property Market Data
  async getPropertyMarketData(propertyId, location) {
    const cacheKey = `property_market_${propertyId}`;
    
    return await this.getCachedData(cacheKey, async () => {
      try {
        // Get similar properties from database
        const similarProperties = await Listing.find({
          city: location.city,
          type: location.type,
          bedrooms: location.bedrooms,
          _id: { $ne: propertyId }
        }).limit(10);

        // Calculate market metrics
        const prices = similarProperties.map(p => p.regularPrice);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        // Price per sq ft analysis
        const pricePerSqft = similarProperties.map(p => ({
          price: p.regularPrice / (p.area || 1000),
          property: p
        }));

        return {
          averagePrice: avgPrice,
          minPrice,
          maxPrice,
          priceRange: maxPrice - minPrice,
          pricePerSqft: pricePerSqft,
          marketActivity: similarProperties.length,
          lastUpdated: new Date()
        };
      } catch (error) {
        console.error('Error fetching property market data:', error);
        return null;
      }
    });
  }

  // 2. Location Intelligence
  async getLocationIntelligence(location) {
    const cacheKey = `location_intel_${location.city}_${location.district}`;
    
    return await this.getCachedData(cacheKey, async () => {
      try {
        const [amenities, crimeData, schoolData, transportData] = await Promise.all([
          this.getNearbyAmenities(location),
          this.getCrimeData(location),
          this.getSchoolData(location),
          this.getTransportData(location)
        ]);

        return {
          amenities,
          crimeData,
          schoolData,
          transportData,
          locationScore: this.calculateLocationScore(amenities, crimeData, schoolData, transportData),
          lastUpdated: new Date()
        };
      } catch (error) {
        console.error('Error fetching location intelligence:', error);
        return null;
      }
    });
  }

  // 3. Nearby Amenities (Google Places API / Mapbox fallback)
  async getNearbyAmenities(location) {
    // Prefer Mapbox if available
    if (this.apiKeys.mapbox) {
      try {
        const lat = location.latitude || 0;
        const lng = location.longitude || 0;
        const amenityQueries = [
          { key: 'hospital', query: 'hospital' },
          { key: 'school', query: 'school' },
          { key: 'shopping_mall', query: 'shopping mall' },
          { key: 'restaurant', query: 'restaurant' },
          { key: 'gas_station', query: 'gas station' },
          { key: 'bank', query: 'bank' },
          { key: 'pharmacy', query: 'pharmacy' },
          { key: 'gym', query: 'gym' },
          { key: 'park', query: 'park' }
        ];

        const amenities = {};

        for (const item of amenityQueries) {
          try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(item.query)}.json`;
            const response = await axios.get(url, {
              params: {
                proximity: `${lng},${lat}`,
                types: 'poi',
                limit: 10,
                access_token: this.apiKeys.mapbox
              }
            });

            amenities[item.key] = (response.data.features || []).map(place => ({
              name: place.text || place.place_name,
              rating: 0, // Mapbox does not provide ratings
              distance: this.calculateDistance(lat, lng, place.center[1], place.center[0]),
              vicinity: place.properties && place.properties.address ? place.properties.address : (place.place_name || '')
            }));
          } catch (error) {
            console.error(`Error fetching ${item.key} amenities from Mapbox:`, error);
          }
        }

        return amenities;
      } catch (error) {
        console.error('Error fetching amenities from Mapbox:', error);
        // Fall through to Google or mock
      }
    }

    if (!this.apiKeys.googlePlaces) {
      return this.getMockAmenities();
    }

    try {
      const lat = location.latitude || 0;
      const lng = location.longitude || 0;
      const radius = 2000; // 2km radius

      const amenityTypes = [
        'hospital', 'school', 'shopping_mall', 'restaurant', 
        'gas_station', 'bank', 'pharmacy', 'gym', 'park'
      ];

      const amenities = {};
      
      for (const type of amenityTypes) {
        try {
          const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
            params: {
              location: `${lat},${lng}`,
              radius: radius,
              type: type,
              key: this.apiKeys.googlePlaces
            }
          });

          amenities[type] = response.data.results.map(place => ({
            name: place.name,
            rating: place.rating || 0,
            distance: this.calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng),
            vicinity: place.vicinity
          }));
        } catch (error) {
          console.error(`Error fetching ${type} amenities:`, error);
        }
      }

      return amenities;
    } catch (error) {
      console.error('Error fetching amenities:', error);
      return this.getMockAmenities();
    }
  }

  // 4. Crime Data (Mock implementation - replace with real API)
  async getCrimeData(location) {
    // In real implementation, use crime data APIs like:
    // - India: Crime data from state police websites
    // - US: FBI Crime Data API
    // - UK: Police.uk API
    
    return {
      crimeRate: 'Low', // Low, Medium, High
      safetyScore: 85, // 0-100
      commonCrimes: ['Petty theft', 'Traffic violations'],
      lastUpdated: new Date()
    };
  }

  // 5. School Data (Google Places API / Mapbox fallback)
  async getSchoolData(location) {
    // Prefer Mapbox if available
    if (this.apiKeys.mapbox) {
      try {
        const lat = location.latitude || 0;
        const lng = location.longitude || 0;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent('school')}.json`;
        const response = await axios.get(url, {
          params: {
            proximity: `${lng},${lat}`,
            types: 'poi',
            limit: 15,
            access_token: this.apiKeys.mapbox
          }
        });

        const features = response.data.features || [];
        const schools = features.map(school => ({
          name: school.text || school.place_name,
          rating: 0,
          distance: this.calculateDistance(lat, lng, school.center[1], school.center[0]),
          vicinity: school.properties && school.properties.address ? school.properties.address : (school.place_name || '')
        }));

        return {
          schools: schools.slice(0, 10),
          averageRating: schools.length ? (schools.reduce((sum, s) => sum + (s.rating || 0), 0) / schools.length) : 0,
          totalSchools: schools.length
        };
      } catch (error) {
        console.error('Error fetching school data from Mapbox:', error);
        // Fall through to Google or mock
      }
    }

    if (!this.apiKeys.googlePlaces) {
      return this.getMockSchoolData();
    }

    try {
      const lat = location.latitude || 0;
      const lng = location.longitude || 0;

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${lat},${lng}`,
          radius: 5000, // 5km radius
          type: 'school',
          key: this.apiKeys.googlePlaces
        }
      });

      const schools = response.data.results.map(school => ({
        name: school.name,
        rating: school.rating || 0,
        distance: this.calculateDistance(lat, lng, school.geometry.location.lat, school.geometry.location.lng),
        vicinity: school.vicinity
      }));

      return {
        schools: schools.slice(0, 10), // Top 10 schools
        averageRating: schools.reduce((sum, school) => sum + school.rating, 0) / schools.length,
        totalSchools: schools.length
      };
    } catch (error) {
      console.error('Error fetching school data:', error);
      return this.getMockSchoolData();
    }
  }

  // 6. Transport Data (Google Places API / Mapbox fallback)
  async getTransportData(location) {
    // Prefer Mapbox if available
    if (this.apiKeys.mapbox) {
      try {
        const lat = location.latitude || 0;
        const lng = location.longitude || 0;

        const queries = ['transit station', 'bus station', 'train station', 'metro station'];
        let stationsCombined = [];

        for (const q of queries) {
          try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`;
            const response = await axios.get(url, {
              params: {
                proximity: `${lng},${lat}`,
                types: 'poi',
                limit: 8,
                access_token: this.apiKeys.mapbox
              }
            });

            const items = (response.data.features || []).map(station => ({
              name: station.text || station.place_name,
              distance: this.calculateDistance(lat, lng, station.center[1], station.center[0]),
              vicinity: station.properties && station.properties.address ? station.properties.address : (station.place_name || '')
            }));

            stationsCombined = stationsCombined.concat(items);
          } catch (innerErr) {
            console.error(`Error fetching transport query "${q}" from Mapbox:`, innerErr);
          }
        }

        // De-duplicate by name + vicinity
        const seen = new Set();
        const stations = stationsCombined.filter(s => {
          const key = `${s.name}|${s.vicinity}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).sort((a, b) => a.distance - b.distance);

        return {
          stations: stations.slice(0, 5),
          connectivityScore: this.calculateConnectivityScore(stations),
          totalStations: stations.length
        };
      } catch (error) {
        console.error('Error fetching transport data from Mapbox:', error);
        // Fall through to Google or mock
      }
    }

    if (!this.apiKeys.googlePlaces) {
      return this.getMockTransportData();
    }

    try {
      const lat = location.latitude || 0;
      const lng = location.longitude || 0;

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${lat},${lng}`,
          radius: 3000, // 3km radius
          type: 'transit_station',
          key: this.apiKeys.googlePlaces
        }
      });

      const stations = response.data.results.map(station => ({
        name: station.name,
        distance: this.calculateDistance(lat, lng, station.geometry.location.lat, station.geometry.location.lng),
        vicinity: station.vicinity
      }));

      return {
        stations: stations.slice(0, 5), // Top 5 stations
        connectivityScore: this.calculateConnectivityScore(stations),
        totalStations: stations.length
      };
    } catch (error) {
      console.error('Error fetching transport data:', error);
      return this.getMockTransportData();
    }
  }

  // 7. Weather Data
  async getWeatherData(location) {
    if (!this.apiKeys.openWeather) {
      return this.getMockWeatherData();
    }

    try {
      const lat = location.latitude || 0;
      const lng = location.longitude || 0;

      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat: lat,
          lon: lng,
          appid: this.apiKeys.openWeather,
          units: 'metric'
        }
      });

      return {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        windSpeed: response.data.wind.speed,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return this.getMockWeatherData();
    }
  }

  // 8. Market Trends Analysis
  async getMarketTrends(location) {
    const cacheKey = `market_trends_${location.city}`;
    
    return await this.getCachedData(cacheKey, async () => {
      try {
        // Get historical data from database
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const historicalListings = await Listing.find({
          city: location.city,
          type: location.type,
          createdAt: { $gte: sixMonthsAgo }
        }).sort({ createdAt: 1 });

        // Calculate trends
        const monthlyData = this.calculateMonthlyTrends(historicalListings);
        const priceGrowth = this.calculatePriceGrowth(monthlyData);
        const demandTrends = this.calculateDemandTrends(historicalListings);

        return {
          monthlyData,
          priceGrowth,
          demandTrends,
          marketSentiment: this.calculateMarketSentiment(priceGrowth, demandTrends),
          lastUpdated: new Date()
        };
      } catch (error) {
        console.error('Error fetching market trends:', error);
        return null;
      }
    });
  }

  // 9. Investment Analysis
  async getInvestmentAnalysis(property, marketData, locationData) {
    try {
      const currentPrice = property.offer ? property.discountPrice : property.regularPrice;
      
      // Calculate ROI based on market data
      const roi = this.calculateROI(currentPrice, marketData, property);
      
      // Calculate appreciation potential
      const appreciation = this.calculateAppreciation(currentPrice, marketData, locationData);
      
      // Calculate risk score
      const riskScore = this.calculateRiskScore(property, marketData, locationData);
      
      // Calculate investment score
      const investmentScore = this.calculateInvestmentScore(roi, appreciation, riskScore);

      return {
        roi,
        appreciation,
        riskScore,
        investmentScore,
        recommendation: this.getInvestmentRecommendation(investmentScore),
        timeline: this.getInvestmentTimeline(roi, appreciation),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error calculating investment analysis:', error);
      return null;
    }
  }

  // Helper Methods
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateLocationScore(amenities, crimeData, schoolData, transportData) {
    let score = 0;
    
    // Amenities score (0-30)
    const amenityCount = Object.values(amenities).reduce((sum, arr) => sum + arr.length, 0);
    score += Math.min(amenityCount * 2, 30);
    
    // Crime score (0-25)
    score += crimeData.safetyScore * 0.25;
    
    // School score (0-25)
    score += schoolData.averageRating * 5;
    
    // Transport score (0-20)
    score += transportData.connectivityScore;
    
    return Math.min(score, 100);
  }

  calculateConnectivityScore(stations) {
    if (stations.length === 0) return 0;
    const avgDistance = stations.reduce((sum, station) => sum + station.distance, 0) / stations.length;
    return Math.max(0, 20 - (avgDistance / 100)); // Closer stations = higher score
  }

  calculateROI(currentPrice, marketData, property) {
    if (!marketData) return { annual: 8, monthly: 0.67 };
    
    const avgPrice = marketData.averagePrice;
    const priceRatio = currentPrice / avgPrice;
    
    // Base ROI calculation
    let baseROI = property.type === 'rent' ? 6 : 10;
    
    // Adjust based on price ratio
    if (priceRatio < 0.9) baseROI += 2; // Good deal
    else if (priceRatio > 1.1) baseROI -= 2; // Overpriced
    
    return {
      annual: baseROI,
      monthly: baseROI / 12,
      potential: baseROI + (Math.random() * 4 - 2) // Add some variation
    };
  }

  calculateAppreciation(currentPrice, marketData, locationData) {
    if (!marketData || !locationData) return { annual: 8, fiveYear: 0 };
    
    const baseAppreciation = 8;
    const locationBonus = locationData.locationScore / 10;
    const marketBonus = marketData.priceGrowth || 0;
    
    const annual = baseAppreciation + locationBonus + marketBonus;
    const fiveYear = Math.pow(1 + annual/100, 5) - 1;
    
    return {
      annual: Math.max(0, annual),
      fiveYear: fiveYear * 100,
      projectedValue: currentPrice * (1 + annual/100)
    };
  }

  calculateRiskScore(property, marketData, locationData) {
    let risk = 50; // Base risk
    
    // Location risk
    if (locationData && locationData.crimeData) {
      risk += locationData.crimeData.safetyScore > 80 ? -20 : 20;
    }
    
    // Market risk
    if (marketData && marketData.marketActivity < 5) {
      risk += 15; // Low market activity = higher risk
    }
    
    // Property risk
    if (property.bedrooms < 2) risk += 10; // Smaller properties = higher risk
    if (property.area < 1000) risk += 10; // Smaller area = higher risk
    
    return Math.max(0, Math.min(100, risk));
  }

  calculateInvestmentScore(roi, appreciation, riskScore) {
    const roiScore = roi.annual * 3; // Weight ROI heavily
    const appreciationScore = appreciation.annual * 2;
    const riskPenalty = riskScore * 0.5;
    
    return Math.max(0, Math.min(100, roiScore + appreciationScore - riskPenalty));
  }

  getInvestmentRecommendation(score) {
    if (score >= 80) return 'Excellent Investment';
    if (score >= 60) return 'Good Investment';
    if (score >= 40) return 'Fair Investment';
    return 'Consider Alternatives';
  }

  getInvestmentTimeline(roi, appreciation) {
    return {
      oneYear: {
        roi: roi.annual,
        appreciation: appreciation.annual,
        totalReturn: roi.annual + appreciation.annual
      },
      threeYear: {
        roi: roi.annual * 3,
        appreciation: Math.pow(1 + appreciation.annual/100, 3) - 1,
        totalReturn: (roi.annual * 3) + (Math.pow(1 + appreciation.annual/100, 3) - 1)
      },
      fiveYear: {
        roi: roi.annual * 5,
        appreciation: appreciation.fiveYear,
        totalReturn: (roi.annual * 5) + appreciation.fiveYear
      }
    };
  }

  // Mock data methods (fallback when APIs are not available)
  getMockAmenities() {
    return {
      hospital: [{ name: 'City Hospital', rating: 4.2, distance: 0.8 }],
      school: [{ name: 'ABC School', rating: 4.5, distance: 1.2 }],
      shopping_mall: [{ name: 'City Mall', rating: 4.0, distance: 2.1 }],
      restaurant: [{ name: 'Local Restaurant', rating: 4.3, distance: 0.5 }]
    };
  }

  getMockSchoolData() {
    return {
      schools: [
        { name: 'ABC School', rating: 4.5, distance: 1.2 },
        { name: 'XYZ School', rating: 4.2, distance: 2.1 }
      ],
      averageRating: 4.35,
      totalSchools: 2
    };
  }

  getMockTransportData() {
    return {
      stations: [
        { name: 'Central Station', distance: 1.5 },
        { name: 'Metro Station', distance: 2.0 }
      ],
      connectivityScore: 15,
      totalStations: 2
    };
  }

  getMockWeatherData() {
    return {
      temperature: 25,
      humidity: 60,
      description: 'Partly cloudy',
      windSpeed: 10,
      lastUpdated: new Date()
    };
  }

  calculateMonthlyTrends(listings) {
    // Group listings by month and calculate average prices
    const monthlyData = {};
    
    listings.forEach(listing => {
      const month = new Date(listing.createdAt).toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { prices: [], count: 0 };
      }
      monthlyData[month].prices.push(listing.regularPrice);
      monthlyData[month].count++;
    });

    // Calculate averages
    Object.keys(monthlyData).forEach(month => {
      const prices = monthlyData[month].prices;
      monthlyData[month].averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      monthlyData[month].minPrice = Math.min(...prices);
      monthlyData[month].maxPrice = Math.max(...prices);
    });

    return monthlyData;
  }

  calculatePriceGrowth(monthlyData) {
    const months = Object.keys(monthlyData).sort();
    if (months.length < 2) return 0;
    
    const firstMonth = monthlyData[months[0]].averagePrice;
    const lastMonth = monthlyData[months[months.length - 1]].averagePrice;
    
    return ((lastMonth - firstMonth) / firstMonth) * 100;
  }

  calculateDemandTrends(listings) {
    const monthlyCounts = {};
    
    listings.forEach(listing => {
      const month = new Date(listing.createdAt).toISOString().substring(0, 7);
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    return monthlyCounts;
  }

  calculateMarketSentiment(priceGrowth, demandTrends) {
    let sentiment = 'Neutral';
    
    if (priceGrowth > 5 && Object.values(demandTrends).some(count => count > 10)) {
      sentiment = 'Bullish';
    } else if (priceGrowth < -5 || Object.values(demandTrends).every(count => count < 5)) {
      sentiment = 'Bearish';
    }
    
    return sentiment;
  }

  // 8. Mapbox Route Planning
  async getRoutePlan(waypoints, profile = 'driving') {
    if (!this.apiKeys.mapbox) {
      return this.getMockRouteData();
    }

    try {
      const coordinates = waypoints.map(wp => `${wp.longitude},${wp.latitude}`).join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}`;
      
      const response = await axios.get(url, {
        params: {
          geometries: 'geojson',
          overview: 'full',
          steps: true,
          access_token: this.apiKeys.mapbox
        }
      });

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
          geometry: route.geometry,
          legs: route.legs,
          waypoints: response.data.waypoints,
          success: true
        };
      } else {
        throw new Error('No routes found');
      }
    } catch (error) {
      console.error('Error fetching route from Mapbox:', error);
      return this.getMockRouteData();
    }
  }

  // Mock route data fallback
  getMockRouteData() {
    return {
      distance: Math.random() * 20 + 5, // 5-25 km
      duration: Math.random() * 60 + 15, // 15-75 minutes
      geometry: null,
      legs: [],
      waypoints: [],
      success: false,
      message: 'Using mock data - Mapbox API not configured'
    };
  }
}

export default new RealTimeDataService();

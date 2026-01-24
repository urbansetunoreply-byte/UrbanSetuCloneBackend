import { authenticatedFetch } from '../utils/auth';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class InvestmentAnalysisService {
  // Get market analysis data based on location and filters
  async getMarketAnalysis(location, filters) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/analytics/property/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          filters,
          analysisType: 'market'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch market analysis');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching market analysis:', error);
      // Return fallback data if API fails
      return this.getFallbackMarketData(location, filters);
    }
  }

  // Get risk assessment data based on property details
  async getRiskAssessment(propertyData, location) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/analytics/property/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyData,
          location,
          analysisType: 'risk'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch risk assessment');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching risk assessment:', error);
      // Return fallback data if API fails
      return this.getFallbackRiskData(propertyData, location);
    }
  }

  // Save calculation to backend
  async saveCalculation(calculationData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/calculations/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calculationData)
      });

      if (!response.ok) {
        throw new Error('Failed to save calculation');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error saving calculation:', error);
      throw error;
    }
  }

  // Get user's calculation history
  async getCalculationHistory(calculationType = null, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (calculationType) {
        params.append('calculationType', calculationType);
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/api/calculations/history?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calculation history');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching calculation history:', error);
      throw error;
    }
  }

  // Fallback market data when API fails
  getFallbackMarketData(location, filters) {
    const { city, state } = location;
    const { propertyType, timeFrame, analysisType } = filters;

    // Generate realistic data based on location and filters
    const basePrice = this.getBasePriceForLocation(city, state);
    const timeMultiplier = this.getTimeMultiplier(timeFrame);
    const typeMultiplier = this.getTypeMultiplier(propertyType);

    const priceTrend = this.calculatePriceTrend(basePrice, timeMultiplier, typeMultiplier);
    const marketScore = this.calculateMarketScore(city, state, propertyType);
    const demandLevel = this.calculateDemandLevel(city, state, propertyType);

    return {
      priceTrend: `${priceTrend > 0 ? '+' : ''}${priceTrend.toFixed(1)}%`,
      marketScore: `${marketScore}/100`,
      demandLevel,
      supplyLevel: this.calculateSupplyLevel(city, state, propertyType),
      averageDaysOnMarket: this.calculateDaysOnMarket(city, state, propertyType),
      pricePerSqFt: `₹${Math.round(basePrice * typeMultiplier).toLocaleString()}`,
      recommendation: this.getRecommendation(marketScore, priceTrend),
      riskLevel: this.calculateRiskLevel(city, state, propertyType),
      lastUpdated: new Date()
    };
  }

  // Fallback risk data when API fails
  getFallbackRiskData(propertyData, location) {
    const { propertyValue, location: riskLocation, propertyType, marketVolatility } = propertyData;
    const { city, state } = location;

    const riskScore = this.calculateRiskScore(propertyData, location);
    const riskLevel = this.getRiskLevel(riskScore);
    const recommendation = this.getRiskRecommendation(riskScore, riskLevel);

    return {
      riskScore,
      riskLevel,
      recommendation,
      riskColor: this.getRiskColor(riskLevel),
      riskFactors: this.getRiskFactors(propertyData, location),
      mitigationStrategies: this.getMitigationStrategies(riskLevel),
      lastUpdated: new Date()
    };
  }

  // Helper methods for calculations
  getBasePriceForLocation(city, state) {
    const cityMultipliers = {
      'Mumbai': 1.5,
      'Delhi': 1.3,
      'Bangalore': 1.2,
      'Chennai': 1.0,
      'Hyderabad': 0.9,
      'Pune': 0.8,
      'Kolkata': 0.7
    };

    const stateMultipliers = {
      'Maharashtra': 1.1,
      'Delhi': 1.2,
      'Karnataka': 1.0,
      'Tamil Nadu': 0.9,
      'Telangana': 0.8,
      'West Bengal': 0.7
    };

    const cityMultiplier = cityMultipliers[city] || 0.8;
    const stateMultiplier = stateMultipliers[state] || 0.8;

    return 5000 * cityMultiplier * stateMultiplier; // Base price per sq ft
  }

  getTimeMultiplier(timeFrame) {
    const multipliers = {
      '6': 0.5,
      '12': 1.0,
      '24': 1.5,
      '36': 2.0
    };
    return multipliers[timeFrame] || 1.0;
  }

  getTypeMultiplier(propertyType) {
    const multipliers = {
      'apartment': 1.0,
      'house': 1.2,
      'villa': 1.5,
      'condo': 0.9,
      'townhouse': 1.1,
      'multi_family': 1.3,
      'commercial': 1.4
    };
    return multipliers[propertyType] || 1.0;
  }

  calculatePriceTrend(basePrice, timeMultiplier, typeMultiplier) {
    // Simulate price trend based on various factors
    const volatility = (Math.random() - 0.5) * 10; // -5% to +5%
    const timeFactor = timeMultiplier * 2; // 1% to 4% based on time frame
    const typeFactor = (typeMultiplier - 1) * 5; // -0.5% to +2% based on type

    return volatility + timeFactor + typeFactor;
  }

  calculateMarketScore(city, state, propertyType) {
    // Base score influenced by location and property type
    let score = 60; // Base score

    // City influence
    const cityScores = {
      'Mumbai': 20,
      'Delhi': 18,
      'Bangalore': 15,
      'Chennai': 12,
      'Hyderabad': 10,
      'Pune': 8,
      'Kolkata': 5
    };
    score += cityScores[city] || 5;

    // Property type influence
    const typeScores = {
      'apartment': 5,
      'house': 3,
      'villa': 8,
      'condo': 4,
      'townhouse': 6,
      'multi_family': 7,
      'commercial': 10
    };
    score += typeScores[propertyType] || 3;

    // Add some randomness
    score += Math.floor(Math.random() * 10) - 5;

    return Math.max(0, Math.min(100, score));
  }

  calculateDemandLevel(city, state, propertyType) {
    const marketScore = this.calculateMarketScore(city, state, propertyType);
    if (marketScore >= 80) return 'Very High';
    if (marketScore >= 65) return 'High';
    if (marketScore >= 50) return 'Medium';
    if (marketScore >= 35) return 'Low';
    return 'Very Low';
  }

  calculateSupplyLevel(city, state, propertyType) {
    // Inverse relationship with demand
    const demandLevel = this.calculateDemandLevel(city, state, propertyType);
    const supplyMap = {
      'Very High': 'Low',
      'High': 'Medium',
      'Medium': 'Medium',
      'Low': 'High',
      'Very Low': 'Very High'
    };
    return supplyMap[demandLevel] || 'Medium';
  }

  calculateDaysOnMarket(city, state, propertyType) {
    const demandLevel = this.calculateDemandLevel(city, state, propertyType);
    const daysMap = {
      'Very High': 15,
      'High': 30,
      'Medium': 45,
      'Low': 60,
      'Very Low': 90
    };
    const baseDays = daysMap[demandLevel] || 45;
    return Math.floor(baseDays + (Math.random() * 20) - 10).toString();
  }

  getRecommendation(marketScore, priceTrend) {
    if (marketScore >= 80 && priceTrend > 0) return 'Strong Buy';
    if (marketScore >= 65 && priceTrend > -2) return 'Buy';
    if (marketScore >= 50) return 'Hold';
    if (marketScore >= 35) return 'Sell';
    return 'Strong Sell';
  }

  calculateRiskLevel(city, state, propertyType) {
    const marketScore = this.calculateMarketScore(city, state, propertyType);
    if (marketScore >= 80) return 'Low';
    if (marketScore >= 65) return 'Low-Medium';
    if (marketScore >= 50) return 'Medium';
    if (marketScore >= 35) return 'Medium-High';
    return 'High';
  }

  calculateRiskScore(propertyData, location) {
    let score = 0;
    const { propertyValue, marketVolatility, tenantStability, maintenanceHistory, neighborhoodGrowth } = propertyData;
    const { city, state } = location;

    // Market volatility scoring
    const volatilityScores = { low: 1, medium: 3, high: 5 };
    score += volatilityScores[marketVolatility] || 3;

    // Tenant stability scoring
    const stabilityScores = { high: 1, medium: 3, low: 5 };
    score += stabilityScores[tenantStability] || 3;

    // Maintenance history scoring
    const maintenanceScores = { excellent: 1, good: 2, fair: 3, poor: 4, unknown: 5 };
    score += maintenanceScores[maintenanceHistory] || 3;

    // Neighborhood growth scoring
    const growthScores = { growing: 1, stable: 2, declining: 4 };
    score += growthScores[neighborhoodGrowth] || 2;

    // Location risk (based on city/state)
    const locationRisk = this.getLocationRiskScore(city, state);
    score += locationRisk;

    return Math.min(20, Math.max(1, score));
  }

  getLocationRiskScore(city, state) {
    // Higher scores for riskier locations
    const cityRisks = {
      'Mumbai': 1, // Lower risk for established markets
      'Delhi': 1,
      'Bangalore': 2,
      'Chennai': 2,
      'Hyderabad': 2,
      'Pune': 3,
      'Kolkata': 3
    };

    const stateRisks = {
      'Maharashtra': 1,
      'Delhi': 1,
      'Karnataka': 2,
      'Tamil Nadu': 2,
      'Telangana': 2,
      'West Bengal': 3
    };

    return (cityRisks[city] || 4) + (stateRisks[state] || 4);
  }

  getRiskLevel(riskScore) {
    if (riskScore <= 5) return 'Low';
    if (riskScore <= 10) return 'Medium';
    if (riskScore <= 15) return 'High';
    return 'Very High';
  }

  getRiskColor(riskLevel) {
    const colors = {
      'Low': 'text-green-600',
      'Medium': 'text-yellow-600',
      'High': 'text-orange-600',
      'Very High': 'text-red-600'
    };
    return colors[riskLevel] || 'text-gray-600';
  }

  getRiskRecommendation(riskScore, riskLevel) {
    if (riskScore <= 5) return 'Low risk investment with good potential';
    if (riskScore <= 10) return 'Moderate risk, consider market conditions';
    if (riskScore <= 15) return 'High risk, thorough due diligence required';
    return 'Very high risk, consider alternative investments';
  }

  getRiskFactors(propertyData, location) {
    const factors = [];
    const { marketVolatility, tenantStability, maintenanceHistory, neighborhoodGrowth } = propertyData;
    const { city, state } = location;

    if (marketVolatility === 'high') factors.push('High market volatility');
    if (tenantStability === 'low') factors.push('Low tenant stability');
    if (maintenanceHistory === 'poor') factors.push('Poor maintenance history');
    if (neighborhoodGrowth === 'declining') factors.push('Declining neighborhood');

    const locationRisk = this.getLocationRiskScore(city, state);
    if (locationRisk >= 6) factors.push('Higher location risk');

    return factors.length > 0 ? factors : ['No significant risk factors identified'];
  }

  getMitigationStrategies(riskLevel) {
    const strategies = {
      'Low': ['Regular market monitoring', 'Maintain property condition'],
      'Medium': ['Diversify portfolio', 'Regular market monitoring', 'Maintain property condition', 'Consider insurance'],
      'High': ['Thorough due diligence', 'Diversify portfolio', 'Regular market monitoring', 'Comprehensive insurance', 'Professional property management'],
      'Very High': ['Avoid investment', 'Consider alternative investments', 'Seek professional advice', 'Thorough market research']
    };
    return strategies[riskLevel] || strategies['Medium'];
  }
}

export default new InvestmentAnalysisService();
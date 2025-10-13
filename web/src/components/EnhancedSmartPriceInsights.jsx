import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { FaChartLine, FaArrowUp, FaCalculator, FaHome, FaBuilding, FaPercentage, FaClock, FaMapMarkerAlt, FaStar, FaInfoCircle, FaShieldAlt, FaGraduationCap, FaBus, FaCloud, FaArrowUp as FaTrendingUp, FaArrowDown as FaTrendingDown, FaExclamationTriangle, FaCheckCircle, FaTimes, FaSpinner } from 'react-icons/fa';

const EnhancedSmartPriceInsights = ({ listing, currentUser }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (listing && currentUser) {
      fetchAnalyticsData();
    }
  }, [listing, currentUser]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analytics/property/${listing._id}/analytics`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRecommendationColor = (recommendation) => {
    if (recommendation.includes('Excellent')) return 'text-green-600';
    if (recommendation.includes('Good')) return 'text-blue-600';
    if (recommendation.includes('Fair')) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white shadow-md rounded-lg mb-6">
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="animate-spin text-4xl text-purple-600 mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Loading Real-Time Analytics</h3>
            <p className="text-gray-600">Fetching latest market data and insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white shadow-md rounded-lg mb-6">
        <div className="flex items-center justify-center py-12">
          <FaTimes className="text-4xl text-red-500 mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Failed to Load Analytics</h3>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={fetchAnalyticsData}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const { marketData, locationData, weatherData, trendsData, investmentAnalysis } = analyticsData;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
          <FaChartLine className="text-white text-xl" />
        </div>
        <div>
          <h4 className="text-2xl font-bold text-gray-800">Real-Time Property Analytics</h4>
          <p className="text-gray-600">Live market data and AI-powered insights</p>
          <p className="text-sm text-gray-500">Last updated: {new Date(analyticsData.lastUpdated).toLocaleString()}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: FaChartLine },
          { id: 'investment', label: 'Investment', icon: FaCalculator },
          { id: 'location', label: 'Location', icon: FaMapMarkerAlt },
          { id: 'market', label: 'Market Trends', icon: FaTrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="text-sm" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FaStar className="text-blue-600" />
                <h6 className="font-semibold text-blue-800">Investment Score</h6>
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(investmentAnalysis?.investmentScore || 0)}`}>
                {investmentAnalysis?.investmentScore || 0}/100
              </p>
              <p className="text-sm text-gray-600">
                {investmentAnalysis?.recommendation || 'Loading...'}
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FaPercentage className="text-green-600" />
                <h6 className="font-semibold text-green-800">ROI Potential</h6>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {investmentAnalysis?.roi?.annual || 0}%
              </p>
              <p className="text-sm text-gray-600">Annual return</p>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FaTrendingUp className="text-orange-600" />
                <h6 className="font-semibold text-orange-800">Appreciation</h6>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {investmentAnalysis?.appreciation?.annual || 0}%
              </p>
              <p className="text-sm text-gray-600">Annual growth</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FaShieldAlt className="text-purple-600" />
                <h6 className="font-semibold text-purple-800">Risk Level</h6>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {investmentAnalysis?.riskScore || 0}/100
              </p>
              <p className="text-sm text-gray-600">Lower is better</p>
            </div>
          </div>

          {/* Market Comparison */}
          {marketData && (
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl">
              <h5 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2">
                <FaBuilding className="text-indigo-600" />
                Market Comparison
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Property Price</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {formatINR(listing.offer ? listing.discountPrice : listing.regularPrice)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Market Average</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {formatINR(marketData.averagePrice || 0)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Price vs Market</p>
                  <p className={`text-xl font-bold ${
                    (listing.offer ? listing.discountPrice : listing.regularPrice) < (marketData.averagePrice || 0)
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {marketData.averagePrice ? 
                      `${(((listing.offer ? listing.discountPrice : listing.regularPrice) - marketData.averagePrice) / marketData.averagePrice * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Investment Tab */}
      {activeTab === 'investment' && investmentAnalysis && (
        <div className="space-y-6">
          {/* Investment Timeline */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
            <h5 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <FaCalculator className="text-green-600" />
              Investment Timeline
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(investmentAnalysis.timeline || {}).map(([period, data]) => (
                <div key={period} className="bg-white p-4 rounded-lg">
                  <h6 className="font-semibold text-gray-800 capitalize mb-2">{period} Outlook</h6>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ROI:</span>
                      <span className="font-semibold text-green-600">{data.roi?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Appreciation:</span>
                      <span className="font-semibold text-blue-600">{data.appreciation?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-semibold text-gray-800">Total Return:</span>
                      <span className="font-semibold text-purple-600">{data.totalReturn?.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl">
            <h5 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
              <FaExclamationTriangle className="text-red-600" />
              Risk Analysis
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Risk Score</span>
                  <span className={`font-bold ${getScoreColor(100 - investmentAnalysis.riskScore)}`}>
                    {investmentAnalysis.riskScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getScoreBg(100 - investmentAnalysis.riskScore)}`}
                    style={{ width: `${100 - investmentAnalysis.riskScore}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Risk Level: 
                  <span className={`ml-2 font-semibold ${
                    investmentAnalysis.riskScore < 30 ? 'text-green-600' :
                    investmentAnalysis.riskScore < 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {investmentAnalysis.riskScore < 30 ? 'Low' :
                     investmentAnalysis.riskScore < 60 ? 'Medium' : 'High'}
                  </span>
                </p>
                <p className="text-sm text-gray-600">Recommendation: 
                  <span className={`ml-2 font-semibold ${getRecommendationColor(investmentAnalysis.recommendation)}`}>
                    {investmentAnalysis.recommendation}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Tab */}
      {activeTab === 'location' && locationData && (
        <div className="space-y-6">
          {/* Location Score */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
            <h5 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-blue-600" />
              Location Intelligence
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Location Score</span>
                  <span className={`font-bold ${getScoreColor(locationData.locationScore)}`}>
                    {locationData.locationScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getScoreBg(locationData.locationScore)}`}
                    style={{ width: `${locationData.locationScore}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Safety: 
                  <span className="ml-2 font-semibold text-green-600">
                    {locationData.crimeData?.safetyScore || 0}/100
                  </span>
                </p>
                <p className="text-sm text-gray-600">Schools: 
                  <span className="ml-2 font-semibold text-blue-600">
                    {locationData.schoolData?.totalSchools || 0} nearby
                  </span>
                </p>
                <p className="text-sm text-gray-600">Transport: 
                  <span className="ml-2 font-semibold text-purple-600">
                    {locationData.transportData?.totalStations || 0} stations
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {locationData.amenities && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
              <h5 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <FaHome className="text-green-600" />
                Nearby Amenities
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['restaurant','hospital','school','shopping_mall','park','gym','pharmacy','bank','gas_station','airport'].map((type) => {
                  const places = (locationData.amenities && locationData.amenities[type]) || [];
                  return (
                    <div key={type} className="bg-white p-3 rounded-lg">
                      <h6 className="font-semibold text-gray-800 capitalize mb-2">{type.replace('_', ' ')}</h6>
                      <p className="text-2xl font-bold text-green-600">{places.length}</p>
                      <p className="text-sm text-gray-600">within 2km</p>
                    </div>
                  );
                })}
                {/* Transit stations (from transportData) */}
                <div className="bg-white p-3 rounded-lg">
                  <h6 className="font-semibold text-gray-800 capitalize mb-2">transit stations</h6>
                  <p className="text-2xl font-bold text-green-600">{locationData.transportData?.totalStations || 0}</p>
                  <p className="text-sm text-gray-600">within 2km</p>
                </div>
              </div>
            </div>
          )}

          {/* Weather */}
          {weatherData && (
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl">
              <h5 className="text-lg font-semibold text-cyan-800 mb-4 flex items-center gap-2">
                <FaCloud className="text-cyan-600" />
                Current Weather
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-2xl font-bold text-cyan-600">{weatherData.temperature}°C</p>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Humidity</p>
                  <p className="text-2xl font-bold text-cyan-600">{weatherData.humidity}%</p>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Wind Speed</p>
                  <p className="text-2xl font-bold text-cyan-600">{weatherData.windSpeed} km/h</p>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Condition</p>
                  <p className="text-sm font-semibold text-cyan-600 capitalize">{weatherData.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Market Trends Tab */}
      {activeTab === 'market' && trendsData && (
        <div className="space-y-6">
          {/* Price Trends Chart */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
            <h5 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <FaTrendingUp className="text-purple-600" />
              Market Trends
            </h5>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={Object.entries(trendsData.monthlyData || {}).map(([month, data]) => ({
                  month,
                  averagePrice: data.averagePrice,
                  minPrice: data.minPrice,
                  maxPrice: data.maxPrice
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(value) => `₹${(value/100000).toFixed(0)}L`} />
                  <Tooltip 
                    formatter={(value, name) => [formatINR(value), name === 'averagePrice' ? 'Average Price' : name === 'minPrice' ? 'Min Price' : 'Max Price']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Line type="monotone" dataKey="averagePrice" stroke="#8b5cf6" strokeWidth={3} />
                  <Line type="monotone" dataKey="minPrice" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="maxPrice" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Sentiment */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
            <h5 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
              <FaTrendingUp className="text-orange-600" />
              Market Sentiment
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Price Growth</p>
                <p className={`text-2xl font-bold ${trendsData.priceGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trendsData.priceGrowth > 0 ? '+' : ''}{trendsData.priceGrowth?.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">6 months</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Market Sentiment</p>
                <p className={`text-2xl font-bold ${
                  trendsData.marketSentiment === 'Bullish' ? 'text-green-600' :
                  trendsData.marketSentiment === 'Bearish' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {trendsData.marketSentiment || 'Neutral'}
                </p>
                <p className="text-sm text-gray-600">Current trend</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Market Activity</p>
                <p className="text-2xl font-bold text-blue-600">
                  {marketData?.marketActivity || 0}
                </p>
                <p className="text-sm text-gray-600">Similar properties</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSmartPriceInsights;

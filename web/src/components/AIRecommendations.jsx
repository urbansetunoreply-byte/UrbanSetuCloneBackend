import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ListingItem from './ListingItem';
import { FaRobot, FaHeart, FaEye, FaSpinner, FaLightbulb, FaChartLine, FaUsers, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AIRecommendations = ({ 
  userId, 
  limit = 8, 
  showTitle = true, 
  showInsights = false,
  onRecommendationClick = null,
  className = "" 
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [activeTab, setActiveTab] = useState('personalized');

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
      if (showInsights) {
        fetchInsights();
      }
    }
  }, [userId, activeTab]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = activeTab === 'trending' ? 
        '/api/ai-recommendations/trending' : 
        '/api/ai-recommendations/recommendations';

      const response = await fetch(`${API_BASE_URL}${endpoint}?limit=${limit}&type=${activeTab}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.data || []);
      } else {
        throw new Error('Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
      toast.error('Failed to load AI recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-recommendations/insights`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.data);
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
    }
  };

  const handleRecommendationClick = (property) => {
    if (onRecommendationClick) {
      onRecommendationClick(property);
    }
  };

  const getRecommendationTypeIcon = (type) => {
    switch (type) {
      case 'hybrid':
        return <FaRobot className="text-blue-500" />;
      case 'content-based':
        return <FaLightbulb className="text-green-500" />;
      case 'collaborative':
        return <FaUsers className="text-purple-500" />;
      case 'popularity':
        return <FaChartLine className="text-orange-500" />;
      default:
        return <FaStar className="text-yellow-500" />;
    }
  };

  const getRecommendationTypeText = (type) => {
    switch (type) {
      case 'hybrid':
        return 'AI Personalized';
      case 'content-based':
        return 'Based on Your Preferences';
      case 'collaborative':
        return 'Similar Users Like';
      case 'popularity':
        return 'Trending Now';
      default:
        return 'Recommended';
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className={`ai-recommendations ${className}`}>
      {showTitle && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <FaRobot className="text-2xl text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">AI Property Recommendations</h2>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('personalized')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'personalized'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Personalized
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'trending'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Trending
              </button>
            </div>
          </div>
          
          {showInsights && insights && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaChartLine className="text-blue-600" />
                AI Insights
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{insights.totalRecommendations}</div>
                  <div className="text-sm text-gray-600">Total Recommendations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {insights.averageScore ? insights.averageScore.toFixed(2) : '0.00'}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Match Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{insights.trendingCount}</div>
                  <div className="text-sm text-gray-600">Trending Properties</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    ₹{insights.priceRange.min ? insights.priceRange.min.toLocaleString('en-IN') : '0'} - 
                    ₹{insights.priceRange.max ? insights.priceRange.max.toLocaleString('en-IN') : '0'}
                  </div>
                  <div className="text-sm text-gray-600">Price Range</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FaSpinner className="animate-spin text-3xl text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">AI is analyzing your preferences...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-2">Failed to load recommendations</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12">
          <FaRobot className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No recommendations available at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations.map((property) => (
            <div
              key={property._id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group cursor-pointer"
              onClick={() => handleRecommendationClick(property)}
            >
              {/* Property Image */}
              <div className="relative h-48 overflow-hidden">
                {property.imageUrls && property.imageUrls.length > 0 ? (
                  <img
                    src={property.imageUrls[0]}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-4xl text-gray-500">🏠</span>
                  </div>
                )}
                
                {/* AI Recommendation Badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2 text-xs font-medium">
                  {getRecommendationTypeIcon(property.recommendationType)}
                  <span className="text-gray-700">
                    {getRecommendationTypeText(property.recommendationType)}
                  </span>
                </div>
                
                {/* Recommendation Score */}
                {property.recommendationScore && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                    {Math.round(property.recommendationScore * 100)}% match
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {property.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                  {property.city}, {property.state}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
                  <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
                  {property.area && <span>{property.area} sq ft</span>}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-green-600">
                    ₹{property.regularPrice?.toLocaleString('en-IN')}
                    {property.offer && property.discountPrice && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ₹{property.discountPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/user/listing/${property._id}`}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaEye className="text-lg" />
                    </Link>
                  </div>
                </div>
                
                {/* AI Insights */}
                {property.recommendationType && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>AI Match Score</span>
                      <span className="font-medium">
                        {property.recommendationScore ? Math.round(property.recommendationScore * 100) : 0}%
                      </span>
                    </div>
                    {property.contentScore && property.collaborativeScore && (
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                        <span>Content: {Math.round(property.contentScore * 100)}%</span>
                        <span>Social: {Math.round(property.collaborativeScore * 100)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;

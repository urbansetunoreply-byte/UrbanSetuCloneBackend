import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ListingItem from './ListingItem';
import { FaRobot, FaBrain, FaChartLine, FaCogs, FaLightbulb, FaSpinner, FaTimesCircle, FaInfoCircle, FaEye, FaThumbsUp, FaArrowUp, FaShieldAlt, FaRocket } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdvancedAIRecommendations = ({ 
  userId, 
  limit = 8, 
  showTitle = true, 
  showInsights = true,
  showModelInfo = true,
  onRecommendationClick = null,
  className = "" 
}) => {
  const { currentUser } = useSelector((state) => state.user);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [modelPerformance, setModelPerformance] = useState(null);
  const [activeTab, setActiveTab] = useState('ensemble');
  const [showModelDetails, setShowModelDetails] = useState(false);

  const models = [
    { id: 'ensemble', name: 'Ensemble AI', icon: FaBrain, description: 'Combines all models for best accuracy' },
    { id: 'matrix-factorization', name: 'Collaborative', icon: FaChartLine, description: 'Users with similar preferences' },
    { id: 'random-forest', name: 'Content-Based', icon: FaCogs, description: 'Property features matching' },
    { id: 'neural-network', name: 'Deep Learning', icon: FaRobot, description: 'Complex pattern recognition' }
  ];

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentUser || !userId) {
        setLoading(false);
        setError('User not logged in.');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch recommendations for the active model
        const res = await fetch(`${API_BASE_URL}/api/advanced-ai/recommendations?limit=${limit}&model=${activeTab}`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (data.success) {
          setRecommendations(data.data);
        } else {
          setError(data.message || 'Failed to fetch recommendations.');
          toast.error(data.message || 'Failed to fetch AI recommendations.');
        }
      } catch (err) {
        console.error('Error fetching AI recommendations:', err);
        setError('Network error or server issue.');
        toast.error('Network error while fetching AI recommendations.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, limit, currentUser, activeTab]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!currentUser || !userId) return;

      try {
        const [insightsRes, performanceRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/advanced-ai/insights`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/api/advanced-ai/model-performance`, { credentials: 'include' })
        ]);

        if (insightsRes.ok) {
          const insightsData = await insightsRes.json();
          if (insightsData.success) {
            setInsights(insightsData.data);
          }
        }

        if (performanceRes.ok) {
          const performanceData = await performanceRes.json();
          if (performanceData.success) {
            setModelPerformance(performanceData.data);
          }
        }
      } catch (err) {
        console.error('Error fetching insights:', err);
      }
    };

    fetchInsights();
  }, [userId, currentUser]);

  const getModelIcon = (modelId) => {
    const model = models.find(m => m.id === modelId);
    return model ? model.icon : FaRobot;
  };

  const getModelName = (modelId) => {
    const model = models.find(m => m.id === modelId);
    return model ? model.name : 'Unknown Model';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-100 p-8 rounded-lg shadow-md border border-blue-200 text-center">
        <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
        <p className="text-blue-700 font-semibold text-lg">Advanced AI is analyzing your preferences...</p>
        <p className="text-blue-500 text-sm mt-2">Running multiple machine learning models for personalized recommendations</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-lg shadow-md border border-red-200 text-center">
        <FaTimesCircle className="text-red-600 text-4xl mx-auto mb-4" />
        <p className="text-red-700 font-semibold text-lg">Error: {error}</p>
        <p className="text-red-500 text-sm mt-2">Please try again later or ensure you are logged in.</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg shadow-md border border-gray-200 text-center">
        <FaRobot className="text-gray-500 text-4xl mx-auto mb-4" />
        <p className="text-gray-700 font-semibold text-lg">No AI recommendations available at the moment.</p>
        <p className="text-gray-500 text-sm mt-2">Try interacting more with properties to help our AI learn your preferences!</p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-100 p-6 rounded-lg shadow-md border border-blue-200 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-blue-800 flex items-center gap-3">
            <FaBrain className="text-blue-600" /> 
            Advanced AI Recommendations
          </h3>
          {showModelInfo && (
            <button
              onClick={() => setShowModelDetails(!showModelDetails)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Model Information"
            >
              <FaInfoCircle className="text-xl" />
            </button>
          )}
        </div>
      )}

      {/* Model Selection Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {models.map((model) => {
            const IconComponent = model.icon;
            return (
              <button
                key={model.id}
                onClick={() => setActiveTab(model.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === model.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
                }`}
              >
                <IconComponent className="text-sm" />
                <span className="text-sm font-medium">{model.name}</span>
              </button>
            );
          })}
        </div>
        
        {showModelDetails && (
          <div className="bg-white p-4 rounded-lg border border-blue-200 mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Model Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map((model) => {
                const IconComponent = model.icon;
                return (
                  <div key={model.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <IconComponent className="text-blue-600 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-800">{model.name}</h5>
                      <p className="text-sm text-gray-600">{model.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {showInsights && insights && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaLightbulb className="text-yellow-500" />
            AI Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{insights.totalRecommendations}</div>
              <div className="text-sm text-gray-600">Total Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(insights.averageScore * 100)}%
              </div>
              <div className="text-sm text-gray-600">Average Match Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(insights.averageConfidence * 100)}%
              </div>
              <div className="text-sm text-gray-600">AI Confidence</div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recommendations.map((listing) => (
          <div key={listing.property._id} className="relative">
            <div 
              onClick={() => onRecommendationClick && onRecommendationClick(listing.property)} 
              className="cursor-pointer"
            >
              <ListingItem listing={listing.property} />
            </div>
            
            {/* AI Recommendation Badge */}
            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <FaRobot className="text-xs" />
              AI
            </div>
            
            {/* Match Score */}
            <div className="absolute top-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-semibold">
              <span className={getScoreColor(listing.recommendationScore || listing.score)}>
                {Math.round((listing.recommendationScore || listing.score) * 100)}% match
              </span>
            </div>
            
            {/* Model Type Badge */}
            <div className="absolute bottom-2 right-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs">
              {getModelName(listing.type)}
            </div>
            
            {/* Confidence Level */}
            <div className="absolute bottom-2 left-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(listing.confidenceLevel || listing.confidence)}`}>
                {Math.round((listing.confidenceLevel || listing.confidence) * 100)}% confidence
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Model Explanations */}
      {showInsights && recommendations.length > 0 && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaEye className="text-blue-500" />
            Model Explanations
          </h4>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-800">{rec.property.name}</h5>
                  <p className="text-sm text-gray-600 mb-2">
                    {rec.modelExplanation || 'AI-powered recommendation based on your preferences'}
                  </p>
                  {rec.aiInsights && rec.aiInsights.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rec.aiInsights.map((insight, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {insight}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {modelPerformance && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaArrowUp className="text-green-500" />
            Performance Metrics
          </h4>
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>Best Model:</strong> {modelPerformance.recommendation.bestModel}
            </p>
            <p className="mb-2">
              <strong>Accuracy:</strong> {modelPerformance.recommendation.accuracy}
            </p>
            <p>
              <strong>Reason:</strong> {modelPerformance.recommendation.reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAIRecommendations;

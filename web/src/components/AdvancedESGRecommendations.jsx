import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ListingItem from './ListingItem';
import { FaLeaf, FaUsers, FaShieldAlt, FaChartLine, FaCogs, FaLightbulb, FaSpinner, FaTimesCircle, FaInfoCircle, FaEye, FaThumbsUp, FaArrowUp, FaRecycle, FaGlobe, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdvancedESGRecommendations = ({ 
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
  const [esgPreferences, setEsgPreferences] = useState(null);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [showModelDetails, setShowModelDetails] = useState(false);

  const tabs = [
    { id: 'recommendations', name: 'ESG Recommendations', icon: FaLeaf },
    { id: 'preferences', name: 'My ESG Profile', icon: FaUsers },
    { id: 'analytics', name: 'ESG Analytics', icon: FaChartLine }
  ];

  useEffect(() => {
    if (currentUser && userId) {
      fetchRecommendations();
      fetchESGPreferences();
    }
  }, [currentUser, userId]);

  const fetchRecommendations = async () => {
    if (!currentUser || !userId) {
      setLoading(false);
      setError('User not logged in.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/api/esg-ai/recommendations?limit=${limit}&includeExplanation=true&t=${timestamp}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Filter out recommendations with missing property data
        const validRecommendations = (data.data || []).filter(rec => rec.property && rec.property._id);
        
        if (validRecommendations.length === 0) {
          setError('No ESG recommendations available. Try interacting with properties to build your sustainability profile.');
        } else {
          setRecommendations(validRecommendations);
        }
      } else {
        setError(data.message || 'Failed to fetch ESG recommendations');
      }
    } catch (err) {
      console.error('Error fetching ESG recommendations:', err);
      setError('Failed to load ESG recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchESGPreferences = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/esg-ai/preferences`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEsgPreferences(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching ESG preferences:', error);
    }
  };

  const fetchESGAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/esg-ai/analytics?timeframe=30d`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInsights(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching ESG analytics:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getRatingColor = (rating) => {
    if (['AAA', 'AA', 'A'].includes(rating)) return 'text-green-600';
    if (['BBB', 'BB', 'B'].includes(rating)) return 'text-yellow-600';
    if (['CCC', 'CC', 'C'].includes(rating)) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingIcon = (rating) => {
    if (['AAA', 'AA', 'A'].includes(rating)) return '⭐';
    if (['BBB', 'BB', 'B'].includes(rating)) return '🔸';
    if (['CCC', 'CC', 'C'].includes(rating)) return '🔶';
    return '❌';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-blue-500 text-2xl mr-3" />
          <span className="text-gray-600">Loading ESG recommendations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <FaTimesCircle className="text-red-500 text-3xl mx-auto mb-3" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      {showTitle && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaLeaf className="text-green-500" />
              <FaUsers className="text-blue-500" />
              <FaShieldAlt className="text-purple-500" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">ESG-Aware AI Recommendations</h3>
                <p className="text-sm text-gray-600">Sustainable properties matching your preferences</p>
              </div>
            </div>
            {showModelInfo && (
              <button
                onClick={() => setShowModelDetails(!showModelDetails)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <FaInfoCircle />
                {showModelDetails ? 'Hide' : 'Show'} Details
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'analytics') {
                    fetchESGAnalytics();
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'recommendations' && (
          <div>
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <FaLeaf className="text-gray-400 text-4xl mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No ESG Recommendations Available</h4>
                <p className="text-gray-600 mb-4">
                  Build your sustainability profile by interacting with properties, adding to wishlist, and writing reviews.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 text-left">
                  <h5 className="font-medium text-blue-900 mb-2">How to get ESG recommendations:</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Add properties to your wishlist</li>
                    <li>• Write reviews about properties</li>
                    <li>• Book property viewings</li>
                    <li>• Rate properties with ESG factors</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                {/* Recommendation Type Indicator */}
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaGlobe className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      🌱 Showing sustainable properties based on your ESG preferences
                    </span>
                  </div>
                </div>

                {/* Recommendations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recommendations.map((listing, index) => (
                    <div key={listing.property?._id || index} className="relative">
                      {listing.property?._id ? (
                        <>
                          <ListingItem listing={listing.property} />
                          
                          {/* ESG Badge */}
                          <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <FaLeaf />
                            ESG {listing.sustainabilityScore}
                          </div>

                          {/* ESG Match Badge */}
                          {listing.esgMatch && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                              <FaStar />
                              Match
                            </div>
                          )}

                          {/* ESG Breakdown */}
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-medium text-green-600">Environmental</div>
                                <div className={`px-1 py-0.5 rounded text-xs ${getScoreColor(listing.breakdown?.environmental || 0)}`}>
                                  {listing.breakdown?.environmental || 0}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-blue-600">Social</div>
                                <div className={`px-1 py-0.5 rounded text-xs ${getScoreColor(listing.breakdown?.social || 0)}`}>
                                  {listing.breakdown?.social || 0}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-purple-600">Governance</div>
                                <div className={`px-1 py-0.5 rounded text-xs ${getScoreColor(listing.breakdown?.governance || 0)}`}>
                                  {listing.breakdown?.governance || 0}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ESG Explanation */}
                          {listing.explanation && listing.explanation.length > 0 && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <div className="text-xs text-blue-800">
                                <strong>Why recommended:</strong>
                                <ul className="mt-1 space-y-1">
                                  {listing.explanation.map((explanation, idx) => (
                                    <li key={idx}>• {explanation}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-600">Property data unavailable</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferences' && (
          <div>
            {esgPreferences ? (
              <div className="space-y-6">
                {/* Overall ESG Profile */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">Your ESG Profile</h4>
                      <p className="text-sm text-gray-600">Based on your property interactions</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getRatingColor(esgPreferences.overall?.esgRating || 'Not Rated')}`}>
                        {getRatingIcon(esgPreferences.overall?.esgRating || 'Not Rated')} {esgPreferences.overall?.esgRating || 'Not Rated'}
                      </div>
                      <div className={`text-sm font-medium ${getScoreColor(esgPreferences.overall?.esgScore || 0)}`}>
                        Score: {esgPreferences.overall?.esgScore || 0}/100
                      </div>
                    </div>
                  </div>
                </div>

                {/* ESG Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Environmental */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FaLeaf className="text-green-600" />
                      <h5 className="font-semibold text-green-800">Environmental</h5>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Energy Efficiency</span>
                        <span className="text-sm font-medium">{esgPreferences.environmental?.energyEfficiency || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Renewable Energy</span>
                        <span className="text-sm font-medium">{esgPreferences.environmental?.renewableEnergy || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Green Certification</span>
                        <span className="text-sm font-medium">{esgPreferences.environmental?.greenCertification || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Social */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FaUsers className="text-blue-600" />
                      <h5 className="font-semibold text-blue-800">Social</h5>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Accessibility</span>
                        <span className="text-sm font-medium">{esgPreferences.social?.accessibility || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Community Impact</span>
                        <span className="text-sm font-medium">{esgPreferences.social?.communityImpact || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Affordable Housing</span>
                        <span className="text-sm font-medium">{esgPreferences.social?.affordableHousing || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Governance */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FaShieldAlt className="text-purple-600" />
                      <h5 className="font-semibold text-purple-800">Governance</h5>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Transparency</span>
                        <span className="text-sm font-medium">{esgPreferences.governance?.transparency || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Compliance</span>
                        <span className="text-sm font-medium">{esgPreferences.governance?.compliance || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Ethical Standards</span>
                        <span className="text-sm font-medium">{esgPreferences.governance?.ethicalStandards || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaUsers className="text-gray-400 text-4xl mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No ESG Profile Yet</h4>
                <p className="text-gray-600">
                  Interact with properties to build your ESG preferences profile.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            {insights ? (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Properties</p>
                        <p className="text-2xl font-bold text-gray-900">{insights.totalProperties}</p>
                      </div>
                      <FaGlobe className="text-blue-500 text-2xl" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">ESG Rated</p>
                        <p className="text-2xl font-bold text-gray-900">{insights.esgRatedProperties}</p>
                      </div>
                      <FaStar className="text-yellow-500 text-2xl" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Score</p>
                        <p className="text-2xl font-bold text-gray-900">{insights.averageEsgScore}</p>
                      </div>
                      <FaChartLine className="text-green-500 text-2xl" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Coverage</p>
                        <p className="text-2xl font-bold text-gray-900">{insights.coverage?.toFixed(1)}%</p>
                      </div>
                      <FaArrowUp className="text-purple-500 text-2xl" />
                    </div>
                  </div>
                </div>

                {/* ESG Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Environmental Metrics */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h5 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <FaLeaf />
                      Environmental
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Energy Efficiency</span>
                        <span className="text-sm font-medium">{insights.environmentalMetrics?.energyEfficiency || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Renewable Energy</span>
                        <span className="text-sm font-medium">{insights.environmentalMetrics?.renewableEnergy || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Green Certifications</span>
                        <span className="text-sm font-medium">{insights.environmentalMetrics?.greenCertifications || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Social Metrics */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <FaUsers />
                      Social
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Accessibility</span>
                        <span className="text-sm font-medium">{insights.socialMetrics?.accessibility || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Community Impact</span>
                        <span className="text-sm font-medium">{insights.socialMetrics?.communityImpact || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Affordable Housing</span>
                        <span className="text-sm font-medium">{insights.socialMetrics?.affordableHousing || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Governance Metrics */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h5 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <FaShieldAlt />
                      Governance
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Transparency</span>
                        <span className="text-sm font-medium">{insights.governanceMetrics?.transparency || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Compliance</span>
                        <span className="text-sm font-medium">{insights.governanceMetrics?.compliance || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Risk Management</span>
                        <span className="text-sm font-medium">{insights.governanceMetrics?.riskManagement || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaChartLine className="text-gray-400 text-4xl mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Loading ESG Analytics</h4>
                <p className="text-gray-600">Please wait while we fetch the latest ESG data...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Details */}
      {showModelDetails && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <h4 className="font-semibold text-gray-800 mb-3">ESG AI Model Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Environmental Factors</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Energy efficiency rating (A+ to G)</li>
                <li>• Carbon footprint tracking</li>
                <li>• Renewable energy usage</li>
                <li>• Green building certifications</li>
                <li>• Water efficiency metrics</li>
                <li>• Waste management practices</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Social Factors</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Accessibility compliance</li>
                <li>• Community impact scoring</li>
                <li>• Affordable housing designation</li>
                <li>• Local employment creation</li>
                <li>• Social amenities availability</li>
                <li>• Diversity & inclusion metrics</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Governance Factors</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Business transparency</li>
                <li>• Ethical standards compliance</li>
                <li>• Regulatory compliance</li>
                <li>• Risk management practices</li>
                <li>• Stakeholder engagement</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">AI Methodology</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Random Forest-inspired scoring</li>
                <li>• Weighted ESG factor analysis</li>
                <li>• User preference learning</li>
                <li>• Sustainability matching</li>
                <li>• Real-time score calculation</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedESGRecommendations;

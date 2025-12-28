import React, { useState } from 'react';
import { FaLeaf, FaUsers, FaShieldAlt, FaStar, FaChartLine, FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ESGDisplay = ({
    esg,
    className = "",
    isAuthenticated = true,
    onAuthRequired,
}) => {
    const [expandedSection, setExpandedSection] = useState(null);

    if (!esg) {
        return (
            <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 transition-colors ${className}`}>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FaInfoCircle />
                    <span className="text-sm">ESG information not available</span>
                </div>
            </div>
        );
    }

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
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

    const toggleSection = (section) => {
        if (!isAuthenticated) {
            if (typeof onAuthRequired === 'function') {
                onAuthRequired(section);
            }
            return;
        }
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors ${className}`}>
            {/* ESG Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <FaLeaf className="text-green-500" />
                            <FaUsers className="text-blue-500" />
                            <FaShieldAlt className="text-purple-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 transition-colors">ESG Rating</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Environmental, Social & Governance</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${getRatingColor(esg.esgRating)}`}>
                            {getRatingIcon(esg.esgRating)} {esg.esgRating}
                        </div>
                        <div className={`text-sm font-medium ${getScoreColor(esg.esgScore)}`}>
                            Score: {esg.esgScore}/100
                        </div>
                    </div>
                </div>
            </div>

            {/* ESG Sections */}
            <div className="p-4 space-y-4">
                {/* Environmental Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                    <button
                        onClick={() => toggleSection('environmental')}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
                    >
                        <div className="flex items-center gap-3">
                            <FaLeaf className="text-green-500" />
                            <span className="font-medium">Environmental</span>
                        </div>
                        {expandedSection === 'environmental' ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                    </button>
                    {expandedSection === 'environmental' && (
                        <div className="px-3 pb-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Energy Rating</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.environmental.energyRating}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Carbon Footprint</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.environmental.carbonFootprint} kg CO₂/year</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Water Efficiency</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.environmental.waterEfficiency}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Waste Management</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.environmental.wasteManagement}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Green Certification</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.environmental.greenCertification}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Renewable Energy</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.environmental.renewableEnergy ? 'Yes' : 'No'}</div>
                                </div>
                            </div>
                            <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <span className={esg.environmental.solarPanels ? 'text-green-600' : 'text-gray-400'}>
                                        ☀️ Solar Panels
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className={esg.environmental.rainwaterHarvesting ? 'text-blue-600' : 'text-gray-400'}>
                                        💧 Rainwater Harvesting
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Social Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                    <button
                        onClick={() => toggleSection('social')}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
                    >
                        <div className="flex items-center gap-3">
                            <FaUsers className="text-blue-500" />
                            <span className="font-medium">Social</span>
                        </div>
                        {expandedSection === 'social' ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                    </button>
                    {expandedSection === 'social' && (
                        <div className="px-3 pb-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Accessibility</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.social.accessibility}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Community Impact</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.social.communityImpact}/100</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Affordable Housing</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.social.affordableHousing ? 'Yes' : 'No'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Local Employment</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.social.localEmployment} jobs</div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">Diversity & Inclusion</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{esg.social.diversityInclusion}</div>
                            </div>
                            {esg.social.socialAmenities.length > 0 && (
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Social Amenities</label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {esg.social.socialAmenities.map((amenity, index) => (
                                            <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded transition-colors">
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Governance Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                    <button
                        onClick={() => toggleSection('governance')}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
                    >
                        <div className="flex items-center gap-3">
                            <FaShieldAlt className="text-purple-500" />
                            <span className="font-medium">Governance</span>
                        </div>
                        {expandedSection === 'governance' ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                    </button>
                    {expandedSection === 'governance' && (
                        <div className="px-3 pb-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Transparency</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.governance.transparency}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Ethical Standards</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.governance.ethicalStandards}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Compliance</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.governance.compliance}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Risk Management</label>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{esg.governance.riskManagement}</div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">Stakeholder Engagement</label>
                                <div className="font-medium text-gray-800 dark:text-gray-200">{esg.governance.stakeholderEngagement}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ESG Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 transition-colors">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 transition-colors">
                    <span>Last updated: {new Date(esg.lastEsgUpdate).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1">
                        <FaChartLine className="text-xs" />
                        <span>ESG Analytics</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ESGDisplay;

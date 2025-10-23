import React, { useState, useEffect } from 'react';
import { FaLeaf, FaUsers, FaShieldAlt, FaSave, FaCalculator, FaInfoCircle } from 'react-icons/fa';

const ESGManagement = ({ esgData, onESGChange, isEditing = false }) => {
    const [esg, setEsg] = useState({
        environmental: {
            energyRating: 'Not Rated',
            carbonFootprint: 0,
            renewableEnergy: false,
            waterEfficiency: 'Not Rated',
            wasteManagement: 'Not Rated',
            greenCertification: 'None',
            solarPanels: false,
            rainwaterHarvesting: false
        },
        social: {
            accessibility: 'Not Rated',
            communityImpact: 0,
            affordableHousing: false,
            localEmployment: 0,
            socialAmenities: [],
            diversityInclusion: 'Not Rated'
        },
        governance: {
            transparency: 'Not Rated',
            ethicalStandards: 'Not Rated',
            compliance: 'Not Rated',
            riskManagement: 'Not Rated',
            stakeholderEngagement: 'Not Rated'
        }
    });

    const [calculatedScore, setCalculatedScore] = useState(0);
    const [calculatedRating, setCalculatedRating] = useState('Not Rated');
    const [showCalculator, setShowCalculator] = useState(false);

    useEffect(() => {
        if (esgData) {
            setEsg(esgData);
            calculateESGScore(esgData);
        }
    }, [esgData]);

    const handleChange = (category, field, value) => {
        const newEsg = {
            ...esg,
            [category]: {
                ...esg[category],
                [field]: value
            }
        };
        setEsg(newEsg);
        calculateESGScore(newEsg);
        onESGChange(newEsg);
    };

    const handleArrayChange = (category, field, value, isAdd) => {
        const currentArray = esg[category][field] || [];
        const newArray = isAdd 
            ? [...currentArray, value]
            : currentArray.filter(item => item !== value);
        
        handleChange(category, field, newArray);
    };

    const calculateESGScore = (esgData) => {
        let score = 0;
        let factors = 0;

        // Environmental factors (40% weight)
        if (esgData.environmental?.energyRating && esgData.environmental.energyRating !== 'Not Rated') {
            const energyScore = getEnergyRatingScore(esgData.environmental.energyRating);
            score += energyScore * 0.4;
            factors += 0.4;
        }

        if (esgData.environmental?.renewableEnergy) {
            score += 20 * 0.4;
            factors += 0.4;
        }

        if (esgData.environmental?.greenCertification && esgData.environmental.greenCertification !== 'None') {
            score += 15 * 0.4;
            factors += 0.4;
        }

        // Social factors (30% weight)
        if (esgData.social?.communityImpact > 0) {
            score += Math.min(esgData.social.communityImpact, 20) * 0.3;
            factors += 0.3;
        }

        if (esgData.social?.affordableHousing) {
            score += 15 * 0.3;
            factors += 0.3;
        }

        if (esgData.social?.accessibility && esgData.social.accessibility !== 'Not Rated') {
            const accessibilityScore = getAccessibilityScore(esgData.social.accessibility);
            score += accessibilityScore * 0.3;
            factors += 0.3;
        }

        // Governance factors (30% weight)
        if (esgData.governance?.transparency && esgData.governance.transparency !== 'Not Rated') {
            const transparencyScore = getRatingScore(esgData.governance.transparency);
            score += transparencyScore * 0.3;
            factors += 0.3;
        }

        if (esgData.governance?.compliance && esgData.governance.compliance !== 'Not Rated') {
            const complianceScore = getComplianceScore(esgData.governance.compliance);
            score += complianceScore * 0.3;
            factors += 0.3;
        }

        const finalScore = factors > 0 ? Math.min(Math.round(score / factors * 5), 100) : 0;
        setCalculatedScore(finalScore);
        setCalculatedRating(getESGRating(finalScore));
    };

    const getEnergyRatingScore = (rating) => {
        const scores = {
            'A+': 20, 'A': 18, 'B': 15, 'C': 10, 'D': 5, 'E': 2, 'F': 1, 'G': 0
        };
        return scores[rating] || 0;
    };

    const getAccessibilityScore = (accessibility) => {
        const scores = {
            'Fully Accessible': 20, 'Partially Accessible': 10, 'Not Accessible': 0
        };
        return scores[accessibility] || 0;
    };

    const getRatingScore = (rating) => {
        const scores = {
            'Excellent': 20, 'Good': 15, 'Average': 10, 'Poor': 5
        };
        return scores[rating] || 0;
    };

    const getComplianceScore = (compliance) => {
        const scores = {
            'Fully Compliant': 20, 'Mostly Compliant': 15, 'Partially Compliant': 10, 'Non-Compliant': 0
        };
        return scores[compliance] || 0;
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

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        if (score >= 40) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
    };

    const socialAmenitiesOptions = [
        'Community Center', 'Playground', 'Gym', 'Swimming Pool', 'Garden',
        'Library', 'Medical Center', 'School', 'Shopping Center', 'Park'
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <FaLeaf className="text-green-500" />
                    <FaUsers className="text-blue-500" />
                    <FaShieldAlt className="text-purple-500" />
                    <h3 className="text-xl font-semibold text-gray-800">ESG Management</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowCalculator(!showCalculator)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                        <FaCalculator />
                        {showCalculator ? 'Hide' : 'Show'} Calculator
                    </button>
                </div>
            </div>

            {/* ESG Score Calculator */}
            {showCalculator && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-gray-800">Calculated ESG Score</h4>
                            <p className="text-sm text-gray-600">Based on current inputs</p>
                        </div>
                        <div className="text-right">
                            <div className={`text-2xl font-bold px-3 py-2 rounded-lg ${getScoreColor(calculatedScore)}`}>
                                {calculatedScore}/100
                            </div>
                            <div className="text-sm font-medium text-gray-600 mt-1">
                                Rating: {calculatedRating}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Environmental Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <FaLeaf className="text-green-500" />
                        <h4 className="font-semibold text-gray-800">Environmental</h4>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Energy Rating
                        </label>
                        <select
                            value={esg.environmental.energyRating}
                            onChange={(e) => handleChange('environmental', 'energyRating', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="Not Rated">Not Rated</option>
                            <option value="A+">A+</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                            <option value="F">F</option>
                            <option value="G">G</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Carbon Footprint (kg CO₂/year)
                        </label>
                        <input
                            type="number"
                            value={esg.environmental.carbonFootprint}
                            onChange={(e) => handleChange('environmental', 'carbonFootprint', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Water Efficiency
                        </label>
                        <select
                            value={esg.environmental.waterEfficiency}
                            onChange={(e) => handleChange('environmental', 'waterEfficiency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="Not Rated">Not Rated</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Green Certification
                        </label>
                        <select
                            value={esg.environmental.greenCertification}
                            onChange={(e) => handleChange('environmental', 'greenCertification', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="None">None</option>
                            <option value="LEED">LEED</option>
                            <option value="BREEAM">BREEAM</option>
                            <option value="GRIHA">GRIHA</option>
                            <option value="IGBC">IGBC</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={esg.environmental.renewableEnergy}
                                onChange={(e) => handleChange('environmental', 'renewableEnergy', e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm">☀️ Renewable Energy</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={esg.environmental.solarPanels}
                                onChange={(e) => handleChange('environmental', 'solarPanels', e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm">🔋 Solar Panels</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={esg.environmental.rainwaterHarvesting}
                                onChange={(e) => handleChange('environmental', 'rainwaterHarvesting', e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm">💧 Rainwater Harvesting</span>
                        </label>
                    </div>
                </div>

                {/* Social Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <FaUsers className="text-blue-500" />
                        <h4 className="font-semibold text-gray-800">Social</h4>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Accessibility
                        </label>
                        <select
                            value={esg.social.accessibility}
                            onChange={(e) => handleChange('social', 'accessibility', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Not Rated">Not Rated</option>
                            <option value="Fully Accessible">Fully Accessible</option>
                            <option value="Partially Accessible">Partially Accessible</option>
                            <option value="Not Accessible">Not Accessible</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Community Impact Score (0-100)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={esg.social.communityImpact}
                            onChange={(e) => handleChange('social', 'communityImpact', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Local Employment (jobs created)
                        </label>
                        <input
                            type="number"
                            value={esg.social.localEmployment}
                            onChange={(e) => handleChange('social', 'localEmployment', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Social Amenities
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {socialAmenitiesOptions.map((amenity) => (
                                <label key={amenity} className="flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        checked={esg.social.socialAmenities.includes(amenity)}
                                        onChange={(e) => handleArrayChange('social', 'socialAmenities', amenity, e.target.checked)}
                                        className="mr-2"
                                    />
                                    {amenity}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={esg.social.affordableHousing}
                                onChange={(e) => handleChange('social', 'affordableHousing', e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm">🏠 Affordable Housing</span>
                        </label>
                    </div>
                </div>

                {/* Governance Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <FaShieldAlt className="text-purple-500" />
                        <h4 className="font-semibold text-gray-800">Governance</h4>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transparency
                        </label>
                        <select
                            value={esg.governance.transparency}
                            onChange={(e) => handleChange('governance', 'transparency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="Not Rated">Not Rated</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ethical Standards
                        </label>
                        <select
                            value={esg.governance.ethicalStandards}
                            onChange={(e) => handleChange('governance', 'ethicalStandards', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="Not Rated">Not Rated</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Compliance
                        </label>
                        <select
                            value={esg.governance.compliance}
                            onChange={(e) => handleChange('governance', 'compliance', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="Not Rated">Not Rated</option>
                            <option value="Fully Compliant">Fully Compliant</option>
                            <option value="Mostly Compliant">Mostly Compliant</option>
                            <option value="Partially Compliant">Partially Compliant</option>
                            <option value="Non-Compliant">Non-Compliant</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Risk Management
                        </label>
                        <select
                            value={esg.governance.riskManagement}
                            onChange={(e) => handleChange('governance', 'riskManagement', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="Not Rated">Not Rated</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stakeholder Engagement
                        </label>
                        <select
                            value={esg.governance.stakeholderEngagement}
                            onChange={(e) => handleChange('governance', 'stakeholderEngagement', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="Not Rated">Not Rated</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={() => onESGChange(esg)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <FaSave />
                    Save ESG Data
                </button>
            </div>
        </div>
    );
};

export default ESGManagement;

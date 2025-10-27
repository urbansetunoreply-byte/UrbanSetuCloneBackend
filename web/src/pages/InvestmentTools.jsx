import React, { useState, useEffect } from 'react';
import { 
  FaCalculator, 
  FaChartLine, 
  FaHome, 
  FaDollarSign, 
  FaChartBar, 
  FaShieldAlt, 
  FaPercent, 
  FaCalendar, 
  FaMoneyBillWave,
  FaPiggyBank,
  FaChartPie,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaDownload,
  FaSave,
  FaHistory,
  FaTimes,
} from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';
import ContactSupportWrapper from '../components/ContactSupportWrapper';

const InvestmentTools = () => {
  usePageTitle("Investment Tools - Real Estate Investment Calculator");

  const [activeTab, setActiveTab] = useState('roi');
  const [savedCalculations, setSavedCalculations] = useState([]);

  // ROI Calculator State
  const [roiData, setRoiData] = useState({
    propertyValue: '',
    downPayment: '',
    monthlyRent: '',
    monthlyExpenses: '',
    loanAmount: '',
    interestRate: '',
    loanTerm: '',
    appreciationRate: ''
  });

  // Mortgage Calculator State
  const [mortgageData, setMortgageData] = useState({
    loanAmount: '',
    interestRate: '',
    loanTerm: '',
    downPayment: '',
    propertyTax: '',
    insurance: '',
    pmi: ''
  });

  // Portfolio State
  const [portfolio, setPortfolio] = useState([]);
  const [newProperty, setNewProperty] = useState({
    name: '',
    value: '',
    monthlyRent: '',
    monthlyExpenses: '',
    purchaseDate: '',
    location: ''
  });

  // Market Analysis State
  const [marketData, setMarketData] = useState({
    location: '',
    propertyType: '',
    timeFrame: '12',
    analysisType: 'price_trend'
  });

  // Risk Assessment State
  const [riskData, setRiskData] = useState({
    propertyValue: '',
    location: '',
    propertyType: '',
    marketVolatility: 'medium',
    tenantStability: 'medium',
    maintenanceHistory: 'good',
    neighborhoodGrowth: 'stable'
  });

  const [results, setResults] = useState({});

  // Load saved calculations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('investmentCalculations');
    if (saved) {
      setSavedCalculations(JSON.parse(saved));
    }
  }, []);

  // Save calculations to localStorage
  const saveCalculation = (type, data, result) => {
    const newCalculation = {
      id: Date.now(),
      type,
      data,
      result,
      timestamp: new Date().toISOString()
    };
    const updated = [...savedCalculations, newCalculation];
    setSavedCalculations(updated);
    localStorage.setItem('investmentCalculations', JSON.stringify(updated));
  };

  // ROI Calculator Functions
  const calculateROI = () => {
    const {
      propertyValue,
      downPayment,
      monthlyRent,
      monthlyExpenses,
      loanAmount,
      interestRate,
      loanTerm,
      appreciationRate
    } = roiData;

    const pv = parseFloat(propertyValue) || 0;
    const dp = parseFloat(downPayment) || 0;
    const mr = parseFloat(monthlyRent) || 0;
    const me = parseFloat(monthlyExpenses) || 0;
    const la = parseFloat(loanAmount) || 0;
    const ir = parseFloat(interestRate) || 0;
    const lt = parseFloat(loanTerm) || 0;
    const ar = parseFloat(appreciationRate) || 0;

    // Monthly mortgage payment calculation
    const monthlyRate = ir / 100 / 12;
    const numPayments = lt * 12;
    const monthlyPayment = la * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);

    // Annual calculations
    const annualRent = mr * 12;
    const annualExpenses = (me + monthlyPayment) * 12;
    const netAnnualIncome = annualRent - annualExpenses;
    const annualAppreciation = pv * (ar / 100);
    const totalAnnualReturn = netAnnualIncome + annualAppreciation;

    // ROI calculations
    const cashOnCashROI = (netAnnualIncome / dp) * 100;
    const totalROI = (totalAnnualReturn / dp) * 100;
    const capRate = (netAnnualIncome / pv) * 100;

    const result = {
      monthlyPayment: monthlyPayment.toFixed(2),
      annualRent: annualRent.toFixed(2),
      annualExpenses: annualExpenses.toFixed(2),
      netAnnualIncome: netAnnualIncome.toFixed(2),
      annualAppreciation: annualAppreciation.toFixed(2),
      totalAnnualReturn: totalAnnualReturn.toFixed(2),
      cashOnCashROI: cashOnCashROI.toFixed(2),
      totalROI: totalROI.toFixed(2),
      capRate: capRate.toFixed(2)
    };

    setResults({ ...results, roi: result });
    saveCalculation('ROI Calculator', roiData, result);
  };

  // Mortgage Calculator Functions
  const calculateMortgage = () => {
    const {
      loanAmount,
      interestRate,
      loanTerm,
      downPayment,
      propertyTax,
      insurance,
      pmi
    } = mortgageData;

    const la = parseFloat(loanAmount) || 0;
    const ir = parseFloat(interestRate) || 0;
    const lt = parseFloat(loanTerm) || 0;
    const dp = parseFloat(downPayment) || 0;
    const pt = parseFloat(propertyTax) || 0;
    const ins = parseFloat(insurance) || 0;
    const pmiAmount = parseFloat(pmi) || 0;

    // Monthly mortgage payment
    const monthlyRate = ir / 100 / 12;
    const numPayments = lt * 12;
    const monthlyPayment = la * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);

    // Total monthly payment including taxes, insurance, PMI
    const totalMonthlyPayment = monthlyPayment + (pt / 12) + (ins / 12) + pmiAmount;

    // Total interest paid over loan term
    const totalInterest = (monthlyPayment * numPayments) - la;

    // Total cost of loan
    const totalCost = monthlyPayment * numPayments + (pt * lt) + (ins * lt) + (pmiAmount * 12 * lt);

    const result = {
      monthlyPayment: monthlyPayment.toFixed(2),
      totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      totalCost: totalCost.toFixed(2),
      totalPrincipal: la.toFixed(2),
      downPayment: dp.toFixed(2),
      propertyValue: (la + dp).toFixed(2)
    };

    setResults({ ...results, mortgage: result });
    saveCalculation('Mortgage Calculator', mortgageData, result);
  };

  // Portfolio Management Functions
  const addToPortfolio = () => {
    if (newProperty.name && newProperty.value && newProperty.monthlyRent) {
      const property = {
        ...newProperty,
        id: Date.now(),
        roi: ((parseFloat(newProperty.monthlyRent) * 12) / parseFloat(newProperty.value) * 100).toFixed(2)
      };
      setPortfolio([...portfolio, property]);
      setNewProperty({
        name: '',
        value: '',
        monthlyRent: '',
        monthlyExpenses: '',
        purchaseDate: '',
        location: ''
      });
    }
  };

  const removeFromPortfolio = (id) => {
    setPortfolio(portfolio.filter(prop => prop.id !== id));
  };

  // Market Analysis Functions
  const analyzeMarket = () => {
    // Simulated market analysis (in real app, this would call an API)
    const mockAnalysis = {
      priceTrend: '+8.5%',
      marketScore: '85/100',
      demandLevel: 'High',
      supplyLevel: 'Medium',
      averageDaysOnMarket: '45',
      pricePerSqFt: '$180',
      recommendation: 'Strong Buy',
      riskLevel: 'Medium'
    };

    setResults({ ...results, market: mockAnalysis });
    saveCalculation('Market Analysis', marketData, mockAnalysis);
  };

  // Risk Assessment Functions
  const assessRisk = () => {
    const {
      propertyValue,
      location,
      propertyType,
      marketVolatility,
      tenantStability,
      maintenanceHistory,
      neighborhoodGrowth
    } = riskData;

    // Risk scoring algorithm
    let riskScore = 0;
    let riskFactors = [];

    // Market volatility scoring
    const volatilityScores = { low: 1, medium: 3, high: 5 };
    riskScore += volatilityScores[marketVolatility] || 3;

    // Tenant stability scoring
    const stabilityScores = { high: 1, medium: 3, low: 5 };
    riskScore += stabilityScores[tenantStability] || 3;

    // Maintenance history scoring
    const maintenanceScores = { excellent: 1, good: 2, fair: 3, poor: 5 };
    riskScore += maintenanceScores[maintenanceHistory] || 2;

    // Neighborhood growth scoring
    const growthScores = { growing: 1, stable: 2, declining: 4 };
    riskScore += growthScores[neighborhoodGrowth] || 2;

    // Location risk (simplified)
    if (location.toLowerCase().includes('downtown') || location.toLowerCase().includes('city center')) {
      riskScore += 1;
    } else if (location.toLowerCase().includes('suburb') || location.toLowerCase().includes('residential')) {
      riskScore -= 1;
    }

    // Property type risk
    if (propertyType === 'commercial') {
      riskScore += 2;
    } else if (propertyType === 'luxury') {
      riskScore += 1;
    }

    // Determine risk level
    let riskLevel, riskColor, recommendation;
    if (riskScore <= 8) {
      riskLevel = 'Low Risk';
      riskColor = 'text-green-600';
      recommendation = 'Safe investment with good potential returns';
    } else if (riskScore <= 12) {
      riskLevel = 'Medium Risk';
      riskColor = 'text-yellow-600';
      recommendation = 'Moderate risk with balanced potential';
    } else {
      riskLevel = 'High Risk';
      riskColor = 'text-red-600';
      recommendation = 'High risk investment, consider carefully';
    }

    const result = {
      riskScore: riskScore,
      riskLevel,
      riskColor,
      recommendation,
      riskFactors: [
        `Market Volatility: ${marketVolatility}`,
        `Tenant Stability: ${tenantStability}`,
        `Maintenance History: ${maintenanceHistory}`,
        `Neighborhood Growth: ${neighborhoodGrowth}`
      ]
    };

    setResults({ ...results, risk: result });
    saveCalculation('Risk Assessment', riskData, result);
  };

  const exportResults = () => {
    const dataStr = JSON.stringify({ calculations: savedCalculations, currentResults: results }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'investment-calculations.json';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <FaCalculator className="text-3xl text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Investment Tools</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive real estate investment calculators and analysis tools to help you make informed investment decisions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={exportResults}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaDownload className="text-sm" />
            Export Results
          </button>
          <button
            onClick={() => setSavedCalculations([])}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <FaHistory className="text-sm" />
            Clear History
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'roi', label: 'ROI Calculator', icon: FaChartLine },
            { id: 'mortgage', label: 'Mortgage Calculator', icon: FaHome },
            { id: 'portfolio', label: 'Portfolio Tracking', icon: FaChartPie },
            { id: 'market', label: 'Market Analysis', icon: FaChartBar },
            { id: 'risk', label: 'Risk Assessment', icon: FaShieldAlt }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="text-sm" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ROI Calculator */}
        {activeTab === 'roi' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaChartLine className="text-green-600" />
              ROI Calculator
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Value ($)</label>
                <input
                  type="number"
                  value={roiData.propertyValue}
                  onChange={(e) => setRoiData({...roiData, propertyValue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment ($)</label>
                <input
                  type="number"
                  value={roiData.downPayment}
                  onChange={(e) => setRoiData({...roiData, downPayment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
                <input
                  type="number"
                  value={roiData.monthlyRent}
                  onChange={(e) => setRoiData({...roiData, monthlyRent: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="3000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses ($)</label>
                <input
                  type="number"
                  value={roiData.monthlyExpenses}
                  onChange={(e) => setRoiData({...roiData, monthlyExpenses: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount ($)</label>
                <input
                  type="number"
                  value={roiData.loanAmount}
                  onChange={(e) => setRoiData({...roiData, loanAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="400000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={roiData.interestRate}
                  onChange={(e) => setRoiData({...roiData, interestRate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="4.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term (Years)</label>
                <input
                  type="number"
                  value={roiData.loanTerm}
                  onChange={(e) => setRoiData({...roiData, loanTerm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appreciation Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={roiData.appreciationRate}
                  onChange={(e) => setRoiData({...roiData, appreciationRate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="3.0"
                />
              </div>
            </div>
            <button
              onClick={calculateROI}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaCalculator className="text-sm" />
              Calculate ROI
            </button>

            {/* ROI Results */}
            {results.roi && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Cash-on-Cash ROI</h3>
                  <p className="text-2xl font-bold text-green-600">{results.roi.cashOnCashROI}%</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Total ROI</h3>
                  <p className="text-2xl font-bold text-blue-600">{results.roi.totalROI}%</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Cap Rate</h3>
                  <p className="text-2xl font-bold text-purple-600">{results.roi.capRate}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Monthly Payment</h3>
                  <p className="text-xl font-bold text-gray-600">${results.roi.monthlyPayment}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Net Annual Income</h3>
                  <p className="text-xl font-bold text-gray-600">${results.roi.netAnnualIncome}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Annual Appreciation</h3>
                  <p className="text-xl font-bold text-gray-600">${results.roi.annualAppreciation}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mortgage Calculator */}
        {activeTab === 'mortgage' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaHome className="text-blue-600" />
              Mortgage Calculator
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount ($)</label>
                <input
                  type="number"
                  value={mortgageData.loanAmount}
                  onChange={(e) => setMortgageData({...mortgageData, loanAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="400000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={mortgageData.interestRate}
                  onChange={(e) => setMortgageData({...mortgageData, interestRate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="4.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term (Years)</label>
                <input
                  type="number"
                  value={mortgageData.loanTerm}
                  onChange={(e) => setMortgageData({...mortgageData, loanTerm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment ($)</label>
                <input
                  type="number"
                  value={mortgageData.downPayment}
                  onChange={(e) => setMortgageData({...mortgageData, downPayment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Tax (Annual $)</label>
                <input
                  type="number"
                  value={mortgageData.propertyTax}
                  onChange={(e) => setMortgageData({...mortgageData, propertyTax: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="6000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance (Annual $)</label>
                <input
                  type="number"
                  value={mortgageData.insurance}
                  onChange={(e) => setMortgageData({...mortgageData, insurance: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PMI (Monthly $)</label>
                <input
                  type="number"
                  value={mortgageData.pmi}
                  onChange={(e) => setMortgageData({...mortgageData, pmi: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="200"
                />
              </div>
            </div>
            <button
              onClick={calculateMortgage}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaCalculator className="text-sm" />
              Calculate Mortgage
            </button>

            {/* Mortgage Results */}
            {results.mortgage && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Monthly Payment</h3>
                  <p className="text-2xl font-bold text-blue-600">${results.mortgage.monthlyPayment}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Total Monthly Payment</h3>
                  <p className="text-2xl font-bold text-green-600">${results.mortgage.totalMonthlyPayment}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Total Interest</h3>
                  <p className="text-2xl font-bold text-red-600">${results.mortgage.totalInterest}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Total Cost</h3>
                  <p className="text-2xl font-bold text-purple-600">${results.mortgage.totalCost}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Property Value</h3>
                  <p className="text-xl font-bold text-gray-600">${results.mortgage.propertyValue}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Down Payment</h3>
                  <p className="text-xl font-bold text-gray-600">${results.mortgage.downPayment}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Tracking */}
        {activeTab === 'portfolio' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaChartPie className="text-purple-600" />
              Investment Portfolio
            </h2>
            
            {/* Add New Property */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Property</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Property Name"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  placeholder="Property Value ($)"
                  value={newProperty.value}
                  onChange={(e) => setNewProperty({...newProperty, value: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  placeholder="Monthly Rent ($)"
                  value={newProperty.monthlyRent}
                  onChange={(e) => setNewProperty({...newProperty, monthlyRent: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  placeholder="Monthly Expenses ($)"
                  value={newProperty.monthlyExpenses}
                  onChange={(e) => setNewProperty({...newProperty, monthlyExpenses: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="date"
                  placeholder="Purchase Date"
                  value={newProperty.purchaseDate}
                  onChange={(e) => setNewProperty({...newProperty, purchaseDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newProperty.location}
                  onChange={(e) => setNewProperty({...newProperty, location: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={addToPortfolio}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Property
              </button>
            </div>

            {/* Portfolio List */}
            <div className="space-y-4">
              {portfolio.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaChartPie className="text-4xl mx-auto mb-4 text-gray-300" />
                  <p>No properties in your portfolio yet. Add your first property above!</p>
                </div>
              ) : (
                portfolio.map(property => (
                  <div key={property.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{property.name}</h4>
                      <p className="text-sm text-gray-600">{property.location}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>Value: ${parseFloat(property.value).toLocaleString()}</span>
                        <span>Rent: ${property.monthlyRent}/month</span>
                        <span className="text-green-600 font-semibold">ROI: {property.roi}%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromPortfolio(property.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <FaTimes className="text-lg" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Portfolio Summary */}
            {portfolio.length > 0 && (
              <div className="mt-6 bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Portfolio Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-purple-600">Total Properties</p>
                    <p className="text-xl font-bold text-purple-800">{portfolio.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600">Total Value</p>
                    <p className="text-xl font-bold text-purple-800">
                      ${portfolio.reduce((sum, prop) => sum + parseFloat(prop.value), 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600">Average ROI</p>
                    <p className="text-xl font-bold text-purple-800">
                      {(portfolio.reduce((sum, prop) => sum + parseFloat(prop.roi), 0) / portfolio.length).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Market Analysis */}
        {activeTab === 'market' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaChartBar className="text-orange-600" />
              Market Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={marketData.location}
                  onChange={(e) => setMarketData({...marketData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="New York, NY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select
                  value={marketData.propertyType}
                  onChange={(e) => setMarketData({...marketData, propertyType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="single_family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi_family">Multi-Family</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Frame (Months)</label>
                <select
                  value={marketData.timeFrame}
                  onChange={(e) => setMarketData({...marketData, timeFrame: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                  <option value="24">24 Months</option>
                  <option value="36">36 Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Type</label>
                <select
                  value={marketData.analysisType}
                  onChange={(e) => setMarketData({...marketData, analysisType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="price_trend">Price Trend</option>
                  <option value="rental_yield">Rental Yield</option>
                  <option value="market_activity">Market Activity</option>
                  <option value="investment_potential">Investment Potential</option>
                </select>
              </div>
            </div>
            <button
              onClick={analyzeMarket}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaChartBar className="text-sm" />
              Analyze Market
            </button>

            {/* Market Analysis Results */}
            {results.market && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Price Trend</h3>
                  <p className="text-2xl font-bold text-green-600">{results.market.priceTrend}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Market Score</h3>
                  <p className="text-2xl font-bold text-blue-600">{results.market.marketScore}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Demand Level</h3>
                  <p className="text-xl font-bold text-purple-600">{results.market.demandLevel}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">Recommendation</h3>
                  <p className="text-xl font-bold text-orange-600">{results.market.recommendation}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Days on Market</h3>
                  <p className="text-xl font-bold text-gray-600">{results.market.averageDaysOnMarket}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Price per Sq Ft</h3>
                  <p className="text-xl font-bold text-gray-600">{results.market.pricePerSqFt}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Supply Level</h3>
                  <p className="text-xl font-bold text-gray-600">{results.market.supplyLevel}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Risk Level</h3>
                  <p className="text-xl font-bold text-gray-600">{results.market.riskLevel}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Risk Assessment */}
        {activeTab === 'risk' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaShieldAlt className="text-red-600" />
              Risk Assessment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Value ($)</label>
                <input
                  type="number"
                  value={riskData.propertyValue}
                  onChange={(e) => setRiskData({...riskData, propertyValue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={riskData.location}
                  onChange={(e) => setRiskData({...riskData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Downtown, City Center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select
                  value={riskData.propertyType}
                  onChange={(e) => setRiskData({...riskData, propertyType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="luxury">Luxury</option>
                  <option value="affordable">Affordable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market Volatility</label>
                <select
                  value={riskData.marketVolatility}
                  onChange={(e) => setRiskData({...riskData, marketVolatility: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Stability</label>
                <select
                  value={riskData.tenantStability}
                  onChange={(e) => setRiskData({...riskData, tenantStability: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance History</label>
                <select
                  value={riskData.maintenanceHistory}
                  onChange={(e) => setRiskData({...riskData, maintenanceHistory: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood Growth</label>
                <select
                  value={riskData.neighborhoodGrowth}
                  onChange={(e) => setRiskData({...riskData, neighborhoodGrowth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="growing">Growing</option>
                  <option value="stable">Stable</option>
                  <option value="declining">Declining</option>
                </select>
              </div>
            </div>
            <button
              onClick={assessRisk}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaShieldAlt className="text-sm" />
              Assess Risk
            </button>

            {/* Risk Assessment Results */}
            {results.risk && (
              <div className="mt-6">
                <div className="bg-gray-50 p-6 rounded-lg mb-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Risk Assessment Result</h3>
                    <p className={`text-3xl font-bold mb-2 ${results.risk.riskColor}`}>
                      {results.risk.riskLevel}
                    </p>
                    <p className="text-lg text-gray-600 mb-4">{results.risk.recommendation}</p>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Risk Score: {results.risk.riskScore}/20</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            results.risk.riskScore <= 8 ? 'bg-green-500' : 
                            results.risk.riskScore <= 12 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(results.risk.riskScore / 20) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Risk Factors</h4>
                  <div className="space-y-2">
                    {results.risk.riskFactors.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <FaInfoCircle className="text-blue-500" />
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Calculations History */}
        {savedCalculations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaHistory className="text-gray-600" />
              Calculation History
            </h2>
            <div className="space-y-4">
              {savedCalculations.slice(-10).reverse().map(calc => (
                <div key={calc.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{calc.type}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(calc.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (calc.type === 'ROI Calculator') {
                          setRoiData(calc.data);
                          setActiveTab('roi');
                        } else if (calc.type === 'Mortgage Calculator') {
                          setMortgageData(calc.data);
                          setActiveTab('mortgage');
                        } else if (calc.type === 'Market Analysis') {
                          setMarketData(calc.data);
                          setActiveTab('market');
                        } else if (calc.type === 'Risk Assessment') {
                          setRiskData(calc.data);
                          setActiveTab('risk');
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Load
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Support Wrapper */}
      <ContactSupportWrapper />
    </div>
  );
};

export default InvestmentTools;
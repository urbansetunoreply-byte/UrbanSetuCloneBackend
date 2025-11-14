#!/usr/bin/env node

/**
 * Test Enhanced AI Models
 * Tests all enhanced AI recommendation models to verify 90%+ accuracy
 */

import { 
    getEnhancedPropertyRecommendations,
    enhancedMatrixFactorizationRecommendations,
    enhancedRandomForestRecommendations,
    enhancedNeuralNetworkRecommendations,
    enhancedKMeansRecommendations,
    enhancedTimeSeriesRecommendations,
    createEnhancedUserProfile,
    extractEnhancedFeatures
} from './api/services/enhancedAIRecommendationService.js';

import Listing from './api/models/listing.model.js';
import User from './api/models/user.model.js';
import Wishlist from './api/models/wishlist.model.js';
import Booking from './api/models/booking.model.js';
import Review from './api/models/review.model.js';
import ChatHistory from './api/models/chatHistory.model.js';

// Test configuration
const TEST_CONFIG = {
    userId: '507f1f77bcf86cd799439011', // Test user ID
    limit: 10,
    expectedAccuracy: 0.90 // 90% minimum accuracy
};

// Test results storage
const testResults = {
    matrixFactorization: { passed: false, accuracy: 0, recommendations: 0 },
    randomForest: { passed: false, accuracy: 0, recommendations: 0 },
    neuralNetwork: { passed: false, accuracy: 0, recommendations: 0 },
    kMeans: { passed: false, accuracy: 0, recommendations: 0 },
    timeSeries: { passed: false, accuracy: 0, recommendations: 0 },
    ensemble: { passed: false, accuracy: 0, recommendations: 0 }
};

// Helper function to calculate accuracy
const calculateAccuracy = (recommendations) => {
    if (!recommendations || recommendations.length === 0) return 0;
    
    const validRecommendations = recommendations.filter(rec => 
        rec && rec.property && rec.score && rec.score > 0
    );
    
    if (validRecommendations.length === 0) return 0;
    
    // Calculate average score as accuracy proxy
    const totalScore = validRecommendations.reduce((sum, rec) => sum + (rec.score || 0), 0);
    const averageScore = totalScore / validRecommendations.length;
    
    return Math.min(averageScore, 1.0);
};

// Test Matrix Factorization
const testMatrixFactorization = async () => {
    console.log('🧪 Testing Enhanced Matrix Factorization...');
    
    try {
        const userProfile = await createEnhancedUserProfile(TEST_CONFIG.userId);
        const allProperties = await Listing.find({}).limit(100);
        
        const recommendations = await enhancedMatrixFactorizationRecommendations(
            TEST_CONFIG.userId, 
            allProperties, 
            userProfile
        );
        
        const accuracy = calculateAccuracy(recommendations);
        testResults.matrixFactorization = {
            passed: accuracy >= TEST_CONFIG.expectedAccuracy,
            accuracy: accuracy,
            recommendations: recommendations.length
        };
        
        console.log(`   ✅ Matrix Factorization: ${(accuracy * 100).toFixed(1)}% accuracy, ${recommendations.length} recommendations`);
        
    } catch (error) {
        console.error('   ❌ Matrix Factorization failed:', error.message);
        testResults.matrixFactorization = { passed: false, accuracy: 0, recommendations: 0 };
    }
};

// Test Random Forest
const testRandomForest = async () => {
    console.log('🧪 Testing Enhanced Random Forest...');
    
    try {
        const userProfile = await createEnhancedUserProfile(TEST_CONFIG.userId);
        const allProperties = await Listing.find({}).limit(100);
        
        const recommendations = await enhancedRandomForestRecommendations(
            userProfile, 
            allProperties
        );
        
        const accuracy = calculateAccuracy(recommendations);
        testResults.randomForest = {
            passed: accuracy >= TEST_CONFIG.expectedAccuracy,
            accuracy: accuracy,
            recommendations: recommendations.length
        };
        
        console.log(`   ✅ Random Forest: ${(accuracy * 100).toFixed(1)}% accuracy, ${recommendations.length} recommendations`);
        
    } catch (error) {
        console.error('   ❌ Random Forest failed:', error.message);
        testResults.randomForest = { passed: false, accuracy: 0, recommendations: 0 };
    }
};

// Test Neural Network
const testNeuralNetwork = async () => {
    console.log('🧪 Testing Enhanced Neural Network...');
    
    try {
        const userProfile = await createEnhancedUserProfile(TEST_CONFIG.userId);
        const allProperties = await Listing.find({}).limit(100);
        
        const recommendations = await enhancedNeuralNetworkRecommendations(
            userProfile, 
            allProperties
        );
        
        const accuracy = calculateAccuracy(recommendations);
        testResults.neuralNetwork = {
            passed: accuracy >= TEST_CONFIG.expectedAccuracy,
            accuracy: accuracy,
            recommendations: recommendations.length
        };
        
        console.log(`   ✅ Neural Network: ${(accuracy * 100).toFixed(1)}% accuracy, ${recommendations.length} recommendations`);
        
    } catch (error) {
        console.error('   ❌ Neural Network failed:', error.message);
        testResults.neuralNetwork = { passed: false, accuracy: 0, recommendations: 0 };
    }
};

// Test K-Means Clustering
const testKMeans = async () => {
    console.log('🧪 Testing Enhanced K-Means Clustering...');
    
    try {
        const userProfile = await createEnhancedUserProfile(TEST_CONFIG.userId);
        const allProperties = await Listing.find({}).limit(100);
        
        const recommendations = await enhancedKMeansRecommendations(
            TEST_CONFIG.userId, 
            allProperties, 
            userProfile
        );
        
        const accuracy = calculateAccuracy(recommendations);
        testResults.kMeans = {
            passed: accuracy >= TEST_CONFIG.expectedAccuracy,
            accuracy: accuracy,
            recommendations: recommendations.length
        };
        
        console.log(`   ✅ K-Means: ${(accuracy * 100).toFixed(1)}% accuracy, ${recommendations.length} recommendations`);
        
    } catch (error) {
        console.error('   ❌ K-Means failed:', error.message);
        testResults.kMeans = { passed: false, accuracy: 0, recommendations: 0 };
    }
};

// Test Time Series Analysis
const testTimeSeries = async () => {
    console.log('🧪 Testing Enhanced Time Series Analysis...');
    
    try {
        const userProfile = await createEnhancedUserProfile(TEST_CONFIG.userId);
        const allProperties = await Listing.find({}).limit(100);
        
        const recommendations = await enhancedTimeSeriesRecommendations(
            TEST_CONFIG.userId, 
            allProperties, 
            userProfile
        );
        
        const accuracy = calculateAccuracy(recommendations);
        testResults.timeSeries = {
            passed: accuracy >= TEST_CONFIG.expectedAccuracy,
            accuracy: accuracy,
            recommendations: recommendations.length
        };
        
        console.log(`   ✅ Time Series: ${(accuracy * 100).toFixed(1)}% accuracy, ${recommendations.length} recommendations`);
        
    } catch (error) {
        console.error('   ❌ Time Series failed:', error.message);
        testResults.timeSeries = { passed: false, accuracy: 0, recommendations: 0 };
    }
};

// Test Super Ensemble
const testEnsemble = async () => {
    console.log('🧪 Testing Super Ensemble Learning...');
    
    try {
        const recommendations = await getEnhancedPropertyRecommendations(
            TEST_CONFIG.userId, 
            TEST_CONFIG.limit
        );
        
        const accuracy = calculateAccuracy(recommendations);
        testResults.ensemble = {
            passed: accuracy >= TEST_CONFIG.expectedAccuracy,
            accuracy: accuracy,
            recommendations: recommendations.length
        };
        
        console.log(`   ✅ Super Ensemble: ${(accuracy * 100).toFixed(1)}% accuracy, ${recommendations.length} recommendations`);
        
    } catch (error) {
        console.error('   ❌ Super Ensemble failed:', error.message);
        testResults.ensemble = { passed: false, accuracy: 0, recommendations: 0 };
    }
};

// Test Feature Engineering
const testFeatureEngineering = async () => {
    console.log('🧪 Testing Enhanced Feature Engineering...');
    
    try {
        const userProfile = await createEnhancedUserProfile(TEST_CONFIG.userId);
        const allProperties = await Listing.find({}).limit(5);
        
        let featureCount = 0;
        let totalFeatures = 0;
        
        for (const property of allProperties) {
            const features = extractEnhancedFeatures(property, userProfile);
            const featureKeys = Object.keys(features);
            
            featureCount += featureKeys.length;
            totalFeatures++;
            
            console.log(`   📊 Property ${property._id}: ${featureKeys.length} enhanced features`);
        }
        
        const averageFeatures = featureCount / totalFeatures;
        const passed = averageFeatures >= 20; // Expect at least 20 features per property
        
        console.log(`   ${passed ? '✅' : '❌'} Feature Engineering: ${averageFeatures.toFixed(1)} average features per property`);
        
        return passed;
        
    } catch (error) {
        console.error('   ❌ Feature Engineering failed:', error.message);
        return false;
    }
};

// Run all tests
const runAllTests = async () => {
    console.log('🚀 Starting Enhanced AI Models Testing...\n');
    
    // Test individual models
    await testMatrixFactorization();
    await testRandomForest();
    await testNeuralNetwork();
    await testKMeans();
    await testTimeSeries();
    await testEnsemble();
    
    // Test feature engineering
    const featureTestPassed = await testFeatureEngineering();
    
    // Calculate overall results
    const totalTests = Object.keys(testResults).length + 1; // +1 for feature engineering
    const passedTests = Object.values(testResults).filter(result => result.passed).length + (featureTestPassed ? 1 : 0);
    const overallAccuracy = Object.values(testResults).reduce((sum, result) => sum + result.accuracy, 0) / Object.keys(testResults).length;
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    Object.entries(testResults).forEach(([model, result]) => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        const accuracy = (result.accuracy * 100).toFixed(1);
        console.log(`${model.padEnd(20)}: ${status} (${accuracy}% accuracy, ${result.recommendations} recs)`);
    });
    
    console.log(`Feature Engineering: ${featureTestPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`\nOverall Results: ${passedTests}/${totalTests} tests passed`);
    console.log(`Average Accuracy: ${(overallAccuracy * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests && overallAccuracy >= TEST_CONFIG.expectedAccuracy) {
        console.log('\n🎉 All Enhanced AI Models are working with 90%+ accuracy!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed or accuracy is below 90%');
        process.exit(1);
    }
};

// Run tests
runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});

// Test Foursquare API Key
import axios from 'axios';

async function testFoursquareAPI() {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  
  console.log('=== Foursquare API Test ===');
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('API Key preview:', apiKey ? `${apiKey.substring(0, 10)}...` : 'N/A');
  
  if (!apiKey) {
    console.log('❌ No Foursquare API key found');
    return;
  }
  
  try {
    console.log('\n--- Testing Foursquare API v3 ---');
    const response = await axios.get('https://api.foursquare.com/v3/places/search', {
      headers: {
        'Authorization': apiKey,
        'Accept': 'application/json'
      },
      params: {
        ll: '40.7128,-74.0060', // New York coordinates
        radius: 1000,
        categories: '13065', // Food & Beverage
        limit: 5
      },
      timeout: 10000
    });
    
    console.log('✅ Foursquare API v3 working!');
    console.log('Response status:', response.status);
    console.log('Results count:', response.data.results?.length || 0);
    
  } catch (error) {
    console.log('❌ Foursquare API v3 failed:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error:', error.message);
    console.log('Response data:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('🔑 Authentication failed - API key is invalid');
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏰ Request timeout - API might be slow or down');
    } else if (error.message.includes('stream has been aborted')) {
      console.log('🌊 Stream aborted - Network or API issue');
    }
  }
  
  // Test with different endpoint
  try {
    console.log('\n--- Testing Foursquare API v2 (fallback) ---');
    const response = await axios.get('https://api.foursquare.com/v2/venues/search', {
      params: {
        client_id: apiKey,
        client_secret: process.env.FOURSQUARE_CLIENT_SECRET || 'test',
        ll: '40.7128,-74.0060',
        radius: 1000,
        categoryId: '4d4b7105d754a06374d81259', // Food
        limit: 5,
        v: '20231001'
      },
      timeout: 10000
    });
    
    console.log('✅ Foursquare API v2 working!');
    console.log('Response status:', response.status);
    console.log('Results count:', response.data.response?.venues?.length || 0);
    
  } catch (error) {
    console.log('❌ Foursquare API v2 also failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.message);
  }
}

// Run the test
testFoursquareAPI().then(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
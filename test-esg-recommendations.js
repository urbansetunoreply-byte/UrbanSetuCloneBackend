// Test ESG Recommendations API
const API_BASE_URL = 'https://urbansetu-pvt4.onrender.com';

const testESGRecommendations = async () => {
  try {
    console.log('🌱 Testing ESG Recommendations API...');

    // Test the ESG recommendations endpoint
    const response = await fetch(`${API_BASE_URL}/api/esg-ai/recommendations?limit=5&includeExplanation=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper authentication cookies
        // But we can see if the endpoint is accessible
      }
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ ESG Recommendations Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ ESG Recommendations Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
};

const testESGAuth = async () => {
  try {
    console.log('🌱 Testing ESG Auth Endpoint...');

    const response = await fetch(`${API_BASE_URL}/api/esg-ai/test-auth`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📊 Auth Response Status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Auth Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Auth Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Auth Test Error:', error.message);
  }
};

// Run tests
console.log('🚀 Starting ESG System Tests...\n');

testESGAuth().then(() => {
  console.log('\n' + '='.repeat(50) + '\n');
  return testESGRecommendations();
}).then(() => {
  console.log('\n✅ ESG System Tests Complete!');
}).catch(error => {
  console.error('\n❌ Test Suite Error:', error);
});

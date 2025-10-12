# Real-Time Data Integration Setup Guide

## 🚀 Overview
This guide will help you set up real-time data integration for UrbanSetu's property analytics features.

## 📋 Required API Keys

### 1. Google Places API (Essential)
- **Purpose**: Nearby amenities, schools, hospitals, transport
- **Cost**: $0.017 per request (first 1000 requests free)
- **Setup**: 
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Enable Places API
  3. Create API key
  4. Add to `.env`: `GOOGLE_PLACES_API_KEY=your_key_here`

### 2. OpenWeather API (Recommended)
- **Purpose**: Weather data for location intelligence
- **Cost**: Free tier available (1000 calls/day)
- **Setup**:
  1. Go to [OpenWeatherMap](https://openweathermap.org/api)
  2. Sign up for free account
  3. Get API key
  4. Add to `.env`: `OPENWEATHER_API_KEY=your_key_here`

### 3. Foursquare API (Optional)
- **Purpose**: Local business data, venue information
- **Cost**: Free tier available
- **Setup**:
  1. Go to [Foursquare Developer](https://developer.foursquare.com/)
  2. Create app
  3. Get API key and secret
  4. Add to `.env`: 
     ```
     FOURSQUARE_API_KEY=your_key_here
     FOURSQUARE_CLIENT_SECRET=your_secret_here
     ```

## 🔧 Environment Variables Setup

Add these to your `.env` file:

```env
# Real-Time Data APIs
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
FOURSQUARE_API_KEY=your_foursquare_api_key
FOURSQUARE_CLIENT_SECRET=your_foursquare_client_secret

# Optional APIs
MAGICBRICKS_API_KEY=your_magicbricks_api_key
HOUSING_API_KEY=your_housing_api_key
PROPTIGER_API_KEY=your_proptiger_api_key
CRIME_DATA_API_KEY=your_crime_data_api_key
RAPIDAPI_KEY=your_rapidapi_key
```

## 📊 Data Sources Available

### 1. Property Market Data
- **Source**: Your database + similar properties analysis
- **Features**: Price comparison, market trends, ROI calculations
- **Update Frequency**: Real-time (based on database queries)

### 2. Location Intelligence
- **Amenities**: Hospitals, schools, malls, restaurants, etc.
- **Transport**: Metro stations, bus stops, railway stations
- **Safety**: Crime data (when available)
- **Update Frequency**: 30 minutes (cached)

### 3. Weather Data
- **Current weather**: Temperature, humidity, wind speed
- **Update Frequency**: 10 minutes (cached)

### 4. Market Trends
- **Price trends**: 6-month historical data
- **Demand analysis**: Property listing frequency
- **Market sentiment**: Bullish/Bearish/Neutral
- **Update Frequency**: 2 hours (cached)

## 🛠️ Implementation Features

### 1. Smart Caching System
- **30-minute cache** for most data
- **10-minute cache** for weather data
- **2-hour cache** for market trends
- **Automatic cache invalidation**

### 2. Fallback Data
- **Mock data** when APIs are unavailable
- **Graceful degradation** of features
- **Error handling** with user-friendly messages

### 3. Rate Limiting
- **Google Places**: 1000 requests/day
- **OpenWeather**: 1000 requests/day
- **Foursquare**: 500 requests/day
- **General**: 100 requests/hour

## 🚀 Usage Examples

### 1. Get Property Analytics
```javascript
// Frontend usage
const response = await fetch('/api/analytics/property/123/analytics', {
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### 2. Get Location Intelligence
```javascript
// Get location data for a city
const response = await fetch('/api/analytics/location/intelligence?city=Mumbai&latitude=19.0760&longitude=72.8777', {
  credentials: 'include'
});
```

### 3. Get Market Trends
```javascript
// Get market trends for a city
const response = await fetch('/api/analytics/market/trends?city=Mumbai&type=sale', {
  credentials: 'include'
});
```

## 📈 Analytics Features

### 1. Investment Analysis
- **ROI Calculation**: Based on market data and property characteristics
- **Appreciation Potential**: 1, 3, 5-year projections
- **Risk Assessment**: Location, market, property-based scoring
- **Investment Score**: 0-100 overall rating

### 2. Location Scoring
- **Amenities Score**: Nearby facilities and services
- **Safety Score**: Crime data and safety metrics
- **Connectivity Score**: Transport and accessibility
- **Overall Location Score**: 0-100 composite rating

### 3. Market Intelligence
- **Price Trends**: Historical price movements
- **Market Activity**: Listing frequency and demand
- **Comparative Analysis**: vs. similar properties
- **Market Sentiment**: Bullish/Bearish/Neutral

## 🔒 Security & Privacy

### 1. API Key Protection
- **Environment variables** for all API keys
- **Server-side only** API calls
- **No client-side** key exposure

### 2. Data Privacy
- **No personal data** stored from external APIs
- **Aggregated data only** for analytics
- **User consent** for location data

### 3. Rate Limiting
- **Per-user limits** on API calls
- **Caching** to reduce API usage
- **Graceful degradation** when limits exceeded

## 🚨 Troubleshooting

### 1. API Key Issues
```bash
# Check if API keys are loaded
console.log('Google Places API Key:', process.env.GOOGLE_PLACES_API_KEY ? 'Set' : 'Missing');
```

### 2. Rate Limit Exceeded
- **Check API usage** in respective dashboards
- **Implement caching** to reduce calls
- **Use fallback data** when limits exceeded

### 3. Data Quality Issues
- **Verify API responses** in logs
- **Check data validation** in service
- **Use mock data** as fallback

## 📊 Monitoring & Analytics

### 1. API Usage Tracking
- **Request counts** per API
- **Error rates** and response times
- **Cache hit rates**

### 2. Data Quality Metrics
- **Data completeness** scores
- **API availability** status
- **User engagement** with analytics

## 🎯 Next Steps

1. **Set up API keys** following the guide above
2. **Test the endpoints** using the provided examples
3. **Monitor API usage** and costs
4. **Customize analytics** based on your needs
5. **Add more data sources** as needed

## 💡 Pro Tips

1. **Start with Google Places API** - most essential for location data
2. **Use caching aggressively** - reduces API costs significantly
3. **Implement fallback data** - ensures features work even without APIs
4. **Monitor costs** - set up billing alerts for API usage
5. **Test thoroughly** - verify data accuracy and user experience

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify API keys are correctly set
3. Test API endpoints individually
4. Check rate limits and quotas
5. Review the fallback data implementation

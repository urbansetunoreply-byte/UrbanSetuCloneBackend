# Mapbox Integration Setup Guide

## 🗺️ Overview
This guide will help you set up Mapbox integration for UrbanSetu's route planner feature, replacing Google Maps API.

## 📋 Required Setup

### 1. Get Mapbox Access Token
1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Sign up or log in to your account
3. Go to "Access tokens" section
4. Create a new token or use the default public token
5. Copy your access token

### 2. Environment Variables

Add these to your `.env` file:

```env
# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

**Note:** 
- `VITE_MAPBOX_ACCESS_TOKEN` is for the frontend (web app)
- `MAPBOX_ACCESS_TOKEN` is for the backend API

### 3. Mapbox Account Setup

#### Free Tier Limits:
- **100,000 requests/month** for Directions API
- **100,000 requests/month** for Geocoding API
- **50,000 map loads/month**

#### Recommended Scopes:
- `styles:read` - For map styles
- `fonts:read` - For map fonts
- `datasets:read` - For custom data
- `geocoding:read` - For address search
- `directions:read` - For route planning

## 🚀 Features Implemented

### Frontend (Web)
- ✅ **Interactive Map** with Mapbox GL JS
- ✅ **Address Autocomplete** using Mapbox Geocoding
- ✅ **Route Planning** with multiple waypoints
- ✅ **Route Optimization** with waypoint ordering
- ✅ **Real-time Directions** with ETA calculations
- ✅ **Responsive Design** for mobile and desktop
- ✅ **Visual Route Display** with markers and route lines

### Backend API
- ✅ **Route Planning Endpoint** (`POST /api/route-planner/plan`)
- ✅ **Geocoding Endpoint** (`POST /api/route-planner/geocode`)
- ✅ **Optimization Suggestions** (`GET /api/route-planner/optimize/:propertyId`)
- ✅ **API Status Check** (`GET /api/route-planner/status`)

## 🔧 API Endpoints

### 1. Plan Route
```http
POST /api/route-planner/plan
Content-Type: application/json
Authorization: Bearer <token>

{
  "waypoints": [
    { "latitude": 28.6139, "longitude": 77.2090 },
    { "latitude": 28.6140, "longitude": 77.2091 }
  ],
  "profile": "driving"
}
```

### 2. Geocode Address
```http
POST /api/route-planner/geocode
Content-Type: application/json
Authorization: Bearer <token>

{
  "address": "Connaught Place, New Delhi",
  "country": "in",
  "types": "address,poi",
  "limit": 5
}
```

### 3. Get API Status
```http
GET /api/route-planner/status
```

## 🎨 Map Styles Available

The implementation supports various Mapbox map styles:

- `mapbox://styles/mapbox/streets-v12` (default)
- `mapbox://styles/mapbox/outdoors-v12`
- `mapbox://styles/mapbox/light-v11`
- `mapbox://styles/mapbox/dark-v11`
- `mapbox://styles/mapbox/satellite-v9`
- `mapbox://styles/mapbox/satellite-streets-v12`

## 🚗 Travel Profiles

Supported travel modes:
- `driving` - Car routes (default)
- `walking` - Pedestrian routes
- `cycling` - Bicycle routes
- `driving-traffic` - Car routes with traffic data

## 📱 Mobile Integration

The mobile app can be updated to use the same backend API endpoints for consistent route planning across platforms.

## 🔒 Security Notes

1. **Token Security**: Never expose your secret tokens in client-side code
2. **Rate Limiting**: Implement rate limiting to stay within free tier limits
3. **CORS**: Configure CORS properly for cross-origin requests
4. **Input Validation**: Always validate coordinates and addresses

## 🐛 Troubleshooting

### Common Issues:

1. **"Mapbox access token not found"**
   - Check if `VITE_MAPBOX_ACCESS_TOKEN` is set in your `.env` file
   - Restart your development server after adding the token

2. **"No routes found"**
   - Verify coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
   - Check if waypoints are in accessible areas

3. **Geocoding not working**
   - Ensure the address is at least 3 characters long
   - Check if the country filter is appropriate

4. **Map not loading**
   - Verify your Mapbox token has the correct scopes
   - Check browser console for any CORS or network errors

## 📊 Usage Monitoring

Monitor your Mapbox usage at:
- [Mapbox Account Dashboard](https://account.mapbox.com/)
- Check API usage in the "Usage" section
- Set up billing alerts for production use

## 🔄 Migration from Google Maps

The implementation completely replaces Google Maps with Mapbox:

### Removed:
- Google Maps JavaScript API
- Google Places API
- Google Directions API
- Google Maps script loading

### Added:
- Mapbox GL JS
- Mapbox Geocoding API
- Mapbox Directions API
- React Map GL components

## 🎯 Next Steps

1. Set up your Mapbox account and get access token
2. Add environment variables to your `.env` file
3. Test the route planner functionality
4. Monitor API usage and upgrade plan if needed
5. Consider custom map styles for branding

## 📞 Support

- [Mapbox Documentation](https://docs.mapbox.com/)
- [Mapbox Support](https://support.mapbox.com/)
- [React Map GL Documentation](https://visgl.github.io/react-map-gl/)

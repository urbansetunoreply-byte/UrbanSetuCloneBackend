# OpenWeather API Setup Guide

## 1. Create Account
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Click "Sign Up"
3. Fill in your details
4. Verify your email

## 2. Get API Key
1. After login, go to "API keys" tab
2. Copy your default API key
3. Note: It may take 10 minutes to activate

## 3. Choose Plan
- **Free Plan**: 1000 calls/day, 60 calls/minute
- **Paid Plans**: Start from $40/month for higher limits

## 4. Add to Environment Variables
Add to your backend `.env` file:
```env
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

## 5. Test Your API Key
```bash
curl "https://api.openweathermap.org/data/2.5/weather?lat=19.0760&lon=72.8777&appid=YOUR_API_KEY"
```

## API Endpoints Used by UrbanSetu
- **Current Weather**: `/data/2.5/weather`
- **5-Day Forecast**: `/data/2.5/forecast`
- **Air Pollution**: `/data/2.5/air_pollution`

## Cost Information
- **Free Tier**: 1000 calls/day (sufficient for UrbanSetu)
- **Paid**: $40/month for 100,000 calls/day

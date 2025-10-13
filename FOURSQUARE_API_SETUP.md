# Foursquare API Setup Guide

## 1. Create Developer Account
1. Go to [Foursquare Developer](https://developer.foursquare.com/)
2. Click "Get Started"
3. Sign up with your email
4. Verify your account

## 2. Create App
1. Go to "My Apps"
2. Click "Create a new app"
3. Fill in app details:
   - **App Name**: UrbanSetu Real Estate
   - **App Website**: https://urbansetu.vercel.app
   - **App Description**: Real estate platform with location intelligence
4. Click "Create App"

## 3. Get API Credentials
1. In your app dashboard, go to "Settings"
2. Copy:
   - **Client ID** (this is your API key)
   - **Client Secret**

## 4. Add to Environment Variables
Add to your backend `.env` file:
```env
FOURSQUARE_API_KEY=your_foursquare_client_id_here
FOURSQUARE_CLIENT_SECRET=your_foursquare_client_secret_here
```

## 5. Test Your API Key
```bash
curl "https://api.foursquare.com/v2/venues/search?ll=19.0760,72.8777&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&v=20231001"
```

## API Endpoints Used by UrbanSetu
- **Venue Search**: `/v2/venues/search`
- **Venue Details**: `/v2/venues/VENUE_ID`
- **Category Search**: `/v2/venues/categories`

## Cost Information
- **Free Tier**: 1000 calls/day
- **Paid**: $25/month for 10,000 calls/day
- **Note**: This is optional - UrbanSetu works without it

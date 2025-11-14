# Google Places API Setup Guide

## 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "UrbanSetu Real Estate"
4. Click "Create"

## 2. Enable Places API
1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Places API"
3. Click on "Places API"
4. Click "Enable"

## 3. Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

## 4. Secure Your API Key (Important!)
1. Click on your API key to edit it
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domains:
     - `https://urbansetu.vercel.app/*`
     - `https://your-backend-domain.com/*`
     - `http://localhost:3000/*` (for development)
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose "Places API"
4. Click "Save"

## 5. Add to Environment Variables
Add to your backend `.env` file:
```env
GOOGLE_PLACES_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 6. Test Your API Key
```bash
curl "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=19.0760,72.8777&radius=2000&type=hospital&key=YOUR_API_KEY"
```

## Cost Information
- **Free Tier**: 1000 requests per month
- **Paid**: $0.017 per request after free tier
- **Estimated Monthly Cost**: $5-20 for UrbanSetu (depending on usage)

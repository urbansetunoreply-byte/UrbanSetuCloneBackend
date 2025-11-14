# Mapbox Places API Setup Guide

## 1. Create Mapbox Account
- Go to https://account.mapbox.com/
- Sign up or log in

## 2. Get Access Token
- In your Mapbox Account dashboard, copy your Default public token (sk. or pk.)
- If needed, create a new token with appropriate scopes

## 3. Restrict Token (Recommended)
- Click your token → Edit token
- Add URL restrictions if using on web maps
- For backend-only usage here, a standard token is sufficient

## 4. Add to Backend Environment
Add to the root `.env` file (backend):
```
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

## 5. How UrbanSetu Uses Mapbox
- Realtime amenities/schools/transport now prefer Mapbox Geocoding API
- If `MAPBOX_ACCESS_TOKEN` is set, backend uses Mapbox; otherwise it falls back to Google Places if configured, else mock data

## 6. Test Endpoints (Examples)
- Amenities/Location Intelligence (through existing analytics routes)
```
curl "https://your-api.com/api/analytics/location/intelligence?latitude=19.0760&longitude=72.8777&city=Mumbai&type=apartment"
```

## 7. Notes
- Mapbox Places does not include place ratings. Email and UI will show rating=0 for Mapbox results.
- Distance calculations are computed using coordinates provided by Mapbox.

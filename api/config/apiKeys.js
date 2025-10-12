// API Keys Configuration
// Add your API keys to the .env file

export const API_KEYS = {
  // Google APIs
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  
  // Mapbox APIs
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
  
  // Weather APIs
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  
  // Social/Location APIs
  FOURSQUARE_API_KEY: process.env.FOURSQUARE_API_KEY,
  FOURSQUARE_CLIENT_SECRET: process.env.FOURSQUARE_CLIENT_SECRET,
  
  // Real Estate APIs (if available)
  MAGICBRICKS_API_KEY: process.env.MAGICBRICKS_API_KEY,
  HOUSING_API_KEY: process.env.HOUSING_API_KEY,
  PROPTIGER_API_KEY: process.env.PROPTIGER_API_KEY,
  
  // Crime Data APIs (varies by country)
  CRIME_DATA_API_KEY: process.env.CRIME_DATA_API_KEY,
  
  // Alternative data sources
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
};

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Google Places API
  GOOGLE_PLACES: {
    NEARBY_SEARCH: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    PLACE_DETAILS: 'https://maps.googleapis.com/maps/api/place/details/json',
    TEXT_SEARCH: 'https://maps.googleapis.com/maps/api/place/textsearch/json'
  },
  
  // Mapbox APIs
  MAPBOX: {
    DIRECTIONS: 'https://api.mapbox.com/directions/v5/mapbox',
    GEOCODING: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    MATRIX: 'https://api.mapbox.com/directions-matrix/v1/mapbox',
    ISOLINE: 'https://api.mapbox.com/isochrone/v1/mapbox'
  },
  
  // OpenWeather API
  OPENWEATHER: {
    CURRENT_WEATHER: 'https://api.openweathermap.org/data/2.5/weather',
    FORECAST: 'https://api.openweathermap.org/data/2.5/forecast',
    ONECALL: 'https://api.openweathermap.org/data/2.5/onecall'
  },
  
  // Foursquare API
  FOURSQUARE: {
    VENUES_SEARCH: 'https://api.foursquare.com/v2/venues/search',
    VENUES_EXPLORE: 'https://api.foursquare.com/v2/venues/explore'
  },
  
  // Real Estate APIs (if available)
  REAL_ESTATE: {
    MAGICBRICKS: 'https://api.magicbricks.com/v1/properties',
    HOUSING: 'https://api.housing.com/v1/search',
    PROPTIGER: 'https://api.proptiger.com/v1/properties'
  }
};

// Rate limiting configuration
export const RATE_LIMITS = {
  GOOGLE_PLACES: 1000, // requests per day
  MAPBOX: 100000, // requests per month (free tier)
  OPENWEATHER: 1000, // requests per day
  FOURSQUARE: 500, // requests per day
  GENERAL: 100 // requests per hour
};

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 30 * 60 * 1000, // 30 minutes
  LOCATION_DATA_TTL: 60 * 60 * 1000, // 1 hour
  WEATHER_DATA_TTL: 10 * 60 * 1000, // 10 minutes
  MARKET_DATA_TTL: 2 * 60 * 60 * 1000, // 2 hours
  INVESTMENT_DATA_TTL: 4 * 60 * 60 * 1000 // 4 hours
};

// Data quality thresholds
export const DATA_QUALITY = {
  MIN_AMENITIES_COUNT: 3,
  MIN_SCHOOLS_COUNT: 2,
  MIN_TRANSPORT_STATIONS: 1,
  MAX_DISTANCE_KM: 5,
  MIN_RATING: 3.0
};

export default {
  API_KEYS,
  API_ENDPOINTS,
  RATE_LIMITS,
  CACHE_CONFIG,
  DATA_QUALITY
};

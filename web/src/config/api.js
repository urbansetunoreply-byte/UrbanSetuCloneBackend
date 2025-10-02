// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

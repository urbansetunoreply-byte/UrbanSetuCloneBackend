const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Cache for CSRF token to avoid multiple requests
let csrfTokenCache = {
  token: null,
  timestamp: null,
  expiresAt: null
};

// Cache duration: 50 minutes (tokens expire in 1 hour)
const CACHE_DURATION = 50 * 60 * 1000;

/**
 * Fetch CSRF token from the server
 * @returns {Promise<string>} CSRF token
 */
export const fetchCSRFToken = async () => {
  try {
    // Check if we have a valid cached token
    const now = Date.now();
    if (csrfTokenCache.token && 
        csrfTokenCache.timestamp && 
        csrfTokenCache.expiresAt && 
        now < csrfTokenCache.expiresAt && 
        (now - csrfTokenCache.timestamp) < CACHE_DURATION) {
      return csrfTokenCache.token;
    }

    // Fetch new token from server
    const response = await fetch(`${API_BASE_URL}/api/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.csrfToken) {
      throw new Error('No CSRF token received from server');
    }

    // Cache the token
    csrfTokenCache = {
      token: data.csrfToken,
      timestamp: now,
      expiresAt: now + (60 * 60 * 1000) // 1 hour from now
    };

    return data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
};

/**
 * Get CSRF token (from cache or fetch new one)
 * @returns {Promise<string>} CSRF token
 */
export const getCSRFToken = async () => {
  return await fetchCSRFToken();
};

/**
 * Clear CSRF token cache (useful for logout or errors)
 */
export const clearCSRFTokenCache = () => {
  csrfTokenCache = {
    token: null,
    timestamp: null,
    expiresAt: null
  };
};

/**
 * Create fetch options with CSRF token
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Fetch options with CSRF token
 */
export const createAuthenticatedFetchOptions = async (options = {}) => {
  try {
    const csrfToken = await getCSRFToken();
    
    return {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        ...options.headers,
      },
      credentials: 'include',
    };
  } catch (error) {
    console.error('Error creating authenticated fetch options:', error);
    // Return options without CSRF token as fallback
    return {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };
  }
};

/**
 * Make an authenticated API request with CSRF token
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const authenticatedFetch = async (url, options = {}) => {
  const authenticatedOptions = await createAuthenticatedFetchOptions(options);
  return fetch(url, authenticatedOptions);
};
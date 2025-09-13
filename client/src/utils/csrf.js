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
    
    // Always fetch a fresh token since server deletes tokens after use
    const response = await fetch(`${API_BASE_URL}/api/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error('CSRF token fetch failed:', response.status, errorText);
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.csrfToken) {
      throw new Error('No CSRF token received from server');
    }

    // Don't cache the token since server deletes it after use
    return data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
};

/**
 * Get CSRF token (always fetch fresh one since server deletes after use)
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
    // Try once more without caching
    try {
      const csrfToken = await fetchCSRFToken();
      return {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          ...options.headers,
        },
        credentials: 'include',
      };
    } catch (retryError) {
      console.error('Retry failed for CSRF token:', retryError);
      // Return options without CSRF token as final fallback
      return {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      };
    }
  }
};

/**
 * Make an authenticated API request with CSRF token
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const authenticatedFetch = async (url, options = {}) => {
  try {
    const authenticatedOptions = await createAuthenticatedFetchOptions(options);
    
    const response = await fetch(url, authenticatedOptions);
    
    if (!response.ok && response.status === 403) {
      const errorData = await response.json().catch(() => ({ message: 'CSRF token error' }));
      console.error('CSRF token error:', errorData);
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
};

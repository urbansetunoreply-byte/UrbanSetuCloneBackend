import { API_BASE_URL } from '../config/api';

export const areCookiesEnabled = () => {
  // Dummy function to prevent breaking imports
  return true;
};

export const getAuthToken = () => {
  return localStorage.getItem("accessToken");
};

export const createAuthenticatedFetchOptions = (options = {}) => {
  const token = getAuthToken();
  const sessionId = localStorage.getItem("sessionId");

  return {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(sessionId ? { 'X-Session-Id': sessionId } : {})
    }
  };
};

export const authenticatedFetch = async (url, options = {}) => {
  const opts = createAuthenticatedFetchOptions(options);
  let response = await fetch(url, opts);

  if (response.status === 401 && !options._retry) {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include'
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.token) {
          localStorage.setItem("accessToken", data.token);
          // Retry original request with new token
          const newOpts = createAuthenticatedFetchOptions({ ...options, _retry: true });
          response = await fetch(url, newOpts);
        }
      } else {
        // Refresh failed (e.g. refresh token expired)
        // Optionally clear auth data here, but usually we let the UI handle the final 401.
        clearAuthData();
        // We could also redirect to sign-in, but that might be intrusive for a utility function.
        // Checking if we are in a browser environment to safely redirect
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/sign-in')) {
          window.location.href = '/sign-in';
        }
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      clearAuthData();
    }
  }
  return response;
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("sessionId");
  localStorage.removeItem("refreshToken");
};
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
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(sessionId ? { 'X-Session-Id': sessionId } : {})
    }
  };
};

export const authenticatedFetch = async (url, options = {}) => {
  const opts = createAuthenticatedFetchOptions(options);
  return fetch(url, opts);
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
};
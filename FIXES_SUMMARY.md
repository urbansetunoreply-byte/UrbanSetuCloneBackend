# Fixes for Call Feature Issues

## Issues Fixed

### 1. "process is not defined" Error
**Problem**: `simple-peer` library tries to access `process.env` which doesn't exist in browser.

**Solution**:
- Updated `vite.config.js` to properly polyfill `process.env` for production builds
- Added `buffer` to `optimizeDeps.include` to ensure it's bundled
- Improved `define` configuration to handle `process.env` properly

**Files Changed**:
- `web/vite.config.js`

### 2. "Not authenticated" / "jwt expired" Error
**Problem**: JWT tokens expire and socket authentication fails, causing "Not authenticated" errors.

**Solutions**:
- Added token expiration check in `useCall.js` before initiating calls
- Added better error handling in `socket.js` for JWT expiration
- Clear expired tokens and redirect to sign-in page when token is expired
- Added token validation before socket reconnection

**Files Changed**:
- `web/src/hooks/useCall.js`
- `web/src/utils/socket.js`

### 3. Backend Environment Variables
**Status**: Your backend `JWT_TOKEN` is correctly set in Render environment variables:
```
JWT_TOKEN=raj77j0928908msnwejj9i3813
JWT_EXPIRE=7d
```

**Action Required**:
- ✅ JWT_TOKEN is already set correctly
- ✅ JWT_EXPIRE is set to 7 days
- ⚠️ If you're still getting "jwt expired" errors:
  1. Sign in again to get a fresh token
  2. Check if your token hasn't actually expired (7 days is the expiry time)
  3. Ensure backend server is using the same JWT_TOKEN value

## How to Test

1. **For "process is not defined"**:
   - Build the project: `npm run build`
   - The error should no longer appear

2. **For JWT expiration**:
   - If you get "jwt expired" error, simply sign in again
   - The app will now properly detect expired tokens and redirect to sign-in
   - Check backend logs to ensure JWT_TOKEN is being read correctly

3. **For socket authentication**:
   - Make a call after signing in
   - If token expires during session, you'll be redirected to sign-in
   - Socket will attempt to reconnect with a fresh token if available

## Next Steps

1. **Sign in again** if your token has expired
2. **Test the call feature** after signing in with a fresh token
3. **Check backend logs** to verify JWT_TOKEN is being used correctly

## Important Notes

- JWT tokens expire after 7 days (as set in JWT_EXPIRE)
- The frontend now checks token expiration before making calls
- Expired tokens are automatically cleared and user is redirected to sign-in
- Backend `JWT_TOKEN` must match between dev and production environments


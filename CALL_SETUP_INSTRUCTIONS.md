# Call Feature Setup Instructions

## Issues Fixed

### 1. "Not authenticated" Error
**Problem**: Socket connection wasn't properly authenticated when initiating calls.

**Solution**: 
- Added better error handling in socket authentication middleware
- Added socket connection check before initiating calls
- Improved logging to debug authentication issues

### 2. "process is not defined" Error
**Problem**: `simple-peer` library tries to access `process.env` which doesn't exist in browser.

**Solution**: 
- Updated `vite.config.js` to define `process.env` and `global` polyfills
- Added buffer alias for compatibility

## Backend Environment Variables Required

**CRITICAL**: You MUST set the `JWT_TOKEN` environment variable in your backend `.env` file for call authentication to work.

### Current Status
Your backend code uses `process.env.JWT_TOKEN` in:
- `api/index.js` (Socket.IO authentication)
- `api/utils/verify.js` (Token verification)
- `api/controllers/auth.controller.js` (Token signing/verification)

### How to Set It:

1. **Check your backend `.env` file**:
   - Open `api/.env` or the root `.env` file
   - Look for `JWT_TOKEN=...`

2. **If `JWT_TOKEN` is NOT set**:
   - Generate a secure random string (at least 32 characters)
   - **Option 1 (Recommended)**: Use OpenSSL:
     ```bash
     openssl rand -base64 32
     ```
   - **Option 2**: Use Node.js:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```
   - **Option 3**: Use any secure random string generator
   
   - Add to your `.env` file:
     ```
     JWT_TOKEN=your_generated_secret_here
     ```
   
   - **IMPORTANT**: Use the SAME secret for all environments (dev, production)
   - **SECURITY**: Never commit this to git! It should be in `.gitignore`

3. **If `JWT_TOKEN` is already set**:
   - Verify it's the same value used throughout your auth system
   - If authentication is working (sign in/out works), then `JWT_TOKEN` is already set correctly

4. **Restart your backend server** after verifying/adding the environment variable:
   ```bash
   npm run dev
   # or
   npm start
   ```

### Verification
After setting `JWT_TOKEN` and restarting:
- Check backend console for any JWT-related errors
- Try signing in - if it works, JWT_TOKEN is correct
- Try making a call - should no longer get "Not authenticated" error

## Frontend Configuration

The frontend is already configured with:
- Vite polyfills for `process.env` and `global`
- Socket authentication using cookies/localStorage
- Proper error handling for call initiation

## Testing

After setting up the environment variable:

1. **Restart your backend server**
2. **Refresh your frontend**
3. **Sign in** to ensure socket is authenticated
4. **Try initiating a call** from the chatbox

## Troubleshooting

### Still getting "Not authenticated"?
1. Check backend console for authentication errors
2. Verify `JWT_TOKEN` is set in backend `.env`
3. Check browser console for socket connection status
4. Ensure you're signed in before making calls

### Still getting "process is not defined"?
1. Clear browser cache
2. Restart Vite dev server: `npm run dev` in `web` directory
3. Check that `vite.config.js` has the polyfill configuration

### Socket not connecting?
1. Check that socket URL is correct in `web/src/utils/socket.js`
2. Verify backend Socket.IO server is running
3. Check browser console for connection errors


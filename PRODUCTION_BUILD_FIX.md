# Production Build Fix - process is not defined

## Issues Fixed

### 1. "process is not defined" Error in Production
**Problem**: `simple-peer` library tries to access `process.env` which doesn't exist in browser production builds.

**Solution**:
- ✅ Installed `process` package for browser polyfill
- ✅ Added `process` alias in vite.config.js
- ✅ Added `process` to optimizeDeps
- ✅ Added proper `process` definition for production builds

### 2. JWT Expired Error
**Problem**: JWT token has expired (7-day expiry).

**Solution**:
- ⚠️ **You need to sign in again** to get a fresh token
- ✅ Added token expiration check before initiating calls
- ✅ Automatic redirect to sign-in when token expires

---

## What You Need to Do

### Step 1: Install Dependencies
Run this in your `web` directory:
```bash
npm install process
```

### Step 2: Rebuild and Deploy
```bash
npm run build
```

Then push to Vercel or redeploy.

### Step 3: Sign In Again
**Important**: Your JWT token has expired. You must:
1. **Sign in again** on your Vercel site
2. This will get you a fresh JWT token (valid for 7 days)
3. **Then try making a call** again

---

## Technical Details

### Files Changed
1. **`web/vite.config.js`**:
   - Added `process` alias: `process: 'process/browser'`
   - Added `process` to optimizeDeps
   - Added proper `process` definition for production

2. **`web/package.json`**:
   - Added `process` package dependency

3. **`web/src/hooks/useCall.js`**:
   - Added token expiration check before initiating calls

4. **`web/src/utils/socket.js`**:
   - Added JWT expiration error handling

---

## After Deployment

1. **Clear browser cache** (important!)
2. **Sign in again** (your token expired)
3. **Test call feature**

---

## Why This Happens

- `simple-peer` is a Node.js library that expects `process.env` to exist
- In browser, `process` doesn't exist by default
- We need to polyfill it for production builds
- JWT tokens expire after 7 days (set in `JWT_EXPIRE`)

---

## Quick Fix Summary

1. ✅ Install `process` package: `npm install process`
2. ✅ Rebuild: `npm run build`
3. ✅ Deploy to Vercel
4. ⚠️ **Sign in again** (token expired!)
5. ✅ Test call feature


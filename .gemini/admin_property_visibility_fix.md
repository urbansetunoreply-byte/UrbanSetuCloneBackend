# Admin Property Visibility Fix

## Issue
Admin users (including root admin) were not able to see all properties in AdminDashboard, AdminExplore, and AdminListings pages, regardless of their verification status. This was because the backend was filtering out unverified properties for non-authenticated requests.

## Root Cause
The backend API endpoint `/api/listing/get` (in `listing.controller.js`) checks if the requester is an admin by examining `req.user`. If the user is an admin, it shows all properties. If not, it only shows verified and public properties.

The problem was that some admin pages were making API calls without including credentials, so the backend couldn't identify them as admins.

## Solution
Added `withCredentials: true` (for axios) or `credentials: 'include'` (for fetch) to all listing API calls in admin pages to ensure authentication cookies are sent with the requests.

## Files Modified

### 1. AdminDashboard.jsx
**Location:** `d:\Videos\Project\UrbanSetu\web\src\pages\AdminDashboard.jsx`

**Changes:**
- Line 244: Added `{ withCredentials: true }` to `fetchOfferListings()`
- Line 253: Added `{ withCredentials: true }` to `fetchRentListings()`
- Line 262: Added `{ withCredentials: true }` to `fetchSaleListings()`

**Before:**
```javascript
const res = await axios.get(`${API_BASE_URL}/api/listing/get?offer=true&limit=6`);
```

**After:**
```javascript
const res = await axios.get(`${API_BASE_URL}/api/listing/get?offer=true&limit=6`, { withCredentials: true });
```

### 2. AdminExplore.jsx
**Location:** `d:\Videos\Project\UrbanSetu\web\src\pages\AdminExplore.jsx`

**Changes:**
- Line 84: Added `{ credentials: 'include' }` to initial fetch in `fetchListings()`
- Line 679: Added `{ credentials: 'include' }` to `showMoreListingClick()`

**Before:**
```javascript
const res = await fetch(`${API_BASE_URL}/api/listing/get?${urlParams.toString()}`);
```

**After:**
```javascript
const res = await fetch(`${API_BASE_URL}/api/listing/get?${urlParams.toString()}`, { credentials: 'include' });
```

### 3. AdminListings.jsx
**Location:** `d:\Videos\Project\UrbanSetu\web\src\pages\AdminListings.jsx`

**Status:** ✅ Already correct - no changes needed
- Line 99: Already has `{ credentials: 'include', signal: controller.signal }`
- Line 124: Already has `{ credentials: 'include' }`

## Backend Logic (No Changes Required)
**File:** `d:\Videos\Project\UrbanSetu\api\controllers\listing.controller.js`

The backend already has the correct logic in the `getListings` function (lines 659-668):

```javascript
// Verification Filter: Only show verified and public properties to non-admin users
// Check if user is authenticated and is admin
const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'rootadmin' || req.user.isDefaultAdmin);

if (!isAdmin) {
  // For public/non-admin users: only show verified and public properties
  query.isVerified = true;
  query.visibility = 'public';
}
// Admins can see all properties (no filter applied)
```

## Testing
After these changes, admin users should be able to see:
- ✅ All properties (verified and unverified)
- ✅ All visibility states (public and private)
- ✅ Complete property listings in AdminDashboard, AdminExplore, and AdminListings

Regular users will continue to see only:
- ✅ Verified properties
- ✅ Public properties

## Date
December 17, 2025

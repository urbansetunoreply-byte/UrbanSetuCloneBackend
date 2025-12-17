# Admin Property Visibility Fix

## Issue
Admin users (including root admin) were not able to see all properties in AdminDashboard, AdminExplore, and AdminListings pages, regardless of their verification status. This was because the backend was filtering out unverified properties AND applying visibility/availability filters to admin users.

## Root Cause
There were TWO issues in the backend:

1. **Authentication Issue**: Some admin pages were making API calls without including credentials, so the backend couldn't identify them as admins.

2. **Backend Filtering Issue**: Even when authenticated as admin, the backend was applying visibility and availability status filters to ALL users (including admins), which filtered out properties that were:
   - Not verified
   - Not public (private visibility)
   - Booked/rented
   - Under contract
   - Sold
   - Reserved

## Solution

### Part 1: Frontend Authentication Fix
Added `withCredentials: true` (for axios) or `credentials: 'include'` (for fetch) to all listing API calls in admin pages to ensure authentication cookies are sent with the requests.

### Part 2: Backend Filter Logic Fix
Modified the `getListings` function in the backend to **completely bypass** visibility and availability filtering for admin users.

## Files Modified

### Frontend Changes

#### 1. AdminDashboard.jsx
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

#### 2. AdminExplore.jsx
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

#### 3. AdminListings.jsx
**Location:** `d:\Videos\Project\UrbanSetu\web\src\pages\AdminListings.jsx`

**Status:** ✅ Already correct - no changes needed
- Line 99: Already has `{ credentials: 'include', signal: controller.signal }`
- Line 124: Already has `{ credentials: 'include' }`

### Backend Changes

#### listing.controller.js (CRITICAL FIX)
**Location:** `d:\Videos\Project\UrbanSetu\api\controllers\listing.controller.js`

**Changes:** Lines 659-714 in the `getListings` function

**Before:**
```javascript
// Verification Filter: Only show verified and public properties to non-admin users
const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'rootadmin' || req.user.isDefaultAdmin);

if (!isAdmin) {
  query.isVerified = true;
  query.visibility = 'public';
}

// This code was applying to EVERYONE including admins
const visibility = req.query.visibility || 'all';
const availabilityFilter = req.query.availabilityStatus;
// ... availability filtering logic that affected admins too
```

**After:**
```javascript
// Verification Filter: Only show verified and public properties to non-admin users
const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'rootadmin' || req.user.isDefaultAdmin);

if (!isAdmin) {
  query.isVerified = true;
  query.visibility = 'public';
}

// Visibility and availability filters - ONLY apply to non-admin users
if (!isAdmin) {
  const visibility = req.query.visibility || 'all';
  const availabilityFilter = req.query.availabilityStatus;
  // ... availability filtering logic now ONLY for non-admins
}
// Admins bypass all visibility and availability filters
```

**Key Change:** Wrapped the entire visibility and availability filtering logic inside an `if (!isAdmin)` block, ensuring these filters are completely bypassed for admin users.

## Testing
After these changes, admin users should be able to see:
- ✅ All properties (verified AND unverified)
- ✅ All visibility states (public AND private)
- ✅ All availability statuses (available, booked, rented, under contract, sold, reserved, suspended)
- ✅ Complete property listings in AdminDashboard, AdminExplore, and AdminListings

Regular users will continue to see only:
- ✅ Verified properties
- ✅ Public properties
- ✅ Available properties (not booked, sold, or under contract)

## Date
December 17, 2025

## Update Log
- **Initial Fix**: Added credentials to frontend API calls
- **Critical Backend Fix**: Wrapped visibility and availability filters in `if (!isAdmin)` block to completely bypass these filters for admin users

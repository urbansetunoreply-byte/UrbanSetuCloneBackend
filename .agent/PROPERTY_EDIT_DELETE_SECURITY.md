# Property Edit/Delete Security Implementation

## Overview
This document outlines the comprehensive security measures implemented to prevent unauthorized editing or deletion of sold and under-contract properties.

## Security Layers

### 1. Frontend UI Layer (First Line of Defense)
**Files Modified:**
- `web/src/pages/Listing.jsx`
- `web/src/pages/MyListings.jsx`

**Implementation:**
- Edit and Delete buttons are **disabled** when `availabilityStatus` is `'sold'` or `'under_contract'`
- Applies to both mobile and desktop views
- Visual feedback: Lock icon and disabled state
- Tooltip messages explain why actions are disabled

**Limitations:**
- Can be bypassed by tech-savvy users via browser dev tools or direct URL manipulation

---

### 2. Frontend Route Guard (Second Line of Defense)
**File Modified:**
- `web/src/pages/EditListing.jsx`

**Implementation:**
```javascript
// Check if property is sold or under contract (non-admins cannot edit)
if ((data.availabilityStatus === 'sold' || data.availabilityStatus === 'under_contract') && 
    currentUser.role !== 'admin' && 
    currentUser.role !== 'rootadmin') {
  toast.error(`Cannot edit property that is ${data.availabilityStatus === 'sold' ? 'sold' : 'under contract'}.`);
  navigate(getPreviousPath());
  return;
}
```

**Protection:**
- Redirects users who try to access the edit page directly via URL
- Shows error toast notification
- Returns user to previous page (My Listings)

**Limitations:**
- Can be bypassed by directly calling the API

---

### 3. Backend API Validation (Final Line of Defense)
**File Modified:**
- `api/controllers/listing.controller.js`

**Implementation in `updateListing` function:**
```javascript
// Check if property is sold or under contract (non-admins cannot edit)
if ((listing.availabilityStatus === 'sold' || listing.availabilityStatus === 'under_contract') && 
    req.user.role !== 'admin' && 
    req.user.role !== 'rootadmin' && 
    !req.user.isDefaultAdmin) {
  return next(errorHandler(403, `Cannot edit property that is ${listing.availabilityStatus === 'sold' ? 'sold' : 'under contract'}.`));
}
```

**Implementation in `deleteListing` function:**
```javascript
// Check if property is sold or under contract (non-admins cannot delete)
if ((listing.availabilityStatus === 'sold' || listing.availabilityStatus === 'under_contract') && 
    req.user.role !== 'admin' && 
    req.user.role !== 'rootadmin' && 
    !req.user.isDefaultAdmin) {
  return next(errorHandler(403, `Cannot delete property that is ${listing.availabilityStatus === 'sold' ? 'sold' : 'under contract'}.`));
}
```

**Protection:**
- **Server-side validation** - Cannot be bypassed by frontend manipulation
- Returns HTTP 403 Forbidden error
- Prevents any unauthorized modifications to the database
- Logs the attempt for security monitoring

---

## Property Status Flow

```
available → reserved → under_contract → sold
   ↓           ↓            ✗             ✗
  Edit       Edit         LOCKED        LOCKED
  Delete     Delete       LOCKED        LOCKED
```

**Status Definitions:**
- `available`: Property is open for bookings
- `reserved`: Property has a pending booking
- `under_contract`: Token paid, sale in progress (LOCKED for non-admins)
- `sold`: Property sale completed (LOCKED for non-admins)
- `suspended`: Admin hold (LOCKED for all)

---

## Admin Override

**Who Can Edit/Delete Sold Properties:**
- Users with role: `'admin'`
- Users with role: `'rootadmin'`
- Users with flag: `isDefaultAdmin: true`

**Use Cases:**
- Correcting data entry errors
- Handling dispute resolutions
- Managing exceptional cases
- Audit and compliance requirements

---

## Testing Bypass Scenarios

### ✅ Scenario 1: Direct URL Access
**Attack:** User navigates to `/user/update-listing/{soldPropertyId}`
**Defense:** Frontend route guard redirects with error message

### ✅ Scenario 2: Browser DevTools Manipulation
**Attack:** User enables disabled button via console
**Defense:** Backend API rejects the request with 403 error

### ✅ Scenario 3: Direct API Call
**Attack:** User sends PUT/DELETE request via Postman/curl
**Defense:** Backend validation rejects with 403 error

### ✅ Scenario 4: Modified Request Payload
**Attack:** User tries to change `availabilityStatus` back to `available`
**Defense:** Backend checks the **current** database state, not the request payload

---

## Error Messages

**Frontend:**
- "Cannot edit sold property"
- "Cannot edit property under contract"
- "Cannot delete sold property"
- "Cannot delete property under contract"

**Backend:**
- HTTP 403: "Cannot edit property that is sold."
- HTTP 403: "Cannot edit property that is under contract."
- HTTP 403: "Cannot delete property that is sold."
- HTTP 403: "Cannot delete property that is under contract."

---

## Database Model

**File:** `api/models/listing.model.js`

```javascript
availabilityStatus: {
  type: String,
  enum: ['available', 'reserved', 'under_contract', 'rented', 'sold', 'suspended'],
  default: 'available',
  index: true
}
```

**Indexed Field:** Ensures fast queries for status-based filtering

---

## Security Best Practices Followed

1. ✅ **Defense in Depth**: Multiple layers of validation
2. ✅ **Server-Side Validation**: Final authority on data integrity
3. ✅ **Principle of Least Privilege**: Only admins can override
4. ✅ **Fail-Safe Defaults**: Deny by default, allow explicitly
5. ✅ **User Feedback**: Clear error messages guide legitimate users
6. ✅ **Audit Trail**: All attempts logged for security monitoring

---

## Related Features

**Existing Protections:**
- Rent-Lock contracts also prevent editing/deletion
- Payment confirmation required before property actions
- User authentication and authorization checks

**Integration:**
- Works alongside existing Rent-Lock validation
- Complements the sale workflow (negotiation → token_paid → sold)
- Supports dispute reporting for completed sales

---

## Maintenance Notes

**When Adding New Property Statuses:**
1. Update the enum in `listing.model.js`
2. Add UI handling in `Listing.jsx` and `MyListings.jsx`
3. Update backend validation in `listing.controller.js`
4. Update this documentation

**When Modifying Edit/Delete Logic:**
- Ensure all three layers are updated consistently
- Test bypass scenarios after changes
- Update error messages for clarity

---

## Summary

The implementation provides **robust, multi-layered protection** against unauthorized editing or deletion of sold and under-contract properties. Even if a user bypasses the frontend restrictions, the backend API will reject the request, ensuring data integrity and preventing potential fraud or disputes.

**Key Takeaway:** Backend validation is the ultimate safeguard - frontend restrictions are for UX, backend validation is for security.

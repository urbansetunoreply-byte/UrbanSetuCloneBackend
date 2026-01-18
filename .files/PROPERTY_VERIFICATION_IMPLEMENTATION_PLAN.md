# Property Verification System - Implementation Plan

## Current State Analysis

### Existing Implementation (Rent Properties Only)
1. **PropertyVerification.jsx** - User-side verification page
   - Currently filters only `type === 'rent'` properties (line 102)
   - Shows "Request Verification" button for unverified properties
   - Shows "View Status" button for properties with verification requests

2. **PropertyVerification Model** - Stores verification data
   - Tracks documents (ownership, identity, address proof)
   - Physical inspection details
   - Badge issuance and expiry
   - Status: pending, in_progress, verified, rejected

3. **Email Templates** - Existing
   - `sendPropertyListingPublishedEmail` - Sent when property is created
   - Property verification email (already exists for rent)

### Current Flow (Rent Properties)
```
Create Listing → Published Email → User Requests Verification → 
Admin Verifies → Verification Email → Badge Issued
```

---

## Required Changes

### 1. Email Templates (emailService.js)

#### New Templates to Create:
1. **`sendPropertyCreatedPendingVerificationEmail`**
   - Subject: "Property Created - Verification Required to Publish"
   - Content: Property created successfully but not published yet
   - Action: Complete verification to make it live
   - Include verification link

2. **`sendPropertyVerificationReminderEmail`**
   - Subject: "Reminder: Complete Your Property Verification"
   - Content: Your property is waiting for verification
   - Days since creation
   - Action: Complete verification now

3. **`sendPropertyPublishedAfterVerificationEmail`**
   - Subject: "🎉 Your Property is Now Live!"
   - Content: Property verified and published
   - Link to view listing
   - Share on social media options

#### Modified Templates:
1. **Update `sendPropertyListingPublishedEmail`**
   - Change to `sendPropertyCreatedPendingVerificationEmail` for initial creation
   - Only send "Published" email after verification

---

### 2. Listing Controller (listing.controller.js)

#### `createListing` Function Changes:
```javascript
// Current: Sends published email immediately
await sendPropertyListingPublishedEmail(...)

// New: Send pending verification email
await sendPropertyCreatedPendingVerificationEmail(...)

// Set listing as unpublished initially
listing.isVerified = false;
listing.visibility = 'private'; // or similar flag
```

#### New Function: `publishListingAfterVerification`
```javascript
export const publishListingAfterVerification = async (listingId) => {
  // Update listing.isVerified = true
  // Send verification email
  // Send published email
  // Update visibility to public
}
```

---

### 3. Property Verification Page (PropertyVerification.jsx)

#### Changes:
```javascript
// Line 102: Remove rent-only filter
// OLD:
const rentalListings = data.filter(listing => listing.type === 'rent');

// NEW:
const allListings = data; // Show both sale and rent
```

#### Update UI Text:
- Change "rental property" to "property"
- Update descriptions to be generic

---

### 4. Admin Property Verification

#### Find and Update Admin Verification Page:
- Extend to handle both sale and rent properties
- When admin verifies:
  1. Update PropertyVerification status to 'verified'
  2. Update Listing.isVerified = true
  3. Send verification confirmation email
  4. Send property published email
  5. Make listing visible on public pages

---

### 5. Listing Model (listing.model.js)

#### Add/Update Fields:
```javascript
isVerified: {
  type: Boolean,
  default: false,
  index: true
},
verificationId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'PropertyVerification',
  default: null
},
visibility: {
  type: String,
  enum: ['private', 'public'],
  default: 'private', // Changed from 'public'
  index: true
}
```

---

### 6. Public Pages Filtering

#### Pages to Update:
1. **Home.jsx** - Filter `isVerified === true`
2. **PublicHome.jsx** - Filter `isVerified === true`
3. **Explore.jsx** - Filter `isVerified === true`
4. **AdminExplore.jsx** - Show all (admin can see unverified)
5. **PublicExplore.jsx** - Filter `isVerified === true`
6. **Search/Suggestions** - Filter `isVerified === true`

#### Query Update:
```javascript
// Add to all public listing queries
const query = {
  isVerified: true,
  visibility: 'public',
  // ... other filters
};
```

---

### 7. MyListings.jsx

#### Add Verification Button:
```javascript
{!listing.isVerified && (
  <button
    onClick={() => navigate(`/user/property-verification?listingId=${listing._id}`)}
    className="text-yellow-600 hover:text-yellow-800"
    title="Verify Property"
  >
    <FaShieldAlt /> Verify
  </button>
)}
```

#### Show Verification Status:
```javascript
{listing.isVerified ? (
  <span className="text-green-600">✓ Verified</span>
) : (
  <span className="text-yellow-600">⚠ Pending Verification</span>
)}
```

---

### 8. Listing.jsx & PropertyCard Component

#### Add Verified Badge:
```javascript
{listing.isVerified && (
  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
    <FaCheckCircle /> Verified
  </div>
)}
```

---

### 9. Verification Reminder Scheduler

#### New File: `api/schedulers/verificationReminder.js`
```javascript
import cron from 'node-cron';
import Listing from '../models/listing.model.js';
import { sendPropertyVerificationReminderEmail } from '../utils/emailService.js';

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  const unverifiedListings = await Listing.find({
    isVerified: false,
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 1 day
  }).populate('userRef');

  for (const listing of unverifiedListings) {
    const daysSinceCreation = Math.floor(
      (Date.now() - listing.createdAt) / (1000 * 60 * 60 * 24)
    );

    // Send reminders on day 1, 3, 7, 14
    if ([1, 3, 7, 14].includes(daysSinceCreation)) {
      await sendPropertyVerificationReminderEmail(
        listing.userRef.email,
        listing,
        daysSinceCreation
      );
    }
  }
});
```

---

## Implementation Order

### Phase 1: Email Templates (Priority: HIGH)
1. Create `sendPropertyCreatedPendingVerificationEmail`
2. Create `sendPropertyVerificationReminderEmail`
3. Create `sendPropertyPublishedAfterVerificationEmail`

### Phase 2: Backend Changes (Priority: HIGH)
1. Update Listing model (add visibility field)
2. Update `createListing` controller
3. Update admin verification controller
4. Add `publishListingAfterVerification` function

### Phase 3: Frontend - Verification Pages (Priority: HIGH)
1. Update PropertyVerification.jsx (remove rent filter)
2. Update MyListings.jsx (add verify button)
3. Find and update Admin verification page

### Phase 4: Frontend - Public Pages (Priority: MEDIUM)
1. Update Home.jsx
2. Update PublicHome.jsx
3. Update Explore pages
4. Update PropertyCard component
5. Update Listing.jsx

### Phase 5: Scheduler (Priority: LOW)
1. Create verification reminder scheduler
2. Test reminder emails

---

## Testing Checklist

- [ ] Create new sale property → Receives pending verification email
- [ ] Create new rent property → Receives pending verification email
- [ ] Property not visible on public pages before verification
- [ ] User can request verification from PropertyVerification page
- [ ] Admin can verify property
- [ ] After verification: 2 emails sent (verification + published)
- [ ] Verified property appears on public pages
- [ ] Verified badge shows on listing cards
- [ ] Reminder emails sent at correct intervals
- [ ] MyListings shows verification status

---

## Database Migration

### Update Existing Listings:
```javascript
// Set all existing listings as verified (grandfathered in)
await Listing.updateMany(
  { isVerified: { $exists: false } },
  { 
    $set: { 
      isVerified: true,
      visibility: 'public'
    } 
  }
);
```

---

## Security Considerations

1. Only property owner can request verification
2. Only admin can approve verification
3. Unverified properties only visible to owner and admin
4. Verification status cannot be manually changed by owner

---

## Next Steps

1. Review this plan with stakeholders
2. Begin Phase 1 implementation
3. Test each phase before moving to next
4. Deploy incrementally with feature flags

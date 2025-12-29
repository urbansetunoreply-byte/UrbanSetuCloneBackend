# Three UI/UX Fixes Implementation

## Fix 1: AdminAppointments.jsx - Dark Mode Chat Options Menu

**Location**: Lines 7161-7321 in `web/src/pages/AdminAppointments.jsx`

### Changes Needed:

Replace text colors for each menu item to add dark mode support:

```javascript
// Line 7162 - Reports
className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"

// Line 7173 - Refresh Messages  
className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"

// Line 7184 - Settings
className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"

// Line 7195 - Starred Messages
className="w-full px-4 py-2 text-left text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 flex items-center gap-2"

// Line 7212 - Select Messages
className="w-full px-4 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2"

// Line 7227 - Text Styling  
className="w-full px-4 py-2 text-left text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-2"

// Line 7243 - Tips & Guidelines
className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"

// Line 7258 - Export Chat
className="w-full px-4 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 flex items-center gap-2"

// Line 7271 - Call History
className="w-full px-4 py-2 text-left text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-2"

// Line 7284 - View Buyer Details
className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"

// Line 7295 - View Seller Details
className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"

// Line 7305 - Divider
className="border-t border-gray-200 dark:border-gray-700 my-1"

// Line 7309 - Delete Entire Chat
className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
```

---

## Fix 2: Mobile Emoji Picker Focus Issues

### Files to Modify:
- `web/src/pages/MyAppointments.jsx`
- `web/src/pages/AdminAppointments.jsx`

### Step 1: Add import at the top of BOTH files

```javascript
import { isMobileDevice } from '../utils/mobileUtils';
```

###  Step 2: Find emoji picker implementation

Search for terms like:
- "emoji"
- "EmojiPicker"
- "Picker"
- "🙂" or "😀"

### Step 3: Fix auto-focus on emoji search (usually in a Picker component)

Change:
```javascript
autoFocus={true}
```

To:
```javascript
autoFocus={!isMobileDevice()}
```

### Step 4: Fix message input re-focus after emoji selection

Find the emoji click handler (function that adds emoji to message), then wrap the focus call:

Change:
```javascript
inputRef.current.focus();
```

To:
```javascript
if (!isMobileDevice()) {
  inputRef.current.focus();
}
```

---

## Fix 3: AdminEditListing - Filter Admin Emails from User Suggestions

**File**: `web/src/pages/AdminEditListing.jsx`

### Need to locate:
- User assignment/selection section
- User search/autocomplete component  
- API call fetching users

### Apply Filter:

**Option A - Frontend filtering:**
```javascript
const regularUsersOnly = allUsers.filter(user => 
  user.role === 'user' // Only show regular users, not 'admin' or 'rootadmin'
);
```

**Option B - API query parameter:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/users?role=user`, {
  credentials: 'include'
});
```

---

## Implementation Status:
- ❌ Fix 1 - Not yet applied (need to modify AdminAppointments.jsx)
- ❌ Fix 2 - Not yet applied (need to find emoji picker in both files)
- ❌ Fix 3 - Not yet applied (need to locate user assignment section)

Ready to implement all fixes!

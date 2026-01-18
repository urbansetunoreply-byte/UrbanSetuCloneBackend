# Rental Ratings Mobile UI Fix

## Issues Resolved
- **Modal Visibility:** The "Rating Details" modal (and "Rate Form" modal) was not properly visible on mobile devices.
    - **Root Cause:** Use of `flex items-center` on the modal wrapper centered content vertically, which, when combined with `max-h-screen` or tall content, caused the top of the modal to be cut off on scroll. Also lack of proper `min-h` styling constraints.
- **Content Layout:** Inside the Rating Details modal, the header sections (User Info vs Star Rating) were side-by-side (`flex-row`), causing overlaps on narrow screens.

## Fixes Applied
1.  **`RentalRatings.jsx` (Modal Container):**
    - Updated both `RatingForm` and `RatingDisplay` modal wrappers.
    - Switched to the "Full Viewport Scroll" pattern:
        - Outer: `fixed inset-0 z-50 overflow-y-auto`
        - Inner Wrapper: `flex min-h-full items-center justify-center p-4`
        - Content: `relative`
    - This ensures that if content is taller than the screen, the user can scroll the *entire* text, and it starts from the top.

2.  **`RatingDisplay.jsx` (Content):**
    - Updated Tenant and Landlord rating header sections.
    - Changed `flex-row` to `flex-col sm:flex-row`.
    - Added `gap-4` for spacing when stacked.
    - This ensures User Info (Avatar + Name) is displayed clearly above the Star Rating on mobile, preventing layout breakage.

## Verification
- Open "Rental Ratings".
- Click "View Details" on a rating.
- On Mobile:
    - The modal should fit within the screen width.
    - You should be able to scroll down to see all comments.
    - The top User Info section should stack neatly.

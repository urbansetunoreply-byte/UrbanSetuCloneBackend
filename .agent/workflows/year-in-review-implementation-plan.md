---
description: Implementation plan for Year in Review (Flashback) feature
---
# Year in Review (Flashback) Feature Implementation Plan

## Objective
Implement a "Year in Review" feature similar to Spotify Wrapped, providing users and admins with a personalized, animated summary of their activity on UrbanSetu at the end of the year.

## 1. Backend Implementation

### A. Data Aggregation Controller
Create `api/controllers/yearInReview.controller.js` to calculate user stats for a specific year.

**Data Points to Collect (User):**
- **Properties Viewed**: Count from `PropertyView` model.
- **Top Locations**: Most visited cities/areas from views.
- **Interactions**: Count of `Wishlist` items, `Contact` requests.
- **Bookings/Rent-Locks**: Count and total value from `Booking` / `RentLockContract`.
- **Community**: `Review`s left, `ForumPost`s created.
- **Gamification**: Total SetuCoins earned (`CoinTransaction`).
- **Personality Type Logic**:
    - *The Window Shopper*: High views, low interaction.
    - *The Serious Searcher*: High contacts/bookings.
    - *The Community Pillar*: High reviews/forum activity.
    - *The Investor*: High value properties viewed/saved.

**Data Points to Collect (Admin):**
- **System Health**: Total users managed, listings verified.
- **Reports**: Reports resolved.
- **Financials**: Total volume processed.

### B. API Routes
- `GET /api/user/year-in-review/:year` (Protected) - Returns JSON stats for the logged-in user.
- `GET /api/admin/year-in-review/:year` (Protected, Admin only) - Returns system-wide stats.

### C. Email Job Scheduler
Create `api/utils/yearInReviewScheduler.js`.
- **Schedule**: Runs daily from Dec 20th to Dec 31st.
- **Logic**:
    - Fetch all active users.
    - Check specific flag `yearInReviewSent_{year}` in User model (need to add this field or a separate tracking collection) to avoid duplicate emails.
    - Process in batches (e.g., 500 users/batch) to respect email provider limits.
    - Generate "Magic Link" or simple link to `https://urbansetu.com/user/year/{year}`.
    - Send email using `emailService.js`.

## 2. Frontend Implementation

### A. Page Structure (`web/src/pages/YearInReview.jsx`)
- **Route**: `/user/year/:year` (and `/admin/year/:year` reused or separate).
- **Design Philosophy**: "Story" mode. Full screen, auto-advancing slides or vertical scroll with scroll-triggered animations.
- **Libraries**: Use `framer-motion` for high-fidelity animations (fade-in, slide-up, scale).

### B. Slides / Sections
1.  **Intro**: "2025 was a big year..." (Animated text).
2.  **Exploration Stats**: "You explored X properties across Y cities." (Map visualization).
3.  **Engagement**: "You found Z properties interesting enough to wishlist."
4.  **Top Pick**: "The property you spent the most time on..." (if data available) or "Your favorite category: Apartments".
5.  **Community**: "You helped X people with your reviews."
6.  **Personality Reveal**: "Your UrbanSetu Persona is: **The Deal Hunter**".
7.  **Outro/CTA**: Share button, "Here's to 2026".

## 3. Email Template
- **Subject**: "Your UrbanSetu 2025 Flashback is here! 🎬"
- **Content**:
    - "Hi [Name],"
    - "What a year it's been! We've crunched the numbers on your property journey."
    - "You viewed 142 properties and found 3 potential homes."
    - **CTA Button**: "Watch Your Flashback" (Links to Web App).

## 4. Admin Dashboard Integration
- Add "Maintenance Review" or "Year in Review" link in the Admin Dashboard sidebar, visible only in December/January.

## Implementation Steps (Workflow)

### Step 1: Backend Setup
1.  Create `api/controllers/yearInReview.controller.js`.
2.  Add routes in `api/routes/user.route.js` (or new `yearInReview.route.js`).
3.  Test API response with mock data or real DB data.

### Step 2: Frontend Page
1.  Install `framer-motion` (if not present).
2.  Create `YearInReview.jsx`.
3.  Implement "Story" logic (state for current slide).
4.  Build individual slide components with animations.
5.  Connect to API to fetch real stats.

### Step 3: Scheduler & Email
1.  Modify `User` model to track `yearInReviewSent` status (or create `YearInReviewLog` model).
2.  Create the cron job in `api/index.js` or `api/utils/yearInReviewScheduler.js`.
3.  Create email template in `api/utils/emailTemplates.js` (if strictly structured) or directly in service.

### Step 4: Testing
1.  Verify API calculation accuracy.
2.  Test Email delivery (dry run mode).
3.  Verify Frontend animations and responsiveness.

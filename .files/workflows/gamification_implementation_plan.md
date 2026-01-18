---
description: Implementation plan for SetuCoins Gamified Loyalty System
---

# SetuCoins Loyalty System Implementation Plan

## 1. Overview
The **SetuCoins** system is a gamified loyalty program designed to increase user retention and engagement on UrbanSetu. Users earn "SetuCoins" for high-value actions (like paying rent on time) and engagement activities (reviews, referrals). These coins can be redeemed for platform benefits (e.g., discount on processing fees, coupons).

## 2. Gamification Strategy

### Earning Mechanics
*   **Sign-Up Bonus:** 50 Coins (One-time).
*   **Profile Completion:** 20 Coins (One-time).
*   **Rent Payments:**
    *   Base: 1 Coin per ₹1000 paid.
    *   On-Time Bonus: Flat 50 Coins.
    *   Streak Bonus: 20 Coins per consecutive month (capped at 100).
*   **Reviews:** 10 Coins per approved review.

### Redemption Mechanics
*   **Conversion Rate (Example):** 10 SetuCoins = ₹1.
*   **Redemption:**
    *   Discount on Rent Payment Processing Fees (User can select "Use Coins" at checkout).
    *   Unlock Premium Listing features.

## 3. Technical Architecture

### 3.1 Database Schema Changes

#### A. User Model (`api/models/user.model.js`)
Add new fields to track the verified balance.
```javascript
  // Gamification Profile
  gamification: {
    setuCoinsBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCoinsEarned: { // Lifetime earnings
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    lastRentPaymentDate: {
      type: Date
    }
  }
```

#### B. CoinTransaction Model (`api/models/coinTransaction.model.js`)
Create a new model to track every earning/spending event.
```javascript
import mongoose from "mongoose";

const coinTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  source: {
    type: String,
    enum: [
      "signup_bonus",
      "profile_completion",
      "rent_payment",
      "rent_streak_bonus",
      "review_reward",
      "referral",
      "admin_adjustment",
      "redemption_rent_fee",
      "redemption_coupon"
    ],
    required: true
  },
  referenceId: { // ID of the Payment, Review, or User (referral)
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Payment', 'Review', 'User', 'AdminLog']
  },
  description: {
    type: String
  },
  balanceAfter: { // Snapshot of balance for easy debugging
    type: Number
  }
}, { timestamps: true });

const CoinTransaction = mongoose.model("CoinTransaction", coinTransactionSchema);
export default CoinTransaction;
```

### 3.2 Backend Implementation

#### A. Coin Controller (`api/controllers/coin.controller.js`)
*   `getBalance(userId)`: Returns current balance and stats.
*   `getHistory(userId, page, limit)`: Returns paginated transactions.
*   `adminAdjustCoins(userId, amount, reason)`: Admin tool to credit/debit coins manually.

#### B. Integration Points
*   **Payment Controller (`api/controllers/payment.controller.js`):**
    *   Inside `processPayment` (or webhook handler):
        *   Calculate earning based on amount.
        *   Check for on-time bonus.
        *   Update User streak and balance.
        *   Create `CoinTransaction` record.
*   **Review Controller:**
    *   Award coins upon review approval.

### 3.3 Frontend Implementation

#### A. Profile Page (`web/src/pages/Profile.jsx`)
*   Add a **"SetuCoins Card"**:
    *   Displays big current balance numbers.
    *   "Redeem" button (leads to rewards catalog or wallet).
    *   Mini-graph of recent history.

#### B. Rent Wallet (`web/src/pages/RentWallet.jsx`)
*   Add a **"Loyalty" Tab** or Section:
    *   Detailed Transaction History (Credits/Debits).
    *   Progress bar to next "On-time Streak" bonus.

#### C. Payment Flow (`web/src/pages/PayMonthlyRent.jsx`)
*   **Earning UI:** "You will earn **50 SetuCoins** for this payment!" badge.
*   **Spending UI (Future):** Checkbox "Use 500 Coins to save ₹50 on fees".

#### D. Admin Dashboard (`web/src/pages/AdminManagement.jsx`)
*   **User Detail View:**
    *   Show current coin balance.
    *   **Action Button:** "Adjust Coins".
        *   Modal to Add/Deduct coins with a reason (e.g., "Customer retention", "Refund").
*   **Coin Analytics:** (Optional) Total coins in circulation.

## 4. Implementation Steps

### Phase 1: Foundation (Backend)
1.  Create `CoinTransaction` model.
2.  Update `User` schema.
3.  Create internal service `CoinService.js` to handle safe credit/debit operations (atomic transactions if using MongoDB Replica Set, or careful finding/updating).

### Phase 2: Earning Logic
4.  Modify `payment.controller.js` to call `CoinService.credit` on successful rent payment.
5.  Implement "Streak" logic checks.

### Phase 3: User UI
6.  Update `Profile.jsx` to fetch and show coins.
7.  Create `CoinHistory` component (reusable in Profile or RentWallet).
8.  Add "Potential Earnings" display on Payment pages.

### Phase 4: Admin Tools
9.  Add Coin Management UI in Admin Dashboard.
10. Implement API for Admin adjustments.

// turbo-all

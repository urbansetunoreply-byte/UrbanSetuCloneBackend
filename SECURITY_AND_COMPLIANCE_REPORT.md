# Security and Compliance Analysis Report

## 1. Executive Summary
This report details the findings regarding UrbanSetu's Account Deletion Grace Period mechanisms and provides a comprehensive analysis of the current Fraud Detection Intelligence System compared to industry standards ("Big Tech" architecture).

## 2. Account Deletion & Grace Period Findings

### 2.1 Current Workflow
1.  **User Action**: User deletes account via `deleteUser` in `user.controller.js`.
2.  **System Action**:
    *   Account is "Soft Banned" (moved to `DeletedAccount` collection).
    *   `AccountRevocation` record is created with a **30-day expiration**.
    *   **Notification**: `sendAccountDeletionEmail` is sent immediately.
        *   Contains a "Restore My Account" link.
        *   Explicitly mentions the 30-day grace period.

### 2.2 Automated Grace Period Reminders
**Question**: Is there an automated email sent when the grace period is near (e.g., from 5 days left)?
**Finding**: **NO**.
*   The scheduler (`api/services/schedulerService.js`) triggers `sendAccountDeletionReminders` daily at 10:00 AM.
*   The logic in `api/services/accountReminderService.js` only triggers emails at strictly defined intervals:
    1.  **15 Days Remaining**: Mid-point reminder.
    2.  **1 Day Remaining**: Final Warning.
*   **Gap**: There is no alert specifically at the 5-day mark (or a countdown starting from 5 days).

### 2.3 Administration
*   **Admin Page**: `AdminManagement.jsx` contains a "Softbanned Accounts" tab.
*   **Capabilities**: Admins can view soft-banned users, their reasons for leaving, and manually **Restore** or **Purge** accounts.

---

## 3. Fraud Intelligence System Analysis

### 3.1 Industry Standard ("Big Tech" Architecture)
Major platforms (Google, Facebook, Stripe) utilize a multi-layered Intelligence System:

1.  **Signal Layer (Data Collection)**:
    *   **Device Fingerprinting**: Canvas hash, Audio context (not just User Agent).
    *   **Behavioral Biometrics**: Mouse movement jitter, typing speed.
    *   **Network Intelligence**: IP Reputation (is this a known proxy?), ASN velocity.
    *   **Geolocation**: "Impossible Travel" (Login in NY at 10:00, Login in London at 10:15).

2.  **The "Check" Engine (Decision Layer)**:
    *   **Rules Engine**: Deterministic logic (e.g., `IF IP_Country != Account_Country AND Amount > $1000 THEN Challenge`).
    *   **ML Models**: Anomaly detection (e.g., `Risk Score = 0.95` based on deviation from user's normal 9-5 login pattern).
    *   **Graph Analysis**: Linking 50 accounts to 1 device/credit card.

3.  **Enforcement (Auto-Suspend)**:
    *   **Action**: If `Risk Score > Threshold`, automatically set `status = suspended`.
    *   **Response**: Revoke all sessions (`socket.emit('force_signout')`).

### 3.2 UrbanSetu Current State (`security.js` Audit)
UrbanSetu has a foundational security layer but lacks "Intelligence" features.

| Feature | UrbanSetu (`security.js`) | Industry Standard |
| :--- | :--- | :--- |
| **Storage** | **In-Memory (`Map`)**. Data is lost on server restart. | **Redis / Database**. Persistent tracking. |
| **Velocity Check** | Simple counter (`failedAttempts >= 10`). | Windowed Counters per IP/Subnet/User. |
| **Bot Detection** | Checks `userAgent.includes('bot')`. Trivial to bypass. | CAPTCHA v3, TLS Fingerprinting. |
| **Disposable Email**| Hardcoded list (3 domains). | API Lookup (e.g., 20,000+ domains). |
| **Alerting** | `console.log` only. | Slack/PagerDuty/Dashboard Integration. |
| **Enforcement** | `lockAccount` (Temporary). | Permanent Ban based on Risk Score. |

### 3.3 Critical Gaps
1.  **Persistence**: Using `failedAttemptsStore = new Map()` means if the server auto-scales or restarts, the attack counters reset to zero.
2.  **Mocks**: Functions like `getRecentLogins` and `getRecentSignups` are currently hardcoded mock implementations returning empty arrays.
3.  **Geo-Awareness**: No logic to detect location anomalies.

## 4. Recommendations

### 4.1 Short Term
1.  **Implement 5-Day Reminder**: Modify `accountReminderService.js` to include logic for `daysLeft <= 5`.
2.  **Persist Security Data**: Replace the `Map` in `security.js` with Redis.

### 4.2 Long Term
1.  **Integrate GeoIP**: Use `geoip-lite` to track login countries.
2.  **Rule Engine**: Implement a basic scoring system (e.g., New Device + Foreign IP = Challenge).

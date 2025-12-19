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

## 3. Fraud Intelligence System Implementation (Live Status)

### 3.1 Architecture Overview
The system has been upgraded from a volatile in-memory solution to a persistent, data-driven intelligence layer.

*   **Persistence**: Security events and login attempts are now stored in **MongoDB** (`LoginAttempt` collection) with TTL (Time-To-Live), ensuring attack history survives server restarts.
*   **Geo-Intelligence**: Integrated **GeoIP** (`geoip-lite`) to map IP addresses to physical locations (City, Country) in real-time.
*   **Context Awareness**: Every security event captures granular details: IP, Device Fingerprint, Location, and User Agent.

### 3.2 Detection Capabilities
| Threat Type | Trigger Mechanism | System Response |
| :--- | :--- | :--- |
| **Brute Force** | 5 consecutive failed login attempts on a single account. | **1. Temporary Lockout**: Account locked for **30 minutes**.<br>**2. User Alert**: Automated "Security Alert" email sent to user.<br>**3. Admin Alert**: Logged to system console/database. |
| **Root Admin DoS** | Excessive failed attempts targeting a `rootadmin` account. | **Prevention**: Lockout is **bypassed** to prevent Denial of Service attacks against super-admins. Administrator is alerted instead. |
| **New Location** | user logs in from a different City/Country than last time. | **Monitoring**: Flagged as `new_location_detected` in logs. User is notified via "New Login" email (already active). |
| **Impossible Travel** | Location changes significantly within 1 hour (e.g., Delhi -> London). | **High Alert**: Flagged as `impossible_travel_velocity`. Admin is alerted immediately. |
| **Suspicious Login** | Rapid successive logins (>5 in 24h) or Bot-like User Agents. | **Monitoring**: Flagged as "Suspicious" in internal logs. |

### 3.3 Automated Actions & Notification Workflow
The system takes **Defensive Actions** rather than destructive ones (Auto-Suspension).

1.  **Attack Detected**: System identifies 5th failed attempt.
2.  **Lockout Enforced**: `PasswordLockout` record prevents login for 30 minutes.
3.  **Intelligence Enrichment**:
    *   System resolves IP `203.0.113.1` -> `Mumbai, India`.
    *   Identifies Device -> `Chrome on Windows`.
4.  **Instant Notification**:
    *   **User**: Receives `sendAccountLockoutEmail` immediately.
        *   *Subject*: "Security Alert: Your UrbanSetu Account has been Temporarily Locked"
        *   *Content*: "We detected suspicious activity from Mumbai, India (IP: ...). Your account is locked for 30m."
        *   *Action*: Includes links to Reset Password (`/forgot-password`) and Contact Support.
    *   **Admin**: Alert logged for visibility.

### 3.4 Why Temporary Lockout vs. Auto-Suspension?
We purposefully chose **Temporary Lockout** over **Permanent Suspsension** for the automated system:
*   **False Positives**: A user forgetting their password shouldn't be permanently banned.
*   **Availability**: Lockouts mitigate the immediate threat (password guessing) without requiring manual admin intervention to restore access.
*   **Manual Control**: Permanent suspension (Soft Ban) is reserved for **Manual Admin Action** via the `AdminManagement` dashboard, which is fully synced via WebSockets.

## 4. Completed Objectives
### 4.1 Account Governance
*   ✅ **5-Day Reminder**: Users now receive an automated email 5 days before their account is permanently purged.
*   ✅ **Root Admin Protection**: Critical `rootadmin` accounts are immune to manual suspension/deletion and automated lockouts.

### 4.2 Intelligence System
*   ✅ **Persistence**: `LoginAttempt` model implemented.
*   ✅ **GeoIP**: Location tracking implemented across Audit Logs and Emails.
*   ✅ **Automated Alerts**: Detailed security emails with deep linking and context.
*   ✅ **Stability**: Fixed Socket.io integration and resolved middleware conflicts.


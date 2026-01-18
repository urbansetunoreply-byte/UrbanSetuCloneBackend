---
description: Re-engagement Email System
---

# Re-engagement Email System

This system automatically sends emails to users who haven't logged in for 30 days, encouraging them to return to UrbanSetu.

## Components

1.  **User Model (`api/models/user.model.js`)**: 
    -   `lastLogin`: Tracks the timestamp of the last successful login.
    -   `lastReEngagementEmailSent`: Tracks when the last re-engagement email was sent to avoid spamming.

2.  **Auth Controller (`api/controllers/auth.controller.js`)**: 
    -   Updates `lastLogin` to `new Date()` on every successful `SignIn` and `Google` login.
    -   Resets `lastReEngagementEmailSent` to `null` on login, so the user becomes eligible again if they go inactive.

3.  **Email Service (`api/utils/emailService.js`)**: 
    -   `sendReEngagementEmail`: Sends a formatted HTML email with:
        -   "We Miss You" message.
        -   Trending topics list.
        -   Links to Sign In, Explore, and Community.

4.  **Scheduler (`api/utils/reEngagementScheduler.js`)**: 
    -   Uses `node-cron`.
    -   Runs daily at **10:00 AM**.

## Logic

-   **Trigger**: Daily cron job (`0 10 * * *`).
-   **Target Users**:
    -   **Inactive**: `lastLogin` is older than 30 days (or null for old users created > 30 days ago).
    -   **Not Recently Contacted**: `lastReEngagementEmailSent` is null OR older than 30 days.
    -   **Active Status**: User `status` is 'active' (not suspended/deleted).
-   **Action**: Sends the re-engagement email.
-   **State Update**: Sets `lastReEngagementEmailSent` to current time.
-   **Rate Limiting**: Processes a maximum of **50 users** per run to avoid overwhelming the email provider and hitting API limits.

## How to Test

1.  **Identify a Test User**: Pick a user email you have access to.
2.  **Modify Database**:
    -   Set `lastLogin` to a date 31 days in the past (e.g., `new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)`).
    -   Set `lastReEngagementEmailSent` to `null`.
3.  **Modify Scheduler (Temporary)**:
    -   Change cron schedule in `api/utils/reEngagementScheduler.js` to `* * * * *` (run every minute).
4.  **Observe**:
    -   Check console logs for "Sending re-engagement email...".
    -   Check email inbox.
    -   Verify database updated `lastReEngagementEmailSent`.
5.  **Revert Scheduler**: Change cron back to `0 10 * * *`.

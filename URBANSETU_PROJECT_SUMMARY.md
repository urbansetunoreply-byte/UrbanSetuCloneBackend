# 🏙️ UrbanSetu - Comprehensive Project Summary

## 📖 Project Overview
**UrbanSetu** is an advanced, full-stack **Real Estate Management Platform** designed to modernize the property market in India. Built on the **MERN Stack** (MongoDB, Express, React, Node.js), it distinguishes itself through deep AI integration, a focus on sustainability (ESG), and a "Trust-First" rental model called **Rent-Lock**.

*   **Live URL:** [https://urbansetu.vercel.app](https://urbansetu.vercel.app)
*   **Repository:** [UrbanSetu on GitHub](https://github.com/VijayChCode/UrbanSetu)

---

## 🏛️ Core Pillars & Modules

### 1. 🏠 Property Marketplace (Buy/Sell/Rent)
*   **Advanced Operations:** Users can list properties for sale or rent with rich media (images/videos).
*   **Search & Discovery:** Powered by **Mapbox** for location-based search and route planning.
*   **Smart Filtering:** Filters for price, amenities, and specific **ESG metrics**.
*   **Wishlist & Watchlist:** Users can track properties; the "Popular" section is driven by watchlist analytics.

### 2. 🤖 SetuAI & Advanced Intelligence
UrbanSetu is not just a database; it is an AI-first platform.
*   **SetuAI Chatbot:** A context-aware assistant powered by **Gemini/Groq (Llama 3)** and **Stack AI**.
    *   *Features:* Real-time property search, legal advice, mortgage math, and multi-lingual support.
*   **Ensemble Recommendation System:** A hybrid engine ensuring 100% fill rate:
    1.  **"Recommended for You":** Heuristic-based (Rating + Freshness) for new users.
    2.  **"Trending":** Collaborative filtering based on Watchlist user behavior.
    3.  **"Advanced AI":** Deep learning models (Matrix Factorization/Neural Networks) for personalized matches (requires user history).
*   **Rent Prediction:** Machine learning models predict fair market rent and future appreciation.

### 3. 🔐 Rent-Lock Guarantee & Financials
A system designed to eliminate rental fraud and disputes.
*   **Rent-Lock Plans:** Fixed rent pricing for 1, 3, or 5 years.
*   **Digital Contracts:** Legal-grade rental agreements with digital signatures (`RentLockContract`).
*   **Rent Wallet:** A dedicated wallet for managing monthly payments, auto-debits, and transaction history.
*   **Rental Loans:** Integrated financial aid for security deposits.
*   **Dispute Resolution:** Structured portal for tenants/landlords to resolve conflicts, moderated by Admins.

### 4. 🌱 ESG (Environmental, Social, Governance)
UrbanSetu is the first platform to natively score properties on sustainability.
*   **Scoring Engine:** Properties receive an **ESG Score (0-100)** and **Rating (AAA-D)**.
*   **Metrics:** Tracks Carbon Footprint, Energy Efficiency, Rainwater Harvesting, and Social Impact (Accessibility, Community).
*   **Analytics:** Admin dashboard to monitor city-wide ESG trends and compliance.

---

## 🛠️ Technical Architecture & Stack

### Frontend (Client)
*   **Framework:** React.js (Vite) for blazing fast performance.
*   **Styling:** Tailwind CSS with a consistent, premium design system (Glassmorphism).
*   **State Management:** Redux Toolkit for auth, search, and booking states.
*   **Maps:** **Mapbox GL JS** for interactive maps and route optimization (replaced Google Maps).

### Backend (API)
*   **Runtime:** Node.js with Express.js.
*   **Database:** MongoDB (Mongoose ODM) with complex schema relationships (User <-> Listing <-> Booking <-> Contract).
*   **Security:**
    *   **Authentication:** JWT (HttpOnly Cookies) + **Google OAuth**.
    *   **Protection:** **Google reCAPTCHA v2** on auth forms to prevent bots.
    *   **Role-Based Access:** Standard User, Admin, and **Root Admin** (approves other admins).
*   **Communication:**
    *   **Socket.IO:** Real-time chat, notifications, and signaling for calls.
    *   **Brevo (formerly Sendinblue):** Transactional emails (OTPs, Booking Confirmations) with Gmail SMTP fallback.

### DevOps & Infrastructure
*   **Storage:** **AWS S3** for large file storage (APKs, high-res videos).
*   **Deployment:** Vercel (Frontend) + Render/Vercel (Backend).
*   **Mobile:** React Native ecosystem logic (APK distribution managed via `AWS_S3_SETUP.md`).

---

## 👥 User Roles

1.  **Public User (Guest):** Browse listings, read blogs, interact with SetuAI (limited).
2.  **Registered User:**
    *   **Tenant/Buyer:** Book appointments, sign contracts, pay rent via Wallet.
    *   **Landlord/Seller:** List properties, view analytics, manage disputes.
3.  **Admin:**
    *   Moderate listings, verify property documents, resolve disputes.
    *   View platform analytics (User growth, ESG stats).
4.  **Root Admin:**
    *   **Exclusive Privilege:** The *only* user who can approve new Admin accounts.
    *   Full system configuration control.

---

## 📅 Recent Implementation Status (Confirmed)
*   ✅ **Chatbox Enhancements:** Dynamic URL routing (`/chat/{id}`) and error handling for missing appointments.
*   ✅ **Login Flow:** Robust email notification retry logic with exponential backoff.
*   ✅ **ESG Features:** Fully deployed with analytics and search filters.
*   ✅ **Mapbox Migration:** Complete replacement of Google Maps.
*   🚧 **Audio/Video Calls:** WebRTC implementation using Socket.IO signaling is planned/in-progress.

---

## 🌟 Unique Selling Propositions (USPs)
1.  **Holistic Trust:** From **Rent-Lock** contracts to **Root Admin** governed security.
2.  **Sustainability First:** The only platform pushing **ESG** usage in residential real estate.
3.  **AI-Native:** AI is not an addon; it drives search, pricing, and support (SetuAI).
4.  **Financial Integration:** Built-in **Rent Wallet** and **Loan** systems simplify the money side of renting.

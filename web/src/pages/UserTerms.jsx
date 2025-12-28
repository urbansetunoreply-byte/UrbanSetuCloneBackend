import React from "react";


import { usePageTitle } from '../hooks/usePageTitle';
export default function UserTerms() {
  // Set page title
  usePageTitle("User Terms & Conditions - Legal Information");

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 transition-colors duration-300">
      <h1 className="text-4xl font-bold mb-6 text-blue-700 dark:text-blue-400 transition-colors">User Terms & Conditions</h1>
      <div className="space-y-6 text-gray-800 dark:text-gray-300 text-base transition-colors">
        <p className="text-lg">By using UrbanSetu, you agree to these user terms. Please read them carefully.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">1. Your Responsibilities</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Provide accurate information. Mobile number must be unique and valid.</li>
          <li>Respect privacy and rights of others. No harassment or fraud.</li>
          <li>Ensure your listings are truthful and updated. False listings may lead to action.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">2. Account & Consent</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Explicit consent is required for our Terms and Privacy Policy.</li>
          <li>You may delete your account; data retention applies where required by law.</li>
          <li>Use strong passwords and keep your account secure.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">3. Platform Use</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Follow applicable laws and platform rules.</li>
          <li>We may remove content that violates guidelines.</li>
          <li>Admins may suspend accounts for serious violations.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">4. Smart & AI Features</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Natural language search, recommendations, and watchlist price monitoring.</li>
          <li>Notifications for price drops, new listings, and appointments.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">5. Property & Transaction Responsibilities</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Truthful Listings:</strong> If you post a property, all details (price, location, size, photos) must be accurate and not misleading.</li>
          <li><strong>Viewing & Visits:</strong> Coordinate property visits safely and comply with local rules (society rules, visiting hours, safety norms).</li>
          <li><strong>Contracts:</strong> All purchase or rental agreements are between buyer and seller/landlord. You should seek independent legal advice where needed.</li>
          <li><strong>Payments:</strong> Use secure payment methods and follow platform guidance for deposits, booking amounts, and rent security.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">6. Liability</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>We facilitate discovery, communication, and certain payment flows, but we are not a party to the underlying real estate contract.</li>
          <li>We are not responsible for third‑party actions, misrepresentations, or disputes between users, except where required by applicable law.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">7. Renting & Appointments</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Only schedule property visits you can attend. No-showing multiple times may restrict new bookings.</li>
          <li>During rent-lock, complete signatures and rent payments within the displayed deadline to keep the property reserved for you.</li>
          <li>Use in-app chat, audio, and video responsibly. Harassment, threats, or sharing contact details publicly is prohibited.</li>
          <li>Move-in/move-out checklists and inspection photos must reflect the true condition of the property.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">8. Payments & Wallet</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Maintain sufficient funds before triggering rent or deposit payments. Failed charges can pause your contract.</li>
          <li>Auto-debit settings can be managed from the rent wallet; turn them off at least two business days before the due date.</li>
          <li>Refund timelines vary by service (appointments, movers, rent). Track refund status in your wallet or email updates.</li>
          <li>Fraudulent chargebacks or payment reversals may lead to account review and recovery of due amounts.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">9. Disputes & Safety</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Use the “Raise Dispute” option with screenshots, receipts, or checklist references so our support team can assist faster.</li>
          <li>All evidence (photos, calls, chats) should stay on-platform for audit purposes.</li>
          <li>Report fraud or safety issues immediately. We may freeze chats or funds while investigating.</li>
          <li>In emergencies, contact local authorities first and then notify UrbanSetu with the case number.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">10. SetuCoins Rewards</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Earning:</strong> Coins are earned automatically for rent payments, streaks, and successful referrals.</li>
          <li><strong>Referral Rewards:</strong> Referrers earn 100 coins per invite; new users joining via link receive 50 coins welcome bonus.</li>
          <li><strong>Discounts:</strong> 10 Coins = ₹1 discount or 800 Coins = $1 discount. Discounts apply to rent and on-demand services only.</li>
          <li><strong>Transferability:</strong> SetuCoins are linked to your unique verified mobile number and cannot be transferred to other users or accounts.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600 dark:text-blue-300 transition-colors">11. Advisory Tools (AI & Analysis)</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Investment tools and Route Planner insights are projections. Actual market values and commute times may vary.</li>
          <li>Always verify AI-generated smart-search results before making viewing appointments or financial deposits.</li>
        </ul>

        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 transition-colors">Last updated: {new Date().toLocaleDateString(`en-IN`, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>
    </div>
  );
}
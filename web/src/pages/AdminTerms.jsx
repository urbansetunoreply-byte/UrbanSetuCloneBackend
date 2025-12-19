import React from "react";


import { usePageTitle } from '../hooks/usePageTitle';
export default function AdminTerms() {
  // Set page title
  usePageTitle("Admin Terms & Conditions - Legal Information");

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">Admin Terms & Conditions</h1>
      <div className="space-y-6 text-gray-800 text-base">
        <p className="text-lg">By using UrbanSetu admin tools, you agree to these admin terms.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">1. Admin Responsibilities</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Act impartially and in users' best interests.</li>
          <li>Do not abuse admin privileges for personal gain.</li>
          <li>Maintain confidentiality of sensitive user and business data.</li>
          <li>Default admin privileges may have additional constraints.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">2. Security & Compliance</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Use strong authentication and keep sessions secure.</li>
          <li>Follow audit and logging practices for critical actions.</li>
          <li>Comply with applicable laws, regulations, and company policies.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">3. Platform Rules</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>We may revoke admin access for violations.</li>
          <li>Admins must not bypass safeguards or manipulate data improperly.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">4. Smart & AI Features</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Use AI insights responsibly; verify results for critical actions.</li>
          <li>Do not rely solely on AI for compliance or legal decisions.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">5. Property Moderation</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Listing Review:</strong> Review listings for accuracy, legality, and compliance with fair housing laws before approval.</li>
          <li><strong>Fraud Detection:</strong> Monitor for suspicious listings and fraudulent sellers using AI and manual inspection.</li>
          <li><strong>RERA Compliance:</strong> All listings must comply with Real Estate Regulation and Development Act requirements.</li>
          <li><strong>Removal Authority:</strong> Admins may remove listings that violate policies or pose fraud/safety risks.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">6. Dispute Handling</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Impartiality:</strong> Remain neutral and unbiased when handling buyer-seller disputes.</li>
          <li><strong>Documentation:</strong> All dispute communications and evidence must be documented for audit.</li>
          <li><strong>Mediation Role:</strong> Facilitate resolution through mediation or escalate to arbitration if needed.</li>
          <li><strong>Escrow Management:</strong> Oversee escrow accounts and fund release per transaction terms and law.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">7. Data & Access Management</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Access Levels:</strong> Different admin levels have appropriate access restrictions.</li>
          <li><strong>Personal Data:</strong> Access personal/payment data only for legitimate dispute/fraud investigation.</li>
          <li><strong>Audit Logging:</strong> All admin actions are logged and audited for accountability.</li>
          <li><strong>Confidentiality Agreement:</strong> Admins sign agreements protecting sensitive user information.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">8. Financial & Escrow Oversight</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Escrow Account Management:</strong> Maintain escrow accounts in trust, separate from operational funds.</li>
          <li><strong>Fund Release:</strong> Release escrow funds only upon completion of transaction terms or legal instruction.</li>
          <li><strong>Refund Processing:</strong> Process refunds per transaction terms within 7-10 days.</li>
          <li><strong>Financial Reporting:</strong> Maintain accurate financial records per accounting standards.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">9. Liability</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Admin actions are traceable and fully auditable; misuse can result in suspension or legal action.</li>
          <li>UrbanSetu is not responsible for third-party actions or user disputes arising from transactions.</li>
          <li>Admins engaging in misconduct face disciplinary action up to termination and legal referral.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">10. Call, Chat & Live Monitor Oversight</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Only authorized admins may join live audio/video sessions. Passive monitoring is limited to dispute resolution, safety, or compliance reviews.</li>
          <li>Screen recordings, call audio, and chat transcripts captured for audits must be stored securely and deleted per retention policies.</li>
          <li>Admins must never disclose user conversations, screenshots, or evidence outside sanctioned workflows.</li>
          <li>Live-monitor access may be revoked immediately if misused or accessed without a valid ticket reference.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">11. Incident Response & Escalations</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Security, fraud, or harassment incidents must be logged with timestamp, user IDs, and supporting evidence.</li>
          <li>Critical incidents require notifying the security/compliance lead within one business hour.</li>
          <li>Admins must cooperate with regulatory or law-enforcement requests and preserve evidence exactly as collected.</li>
          <li>After every major incident, document remediation steps and lessons learned to prevent recurrence.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">12. SetuCoin Economy & Loyalty Oversight</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Balance Adjustments:</strong> Admins may only adjust user coin balances to correct system errors, process refunds, or penalize verified fraud.</li>
          <li><strong>Referral Policy:</strong> The current standard reward is 100 coins for the referrer and 50 coins for the joining user.</li>
          <li><strong>Redemption Rates:</strong> The platform standard is 10 Coins = ₹1 or 800 Coins = $1.</li>
          <li><strong>Economy Monitoring:</strong> Root admins must monitor the system-wide burn-to-mint ratio to ensure the sustainability of the rewards program.</li>
          <li><strong>Revocation:</strong> Admins reserve the right to revoke coins earned through cancelled service requests, fraudulent rent payments, or non-genuine referrals.</li>
        </ul>

        <p className="mt-6 text-sm text-gray-600">Last updated: {new Date().toLocaleDateString(`en-IN`, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>
    </div>
  );
}
import React from "react";


import { usePageTitle } from '../hooks/usePageTitle';
export default function AdminPrivacy() {
  // Set page title
  usePageTitle("Admin Privacy Policy - Data Protection");

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">Admin Privacy Policy</h1>
      <div className="space-y-6 text-gray-800 text-base">
        <p className="text-lg">This policy explains how we collect, use, and protect your information as an admin on UrbanSetu.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">1. Information We Collect</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Admin Profile:</strong> Name, email, validated mobile number (unique 10 digits), role (admin/rootadmin), and authentication credentials.</li>
          <li><strong>Admin Activity:</strong> Listing approvals, edits, removals, reviews, unlocks, and other moderation actions.</li>
          <li><strong>Operational Data:</strong> Security events, OTP lockouts handling, system notices, and audit logs.</li>
          <li><strong>Technical Data:</strong> IP address, device and browser details, usage analytics, and error logs.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">2. How We Use Admin Information</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Operations:</strong> Perform admin duties and maintain platform integrity.</li>
          <li><strong>Security:</strong> Monitor threats, manage lockouts, and prevent abuse.</li>
          <li><strong>Compliance:</strong> Maintain audit trails and follow legal obligations.</li>
          <li><strong>Improvement:</strong> Use analytics and feedback to improve tooling.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">3. Admin Rights</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Access your data and request corrections.</li>
          <li>Request account deletion (may be limited for default admins).</li>
          <li>Receive important operational and security notifications.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">4. Sharing & Third Parties</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>No Sale:</strong> We do not sell admin information.</li>
          <li><strong>Service Providers:</strong> Infrastructure, monitoring, analytics under strict agreements.</li>
          <li><strong>Legal:</strong> Disclosures required by law or to protect our users and platform.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">5. Security</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Role-based access, encryption, audit logging, and incident response.</li>
          <li>Despite safeguards, no system is perfect—use admin tools responsibly.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">6. Real Estate Data & Transaction Access</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Scoped Access:</strong> Admins may view transaction histories, rent locks, wallet activity, and call/chat logs only for legitimate operational reasons.</li>
          <li><strong>Document Handling:</strong> Access to sale/rent agreements, KYC files, and ownership documents is restricted to senior or compliance-approved admins.</li>
          <li><strong>Screen Monitoring:</strong> Any use of "live" monitoring tools is strictly for fraud prevention, dispute resolution, and safety review—not for personal surveillance.</li>
          <li><strong>Download Controls:</strong> Downloading or exporting sensitive documents must follow internal policies and legal obligations.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">7. Audit Logs & Monitoring</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Action Logs:</strong> Critical admin actions (approvals, removals, refunds, locks/unlocks) are logged with timestamp, IP, and admin identity.</li>
          <li><strong>Review & Oversight:</strong> Logs may be periodically reviewed by senior admins or compliance teams.</li>
          <li><strong>Misuse Detection:</strong> Unusual viewing or export patterns may trigger internal review.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">8. Data Retention & Legal Compliance</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Retention:</strong> Admin activity logs, moderation records, and escalation notes may be retained for extended periods for legal, audit, and fraud‑prevention purposes.</li>
          <li><strong>Access on Need Basis:</strong> Only authorized roles (e.g., compliance, legal, founders) may access historical admin logs.</li>
          <li><strong>Lawful Requests:</strong> Where required, relevant admin activity data may be shared with regulators, law‑enforcement, or courts.</li>
        </ul>

        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Related Policies</h3>
          <p className="text-gray-700 mb-3">For information about how we use cookies and similar technologies, please review our:</p>
          <a 
            href="/admin/cookie-policy" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            🍪 Cookie Policy
          </a>
        </div>

        <p className="mt-6 text-sm text-gray-600">Last updated: {new Date().toLocaleDateString(`en-IN`, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>
    </div>
  );
}
import React from "react";


export default function AdminPrivacy() {
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

        <p className="mt-6 text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
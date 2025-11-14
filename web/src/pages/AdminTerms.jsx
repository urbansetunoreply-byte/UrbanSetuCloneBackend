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

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">5. Liability</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Admin actions are traceable; misuse can result in suspension or legal action.</li>
          <li>UrbanSetu is not responsible for third-party actions.</li>
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
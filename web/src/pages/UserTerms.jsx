import React from "react";


import { usePageTitle } from '../hooks/usePageTitle';
export default function UserTerms() {
  // Set page title
  usePageTitle("User Terms & Conditions - Legal Information");

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">User Terms & Conditions</h1>
      <div className="space-y-6 text-gray-800 text-base">
        <p className="text-lg">By using UrbanSetu, you agree to these user terms. Please read them carefully.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">1. Your Responsibilities</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Provide accurate information. Mobile number must be unique and valid.</li>
          <li>Respect privacy and rights of others. No harassment or fraud.</li>
          <li>Ensure your listings are truthful and updated. False listings may lead to action.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">2. Account & Consent</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Explicit consent is required for our Terms and Privacy Policy.</li>
          <li>You may delete your account; data retention applies where required by law.</li>
          <li>Use strong passwords and keep your account secure.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">3. Platform Use</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Follow applicable laws and platform rules.</li>
          <li>We may remove content that violates guidelines.</li>
          <li>Admins may suspend accounts for serious violations.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">4. Smart & AI Features</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Natural language search, recommendations, and watchlist price monitoring.</li>
          <li>Notifications for price drops, new listings, and appointments.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">5. Liability</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>We are not party to property transactions between users.</li>
          <li>We are not responsible for third-party actions.</li>
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
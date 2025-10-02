import React from "react";


export default function UserPrivacy() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">User Privacy Policy</h1>
      <div className="space-y-6 text-gray-800 text-base">
        <p className="text-lg">Your privacy is important to us. This policy explains how we collect, use, and protect your information as a user of UrbanSetu.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">1. Information We Collect</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Account Information:</strong> Name, email, validated mobile number (unique 10 digits), role (user), profile picture, and authentication credentials.</li>
          <li><strong>Property Data:</strong> Listings you create, save, watch, or interact with; images and descriptions you upload.</li>
          <li><strong>Activity Data:</strong> Search queries, wishlist and watchlist items, appointments, messages, and reviews.</li>
          <li><strong>Technical Data:</strong> IP address, device and browser details, and usage analytics.</li>
          <li><strong>Security Data:</strong> Login attempts, OTP verification, and fraud prevention signals.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">2. How We Use Your Information</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Provide Services:</strong> Enable listings, search, watchlist, wishlist, and appointments.</li>
          <li><strong>Personalize Experience:</strong> Smart search, recommendations, and relevant suggestions.</li>
          <li><strong>Notify:</strong> Price-drop alerts, property updates, booking confirmations.</li>
          <li><strong>Protect:</strong> Security monitoring, fraud detection, and abuse prevention.</li>
          <li><strong>Improve:</strong> Analytics for product improvements and feature development.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">3. Your Rights</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Access & Correction:</strong> View and update your profile data.</li>
          <li><strong>Deletion:</strong> Delete your account to remove personal data (subject to legal retention).</li>
          <li><strong>Opt-out:</strong> Unsubscribe from marketing while keeping essential notifications.</li>
          <li><strong>Consent:</strong> Withdraw consent for processing where applicable.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">4. Sharing & Third Parties</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>No Sale:</strong> We do not sell personal information.</li>
          <li><strong>Service Providers:</strong> Payments, email and analytics providers under strict agreements.</li>
          <li><strong>Legal:</strong> Disclosures required by law or to protect rights and users.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">5. Security</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>Encryption in transit, access controls, regular audits, and incident response.</li>
          <li>Despite safeguards, no system is perfect—use the platform responsibly.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">6. AI & Smart Features</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li>We use NLP for search and recommendations.</li>
          <li>We monitor watchlist prices to send helpful alerts.</li>
        </ul>

        <p className="mt-6 text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
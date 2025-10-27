import React from "react";


import { usePageTitle } from '../hooks/usePageTitle';
export default function Privacy() {
  // Set page title
  usePageTitle("Privacy Policy - Data Protection");

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">Privacy Policy</h1>
      <div className="space-y-6 text-gray-800 text-base">
        <p className="text-lg">Your privacy is important to us. This policy explains how we collect, use, and protect your information as a user or admin of our UrbanSetu real estate platform.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">1. Information We Collect</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Account Information:</strong> Name, email, validated mobile number (unique 10 digits), role selection (user/admin), profile picture, and authentication credentials.</li>
          <li><strong>Property Data:</strong> Property listings, images, descriptions, pricing, location details, property specifications, and availability status.</li>
          <li><strong>Transaction Data:</strong> Appointments, bookings, communications, payment information, and transaction history.</li>
          <li><strong>Platform Usage:</strong> Search queries, watchlist items, wishlist preferences, browsing behavior, and interaction patterns.</li>
          <li><strong>Communication Data:</strong> Messages, reviews, ratings, support tickets, and feedback.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, device information, location data, and usage analytics.</li>
          <li><strong>Security Data:</strong> Login attempts, security events, OTP verification, and fraud prevention data.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">2. How We Use Your Information</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Service Provision:</strong> To provide, maintain, and improve our real estate platform services.</li>
          <li><strong>User Experience:</strong> To personalize content, provide smart search results, and recommend relevant properties.</li>
          <li><strong>Communication:</strong> To send notifications about price changes, new listings, appointments, and platform updates.</li>
          <li><strong>Security:</strong> To prevent fraud, detect suspicious activities, and protect user accounts.</li>
          <li><strong>Analytics:</strong> To understand user behavior, improve platform performance, and develop new features.</li>
          <li><strong>Compliance:</strong> To comply with legal obligations and enforce platform terms.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">3. Smart Features & AI Integration</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Natural Language Processing:</strong> We use AI to process search queries and provide intelligent property recommendations.</li>
          <li><strong>Price Monitoring:</strong> We track property prices in your watchlist and notify you of changes.</li>
          <li><strong>Smart Notifications:</strong> AI-powered alerts for price drops, new listings matching your preferences, and market insights.</li>
          <li><strong>Fraud Detection:</strong> Automated systems to detect and prevent fraudulent activities and suspicious listings.</li>
          <li><strong>Content Moderation:</strong> AI-assisted review of listings, images, and user-generated content for quality and compliance.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">4. Data Sharing & Third Parties</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>No Sale Policy:</strong> We do not sell your personal information to third parties.</li>
          <li><strong>Service Providers:</strong> We may share data with trusted partners for payment processing, email services, and analytics.</li>
          <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights and users.</li>
          <li><strong>Business Transfers:</strong> In case of merger or acquisition, user data may be transferred as part of business assets.</li>
          <li><strong>Public Information:</strong> Property listings and reviews may be publicly visible as part of the platform's core functionality.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">5. Your Rights & Control</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Access:</strong> You can view and download your personal data through your account settings.</li>
          <li><strong>Correction:</strong> You can update your profile information, preferences, and account settings at any time.</li>
          <li><strong>Deletion:</strong> You can delete your account, which will remove your personal data (except where retention is legally required).</li>
          <li><strong>Portability:</strong> You can export your data in a machine-readable format.</li>
          <li><strong>Opt-out:</strong> You can unsubscribe from marketing communications while maintaining essential service notifications.</li>
          <li><strong>Consent Withdrawal:</strong> You can withdraw consent for data processing where applicable.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">6. Data Security & Protection</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard protocols.</li>
          <li><strong>Access Controls:</strong> Strict access controls and authentication mechanisms protect your data.</li>
          <li><strong>Regular Audits:</strong> We conduct regular security assessments and vulnerability testing.</li>
          <li><strong>Incident Response:</strong> We have procedures in place to respond to and notify users of any data breaches.</li>
          <li><strong>Staff Training:</strong> Our team is trained on data protection and privacy best practices.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">7. Data Retention</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Account Data:</strong> Retained while your account is active and for a reasonable period after deletion.</li>
          <li><strong>Transaction Records:</strong> Kept for legal and accounting purposes as required by law.</li>
          <li><strong>Communication Data:</strong> Retained for customer service and dispute resolution purposes.</li>
          <li><strong>Analytics Data:</strong> Aggregated and anonymized data may be retained for business insights.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">8. International Data Transfers</h2>
        <p className="ml-6">Your data may be processed and stored in servers located outside your country. We ensure appropriate safeguards are in place to protect your data in accordance with applicable privacy laws.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">9. Children's Privacy</h2>
        <p className="ml-6">Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">10. Changes to This Policy</h2>
        <p className="ml-6">We may update this privacy policy from time to time. We will notify you of significant changes through email or platform notifications. Continued use of the platform constitutes acceptance of the updated policy.</p>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Contact Us</h3>
          <p className="text-gray-700">If you have any questions about this privacy policy or our data practices, please contact us:</p>
          <ul className="mt-2 space-y-1 text-gray-700">
            <li>📧 Email: privacy@urbansetu.com</li>
            <li>📞 Phone: +1 (555) 123-4567</li>
            <li>🏢 Address: UrbanSetu Privacy Team, Real Estate Platform</li>
          </ul>
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
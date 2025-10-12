import React from "react";


import { usePageTitle } from '../hooks/usePageTitle';
export default function Terms() {
  // Set page title
  usePageTitle("Terms & Conditions - Legal Information");

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">Terms & Conditions</h1>
      <div className="space-y-6 text-gray-800 text-base">
        <p className="text-lg">Welcome to UrbanSetu, our comprehensive real estate platform. By using our services, you agree to the following terms and conditions. Please read them carefully. By registering, you must select a role (user or admin) and provide explicit consent to our Terms & Privacy Policy.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">1. Platform Overview & Services</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Real Estate Marketplace:</strong> We provide a platform for buying, selling, and renting properties with advanced search and matching capabilities.</li>
          <li><strong>Smart Features:</strong> AI-powered search, price monitoring, fraud detection, and intelligent property recommendations.</li>
          <li><strong>User Roles:</strong> Users can register as buyers, sellers, or administrators with different access levels and responsibilities.</li>
          <li><strong>Communication Tools:</strong> Built-in messaging, appointment scheduling, and notification systems.</li>
          <li><strong>Analytics & Insights:</strong> Market data, price trends, and property analytics for informed decision-making.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">2. User Registration & Account Management</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Account Creation:</strong> You must provide accurate information including name, email, unique mobile number (10 digits), and select an appropriate role.</li>
          <li><strong>Verification:</strong> Mobile number verification via OTP is required for account activation and security.</li>
          <li><strong>Password Security:</strong> Strong password requirements are enforced. You are responsible for maintaining account security.</li>
          <li><strong>Account Deletion:</strong> You may delete your account at any time. Data will be removed except where retention is legally required.</li>
          <li><strong>Multiple Accounts:</strong> Creating multiple accounts to circumvent restrictions is prohibited.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">3. Property Listings & Content</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Accurate Information:</strong> All property details, images, and descriptions must be truthful and current.</li>
          <li><strong>Image Rights:</strong> You must own or have permission to use all uploaded images and content.</li>
          <li><strong>Pricing:</strong> Property prices must be accurate and include all applicable fees and taxes.</li>
          <li><strong>Availability:</strong> You must promptly update listing status (available, sold, rented) to maintain platform integrity.</li>
          <li><strong>Content Moderation:</strong> We reserve the right to review, edit, or remove content that violates our guidelines.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">4. Smart Features & AI Services</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Natural Language Search:</strong> Our AI processes search queries to provide relevant property recommendations.</li>
          <li><strong>Price Monitoring:</strong> Watchlist features track price changes and send notifications about market movements.</li>
          <li><strong>Fraud Detection:</strong> Automated systems monitor for suspicious activities and fraudulent listings.</li>
          <li><strong>Recommendations:</strong> AI-powered suggestions based on your preferences and browsing history.</li>
          <li><strong>Data Usage:</strong> Your interaction data helps improve our AI algorithms and service quality.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">5. User Responsibilities & Conduct</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Fair Dealing:</strong> All users must act honestly and fairly in all transactions and communications.</li>
          <li><strong>No Discrimination:</strong> Discrimination based on race, gender, religion, or any protected status is strictly prohibited.</li>
          <li><strong>Respectful Communication:</strong> Maintain professional and respectful communication with other users.</li>
          <li><strong>Legal Compliance:</strong> All activities must comply with applicable local, state, and federal laws.</li>
          <li><strong>Prohibited Activities:</strong> No spam, harassment, fraud, or misuse of platform features.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">6. Admin Responsibilities</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Impartial Review:</strong> Admins must review listings and requests without bias or personal interest.</li>
          <li><strong>Platform Integrity:</strong> Maintain platform quality by enforcing rules and removing inappropriate content.</li>
          <li><strong>User Support:</strong> Provide timely assistance and resolve disputes fairly.</li>
          <li><strong>Data Protection:</strong> Handle user data responsibly and in accordance with privacy policies.</li>
          <li><strong>Security Monitoring:</strong> Monitor for security threats and take appropriate action.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">7. Transactions & Payments</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Direct Transactions:</strong> Property transactions occur directly between users. We facilitate connections but are not party to transactions.</li>
          <li><strong>Payment Processing:</strong> Any payment features are provided by third-party services with their own terms.</li>
          <li><strong>Transaction Records:</strong> We may maintain records of communications and appointments for dispute resolution.</li>
          <li><strong>Dispute Resolution:</strong> Users are responsible for resolving transaction disputes. We may provide mediation services.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">8. Privacy & Data Protection</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Consent:</strong> Explicit consent is required for data processing and certain platform features.</li>
          <li><strong>Data Usage:</strong> Your data is used to provide services, improve platform functionality, and ensure security.</li>
          <li><strong>Third-Party Sharing:</strong> We may share data with service providers but do not sell personal information.</li>
          <li><strong>Security Measures:</strong> We implement industry-standard security measures to protect your data.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">9. Platform Rules & Enforcement</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Content Standards:</strong> All content must be appropriate, legal, and relevant to real estate.</li>
          <li><strong>Account Suspension:</strong> We may suspend or terminate accounts for violations of these terms.</li>
          <li><strong>Appeal Process:</strong> Users may appeal account actions through our support system.</li>
          <li><strong>Platform Modifications:</strong> We reserve the right to modify or discontinue features with notice.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">10. Intellectual Property</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Platform Rights:</strong> We own all rights to the platform, including software, design, and content.</li>
          <li><strong>User Content:</strong> You retain rights to your content but grant us license to use it on the platform.</li>
          <li><strong>Prohibited Use:</strong> No copying, reverse engineering, or unauthorized use of platform features.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">11. Limitation of Liability</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Service Availability:</strong> We strive for uptime but do not guarantee uninterrupted service.</li>
          <li><strong>Third-Party Actions:</strong> We are not responsible for actions of other users or third parties.</li>
          <li><strong>Property Transactions:</strong> All property transactions are the responsibility of the involved parties.</li>
          <li><strong>Damages:</strong> Our liability is limited to the maximum extent permitted by law.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">12. Changes to Terms</h2>
        <p className="ml-6">We may update these terms from time to time. Significant changes will be communicated through email or platform notifications. Continued use of the platform constitutes acceptance of the updated terms.</p>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Contact Information</h3>
          <p className="text-gray-700">For questions about these terms or our services, please contact us:</p>
          <ul className="mt-2 space-y-1 text-gray-700">
            <li>📧 Email: legal@urbansetu.com</li>
            <li>📞 Phone: +1 (555) 123-4567</li>
            <li>🏢 Address: UrbanSetu Legal Team, Real Estate Platform</li>
          </ul>
        </div>

        <p className="mt-6 text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
} 
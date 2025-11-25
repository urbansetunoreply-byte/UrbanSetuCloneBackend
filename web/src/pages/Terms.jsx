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

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">12. Property Transactions & Escrow</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Escrow Services:</strong> We may hold deposits in trust during property transactions. All escrow accounts are maintained in accordance with applicable real estate laws and regulations.</li>
          <li><strong>Transaction Timeline:</strong> Property purchases and sales follow agreed timelines. Any deviation requires mutual consent in writing.</li>
          <li><strong>Contingencies:</strong> Transaction contingencies (inspection, appraisal, financing) must be clearly documented and communicated to all parties.</li>
          <li><strong>Earnest Money:</strong> Earnest money deposits are held in escrow and released according to transaction terms or applicable law.</li>
          <li><strong>Title & Documentation:</strong> All property documentation, title insurance, and legal paperwork are the responsibility of the transacting parties and their legal representatives.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">13. Fair Housing & Non-Discrimination</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Legal Compliance:</strong> We comply with the Fair Housing Act and applicable fair housing laws in all jurisdictions.</li>
          <li><strong>No Discrimination:</strong> Discrimination in property sales, rentals, or services based on race, color, national origin, religion, sex, familial status, disability, sexual orientation, or gender identity is strictly prohibited.</li>
          <li><strong>Reporting Violations:</strong> Users may report fair housing violations through our platform for investigation and action.</li>
          <li><strong>Accessibility:</strong> All properties and services must be made accessible to individuals with disabilities to the extent legally required.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">14. Broker Commissions & Fees</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Transparency:</strong> All commissions and fees must be disclosed upfront and agreed upon before services are rendered.</li>
          <li><strong>Commission Structure:</strong> Standard commissions (typically 5-6% split between buyer and seller agents) may vary by transaction and agreement.</li>
          <li><strong>Flat Fees:</strong> Alternative fee arrangements (flat fees, hourly rates) are permitted if mutually agreed in writing.</li>
          <li><strong>Broker Responsibilities:</strong> Licensed brokers are responsible for managing escrow accounts, regulatory compliance, and agent conduct.</li>
          <li><strong>Dispute Resolution:</strong> Commission disputes are resolved through negotiation, mediation, or arbitration as agreed.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">15. Property Disclosures & Representations</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Seller Obligations:</strong> Sellers must disclose known material defects, property condition, title issues, and environmental concerns.</li>
          <li><strong>Latent Defects:</strong> Sellers must disclose latent defects (not readily apparent) that would affect property value or habitability.</li>
          <li><strong>Property Condition Report:</strong> Many jurisdictions require detailed property condition reports; sellers must comply with local requirements.</li>
          <li><strong>Honest Representations:</strong> All representations about property condition, improvements, or compliance must be truthful and based on actual knowledge.</li>
          <li><strong>Consequences of Misrepresentation:</strong> Deliberate misrepresentation may result in legal liability, financial damages, or criminal charges.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">16. Insurance & Risk Management</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Homeowners Insurance:</strong> Buyers are required to obtain homeowners insurance before closing. Proof of insurance is required by lenders.</li>
          <li><strong>Title Insurance:</strong> Title insurance protects against ownership disputes and is typically paid by the seller at closing.</li>
          <li><strong>Platform Liability:</strong> We maintain insurance for our operations but do not insure individual transactions or properties.</li>
          <li><strong>User Responsibility:</strong> Users should obtain appropriate insurance for their properties and activities.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">17. Regional Compliance & Regulations</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>India Real Estate Laws:</strong> Transactions comply with the Real Estate (Regulation and Development) Act (RERA) and state-specific regulations.</li>
          <li><strong>GST Compliance:</strong> Goods and Services Tax (GST) is applied per applicable rates and regulations.</li>
          <li><strong>Local Laws:</strong> All transactions adhere to municipal, state, and national property laws and regulations.</li>
          <li><strong>GDPR/Privacy Laws:</strong> International transactions follow GDPR and applicable data protection regulations.</li>
          <li><strong>Currency & Taxation:</strong> International transactions include currency conversion details and applicable tax reporting.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">18. Dispute Resolution & Mediation</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Negotiation First:</strong> All disputes should first be resolved through direct negotiation between parties.</li>
          <li><strong>Mediation:</strong> If negotiation fails, parties agree to attempt mediation through a neutral third party.</li>
          <li><strong>Arbitration:</strong> Unresolved disputes may be submitted to binding arbitration per applicable laws and agreements.</li>
          <li><strong>Legal Remedies:</strong> Parties retain the right to pursue legal remedies through courts if mediation/arbitration fails.</li>
          <li><strong>Admin Role:</strong> Admins may provide mediation services but are not party to disputes and maintain impartiality.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">19. Fraud Prevention & Security</h2>
        <ul className="list-disc ml-6 space-y-3">
          <li><strong>Identity Verification:</strong> All users must provide verified identity documentation for high-value transactions.</li>
          <li><strong>Fraud Detection:</strong> We employ AI and manual monitoring to detect and prevent fraudulent activities.</li>
          <li><strong>Reporting Fraud:</strong> Users should immediately report suspected fraud to our support team.</li>
          <li><strong>Escrow Protection:</strong> Escrow accounts protect buyers from fraud during transaction periods.</li>
          <li><strong>Consequences:</strong> Fraudulent activities result in account termination, legal referral, and potential criminal prosecution.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-600">20. Changes to Terms</h2>
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

        <p className="mt-6 text-sm text-gray-600">Last updated: {new Date().toLocaleDateString(`en-IN`, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>
    </div>
  );
} 
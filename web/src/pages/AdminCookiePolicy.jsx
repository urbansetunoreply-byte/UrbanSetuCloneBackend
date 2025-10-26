import React from 'react';
import { FaCookie, FaShieldAlt, FaChartBar, FaBullhorn, FaCog, FaUserShield } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';
import ContactSupportWrapper from '../components/ContactSupportWrapper';

const AdminCookiePolicy = () => {
  // Set page title
  usePageTitle("Admin Cookie Policy - Privacy Information");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <FaCookie className="text-3xl text-amber-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Cookie Policy</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn about how UrbanSetu uses cookies for administrative functions and enhanced security.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What are Cookies?</h2>
            <p className="text-gray-700 leading-relaxed">
              Cookies are small text files that are stored on your device when you access our admin panel. 
              They help us provide secure administrative functionality and maintain system integrity 
              while protecting sensitive administrative data.
            </p>
          </section>

          {/* Cookie Types */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Types of Cookies We Use</h2>
            
            <div className="space-y-6">
              {/* Necessary Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FaShieldAlt className="text-xl text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Necessary Cookies</h3>
                    <p className="text-gray-700 mb-3">
                      These cookies are essential for admin panel functionality. They cannot be disabled 
                      and are required for authentication, session management, and administrative security.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Admin authentication, session tokens, security cookies, role-based access</p>
                      <p><strong>Duration:</strong> Session or up to 30 days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FaChartBar className="text-xl text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Cookies</h3>
                    <p className="text-gray-700 mb-3">
                      These cookies help us monitor admin panel usage, system performance, and user activity 
                      to ensure optimal administrative functionality and security.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Admin activity tracking, system performance monitoring, audit logs</p>
                      <p><strong>Duration:</strong> Up to 2 years</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FaBullhorn className="text-xl text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing Cookies</h3>
                    <p className="text-gray-700 mb-3">
                      These cookies help us provide relevant administrative notifications and system updates 
                      to keep you informed about platform changes and improvements.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Admin notifications, system updates, platform announcements</p>
                      <p><strong>Duration:</strong> Up to 1 year</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FaCog className="text-xl text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Functional Cookies</h3>
                    <p className="text-gray-700 mb-3">
                      These cookies remember your admin preferences and settings to provide a personalized 
                      administrative experience and maintain your workflow efficiency.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Dashboard preferences, filter settings, notification preferences, admin theme</p>
                      <p><strong>Duration:</strong> Up to 1 year</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FaUserShield className="text-xl text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Cookies</h3>
                    <p className="text-gray-700 mb-3">
                      These cookies are specifically designed for administrative security, including 
                      fraud detection, access control, and audit trail maintenance.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> CSRF protection, admin session validation, security audit logs</p>
                      <p><strong>Duration:</strong> Session only</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Admin-Specific Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Admin Cookie Management</h2>
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Managing Administrative Cookies</h3>
              <p className="text-gray-700 mb-4">
                As an administrator, you have additional controls for managing cookies:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Admin panel cookie settings in your profile</li>
                <li>System-wide cookie policy management tools</li>
                <li>Advanced security cookie configurations</li>
                <li>Audit trail and compliance reporting</li>
              </ul>
              
              <div className="mt-4 p-4 bg-white rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Security Note:</strong> Disabling security cookies may compromise administrative 
                  security and violate compliance requirements. Consult with your system administrator 
                  before making changes to security-related cookie settings.
                </p>
              </div>
            </div>
          </section>

          {/* Compliance Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Compliance & Security</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Administrative Compliance</h3>
              <p className="text-gray-700 mb-4">
                Our cookie usage for administrative functions complies with:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>GDPR requirements for administrative data processing</li>
                <li>Industry security standards for admin panel access</li>
                <li>Internal audit and compliance frameworks</li>
                <li>Data protection regulations for administrative functions</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For administrative cookie policy questions or security concerns, contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Email:</strong> admin-privacy@urbansetu.com<br />
                <strong>Phone:</strong> +1 (555) 123-4567<br />
                <strong>Address:</strong> UrbanSetu Admin Privacy Team, 123 Real Estate Ave, City, State 12345
              </p>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
            <p className="text-gray-700">
              We may update this Admin Cookie Policy from time to time to reflect changes in our 
              administrative practices or security requirements. Administrators will be notified 
              of any material changes through the admin panel or direct communication.
            </p>
          </section>
        </div>
      </div>
      
      {/* Contact Support Wrapper */}
      <ContactSupportWrapper />
    </div>
  );
};

export default AdminCookiePolicy;
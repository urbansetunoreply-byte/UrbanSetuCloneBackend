import React from 'react';
import { FaCookie, FaShieldAlt, FaChartBar, FaBullhorn, FaCog } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';
import ContactSupportWrapper from '../components/ContactSupportWrapper';

const UserCookiePolicy = () => {
  // Set page title
  usePageTitle("User Cookie Policy - Privacy Information");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <FaCookie className="text-3xl text-amber-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">User Cookie Policy</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn about how UrbanSetu uses cookies to enhance your user experience and protect your privacy.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString(`en-IN`, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* Manage Cookies CTA */}
          <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm text-amber-800">You can change your cookie preferences anytime.</div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openCookieSettings'))}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
            >
              Manage Cookies
            </button>
          </div>
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What are Cookies?</h2>
            <p className="text-gray-700 leading-relaxed">
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our site as a registered user.
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
                      These cookies are essential for your user account to function properly. They cannot be disabled 
                      and are required for authentication, session management, and security features.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Login sessions, authentication tokens, security cookies, user preferences</p>
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
                      These cookies help us understand how you use our platform as a registered user, 
                      allowing us to improve features and personalize your experience.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> User behavior tracking, feature usage analytics, performance monitoring</p>
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
                      These cookies help us show you relevant property recommendations and personalized 
                      content based on your interests and search history.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Property recommendations, personalized content, targeted notifications</p>
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
                      These cookies remember your preferences and settings to provide a personalized 
                      experience tailored to your needs as a user.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Search preferences, favorite properties, notification settings, theme preferences</p>
                      <p><strong>Duration:</strong> Up to 1 year</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* User-Specific Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Cookie Preferences</h2>
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Managing Your Preferences</h3>
              <p className="text-gray-700 mb-4">
                As a registered user, you can manage your cookie preferences at any time through:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Your user profile settings</li>
                <li>The cookie consent banner on our website</li>
                <li>Your browser's cookie settings</li>
              </ul>
              
              <div className="mt-4 p-4 bg-white rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Disabling certain cookies may affect your user experience and limit 
                  some personalized features we offer to registered users.
                </p>
              </div>
            </div>
          </section>

          {/* Related Policies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Related Policies</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                For more information about our data practices and terms of service, please review our:
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="/user/privacy" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  🔒 Privacy Policy
                </a>
                <a 
                  href="/user/terms" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  📋 Terms of Service
                </a>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@urbansetu.com<br />
                <strong>Phone:</strong> +1 (555) 123-4567<br />
                <strong>Address:</strong> UrbanSetu Privacy Team, 123 Real Estate Ave, City, State 12345
              </p>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
            <p className="text-gray-700">
              We may update this Cookie Policy from time to time to reflect changes in our practices 
              or for other operational, legal, or regulatory reasons. We will notify you of any 
              material changes through your user account or by email.
            </p>
          </section>
        </div>
      </div>
      
      {/* Contact Support Wrapper */}
      <ContactSupportWrapper />
    </div>
  );
};

export default UserCookiePolicy;
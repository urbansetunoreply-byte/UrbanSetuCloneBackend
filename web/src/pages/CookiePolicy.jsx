import React from 'react';
import { FaCookie, FaShieldAlt, FaChartBar, FaBullhorn, FaCog } from 'react-icons/fa';
import ContactSupportWrapper from '../components/ContactSupportWrapper';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <FaCookie className="text-3xl text-amber-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Cookie Policy</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn about how UrbanSetu uses cookies to enhance your experience and protect your privacy.
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
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our site.
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
                      These cookies are essential for the website to function properly. They cannot be disabled 
                      and are required for basic website functionality, security, and user authentication.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Session cookies, authentication tokens, security cookies</p>
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
                      These cookies help us understand how visitors interact with our website by collecting 
                      and reporting information anonymously. This helps us improve our website's performance.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Google Analytics, page view tracking, user behavior analysis</p>
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
                      These cookies are used to track visitors across websites to display relevant and 
                      engaging advertisements. They help us show you ads that are more likely to be of interest to you.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Advertising networks, social media pixels, remarketing</p>
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
                      These cookies enable enhanced functionality and personalization, such as remembering 
                      your preferences, language settings, and other customizations.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p><strong>Examples:</strong> Language preferences, theme settings, user preferences</p>
                      <p><strong>Duration:</strong> Up to 1 year</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How to Manage Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Manage Your Cookie Preferences</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">On Our Website</h3>
              <p className="text-gray-700 mb-4">
                You can manage your cookie preferences at any time by clicking the "Manage Cookies" 
                button in the cookie consent banner or by visiting our cookie settings page.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">In Your Browser</h3>
              <p className="text-gray-700 mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Block all cookies</li>
                <li>Block third-party cookies only</li>
                <li>Delete existing cookies</li>
                <li>Set your browser to ask for permission before setting cookies</li>
              </ul>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Disabling certain cookies may affect the functionality of our website 
                  and your user experience.
                </p>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              We may use third-party services that set their own cookies. These services include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
              <li><strong>Google Maps:</strong> For location services and map functionality</li>
              <li><strong>Cloudinary:</strong> For image and media optimization</li>
              <li><strong>Vercel:</strong> For website hosting and performance optimization</li>
            </ul>
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
              material changes by posting the updated policy on our website.
            </p>
          </section>
        </div>
      </div>
      
      {/* Contact Support Wrapper */}
      <ContactSupportWrapper />
    </div>
  );
};

export default CookiePolicy;
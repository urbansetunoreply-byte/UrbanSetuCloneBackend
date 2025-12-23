import React from 'react';
import { Cookie, Shield, BarChart, FileText, Settings, Info, CheckCircle2, XCircle, ExternalLink, Mail, Phone, MapPin } from 'lucide-react';
import ContactSupportWrapper from '../components/ContactSupportWrapper';

const AdminCookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80')] opacity-10 bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-full mb-6 ring-4 ring-white/20">
              <Cookie className="w-12 h-12 text-amber-300" />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">Cookie Policy</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-light leading-relaxed">
              Transparency and control over your data. Learn how we use cookies to improve your experience.
            </p>
            <div className="mt-8 text-sm font-medium bg-blue-900/40 inline-block px-4 py-2 rounded-full border border-blue-500/30">
              Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 -mt-16 flex flex-col gap-12 relative z-20">
        {/* Intro Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 animate-fade-in-up border border-gray-100" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Info className="w-8 h-8 text-blue-600" />
                What are Cookies?
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Cookies are small text files stored on your device when you visit our website. They act as a memory for the website, allowing it to recognize you and remember your preferences, ensuring a smoother and more personalized experience.
              </p>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 min-w-[300px]">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Your Preferences
              </h3>
              <p className="text-blue-800 text-sm mb-4">
                You have full control over your cookie settings. You can modify them at any time.
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openCookieSettings'))}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Cookie className="w-4 h-4" /> Manage Cookies
              </button>
            </div>
          </div>
        </div>

        {/* Cookie Types Grid */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Types of Cookies We Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Necessary */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100">
              <div className="h-2 bg-green-500"></div>
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Necessary</h3>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Essential for the website's core functionality, security, and accessibility. These cannot be disabled.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Authentication
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Security
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100">
              <div className="h-2 bg-blue-500"></div>
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <BarChart className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Analytics</h3>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Help us understand how you use our site, allowing us to improve performance and usability.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" /> Page Views
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" /> Navigation Paths
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100">
              <div className="h-2 bg-purple-500"></div>
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Marketing</h3>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Used to deliver relevant advertisements and measure the effectiveness of our marketing campaigns.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" /> Ad Personalization
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" /> Campaign Tracking
                  </div>
                </div>
              </div>
            </div>

            {/* Functional */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100">
              <div className="h-2 bg-orange-500"></div>
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-orange-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Settings className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Functional</h3>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Enable advanced features and personalization, such as remembering your language or login details.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-orange-500" /> Preferences
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-orange-500" /> Local Settings
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Cookie Table */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Specific Cookies We Use
            </h2>
            <p className="text-gray-600 mt-2">A detailed list of the first-party and third-party cookies currently in use on UrbanSetu.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="p-6">Cookie Name</th>
                  <th className="p-6">Category</th>
                  <th className="p-6">Purpose</th>
                  <th className="p-6">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 font-mono text-blue-600 font-medium">access_token</td>
                  <td className="p-6"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Necessary</span></td>
                  <td className="p-6 text-gray-600">Securely authenticates your user session to access private features.</td>
                  <td className="p-6 text-gray-500">Session (15 mins)</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 font-mono text-blue-600 font-medium">refresh_token</td>
                  <td className="p-6"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Necessary</span></td>
                  <td className="p-6 text-gray-600">Allows you to stay logged in without re-entering credentials frequently.</td>
                  <td className="p-6 text-gray-500">Persistent (7 days)</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 font-mono text-blue-600 font-medium">session_id</td>
                  <td className="p-6"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Necessary</span></td>
                  <td className="p-6 text-gray-600">Uniquely identifies your browsing session to prevent fraud and manage state.</td>
                  <td className="p-6 text-gray-500">Session</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 font-mono text-blue-600 font-medium">csrftoken</td>
                  <td className="p-6"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Security</span></td>
                  <td className="p-6 text-gray-600">Protects against Cross-Site Request Forgery (CSRF) attacks.</td>
                  <td className="p-6 text-gray-500">Session</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 font-mono text-blue-600 font-medium">theme_pref</td>
                  <td className="p-6"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Functional</span></td>
                  <td className="p-6 text-gray-600">Remembers your preferred display mode (Light/Dark).</td>
                  <td className="p-6 text-gray-500">Persistent (1 year)</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6 font-mono text-blue-600 font-medium">_ga, _gid</td>
                  <td className="p-6"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Analytics</span></td>
                  <td className="p-6 text-gray-600">Google Analytics cookies to distinguish unique users and throttle request rates.</td>
                  <td className="p-6 text-gray-500">2 years / 24 hours</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Browser Management Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Settings className="w-6 h-6 text-gray-600" /> Managing Cookies in Your Browser
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all text-center group">
              <span className="font-semibold text-gray-700 group-hover:text-blue-600 block mb-1">Google Chrome</span>
              <span className="text-xs text-gray-500">Manage settings &rarr;</span>
            </a>
            <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all text-center group">
              <span className="font-semibold text-gray-700 group-hover:text-blue-600 block mb-1">Safari</span>
              <span className="text-xs text-gray-500">Manage settings &rarr;</span>
            </a>
            <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all text-center group">
              <span className="font-semibold text-gray-700 group-hover:text-blue-600 block mb-1">Mozilla Firefox</span>
              <span className="text-xs text-gray-500">Manage settings &rarr;</span>
            </a>
            <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c23d-708e-4050b5969269" target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all text-center group">
              <span className="font-semibold text-gray-700 group-hover:text-blue-600 block mb-1">Microsoft Edge</span>
              <span className="text-xs text-gray-500">Manage settings &rarr;</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Third Party Services */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <ExternalLink className="w-6 h-6 text-gray-600" /> Third-Party Services
            </h2>
            <p className="text-gray-600 mb-6">
              We partner with trusted service providers who may also set cookies on your device.
            </p>
            <div className="space-y-3">
              {[
                { name: 'Google Analytics', url: 'https://marketingplatform.google.com/about/analytics/terms/us/' },
                { name: 'Google Maps', url: 'https://cloud.google.com/maps-platform/terms/' },
                { name: 'Cloudinary CDN', url: 'https://cloudinary.com/privacy' },
                { name: 'Vercel Analytics', url: 'https://vercel.com/legal/privacy-policy' }
              ].map((service) => (
                <a
                  key={service.name}
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group cursor-pointer"
                >
                  <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{service.name}</span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Have Questions?</h2>
            <p className="text-blue-100 mb-8">
              If you have specific questions about our cookie policy or data privacy, our team is here to help.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <Mail className="w-6 h-6 text-blue-200" />
                <div>
                  <div className="text-xs text-blue-200 uppercase tracking-wider">Email Us</div>
                  <div className="font-medium">privacy@urbansetu.com</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <Phone className="w-6 h-6 text-blue-200" />
                <div>
                  <div className="text-xs text-blue-200 uppercase tracking-wider">Call Us</div>
                  <div className="font-medium">+91 (800) 123-4567</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <MapPin className="w-6 h-6 text-blue-200" />
                <div>
                  <div className="text-xs text-blue-200 uppercase tracking-wider">Visit Us</div>
                  <div className="font-medium">UrbanSetu HQ, Bangalore, India</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-gray-500 mb-4">View our other policies for more details.</p>
          <div className="flex justify-center gap-6">
            <a href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">Privacy Policy</a>
            <span className="text-gray-300">|</span>
            <a href="/terms" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">Terms of Service</a>
          </div>
        </div>
      </div>

      <ContactSupportWrapper />
    </div>
  );
};

export default AdminCookiePolicy;
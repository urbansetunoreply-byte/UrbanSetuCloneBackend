import React, { useState, useEffect } from 'react'
import ContactSupportWrapper from '../components/ContactSupportWrapper';
import { FaBullseye, FaGlobe, FaUsers, FaShieldAlt, FaUserFriends, FaEnvelope, FaStar, FaPhone, FaMobileAlt, FaDownload, FaAndroid, FaEye, FaCog, FaRocket, FaHeart, FaLock, FaCheckCircle, FaQuestionCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { downloadAndroidApp, isAndroidDevice, isMobileDevice, getDownloadMessage, getDownloadButtonText } from '../utils/androidDownload';
import { toast } from 'react-toastify';

import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

export default function About() {
  // Set page title
  usePageTitle("About Us - Learn About UrbanSetu");

  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const { currentUser } = useSelector((state) => state.user) || {};
  let termsLink = '/terms';
  let privacyLink = '/privacy';
  if (currentUser) {
    if (currentUser.role === 'admin' || currentUser.role === 'rootadmin') {
      termsLink = '/admin/terms';
      privacyLink = '/admin/privacy';
    } else {
      termsLink = '/user/terms';
      privacyLink = '/user/privacy';
    }
  }

  // Function to handle phone number clicks
  const handlePhoneClick = (phoneNumber) => {
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // For mobile devices, open phone dialer
      window.location.href = `tel:${phoneNumber}`;
    } else {
      // For desktop, copy to clipboard
      navigator.clipboard.writeText(phoneNumber).then(() => {
        alert(`Phone number ${phoneNumber} copied to clipboard!`);
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = phoneNumber;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`Phone number ${phoneNumber} copied to clipboard!`);
      });
    }
  };

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/about`);
        if (response.ok) {
          const data = await response.json();
          setAboutData(data);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching about data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAboutData();
  }, []);

  if (loading || !aboutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading about page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Animations */}
      <style>
        {`
            @keyframes blob {
                0% { transform: translate(0px, 0px) scale(1); }
                33% { transform: translate(30px, -50px) scale(1.1); }
                66% { transform: translate(-20px, 20px) scale(0.9); }
                100% { transform: translate(0px, 0px) scale(1); }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-blob { animation: blob 7s infinite; }
            .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
            .animate-fade-in-delay { animation: fadeIn 0.6s ease-out 0.2s forwards; opacity: 0; }
        `}
      </style>

      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-in">

        {/* 1. Introduction / Hero Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-5xl font-extrabold text-blue-700 mb-6 drop-shadow flex items-center justify-center gap-3">
            <FaGlobe className="text-blue-400" /> {aboutData.heroTitle || 'Welcome to UrbanSetu'}
          </h1>
          <p className="text-xl text-slate-700 font-medium max-w-4xl mx-auto leading-relaxed">
            {aboutData.heroText || ''}
          </p>
        </div>

        {/* 2. Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-purple-700 flex items-center justify-center gap-3 mb-4">
              <FaBullseye className="text-purple-500" /> Our Mission
            </h2>
            <p className="text-slate-700 text-lg leading-relaxed">
              {aboutData.mission || ''}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-blue-700 flex items-center justify-center gap-3 mb-4">
              <FaEye className="text-blue-500" /> Our Vision
            </h2>
            <p className="text-slate-700 text-lg leading-relaxed">
              {aboutData.vision || ''}
            </p>
          </div>
        </div>

        {/* 3. Core Values */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-green-700 flex items-center gap-3 mb-6 text-center justify-center">
            <FaHeart className="text-green-500" /> Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(aboutData.coreValues || []).map((value, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-gray-800 mb-3">{value.title}</h3>
                <p className="text-slate-700">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. How UrbanSetu Works */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-blue-700 flex items-center gap-3 mb-8 text-center justify-center">
            <FaCog className="text-blue-500" /> How UrbanSetu Works
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {(aboutData.howItWorks ? Object.entries(aboutData.howItWorks) : []).map(([key, section], idx) => (
              <div key={key} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <FaRocket className="text-blue-600" /> {section.title}
                </h3>
                <ul className="space-y-3">
                  {(section.steps || []).map((step, stepIdx) => (
                    <li key={stepIdx} className="flex items-start gap-3 text-slate-700">
                      <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Key Features */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-blue-700 flex items-center gap-3 mb-6 text-center justify-center">
            <FaStar className="text-yellow-500" /> Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(aboutData.features || []).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <FaCheckCircle className="text-green-500 flex-shrink-0" />
                <span className="text-slate-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Our Journey */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-purple-700 flex items-center gap-3 mb-6 text-center justify-center">
            <FaRocket className="text-purple-500" /> {aboutData.journey?.title || 'Our Journey'}
          </h2>
          <p className="text-lg text-slate-700 text-center mb-8 max-w-4xl mx-auto leading-relaxed">
            {aboutData.journey?.story || ''}
          </p>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
            <div className="space-y-8">
              {(aboutData.journey?.milestones || []).map((milestone, idx) => (
                <div key={idx} className="relative flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 relative z-10">
                    {milestone.year}
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200 flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{milestone.title}</h3>
                    <p className="text-slate-700">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7. Who We Serve */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-green-700 flex items-center gap-3 mb-6 text-center justify-center">
            <FaUsers className="text-green-500" /> Who We Serve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(aboutData.whoWeServe || []).map((audience, idx) => (
              <div key={idx} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200 text-center hover:shadow-md transition-shadow">
                <FaUsers className="text-green-500 text-3xl mx-auto mb-4" />
                <p className="text-slate-700 font-medium">{audience}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 8. Team Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-purple-700 flex items-center gap-3 mb-6 text-center justify-center">
            <FaUserFriends className="text-purple-500" /> Meet Our Team
          </h2>
          <p className="text-lg text-slate-700 text-center mb-8 max-w-4xl mx-auto">
            {aboutData.team || ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(aboutData.teamMembers || []).map((member, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg p-6 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                <p className="text-sm text-slate-600">{member.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 9. Trust & Security */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-blue-700 flex items-center gap-3 mb-6 text-center justify-center">
            <FaShieldAlt className="text-blue-500" /> Trust & Security
          </h2>
          <p className="text-lg text-slate-700 text-center max-w-4xl mx-auto leading-relaxed">
            {aboutData.trust || ''}
          </p>
        </div>

        {/* 10. FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-green-700 flex items-center gap-3 mb-8 text-center justify-center">
            <FaQuestionCircle className="text-green-500" /> Frequently Asked Questions
          </h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {(aboutData.faqs || []).map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-6 text-left bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="font-semibold text-gray-800">{faq.question}</span>
                  {expandedFaq === idx ? (
                    <FaChevronUp className="text-blue-600" />
                  ) : (
                    <FaChevronDown className="text-blue-600" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="p-6 bg-white border-t border-gray-200">
                    <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 11. Contact & Support */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-green-700 flex items-center gap-3 mb-6 text-center justify-center">
            <FaEnvelope className="text-green-500" /> Contact & Support
          </h2>
          <p className="text-lg text-slate-700 text-center mb-8 whitespace-pre-line">
            {aboutData.contact || ''}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Support */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <FaPhone className="text-blue-600" /> Phone Support
              </h3>
              <div className="space-y-3">
                <button onClick={() => handlePhoneClick('+1-555-123-4567')} className="flex items-center gap-3 text-blue-700 hover:text-blue-800 hover:bg-blue-200 p-3 rounded-lg transition-all duration-200 w-full text-left">
                  <FaMobileAlt className="text-blue-600" />
                  <span className="font-medium">+1 (555) 123-4567</span>
                </button>
                <button onClick={() => handlePhoneClick('+1-555-987-6543')} className="flex items-center gap-3 text-blue-700 hover:text-blue-800 hover:bg-blue-200 p-3 rounded-lg transition-all duration-200 w-full text-left">
                  <FaPhone className="text-blue-600" />
                  <span className="font-medium">+1 (555) 987-6543</span>
                </button>
              </div>
              <p className="text-sm text-blue-600 mt-3">📱 Mobile: Tap to call | 💻 Desktop: Click to copy</p>
            </div>

            {/* Email Support */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                <FaEnvelope className="text-green-600" /> Email Support
              </h3>
              <div className="space-y-3">
                <a href="mailto:support@urbansetu.com" className="flex items-center gap-3 text-green-700 hover:text-green-800 hover:bg-green-200 p-3 rounded-lg transition-all duration-200">
                  <FaEnvelope className="text-green-600" />
                  <span className="font-medium">support@urbansetu.com</span>
                </a>
                <a href="mailto:info@urbansetu.com" className="flex items-center gap-3 text-green-700 hover:text-green-800 hover:bg-green-200 p-3 rounded-lg transition-all duration-200">
                  <FaEnvelope className="text-green-600" />
                  <span className="font-medium">info@urbansetu.com</span>
                </a>
              </div>
              <p className="text-sm text-green-600 mt-3">📧 24/7 email support available</p>
            </div>
          </div>
        </div>
      </div>
      {/* Android App Download Section (bottom) */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="mb-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FaAndroid className="text-4xl text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Available on Android</h2>
                <p className="text-gray-600">Get the UrbanSetu mobile app for the best experience</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-2">
              <button
                onClick={async () => {
                  const result = await downloadAndroidApp();
                  if (result.success) {
                    toast.success(result.message);
                  } else {
                    toast.error(result.message);
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FaDownload className="text-xl" />
                <span>{getDownloadButtonText()}</span>
              </button>
            </div>
            <p className="text-sm text-gray-500">Download our Android app to access UrbanSetu on your mobile device!</p>
          </div>
        </div>
      </div>
      {/* Connect with Us section */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-6 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-2">Connect with Us</h2>
        <div className="flex gap-4 text-2xl mb-2">
          <a href={`mailto:${aboutData.socialLinks?.email || 'contact@urbansetu.com'}`} target="_blank" rel="noopener noreferrer" title="Email"><FaEnvelope /></a>
          <a href={aboutData.socialLinks?.instagram || "https://instagram.com/urbansetu"} target="_blank" rel="noopener noreferrer" title="Instagram"><svg className="inline w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5zm4.25 2.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5.25 1.25a1 1 0 1 1 0 2a1 1 0 0 1 0-2z" /></svg></a>
          <a href={aboutData.socialLinks?.x || "https://x.com/urbansetu"} target="_blank" rel="noopener noreferrer" title="X"><svg className="inline w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.53 2H21l-7.19 8.21L22 22h-6.56l-5.18-6.98L2.47 22H-1l7.61-8.7L2 2h6.56l4.93 6.64L17.53 2zm-2.1 16.5h2.13l-5.98-8.06l-2.13-2.87H7.47l5.98 8.06l2.13 2.87z" /></svg></a>
          <a href={aboutData.socialLinks?.facebook || "https://facebook.com/urbansetu"} target="_blank" rel="noopener noreferrer" title="Facebook"><svg className="inline w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.326 24H12.82v-9.294H9.692v-3.622h3.127V8.413c0-3.1 1.893-4.788 4.659-4.788c1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" /></svg></a>
          <a href={aboutData.socialLinks?.youtube || "https://youtube.com/@urbansetu"} target="_blank" rel="noopener noreferrer" title="YouTube"><svg className="inline w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.112C19.454 3.5 12 3.5 12 3.5s-7.454 0-9.386.574A2.994 2.994 0 0 0 .502 6.186C0 8.118 0 12 0 12s0 3.882.502 5.814a2.994 2.994 0 0 0 2.112 2.112C4.546 20.5 12 20.5 12 20.5s7.454 0 9.386-.574a2.994 2.994 0 0 0 2.112-2.112C24 15.882 24 12 24 12s0-3.882-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></a>
        </div>
        <div className="text-xs text-gray-500 mt-2">&copy; {new Date().getFullYear()} UrbanSetu. All rights reserved.</div>
      </div>

      {/* Contact Support Wrapper */}
      <ContactSupportWrapper />
    </div>
  )
}

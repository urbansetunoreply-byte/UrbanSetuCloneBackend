import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import AboutSkeleton from '../components/skeletons/AboutSkeleton';
import { Link } from 'react-router-dom';
import { FaBullseye, FaGlobe, FaUsers, FaShieldAlt, FaUserFriends, FaEnvelope, FaStar, FaPhone, FaMobileAlt, FaAndroid, FaDownload, FaEye, FaCog, FaRocket, FaHeart, FaLock, FaCheckCircle, FaQuestionCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { downloadAndroidApp, getDownloadButtonText } from '../utils/androidDownload';
import ContactSupportWrapper from '../components/ContactSupportWrapper';

import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu-pvt4.onrender.com';

export default function PublicAbout() {
  // Set page title
  usePageTitle("About Us - Learn About UrbanSetu");

  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const termsLink = '/terms';
  const privacyLink = '/privacy';
  const communityGuidelinesLink = '/community-guidelines';

  const handlePhoneClick = (phoneNumber) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      navigator.clipboard.writeText(phoneNumber).then(() => {
        alert(`Phone number ${phoneNumber} copied to clipboard!`);
      }).catch(() => {
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
        const response = await authenticatedFetch(`${API_BASE_URL}/api/about`, { autoRedirect: false });
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
    return <AboutSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
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
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-400 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-in">

        {/* 1. Introduction / Hero Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center border border-transparent dark:border-gray-800 transition-colors">
          <h1 className="text-5xl font-extrabold text-blue-700 dark:text-blue-400 mb-6 drop-shadow flex items-center justify-center gap-3">
            <FaGlobe className="text-blue-400 dark:text-blue-300" /> {aboutData.heroTitle || 'Welcome to UrbanSetu'}
          </h1>
          <p className="text-xl text-slate-700 dark:text-gray-300 font-medium max-w-4xl mx-auto leading-relaxed">
            {aboutData.heroText || ''}
          </p>
        </div>

        {/* 2. Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
            <h2 className="text-3xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-center gap-3 mb-4">
              <FaBullseye className="text-purple-500 dark:text-purple-300" /> Our Mission
            </h2>
            <p className="text-slate-700 dark:text-gray-300 text-lg leading-relaxed">
              {aboutData.mission || ''}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
            <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-3 mb-4">
              <FaEye className="text-blue-500 dark:text-blue-300" /> Our Vision
            </h2>
            <p className="text-slate-700 dark:text-gray-300 text-lg leading-relaxed">
              {aboutData.vision || ''}
            </p>
          </div>
        </div>

        {/* 3. Core Values */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
          <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 flex items-center gap-3 mb-6 text-center justify-center">
            <FaHeart className="text-green-500 dark:text-green-300" /> Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(aboutData.coreValues || []).map((value, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/40 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{value.title}</h3>
                <p className="text-slate-700 dark:text-gray-300">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. How UrbanSetu Works */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
          <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-3 mb-8 text-center justify-center">
            <FaCog className="text-blue-500 dark:text-blue-300" /> How UrbanSetu Works
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {(aboutData.howItWorks ? Object.entries(aboutData.howItWorks) : []).map(([key, section], idx) => (
              <div key={key} className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800 transition-colors">
                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                  <FaRocket className="text-blue-600 dark:text-blue-400" /> {section.title}
                </h3>
                <ul className="space-y-3">
                  {(section.steps || []).map((step, stepIdx) => (
                    <li key={stepIdx} className="flex items-start gap-3 text-slate-700 dark:text-gray-300 transition-colors">
                      <FaCheckCircle className="text-green-500 dark:text-green-400 mt-1 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Key Features */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
          <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-3 mb-6 text-center justify-center">
            <FaStar className="text-yellow-500 dark:text-yellow-400" /> Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(aboutData.features || []).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/40 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                <FaCheckCircle className="text-green-500 dark:text-green-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-gray-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Our Journey */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
          <h2 className="text-3xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-3 mb-6 text-center justify-center">
            <FaRocket className="text-purple-500 dark:text-purple-400" /> {aboutData.journey?.title || 'Our Journey'}
          </h2>
          <p className="text-lg text-slate-700 dark:text-gray-300 text-center mb-8 max-w-4xl mx-auto leading-relaxed transition-colors">
            {aboutData.journey?.story || ''}
          </p>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 opacity-50"></div>
            <div className="space-y-8">
              {(aboutData.journey?.milestones || []).map((milestone, idx) => (
                <div key={idx} className="relative flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 relative z-10 shadow-lg">
                    {milestone.year}
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/40 rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex-1 transition-all">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{milestone.title}</h3>
                    <p className="text-slate-700 dark:text-gray-300">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7. Who We Serve */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
          <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 flex items-center gap-3 mb-6 text-center justify-center">
            <FaUsers className="text-green-500 dark:text-green-400" /> Who We Serve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(aboutData.whoWeServe || []).map((audience, idx) => (
              <div key={idx} className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800 text-center hover:shadow-md transition-all">
                <FaUsers className="text-green-500 dark:text-green-400 text-3xl mx-auto mb-4" />
                <p className="text-slate-700 dark:text-gray-300 font-medium">{audience}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 8. Team Section */}
        <div className="space-y-8">
          {/* CEO Spotlight */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-transparent dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-3xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-3 mb-8 text-center justify-center">
              <FaUserFriends className="text-purple-500" /> Leadership Spotlight
            </h2>
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 max-w-6xl mx-auto">
              {/* Left: Main Profile */}
              <div className="flex-1 text-center lg:text-left">
                <div className="w-56 h-56 mx-auto lg:mx-0 relative rounded-full overflow-hidden border-4 border-purple-500 shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300">
                  <img src="/images/bhavith_ceo.png" alt="Bhavith Tungena" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-2">Bhavith Tungena</h3>
                <div className="inline-block bg-blue-100 dark:bg-blue-900/30 px-4 py-1 rounded-full mb-4">
                  <p className="text-blue-700 dark:text-blue-400 font-bold text-lg">CEO & Founder</p>
                </div>
                <p className="text-lg text-slate-600 dark:text-gray-300 italic mb-6 leading-relaxed">
                  "Innovating at the intersection of Real Estate and Artificial Intelligence."
                </p>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800 shadow-sm text-left">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    <FaRocket className="text-purple-500" /> Visionary & Technologist
                  </h4>
                  <p className="text-slate-600 dark:text-gray-400 mb-4 leading-relaxed">
                    A visionary leader and motivational speaker with immense experience in real estate and software development.
                    Expertise in <strong>Machine Learning, Data Science, and GenAI</strong>.
                    Currently pursuing engineering at <span className="text-purple-600 dark:text-purple-400 font-medium">Kakatiya Institute of Technology & Science, Warangal (2022-2026)</span>.
                  </p>
                  <a href="https://www.linkedin.com/in/bhavith-tungena-b6689727a/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
                    <FaGlobe /> Connect on LinkedIn
                  </a>
                </div>
              </div>

              {/* Right: Featured Moments / Gallery */}
              <div className="flex-1 w-full max-w-md lg:max-w-none">
                <div className="grid grid-cols-2 gap-4 relative">
                  <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden shadow-xl h-80 transform rotate-2 hover:rotate-0 transition-all duration-500 border-2 border-white dark:border-gray-800">
                    <img src="/images/bhavith_ceo_2.jpg" alt="Bhavith Tungena - Speaking" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="col-span-1 rounded-2xl overflow-hidden shadow-xl h-36 transform -rotate-2 hover:rotate-0 transition-all duration-500 border-2 border-white dark:border-gray-800 mt-4">
                    <img src="/images/bhavith_ceo_3.jpg" alt="Bhavith Tungena - Event" className="w-full h-full object-cover object-top hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="col-span-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white h-36 border-2 border-white dark:border-gray-800 shadow-xl transform rotate-1 hover:rotate-0 transition-all duration-500">
                    <div className="text-center p-4">
                      <FaStar className="text-3xl mx-auto mb-2 text-yellow-300" />
                      <span className="font-bold text-sm">Most Eligible & Motivational Speaker</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
            <h2 className="text-3xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-3 mb-6 text-center justify-center">
              <FaUserFriends className="text-purple-500 dark:text-purple-400" /> Meet Our Team
            </h2>
            <p className="text-lg text-slate-700 dark:text-gray-300 text-center mb-8 max-w-4xl mx-auto transition-colors">
              {aboutData.team || ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(aboutData.teamMembers || []).map((member, idx) => (
                <div key={idx} className="bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/30 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition-all">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-md">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 transition-colors">{member.name}</h3>
                  <p className="text-blue-600 dark:text-blue-400 font-medium mb-2 transition-colors">{member.role}</p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 9. Trust & Security */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
          <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-3 mb-6 text-center justify-center">
            <FaShieldAlt className="text-blue-500 dark:text-blue-300" /> Trust & Security
          </h2>
          <p className="text-lg text-slate-700 dark:text-gray-300 text-center max-w-4xl mx-auto leading-relaxed transition-colors">
            {aboutData.trust || ''}
          </p>
        </div>

        {/* 10. FAQ Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
          <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 flex items-center gap-3 mb-8 text-center justify-center">
            <FaQuestionCircle className="text-green-500 dark:text-green-400" /> Frequently Asked Questions
          </h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {(aboutData.faqs || []).map((faq, idx) => (
              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-6 text-left bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/40 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/60 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="font-semibold text-gray-800 dark:text-white transition-colors">{faq.question}</span>
                  {expandedFaq === idx ? (
                    <FaChevronUp className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <FaChevronDown className="text-blue-600 dark:text-blue-400" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
                        <p className="text-slate-700 dark:text-gray-300 leading-relaxed transition-colors">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* 11. Contact & Support */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-transparent dark:border-gray-800 transition-colors">
          <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 flex items-center gap-3 mb-6 text-center justify-center">
            <FaEnvelope className="text-green-500 dark:text-green-400" /> Contact & Support
          </h2>
          <p className="text-lg text-slate-700 dark:text-gray-300 text-center mb-8 whitespace-pre-line transition-colors">
            {aboutData.contact || ''}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Support */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 rounded-lg p-6 border border-blue-200 dark:border-blue-800 transition-colors">
              <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                <FaPhone className="text-blue-600 dark:text-blue-400" /> Phone Support
              </h3>
              <div className="space-y-3">
                <button onClick={() => handlePhoneClick('+1-555-123-4567')} className="flex items-center gap-3 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800 p-3 rounded-lg transition-all duration-200 w-full text-left">
                  <FaMobileAlt className="text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">+1 (555) 123-4567</span>
                </button>
                <button onClick={() => handlePhoneClick('+1-555-987-6543')} className="flex items-center gap-3 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800 p-3 rounded-lg transition-all duration-200 w-full text-left">
                  <FaPhone className="text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">+1 (555) 987-6543</span>
                </button>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-3">ðŸ“± Mobile: Tap to call | ðŸ’» Desktop: Click to copy</p>
            </div>

            {/* Email Support */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40 rounded-lg p-6 border border-green-200 dark:border-green-800 transition-colors">
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                <FaEnvelope className="text-green-600 dark:text-green-400" /> Email Support
              </h3>
              <div className="space-y-3">
                <a href="mailto:support@urbansetu.com" className="flex items-center gap-3 text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100 hover:bg-green-200 dark:hover:bg-green-800 p-3 rounded-lg transition-all duration-200">
                  <FaEnvelope className="text-green-600 dark:text-green-400" />
                  <span className="font-medium">support@urbansetu.com</span>
                </a>
                <a href="mailto:info@urbansetu.com" className="flex items-center gap-3 text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100 hover:bg-green-200 dark:hover:bg-green-800 p-3 rounded-lg transition-all duration-200">
                  <FaEnvelope className="text-green-600 dark:text-green-400" />
                  <span className="font-medium">info@urbansetu.com</span>
                </a>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-3">ðŸ“§ 24/7 email support available</p>
            </div>
          </div>
        </div>
      </div>
      {/* Android App Download Section (redundant placement to ensure visibility) */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mt-6 border border-transparent dark:border-gray-800 transition-colors">
        <div className="mb-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 transition-colors">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FaMobileAlt className="text-4xl text-blue-600 dark:text-blue-400 transition-colors" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">Download Our App</h2>
                <p className="text-gray-600 dark:text-gray-400 transition-colors">Get the UrbanSetu app for the best experience on any device</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-2">
              <Link
                to="/download"
                className="flex items-center gap-2 px-6 py-3 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FaDownload className="text-xl" />
                <span>Download App</span>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Available for Windows, macOS, Android, and iOS!</p>
          </div>
        </div>
      </div>
      {/* Connect with Us section */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mt-6 flex flex-col items-center border border-transparent dark:border-gray-800 transition-colors">
        <h2 className="text-xl font-bold mb-2 dark:text-white transition-colors">Connect with Us</h2>
        <div className="flex gap-4 text-2xl mb-2 dark:text-gray-300 transition-colors">
          <a href={`mailto:${aboutData.socialLinks?.email || 'contact@urbansetu.com'}`} target="_blank" rel="noopener noreferrer" title="Email" className="hover:text-blue-500 transition-colors"><FaEnvelope /></a>
          <a href={aboutData.socialLinks?.instagram || "https://instagram.com/urbansetu"} target="_blank" rel="noopener noreferrer" title="Instagram" className="hover:text-pink-500 transition-colors"><svg className="inline w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5zm4.25 2.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5.25 1.25a1 1 0 1 1 0 2a1 1 0 0 1 0-2z" /></svg></a>
          <a href={aboutData.socialLinks?.x || "https://x.com/urbansetu"} target="_blank" rel="noopener noreferrer" title="X" className="hover:text-blue-400 transition-colors"><svg className="inline w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.53 2H21l-7.19 8.21L22 22h-6.56l-5.18-6.98L2.47 22H-1l7.61-8.7L2 2h6.56l4.93 6.64L17.53 2zm-2.1 16.5h2.13l-5.98-8.06l-2.13-2.87H7.47l5.98 8.06l2.13 2.87z" /></svg></a>
          <a href={aboutData.socialLinks?.facebook || "https://facebook.com/urbansetu"} target="_blank" rel="noopener noreferrer" title="Facebook" className="hover:text-blue-600 transition-colors"><svg className="inline w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.326 24H12.82v-9.294H9.692v-3.622h3.127V8.413c0-3.1 1.893-4.788 4.659-4.788c1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" /></svg></a>
          <a href={aboutData.socialLinks?.youtube || "https://youtube.com/@urbansetu"} target="_blank" rel="noopener noreferrer" title="YouTube" className="hover:text-red-600 transition-colors"><svg className="inline w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.112C19.454 3.5 12 3.5 12 3.5s-7.454 0-9.386.574A2.994 2.994 0 0 0 .502 6.186C0 8.118 0 12 0 12s0 3.882.502 5.814a2.994 2.994 0 0 0 2.112 2.112C4.546 20.5 12 20.5 12 20.5s7.454 0 9.386-.574a2.994 2.994 0 0 0 2.112-2.112C24 15.882 24 12 24 12s0-3.882-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></a>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">&copy; {new Date().getFullYear()} UrbanSetu. All rights reserved.</div>
      </div>
      <ContactSupportWrapper />
    </div>
  );
} 

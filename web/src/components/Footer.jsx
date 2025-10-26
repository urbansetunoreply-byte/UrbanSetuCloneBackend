import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCookie, FaShieldAlt, FaFileContract } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <FaHome className="text-xl text-gray-900" />
              </div>
              <h3 className="text-xl font-bold">UrbanSetu</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Your trusted partner in finding the perfect property. 
              We make real estate simple, smart, and secure.
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <FaPhone className="text-yellow-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-yellow-400" />
                <span>info@urbansetu.com</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-yellow-400" />
                <span>123 Real Estate Ave, City, State 12345</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Search Properties
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/user/create-listing" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  List Property
                </Link>
              </li>
              <li>
                <Link to="/user/appointment" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link to="/user/ai" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link to="/user/route-planner" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Route Planner
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Privacy */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal & Privacy</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <FaFileContract className="text-xs" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <FaShieldAlt className="text-xs" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <FaCookie className="text-xs" />
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Made with ❤️ for real estate</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
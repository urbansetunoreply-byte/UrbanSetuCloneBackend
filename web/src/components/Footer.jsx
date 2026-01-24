import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaHome, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCookie, FaShieldAlt, FaFileContract, FaEye, FaHandshake } from 'react-icons/fa';
import { authenticatedFetch } from '../utils/auth';

import { API_BASE_URL } from '../config/api';

const Footer = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [visitorStats, setVisitorStats] = useState({ todayCount: 0, totalVisitors: 0 });

  // Fetch visitor stats
  useEffect(() => {
    const fetchVisitorStats = async () => {
      try {
        let today = 0;
        let total = 0;

        // 1. Fetch Daily Count (Confirmed Public Endpoint)
        try {
          const dailyRes = await authenticatedFetch(`${API_BASE_URL}/api/visitors/count/daily`);
          if (dailyRes.ok) {
            const dailyData = await dailyRes.json();
            if (dailyData.success) {
              today = dailyData.count;
              // Check if total is coincidentally returned here
              if (dailyData.total !== undefined) total = dailyData.total;
            }
          }
        } catch (e) {
          console.error('Failed to fetch daily stats', e);
        }

        // 2. Fetch Total Count (If not found yet)
        if (total === 0) {
          try {
            // Attempt to fetch from generic count endpoint
            const totalRes = await authenticatedFetch(`${API_BASE_URL}/api/visitors/count`);
            if (totalRes.ok) {
              const totalData = await totalRes.json();
              if (totalData.success) total = totalData.count;
            } else {
              // Fallback: If user is admin, use the protected stats endpoint
              if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')) {
                const statsRes = await authenticatedFetch(`${API_BASE_URL}/api/visitors/stats?days=36500`);
                if (statsRes.ok) {
                  const statsData = await statsRes.json();
                  if (statsData.success && statsData.stats) total = statsData.stats.totalVisitors;
                }
              }
            }
          } catch (e) {
            // Silent fail
          }
        }

        setVisitorStats({ todayCount: today, totalVisitors: total });
      } catch (error) {
        console.error('Failed to fetch visitor stats:', error);
      }
    };

    fetchVisitorStats();

    // Listen for visitor tracked events to update count immediately (for same browser)
    const handleVisitorTracked = () => {
      fetchVisitorStats();
    };

    window.addEventListener('visitorTracked', handleVisitorTracked);

    // Refresh count every 30 seconds for real-time updates across all users
    // This ensures when a new visitor accepts cookies on another device,
    // all users see the updated count within 30 seconds without page refresh
    const interval = setInterval(fetchVisitorStats, 30 * 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visitorTracked', handleVisitorTracked);
    };
  }, []);

  return (
    <footer className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8 md:gap-8">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <FaHome className="text-xl text-gray-900" />
              </div>
              <h3 className="text-xl font-bold dark:text-white">UrbanSetu</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm leading-relaxed max-w-sm transition-colors">
              Your trusted partner in finding the perfect property.
              We make real estate simple, smart, and secure.
            </p>
            <div className="space-y-2 text-xs md:text-sm text-gray-700 dark:text-gray-300 transition-colors">
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
          <div className="space-y-3">
            <h4 className="text-lg font-semibold dark:text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to={
                    currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                      ? "/admin"
                      : currentUser
                        ? "/user"
                        : "/"
                  }
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link to="/download" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
                  Downloads
                </Link>
              </li>
              <li>
                <Link
                  to={
                    currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                      ? "/admin/updates"
                      : currentUser
                        ? "/user/updates"
                        : "/updates"
                  }
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                >
                  Updates
                </Link>
              </li>
              <li>
                <Link
                  to={
                    currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                      ? "/admin/explore"
                      : currentUser
                        ? "/user/search"
                        : "/search"
                  }
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                >
                  Search Properties
                </Link>
              </li>
              <li>
                <Link
                  to={
                    currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                      ? "/admin/about"
                      : currentUser
                        ? "/user/about"
                        : "/about"
                  }
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to={currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin') ? "/admin/support" : "/contact"}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold dark:text-white">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={(currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin'))
                  ? "/admin/create-listing"
                  : "/user/create-listing"} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
                  List Property
                </Link>
              </li>
              <li>
                <Link to={(currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin'))
                  ? "/admin/appointments"
                  : "/user/my-appointments"} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link
                  to={
                    currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                      ? "/admin/ai"
                      : currentUser
                        ? "/user/ai"
                        : "/ai"
                  }
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                >
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link
                  to={(currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin'))
                    ? "/admin/route-planner"
                    : "/user/route-planner"}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                >
                  Route Planner
                </Link>
              </li>
              <li>
                <Link
                  to={(currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin'))
                    ? "/admin/rental-contracts"
                    : "/user/rental-contracts"}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                >
                  Rental Contracts
                </Link>
              </li>
              <li>
                <Link
                  to={(currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin'))
                    ? "/admin/property-verification"
                    : "/user/property-verification"}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
                  Property Verification
                </Link>
              </li>

            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold dark:text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to={
                    currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                      ? "/admin/blogs"
                      : "/user/blogs"
                  }
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                >
                  Real Estate Blogs
                </Link>
              </li>
              <li>
                <Link
                  to={
                    currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                      ? "/admin/help-center"
                      : currentUser
                        ? "/user/help-center"
                        : "/help-center"
                  }
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/market-trends" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
                  Market Trends
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
                  Property Guides
                </Link>
              </li>
              <li>
                <Link to={
                  currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                    ? "/admin/agents"
                    : currentUser
                      ? "/user/agents"
                      : "/agents"
                } className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
                  Find an Agent
                </Link>
              </li>
              <li>
                <Link to={(currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin'))
                  ? "/admin/investment-tools"
                  : "/user/investment-tools"} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
                  Investment Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Privacy */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold dark:text-white">Legal & Privacy</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={
                  currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                    ? "/admin/terms"
                    : currentUser
                      ? "/user/terms"
                      : "/terms"
                } className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <FaFileContract className="text-xs" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to={
                  currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                    ? "/admin/privacy"
                    : currentUser
                      ? "/user/privacy"
                      : "/privacy"
                } className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <FaShieldAlt className="text-xs" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to={
                    currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                      ? "/admin/cookie-policy"
                      : currentUser
                        ? "/user/cookie-policy"
                        : "/cookie-policy"
                  }
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors flex items-center gap-2"
                >
                  <FaCookie className="text-xs" />
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  to={
                    currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin')
                      ? "/admin/community-guidelines"
                      : currentUser
                        ? "/user/community-guidelines"
                        : "/community-guidelines"
                  }
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors flex items-center gap-2"
                >
                  <FaHandshake className="text-xs" />
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-300 dark:border-gray-800 mt-6 pt-6 md:mt-8 md:pt-8 transition-colors">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} UrbanSetu. All rights reserved.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors">
                <FaEye className="text-blue-500 dark:text-blue-400" />
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <span>Today: <span className="font-semibold text-blue-600 dark:text-blue-400">{visitorStats.todayCount}</span></span>
                  {visitorStats.totalVisitors > 0 && (
                    <>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <span>All Time: <span className="font-semibold text-purple-600 dark:text-purple-400">{visitorStats.totalVisitors}</span></span>
                    </>
                  )}
                </span>
              </div>
              <span>Made with ❤️ for real estate</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
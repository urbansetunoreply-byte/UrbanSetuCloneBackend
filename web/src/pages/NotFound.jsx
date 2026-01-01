import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search, Home, ArrowLeft } from "lucide-react";
import duckImg from "../assets/duck-go-final.gif";
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFound() {
  // Set page title
  usePageTitle("Page Not Found");
  const navigate = useNavigate();

  const { currentUser } = useSelector((state) => state.user);
  let homePath = "/";
  if (currentUser) {
    if (currentUser.role === "admin" || currentUser.role === "rootadmin") {
      homePath = "/admin";
    } else {
      homePath = "/user";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden p-6">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[10%] left-[20%] w-72 h-72 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[60%] w-64 h-64 bg-pink-400/20 dark:bg-pink-600/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Content Card */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full relative z-10 text-center animate-fade-in-up">

        {/* Image Section */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full animate-pulse-soft"></div>
          <img
            src={duckImg}
            alt="Lost Explorer"
            className="w-full h-full object-contain relative z-10 drop-shadow-xl hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Text Content */}
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-4 tracking-tighter">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Oops! You've gone off the map.
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
          The page you're searching for seems to have moved, been deleted, or never existed in the first place. Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all flex items-center justify-center gap-2 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>

          <Link
            to={homePath}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>

        {/* Helpful Links / Footer */}
        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Link to="/about" className="hover:text-blue-700 dark:hover:text-blue-300 hover:underline">About Us</Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link to="/contact" className="hover:text-blue-700 dark:hover:text-blue-300 hover:underline">Contact Support</Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link to="/search" className="hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1">
              <Search className="w-3 h-3" /> Search Properties
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
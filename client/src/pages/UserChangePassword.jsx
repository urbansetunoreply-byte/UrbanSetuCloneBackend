import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaCheck, FaEdit } from "react-icons/fa";
import { signoutUserStart, signoutUserSuccess, signoutUserFailure } from "../redux/user/userSlice";
import { reconnectSocket } from "../utils/socket";
import { toast } from 'react-toastify';
import { focusWithoutKeyboard } from '../utils/mobileUtils';
import { calculatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthBgColor, getPasswordStrengthText, meetsMinimumRequirements } from "../utils/passwordStrength.js";
import { authenticatedFetch } from '../utils/csrf';
import ContactSupportWrapper from '../components/ContactSupportWrapper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function UserChangePassword() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentPasswordRef = useRef(null);

  const [formData, setFormData] = useState({
    previousPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPrev, setShowPrev] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    level: 'very-weak',
    feedback: []
  });

  // Autofocus current password field on mount
  useEffect(() => {
    if (currentPasswordRef.current) {
      focusWithoutKeyboard(currentPasswordRef.current);
    }
  }, []);

  const checkPasswordStrength = (password) => {
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "newPassword") {
      checkPasswordStrength(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError("New passwords do not match");
      return;
    }

    if (!meetsMinimumRequirements(formData.newPassword)) {
      setError("Password does not meet minimum strength requirements");
      return;
    }

    // Check if new password is different from current password
    if (formData.previousPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/api/user/change-password/${currentUser._id}`, {
        method: "POST",
        body: JSON.stringify({
          previousPassword: formData.previousPassword,
          newPassword: formData.newPassword,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.status === 401) {
        setError("Session expired or unauthorized. Please sign in again.");
        // Proper logout process
        dispatch(signoutUserStart());
        try {
          const signoutRes = await fetch(`${API_BASE_URL}/api/auth/signout`, { credentials: 'include' });
          const signoutData = await signoutRes.json();
          if (signoutData.success === false) {
            dispatch(signoutUserFailure(signoutData.message));
          } else {
            dispatch(signoutUserSuccess(signoutData));
            // Clear persisted state
            if (window.persistor && window.persistor.purge) {
              await window.persistor.purge();
            }
            // Disconnect and reconnect socket to clear auth
            reconnectSocket();
            // Clear localStorage token if used
            localStorage.removeItem('accessToken');
            // Expire the access_token cookie on client side
            document.cookie = 'access_token=; Max-Age=0; path=/; domain=' + window.location.hostname + '; secure; samesite=None';
          }
        } catch (err) {
          dispatch(signoutUserFailure(err.message));
        }
        toast.error("Session expired or unauthorized. Please sign in again.");
        setTimeout(() => {
          navigate("/sign-in", { replace: true });
        }, 1500);
        return;
      }
      if (!res.ok || data.success === false) {
        setError(data.message || "Failed to change password");
      } else {
        setSuccess("Password changed successfully");
        setTimeout(() => {
          navigate("/user");
        }, 1200);
      }
    } catch (err) {
      setLoading(false);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex">
      
      {/* Left Side - Image and Quote */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold mb-6 animate-fade-in">
              Change Password
            </h1>
            <p className="text-xl mb-8 leading-relaxed animate-fade-in-delay">
              "Security is not a product, but a process. Keep your account safe with a strong password."
            </p>
            <div className="space-y-4 text-lg animate-fade-in-delay-2">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Secure & Strong</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span>Easy to Remember</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span>Keep Your Account Safe</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-float"></div>
        <div className="absolute bottom-32 right-16 w-12 h-12 bg-white bg-opacity-10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-24 w-8 h-8 bg-white bg-opacity-10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        
        {/* Shield Icon */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black bg-opacity-20 flex items-center justify-center">
          <svg className="w-16 h-16 text-white opacity-30" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Right Side - Change Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Change Password</h2>
            <p className="text-gray-600">Update your password to keep your account secure.</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password Field */}
              <div>
                <label htmlFor="previousPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPrev ? "text" : "password"}
                    placeholder="Enter your current password"
                    id="previousPassword"
                    name="previousPassword"
                    value={formData.previousPassword}
                    onChange={handleChange}
                    ref={currentPasswordRef}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                    onClick={() => setShowPrev(!showPrev)}
                  >
                    {showPrev ? (
                      <FaEyeSlash className="text-gray-600" />
                    ) : (
                      <FaEye className="text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Create a strong password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? (
                      <FaEyeSlash className="text-gray-600" />
                    ) : (
                      <FaEye className="text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Password Strength */}
              {formData.newPassword && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Password Strength:</span>
                    <span className={`text-sm font-semibold ${getPasswordStrengthColor(passwordStrength.level)}`}>
                      {getPasswordStrengthText(passwordStrength.level)}
                    </span>
                  </div>
                  
                  {/* Strength Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.level === 'very-weak' ? 'bg-red-500 w-1/5' :
                        passwordStrength.level === 'weak' ? 'bg-red-400 w-2/5' :
                        passwordStrength.level === 'medium' ? 'bg-yellow-400 w-3/5' :
                        passwordStrength.level === 'strong' ? 'bg-green-400 w-4/5' :
                        'bg-green-500 w-full'
                      }`}
                    ></div>
                  </div>
                  
                  {/* Feedback */}
                  {passwordStrength.feedback.length > 0 && (
                    <div className={`p-3 rounded-lg ${getPasswordStrengthBgColor(passwordStrength.level)}`}>
                      <p className="text-sm font-medium text-gray-700 mb-1">To improve your password:</p>
                      <ul className="text-xs space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="flex items-center">
                            <span className="mr-2">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Security Tips */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>💡 <strong>Tip:</strong> Use a unique password for this account</p>
                    <p>🔒 <strong>Security:</strong> Consider using a password manager</p>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm your new password"
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? (
                      <FaEyeSlash className="text-gray-600" />
                    ) : (
                      <FaEye className="text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              <button
                disabled={
                  loading ||
                  !meetsMinimumRequirements(formData.newPassword) ||
                  formData.previousPassword === formData.newPassword
                }
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Changing...
                  </div>
                ) : (
                  "Change Password"
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Remember your password?{" "}
                <button 
                  onClick={() => navigate("/user")} 
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors duration-200"
                >
                  Back to Profile
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      <ContactSupportWrapper />
    </div>
  );
} 
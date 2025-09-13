import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signInFailure, signInStart, signInSuccess } from "../redux/user/userSlice.js";
import Oauth from "../components/Oauth.jsx";


import { reconnectSocket } from "../utils/socket";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { areCookiesEnabled, createAuthenticatedFetchOptions } from '../utils/auth';
import { focusWithoutKeyboard } from '../utils/mobileUtils';
import { authenticatedFetch, getCSRFToken } from '../utils/csrf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function SignIn({ bootstrapped, sessionChecked }) {
    const emailInputRef = useRef(null);
    const otpEmailInputRef = useRef(null);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [emailStep, setEmailStep] = useState(false); // Track if email step is completed
    const [urlError, setUrlError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loginMethod, setLoginMethod] = useState("password"); // "password" or "otp"
    const [otpData, setOtpData] = useState({
        email: "",
        otp: ""
    });
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpSuccessMessage, setOtpSuccessMessage] = useState("");
    
    // Timer states for resend OTP
    const [resendTimer, setResendTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);

    const { loading, error, currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    // Check for error parameters in URL on component mount
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const errorParam = searchParams.get('error');
        
        if (errorParam === 'password_change_unsuccessful') {
            setUrlError("Password change unsuccessful! Please try again.");
            // Clear the error parameter from URL
            navigate('/sign-in', { replace: true });
        }
    }, [location.search, navigate]);

    // Autofocus email field on mount
    useEffect(() => {
        if (emailInputRef.current) {
            focusWithoutKeyboard(emailInputRef.current);
        }
    }, []);

    // Focus OTP email field when OTP method is selected
    useEffect(() => {
        if (loginMethod === "otp" && otpEmailInputRef.current) {
            focusWithoutKeyboard(otpEmailInputRef.current);
        }
    }, [loginMethod]);

    // Block access if already signed in
    useEffect(() => {
        if (bootstrapped && sessionChecked && currentUser) {
            if (currentUser.role === 'admin' || currentUser.role === 'rootadmin') {
                if (currentUser.isDefaultAdmin) {
                    navigate('/admin', { replace: true });
                } else {
                    navigate('/admin', { replace: true });
                }
            } else {
                navigate('/user', { replace: true });
            }
        }
    }, [bootstrapped, sessionChecked, currentUser, navigate]);

    // Timer effect for resend OTP
    useEffect(() => {
        let interval = null;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prevTimer) => {
                    if (prevTimer <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendTimer]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
        // Clear URL error when user starts typing
        if (urlError) {
            setUrlError("");
        }
    };

    const handleEmailContinue = (e) => {
        e.preventDefault();
        if (!formData.email) {
            dispatch(signInFailure("Email is required"));
            return;
        }
        setEmailStep(true);
    };

    const handleEmailEdit = () => {
        setEmailStep(false);
        setFormData(prev => ({ ...prev, password: "" }));
    };

    const handleOtpChange = (e) => {
        setOtpData({
            ...otpData,
            [e.target.id]: e.target.value
        });
        // Clear URL error when user starts typing
        if (urlError) {
            setUrlError("");
        }
        // Clear success message when user starts typing
        if (otpSuccessMessage) {
            setOtpSuccessMessage("");
        }
        // Reset timer when email changes
        if (e.target.id === "email") {
            setResendTimer(0);
            setCanResend(true);
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!otpData.email) {
            dispatch(signInFailure("Email is required"));
            return;
        }

        if (!canResend) {
            return;
        }

        setOtpLoading(true);
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/auth/send-login-otp`, {
                method: "POST",
                body: JSON.stringify({ email: otpData.email })
            });

            const data = await res.json();

            if (data.success === false) {
                dispatch(signInFailure(data.message));
                return;
            }

            setOtpSent(true);
            setOtpSuccessMessage("OTP sent successfully to your email");
            
            // Start timer for resend
            setResendTimer(30); // 30 seconds
            setCanResend(false);
        } catch (error) {
            dispatch(signInFailure(error.message));
        } finally {
            setOtpLoading(false);
        }
    };

    const handleOtpLogin = async (e) => {
        e.preventDefault();
        if (!otpData.email || !otpData.otp) {
            dispatch(signInFailure("Email and OTP are required"));
            return;
        }

        dispatch(signInStart());
        
        // Check if cookies are enabled for better UX
        const cookiesEnabled = areCookiesEnabled();
        
        try {
            const apiUrl = `${API_BASE_URL}/api/auth/verify-login-otp`;
            const res = await authenticatedFetch(apiUrl, {
                method: "POST",
                body: JSON.stringify(otpData)
            });
            const data = await res.json();

            if (data.success === false) {
                dispatch(signInFailure(data.message));
                return;
            }
            
            if (data.token) {
                localStorage.setItem('accessToken', data.token);
                
            }
            // Dispatch success and wait for state update
            dispatch(signInSuccess(data));
            
            // Use a small delay to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Reconnect socket with new token
            reconnectSocket();
            
            if (data.role === "admin" || data.role === "rootadmin") {
                // Special handling for root admin
                if (data.isDefaultAdmin) {
                    navigate("/admin");
                } else {
                    navigate("/admin");
                }
            } else {
                navigate("/user");
            }

        } catch (error) {
            dispatch(signInFailure(error.message));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(signInStart());
        
        // Check if cookies are enabled for better UX
        const cookiesEnabled = areCookiesEnabled();
        
        try {
            const apiUrl = `${API_BASE_URL}/api/auth/signin`;
            const res = await authenticatedFetch(apiUrl, {
                method: "POST",
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success === false) {
                dispatch(signInFailure(data.message));
                return;
            }
            
            if (data.token) {
                localStorage.setItem('accessToken', data.token);
                
            }
            // Dispatch success and wait for state update
            dispatch(signInSuccess(data));
            
            // Use a small delay to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Reconnect socket with new token
            reconnectSocket();
            
            if (data.role === "admin" || data.role === "rootadmin") {
                // Special handling for root admin
                if (data.isDefaultAdmin) {
                    navigate("/admin");
                } else {
                    navigate("/admin");
                }
            } else {
                navigate("/user");
            }

        } catch (error) {
            dispatch(signInFailure(error.message));
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
                            Welcome Back
                        </h1>
                        <p className="text-xl mb-8 leading-relaxed animate-fade-in-delay">
                            "Home is not a place, it's a feeling. Find your perfect sanctuary with us."
                        </p>
                        <div className="space-y-4 text-lg animate-fade-in-delay-2">
                            <div className="flex items-center justify-center space-x-3">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span>Discover Your Dream Home</span>
                            </div>
                            <div className="flex items-center justify-center space-x-3">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                                <span>Connect with Trusted Agents</span>
                            </div>
                            <div className="flex items-center justify-center space-x-3">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                                <span>Secure & Reliable Platform</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute top-20 left-20 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-float"></div>
                <div className="absolute bottom-32 right-16 w-12 h-12 bg-white bg-opacity-10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-1/2 right-24 w-8 h-8 bg-white bg-opacity-10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
                
                {/* House Silhouette */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black bg-opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 2L2 8V18H18V8L10 2Z" fill="white" fillOpacity="0.1"/>
                        <path d="M8 12H12V18H8V12Z" fill="white" fillOpacity="0.2"/>
                        <circle cx="10" cy="5" r="1" fill="white" fillOpacity="0.3"/>
                    </svg>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
                        <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
                    </div>

                    {/* Login Method Toggle Tabs */}
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setLoginMethod("password");
                                setOtpSent(false);
                                setOtpData({ email: "", otp: "" });
                                setOtpSuccessMessage("");
                                setResendTimer(0);
                                setCanResend(true);
                                setEmailStep(false);
                                setFormData({ email: "", password: "" });
                            }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                                loginMethod === "password"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Password Login
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLoginMethod("otp");
                                setFormData({ email: "", password: "" });
                                setOtpSuccessMessage("");
                                setResendTimer(0);
                                setCanResend(true);
                                setEmailStep(false);
                            }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                                loginMethod === "otp"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            OTP Login
                        </button>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        {loginMethod === "password" ? (
                            // Password Login Form
                            <form onSubmit={emailStep ? handleSubmit : handleEmailContinue} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="email" 
                                            placeholder="Enter your email" 
                                            id="email" 
                                            value={formData.email}
                                            onChange={handleChange} 
                                            ref={emailInputRef}
                                            readOnly={emailStep}
                                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${emailStep ? 'pr-12 bg-gray-50' : ''}`}
                                            required
                                        />
                                        {emailStep && (
                                            <button
                                                type="button"
                                                onClick={handleEmailEdit}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 focus:outline-none"
                                                title="Edit email"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {emailStep && (
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password" 
                                                id="password" 
                                                value={formData.password}
                                                onChange={handleChange} 
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                                                tabIndex={-1}
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        
                                        {/* Forgot Password Link */}
                                        <div className="text-right mt-2">
                                            <Link 
                                                to="/forgot-password" 
                                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                                            >
                                                Forgot Password?
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                
                                <button 
                                    disabled={loading} 
                                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Signing In...
                                        </div>
                                    ) : (
                                        emailStep ? "Sign In" : "Continue"
                                    )}
                                </button>
                            </form>
                        ) : (
                            // OTP Login Form
                            <form onSubmit={otpSent ? handleOtpLogin : handleSendOTP} className="space-y-6">
                                <div>
                                    <label htmlFor="otp-email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="email" 
                                            placeholder="Enter your email" 
                                            id="email" 
                                            value={otpData.email}
                                            onChange={handleOtpChange} 
                                            ref={otpEmailInputRef}
                                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${otpSent ? 'pr-12 bg-gray-50' : ''}`}
                                            required
                                            disabled={otpSent}
                                        />
                                        {otpSent && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOtpSent(false);
                                                    setOtpData({ email: otpData.email, otp: "" });
                                                    setOtpSuccessMessage("");
                                                }}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 focus:outline-none"
                                                title="Edit email"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {otpSent && (
                                    <div>
                                        {otpSuccessMessage && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                                <p className="text-green-600 text-sm">{otpSuccessMessage}</p>
                                            </div>
                                        )}
                                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                                            OTP Code
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Enter 6-digit OTP" 
                                            id="otp" 
                                            value={otpData.otp}
                                            onChange={(e) => {
                                                // Only allow numbers
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                // Create a new event-like object with the filtered value
                                                const syntheticEvent = {
                                                    target: {
                                                        id: 'otp',
                                                        value: value
                                                    }
                                                };
                                                handleOtpChange(syntheticEvent);
                                            }} 
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-lg tracking-widest"
                                            maxLength="6"
                                            required
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                            Enter the 6-digit code sent to your email
                                        </p>
                                    </div>
                                )}
                                
                                {otpSent && (
                                    <div className="text-center">
                                        {resendTimer > 0 ? (
                                            <span className="text-sm text-gray-500">
                                                Resend in {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSendOTP}
                                                disabled={otpLoading || !canResend}
                                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {otpLoading ? "Sending..." : "Resend OTP"}
                                            </button>
                                        )}
                                    </div>
                                )}
                                
                                <button 
                                    disabled={loading || otpLoading || (!otpSent && !canResend)} 
                                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                                >
                                    {loading || otpLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            {otpSent ? "Verifying..." : "Sending OTP..."}
                                        </div>
                                    ) : (
                                        otpSent ? "Verify & Sign In" : "Send OTP"
                                    )}
                                </button>
                            </form>
                        )}
                        
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">OR</span>
                            </div>
                        </div>
                        
                        <Oauth pageType="signIn" />
                        
                        {(error || urlError) && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-600 text-sm">{urlError || error}</p>
                            </div>
                        )}
                        
                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                Don't have an account?{" "}
                                <Link to="/sign-up" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors duration-200">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


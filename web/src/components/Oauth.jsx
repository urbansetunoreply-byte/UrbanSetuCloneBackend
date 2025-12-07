import { GoogleAuthProvider, getAuth, signInWithRedirect, getRedirectResult, signInWithPopup } from 'firebase/auth';
import { app } from '../firebase';
import { signInSuccess } from '../redux/user/userSlice.js';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { authenticatedFetch } from '../utils/csrf';
import React, { useEffect, useState } from 'react';

import { API_BASE_URL } from '../config/api.js';

export default function Oauth({ pageType, disabled = false, onAuthStart = null }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Handle redirect result when component mounts
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const auth = getAuth();
                const result = await getRedirectResult(auth);

                if (result) {
                    await processGoogleAuth(result);
                }
            } catch (error) {
                console.error('Error handling redirect result:', error);
            }
        };

        handleRedirectResult();
    }, []);

    const processGoogleAuth = async (result) => {
        try {
            setIsLoading(true);
            setError(null);

            const apiUrl = "/api/auth/google";
            const res = await authenticatedFetch(`${API_BASE_URL}${apiUrl}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: result.user.displayName,
                    email: result.user.email,
                    photo: result.user.photoURL
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success === false) {
                throw new Error(data.message || 'Authentication failed');
            }

            dispatch(signInSuccess(data));

            // Navigate based on user role
            if (data.role === "admin" || data.role === "rootadmin") {
                navigate("/admin");
            } else {
                navigate("/user");
            }
        } catch (error) {
            console.error('Error processing Google authentication:', error);
            setError('Authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
            // Notify parent component that Google auth completed
            if (onAuthStart) {
                onAuthStart(null);
            }
        }
    };

    const handleGoogleClick = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Notify parent component that Google auth is starting
            if (onAuthStart) {
                onAuthStart('google');
            }

            // Try popup first, fallback to redirect if it fails
            try {
                const provider = new GoogleAuthProvider();
                provider.addScope('email');
                provider.addScope('profile');

                const auth = getAuth();
                const result = await signInWithPopup(auth, provider);
                await processGoogleAuth(result);
            } catch (popupError) {
                console.log('Popup failed, trying redirect method:', popupError);

                // If popup fails due to CORS or other issues, use redirect
                const provider = new GoogleAuthProvider();
                provider.addScope('email');
                provider.addScope('profile');

                const auth = getAuth();
                await signInWithRedirect(auth, provider);
            }
        } catch (error) {
            console.error(`Error initiating Google ${pageType}:`, error);
            setError('Failed to initiate Google authentication. Please try again.');
            setIsLoading(false);

            // Notify parent component that Google auth failed
            if (onAuthStart) {
                onAuthStart(null);
            }
        }
    };

    return (
        <div className="w-full">
            <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isLoading || disabled}
                className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`${pageType === "signIn" ? "Sign In" : "Sign Up"} with Google`}
            >
                {isLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                        {error ? 'Retrying...' : 'Signing In...'}
                    </>
                ) : (
                    <>
                        <FcGoogle className="text-xl" />
                        {pageType === "signIn" ? "Sign In with Google" : "Sign Up with Google"}
                    </>
                )}
            </button>

            {error && (
                <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                </div>
            )}
        </div>
    );
}

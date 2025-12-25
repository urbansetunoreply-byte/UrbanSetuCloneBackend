import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUnlock, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

import ContactSupportWrapper from '../../components/ContactSupportWrapper';

export default function UnlockAccount() {
    const { token } = useParams();
    // ... (existing code, not repeating entirely)
    useEffect(() => {
        // ... existing useEffect code
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">

                    {status === 'processing' && (
                        <div className="flex flex-col items-center">
                            <FaSpinner className="h-10 w-10 text-green-600 animate-spin mb-4" />
                            <p className="text-lg font-medium text-gray-900">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <FaUnlock className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Unlocked!</h2>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <button
                                onClick={() => navigate('/sign-in')}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Proceed to Sign In
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <FaExclamationTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Unlock Failed</h2>
                            <p className="text-red-500 mb-6">{message}</p>
                            <p className="text-sm text-gray-500 mt-4">Please contact support if you continue to face issues.</p>
                        </div>
                    )}

                </div>
            </div>
            <ContactSupportWrapper />
        </div>
    );
}

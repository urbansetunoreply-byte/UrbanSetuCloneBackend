import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaLock, FaExclamationTriangle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import ContactSupportWrapper from '../../components/ContactSupportWrapper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function LockAccount() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('confirm'); // confirm, processing, success, error
    const [message, setMessage] = useState('');

    const handleLock = async () => {
        try {
            setStatus('processing');
            setMessage('Locking your account...');

            const res = await fetch(`${API_BASE_URL}/api/auth/lock-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message || 'Your account has been successfully locked.');
            } else {
                setStatus('error');
                setMessage(data.message || 'Failed to lock account. The link may be invalid or expired.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('An unexpected error occurred. Please try again or contact support.');
            console.error("Lock error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">

                    {status === 'confirm' && (
                        <>
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <FaLock className="h-8 w-8 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Emergency Account Lock</h2>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to lock your account? This will terminate all active sessions immediately.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={handleLock}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Yes, Lock My Account
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}

                    {status === 'processing' && (
                        <div className="flex flex-col items-center">
                            <FaSpinner className="h-10 w-10 text-red-600 animate-spin mb-4" />
                            <p className="text-lg font-medium text-gray-900">Processing security request...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <FaCheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Locked</h2>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <p className="text-sm text-gray-500 mb-6">You will need to use the Unlock link sent to your email to restore access.</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <FaExclamationTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Request Failed</h2>
                            <p className="text-red-500 mb-6">{message}</p>
                        </div>
                    )}

                </div>
            </div>
            <ContactSupportWrapper />
        </div>
    );
}

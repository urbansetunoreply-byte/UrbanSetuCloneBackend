import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaClock, FaUser, FaEnvelope, FaCrown } from 'react-icons/fa';

import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AccountRevocation() {
  // Set page title
  usePageTitle("Account Recovery - Restore Account");

  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [isPurged, setIsPurged] = useState(false);
  const [purgedDetails, setPurgedDetails] = useState(null);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setError('Invalid or missing token');
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-revocation-token/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAccountData(data.accountData);
        setLoading(false);
      } else if (response.status === 410 && data.error === 'PURGED_ACCOUNT') {
        // Account has been permanently deleted (purged)
        setIsPurged(true);
        setPurgedDetails(data.details);
        setLoading(false);
      } else {
        setError(data.message || 'Invalid or expired token');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setError('Failed to verify token. Please try again.');
      setLoading(false);
    }
  };

  const handleRestoreAccount = async () => {
    try {
      setRestoring(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/restore-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Redirect to sign-in after 3 seconds
        setTimeout(() => {
          navigate('/sign-in');
        }, 3000);
      } else {
        setError(data.message || 'Failed to restore account');
      }
    } catch (error) {
      console.error('Error restoring account:', error);
      setError('Failed to restore account. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your account restoration link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTimesCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={() => navigate('/sign-in')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Restored!</h1>
          <p className="text-gray-600 mb-6">
            Your account has been successfully restored. You will be redirected to the sign-in page shortly.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isPurged) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">Account Permanently Deleted</h1>
            <p className="text-red-100">This account can no longer be restored</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTimesCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Account No Longer Available</h2>
              <p className="text-gray-600">
                This account has been permanently deleted and cannot be restored. However, you can create a new account to continue using our services.
              </p>
            </div>

            {/* Account Details */}
            {purgedDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FaUser className="w-4 h-4 mr-2" />
                  Previous Account Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Username:</span>
                    <span className="font-medium">{purgedDetails.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{purgedDetails.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Permanently Deleted:</span>
                    <span className="font-medium text-red-600">
                      {new Date(purgedDetails.purgedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Since Purge:</span>
                    <span className="font-medium text-red-600">
                      {Math.ceil((new Date() - new Date(purgedDetails.purgedAt)) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <FaTimesCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="font-semibold text-red-800">Important Notice</span>
              </div>
              <p className="text-red-700 text-sm">
                This account has been permanently deleted and cannot be restored. All data associated with this account has been permanently removed from our systems.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/sign-up')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <FaUser className="w-4 h-4 mr-2" />
                Create New Account
              </button>
              <button
                onClick={() => navigate('/sign-in')}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                Sign In to Existing Account
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go to Home
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                By creating a new account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Restore Your Account</h1>
          <p className="text-blue-100">Welcome back to UrbanSetu!</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUser className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Account Found</h2>
            <p className="text-gray-600">
              We found your deleted account. You can restore it with all your previous data intact.
            </p>
          </div>

          {/* Account Details */}
          {accountData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <FaUser className="w-4 h-4 mr-2" />
                Account Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-medium">{accountData.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{accountData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium flex items-center">
                    {accountData.role === 'admin' ? (
                      <>
                        <FaCrown className="w-3 h-3 mr-1 text-purple-600" />
                        Administrator
                      </>
                    ) : (
                      'User'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Deleted:</span>
                  <span className="font-medium">
                    {new Date(accountData.deletedAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Since Deletion:</span>
                  <span className="font-medium">
                    {Math.ceil((new Date() - new Date(accountData.deletedAt)) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Link Valid Until:</span>
                  <span className="font-medium text-green-600">
                    {new Date(accountData.expiresAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Remaining:</span>
                  <span className="font-medium text-green-600">
                    {Math.max(0, Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))} days
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status Indicator */}
          {accountData && (
            <div className={`rounded-lg p-4 mb-6 ${
              Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 3 
                ? 'bg-red-50 border border-red-200' 
                : Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 7 
                ? 'bg-orange-50 border border-orange-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 3 
                    ? 'bg-red-500' 
                    : Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 7 
                    ? 'bg-orange-500' 
                    : 'bg-green-500'
                }`}></div>
                <span className={`font-semibold ${
                  Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 3 
                    ? 'text-red-800' 
                    : Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 7 
                    ? 'text-orange-800' 
                    : 'text-green-800'
                }`}>
                  {Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 3 
                    ? 'URGENT: Link expires soon!' 
                    : Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 7 
                    ? 'WARNING: Link expires in less than a week' 
                    : 'Status: Link is valid'
                  }
                </span>
              </div>
              <p className={`text-sm ${
                Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 3 
                  ? 'text-red-700' 
                  : Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 7 
                  ? 'text-orange-700' 
                  : 'text-green-700'
              }`}>
                {Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 3 
                  ? 'Please restore your account immediately to avoid permanent data loss.'
                  : Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 7 
                  ? 'Consider restoring your account soon to avoid missing the deadline.'
                  : 'You have plenty of time to restore your account when convenient.'
                }
              </p>
            </div>
          )}

          {/* Expiry Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <FaClock className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="font-semibold text-yellow-800">Important Notice</span>
            </div>
            <div className="space-y-2">
              <p className="text-yellow-700 text-sm">
                This restoration link will expire on <strong>{accountData && new Date(accountData.expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</strong> (30 days from deletion).
              </p>
              <p className="text-yellow-700 text-sm">
                You have <strong className="text-yellow-800">
                  {accountData && Math.max(0, Math.ceil((new Date(accountData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))} days
                </strong> remaining to restore your account.
              </p>
              <p className="text-yellow-700 text-sm">
                After expiration, your account will be permanently removed and cannot be restored.
              </p>
            </div>
          </div>

          {/* Restore Button */}
          <button
            onClick={handleRestoreAccount}
            disabled={restoring}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {restoring ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Restoring Account...
              </>
            ) : (
              <>
                <FaCheckCircle className="w-4 h-4 mr-2" />
                Restore My Account
              </>
            )}
          </button>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By restoring your account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

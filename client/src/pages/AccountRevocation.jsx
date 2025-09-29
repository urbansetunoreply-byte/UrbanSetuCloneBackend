import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaClock, FaUser, FaEnvelope, FaCrown } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AccountRevocation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [restoring, setRestoring] = useState(false);

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
              <div className="space-y-2">
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
                  <span className="text-gray-600">Deleted:</span>
                  <span className="font-medium">
                    {new Date(accountData.deletedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Expiry Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <FaClock className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="font-semibold text-yellow-800">Important Notice</span>
            </div>
            <p className="text-yellow-700 text-sm">
              This restoration link will expire in 30 days from when your account was deleted. 
              After that, your account will be permanently removed.
            </p>
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

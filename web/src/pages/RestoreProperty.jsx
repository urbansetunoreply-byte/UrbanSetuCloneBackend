import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaHome, FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RestoreProperty = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [propertyData, setPropertyData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid restoration link. No token provided.');
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      console.log('🔍 Verifying token:', token);
      console.log('🔍 API Base URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/api/property-restoration/verify/${token}`);
      console.log('🔍 Response status:', response.status);
      
      const data = await response.json();
      console.log('🔍 Response data:', data);

      if (data.success) {
        setPropertyData(data.deletedListing);
      } else {
        setError(data.message || 'Invalid or expired restoration token');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setError('Failed to verify restoration token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirmRestore) {
      setError('Please confirm that you want to restore this property.');
      return;
    }

    setRestoring(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/property-restoration/restore/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmRestore: true
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Redirect to my listings after 3 seconds
        setTimeout(() => {
          navigate('/user/my-listings');
        }, 3000);
      } else {
        setError(data.message || 'Failed to restore property');
      }
    } catch (error) {
      console.error('Error restoring property:', error);
      setError('Failed to restore property. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatExpiryDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying restoration token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Restoration Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaHome className="text-lg" />
              Go to Home
            </button>
            <button
              onClick={() => navigate('/user/my-listings')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <FaArrowLeft className="text-lg" />
              My Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Restored!</h1>
          <p className="text-gray-600 mb-6">
            Your property "{propertyData?.propertyName}" has been successfully restored and is now available in your listings.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You will be redirected to your properties page in a few seconds...
          </p>
          <button
            onClick={() => navigate('/user/my-listings')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <FaHome className="text-lg" />
            Go to My Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">🔄 Restore Property</h1>
            <p className="text-red-100">Restore your accidentally deleted property</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Property Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{propertyData?.propertyName}</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={propertyData?.propertyImages?.[0] || '/placeholder-property.jpg'}
                    alt={propertyData?.propertyName}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Address:</span>
                    <p className="text-gray-600">{propertyData?.propertyAddress || 'Address not specified'}</p>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Price:</span>
                    <p className="text-gray-600">₹{propertyData?.propertyPrice || 'Price not specified'}</p>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Deleted on:</span>
                    <p className="text-gray-600">{formatDate(propertyData?.deletedAt)}</p>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Deleted by:</span>
                    <p className="text-gray-600">
                      {propertyData?.deletionType === 'admin' ? 'Administrator' : 'You'}
                    </p>
                  </div>
                  
                  {propertyData?.deletionReason && (
                    <div>
                      <span className="font-semibold text-gray-700">Reason:</span>
                      <p className="text-gray-600">{propertyData.deletionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Restoration Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3">🔄 Restoration Information</h3>
              <div className="space-y-2 text-green-700">
                <p><strong>Expiry Date:</strong> {formatExpiryDate(propertyData?.tokenExpiry)}</p>
                <p><strong>Owner:</strong> {propertyData?.ownerUsername} ({propertyData?.ownerEmail})</p>
                <p className="text-sm">
                  This property can be restored within 30 days of deletion. After restoration, 
                  it will appear in your property listings with all original data intact.
                </p>
              </div>
            </div>

            {/* Confirmation */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ Important Notice</h3>
              <div className="space-y-3 text-yellow-700">
                <p>Before restoring this property, please confirm:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You want to restore this property to your listings</li>
                  <li>All original property data will be restored</li>
                  <li>The property will be visible to potential buyers again</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="mb-6">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmRestore}
                  onChange={(e) => setConfirmRestore(e.target.checked)}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">
                  I confirm that I want to restore this property and understand that it will be made available to potential buyers again.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRestore}
                disabled={!confirmRestore || restoring}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                  confirmRestore && !restoring
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {restoring ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Restore Property
                  </>
                )}
              </button>
              
              <button
                onClick={() => navigate('/user/my-listings')}
                className="flex-1 py-3 px-6 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaArrowLeft />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreProperty;

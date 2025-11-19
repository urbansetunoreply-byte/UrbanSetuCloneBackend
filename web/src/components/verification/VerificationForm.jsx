import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaUpload, FaTimes, FaSpinner, FaFile, FaCheckCircle } from 'react-icons/fa';
import ImagePreview from '../ImagePreview';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const OWNERSHIP_TYPES = [
  { value: 'sale_deed', label: 'Sale Deed' },
  { value: 'gift_deed', label: 'Gift Deed' },
  { value: 'inheritance', label: 'Inheritance' },
  { value: 'lease', label: 'Lease Agreement' },
  { value: 'other', label: 'Other' }
];

const IDENTITY_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'other', label: 'Other' }
];

const ADDRESS_TYPES = [
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'rent_agreement', label: 'Rent Agreement' },
  { value: 'other', label: 'Other' }
];

export default function VerificationForm({ listing, onSuccess, onCancel }) {
  const { currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({});
  const [formData, setFormData] = useState({
    ownershipProof: {
      documentUrl: '',
      documentType: 'sale_deed'
    },
    identityProof: {
      documentUrl: '',
      documentType: 'aadhaar'
    },
    addressProof: {
      documentUrl: '',
      documentType: 'utility_bill'
    },
    verificationFee: 0
  });

  const handleInputChange = (e, section) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value
      }
    }));
  };

  const handleDocumentUpload = async (e, section) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [section]: true }));

    try {
      const formDataObj = new FormData();
      formDataObj.append('document', file);

      const res = await fetch(`${API_BASE_URL}/api/upload/document`, {
        method: 'POST',
        credentials: 'include',
        body: formDataObj
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      // Cloudinary returns 'path' for document URL
      const documentUrl = data.documentUrl || data.path || data.url || data.imageUrl;

      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          documentUrl
        }
      }));

      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload document');
      console.error(error);
    } finally {
      setUploading(prev => ({ ...prev, [section]: false }));
    }
  };

  const removeDocument = (section) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        documentUrl: ''
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required documents
    if (!formData.ownershipProof.documentUrl) {
      toast.error('Please upload ownership proof document');
      return;
    }

    if (!formData.identityProof.documentUrl) {
      toast.error('Please upload identity proof document');
      return;
    }

    if (!formData.addressProof.documentUrl) {
      toast.error('Please upload address proof document');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/rental/verification/${listing._id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownershipProof: formData.ownershipProof,
          identityProof: formData.identityProof,
          addressProof: formData.addressProof,
          verificationFee: formData.verificationFee
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Verification request submitted successfully');
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.message || 'Failed to submit verification request');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Failed to submit verification request');
    } finally {
      setLoading(false);
    }
  };

  const renderDocumentSection = (title, section, documentTypes, placeholder) => {
    const hasDocument = formData[section].documentUrl;
    const isUploading = uploading[section];

    return (
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-gray-800">{title} <span className="text-red-500">*</span></h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
          <select
            name="documentType"
            value={formData[section].documentType}
            onChange={(e) => handleInputChange(e, section)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document</label>
          {!hasDocument ? (
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100">
              {isUploading ? (
                <FaSpinner className="animate-spin text-blue-600" />
              ) : (
                <FaUpload className="text-blue-600" />
              )}
              <span className="text-sm font-medium text-blue-700">
                {isUploading ? 'Uploading...' : 'Click to upload document'}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => handleDocumentUpload(e, section)}
                disabled={isUploading}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <FaCheckCircle className="text-green-600" />
              <span className="flex-1 text-sm text-green-700">Document uploaded</span>
              <button
                type="button"
                onClick={() => removeDocument(section)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Request Property Verification</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          <FaTimes />
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-800 mb-2">{listing.name}</h3>
        <p className="text-sm text-blue-700">{listing.address}</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Please upload clear, legible documents. All documents will be verified by our admin team. 
          Verification typically takes 2-5 business days.
        </p>
      </div>

      {/* Ownership Proof */}
      {renderDocumentSection(
        'Ownership Proof',
        'ownershipProof',
        OWNERSHIP_TYPES,
        'Upload ownership document (Sale Deed, Gift Deed, etc.)'
      )}

      {/* Identity Proof */}
      {renderDocumentSection(
        'Identity Proof',
        'identityProof',
        IDENTITY_TYPES,
        'Upload identity document (Aadhaar, PAN, Passport, etc.)'
      )}

      {/* Address Proof */}
      {renderDocumentSection(
        'Address Proof',
        'addressProof',
        ADDRESS_TYPES,
        'Upload address proof (Utility Bill, Bank Statement, etc.)'
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
          {loading ? 'Submitting...' : 'Submit Verification Request'}
        </button>
      </div>
    </form>
  );
}


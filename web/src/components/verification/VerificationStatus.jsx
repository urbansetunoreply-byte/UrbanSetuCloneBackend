import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaShieldAlt, FaFileAlt, FaMapMarkerAlt, FaImage, FaHome, FaTimes, FaDownload } from 'react-icons/fa';
import ImagePreview from '../ImagePreview';

export default function VerificationStatus({ verification, listing, currentUser, onUpdate, STATUS_COLORS, STATUS_LABELS, onClose }) {
  const isAdmin = currentUser?.role === 'admin';
  const isVerified = verification.status === 'verified';
  const isRejected = verification.status === 'rejected';

  const getDocumentStatus = (doc) => {
    if (doc.verified) {
      return { icon: <FaCheckCircle className="text-green-600" />, text: 'Verified', color: 'text-green-700' };
    }
    return { icon: <FaClock className="text-yellow-600" />, text: 'Pending', color: 'text-yellow-700' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaShieldAlt className="text-blue-600" />
          Verification Status
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Property Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-1">{listing.name}</h3>
        <p className="text-sm text-blue-700">{listing.address}</p>
        <div className="mt-2 text-xs text-blue-600">
          Verification ID: <span className="font-mono">{verification.verificationId}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`p-4 rounded-lg border-2 ${STATUS_COLORS[verification.status] || STATUS_COLORS.pending}`}>
        <div className="flex items-center gap-3">
          {isVerified && <FaCheckCircle className="text-2xl" />}
          {isRejected && <FaTimesCircle className="text-2xl" />}
          {!isVerified && !isRejected && <FaClock className="text-2xl" />}
          <div>
            <div className="font-bold text-lg">Status: {STATUS_LABELS[verification.status] || verification.status}</div>
            {verification.badgeNumber && (
              <div className="text-sm mt-1">
                Badge Number: <span className="font-mono font-semibold">{verification.badgeNumber}</span>
              </div>
            )}
            {verification.badgeExpiry && (
              <div className="text-sm mt-1">
                Expires: {new Date(verification.badgeExpiry).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents Verification */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaFileAlt /> Document Verification
        </h3>
        <div className="space-y-3">
          {/* Ownership Proof */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-blue-600" />
                <span className="font-medium">Ownership Proof</span>
                <span className="text-xs text-gray-500">({verification.documents.ownershipProof.documentType})</span>
              </div>
              <div className={`flex items-center gap-1 ${getDocumentStatus(verification.documents.ownershipProof).color}`}>
                {getDocumentStatus(verification.documents.ownershipProof).icon}
                <span className="text-sm font-medium">{getDocumentStatus(verification.documents.ownershipProof).text}</span>
              </div>
            </div>
            {verification.documents.ownershipProof.documentUrl && (
              <div className="mt-2">
                <a
                  href={verification.documents.ownershipProof.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FaDownload /> View Document
                </a>
              </div>
            )}
            {verification.documents.ownershipProof.verifiedAt && (
              <div className="text-xs text-gray-500 mt-1">
                Verified on: {new Date(verification.documents.ownershipProof.verifiedAt).toLocaleString()}
              </div>
            )}
            {verification.documents.ownershipProof.rejectionReason && (
              <div className="text-xs text-red-600 mt-1">
                Reason: {verification.documents.ownershipProof.rejectionReason}
              </div>
            )}
          </div>

          {/* Identity Proof */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-green-600" />
                <span className="font-medium">Identity Proof</span>
                <span className="text-xs text-gray-500">({verification.documents.identityProof.documentType})</span>
              </div>
              <div className={`flex items-center gap-1 ${getDocumentStatus(verification.documents.identityProof).color}`}>
                {getDocumentStatus(verification.documents.identityProof).icon}
                <span className="text-sm font-medium">{getDocumentStatus(verification.documents.identityProof).text}</span>
              </div>
            </div>
            {verification.documents.identityProof.documentUrl && (
              <div className="mt-2">
                <a
                  href={verification.documents.identityProof.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FaDownload /> View Document
                </a>
              </div>
            )}
            {verification.documents.identityProof.verifiedAt && (
              <div className="text-xs text-gray-500 mt-1">
                Verified on: {new Date(verification.documents.identityProof.verifiedAt).toLocaleString()}
              </div>
            )}
            {verification.documents.identityProof.rejectionReason && (
              <div className="text-xs text-red-600 mt-1">
                Reason: {verification.documents.identityProof.rejectionReason}
              </div>
            )}
          </div>

          {/* Address Proof */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-purple-600" />
                <span className="font-medium">Address Proof</span>
                <span className="text-xs text-gray-500">({verification.documents.addressProof.documentType})</span>
              </div>
              <div className={`flex items-center gap-1 ${getDocumentStatus(verification.documents.addressProof).color}`}>
                {getDocumentStatus(verification.documents.addressProof).icon}
                <span className="text-sm font-medium">{getDocumentStatus(verification.documents.addressProof).text}</span>
              </div>
            </div>
            {verification.documents.addressProof.documentUrl && (
              <div className="mt-2">
                <a
                  href={verification.documents.addressProof.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FaDownload /> View Document
                </a>
              </div>
            )}
            {verification.documents.addressProof.verifiedAt && (
              <div className="text-xs text-gray-500 mt-1">
                Verified on: {new Date(verification.documents.addressProof.verifiedAt).toLocaleString()}
              </div>
            )}
            {verification.documents.addressProof.rejectionReason && (
              <div className="text-xs text-red-600 mt-1">
                Reason: {verification.documents.addressProof.rejectionReason}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Inspection */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaHome /> Property Inspection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Photos Verified</span>
              {verification.photosVerified ? (
                <FaCheckCircle className="text-green-600" />
              ) : (
                <FaClock className="text-yellow-600" />
              )}
            </div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Location Verified</span>
              {verification.locationVerified ? (
                <FaCheckCircle className="text-green-600" />
              ) : (
                <FaClock className="text-yellow-600" />
              )}
            </div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Amenities Verified</span>
              {verification.amenitiesVerified ? (
                <FaCheckCircle className="text-green-600" />
              ) : (
                <FaClock className="text-yellow-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Reason */}
      {isRejected && verification.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">Rejection Reason</h4>
          <p className="text-sm text-red-700">{verification.rejectionReason}</p>
          {verification.rejectedAt && (
            <div className="text-xs text-red-600 mt-2">
              Rejected on: {new Date(verification.rejectedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Admin Notes */}
      {verification.adminNotes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Admin Notes</h4>
          <p className="text-sm text-gray-700">{verification.adminNotes}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Created: {new Date(verification.createdAt).toLocaleString()}</div>
        <div>Last Updated: {new Date(verification.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
}


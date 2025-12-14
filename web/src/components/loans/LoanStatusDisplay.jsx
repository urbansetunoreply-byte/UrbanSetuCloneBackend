import React from 'react';
import { useSelector } from 'react-redux';
import { FaCheckCircle, FaClock, FaTimesCircle, FaCreditCard, FaFile, FaDownload, FaHome, FaUser, FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';

export default function LoanStatusDisplay({ loan, currentUser, onUpdate, STATUS_COLORS, STATUS_LABELS, LOAN_TYPE_LABELS }) {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'rootadmin';
  const contract = loan.contractId;

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadDocument = async (docUrl, docName) => {
    try {
      if (!docUrl) return;

      const response = await fetch(docUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Failed to fetch document');

      const contentType = response.headers.get('content-type') || '';
      let extension = 'pdf';

      try {
        const urlPath = docUrl.split('?')[0];
        const lastSegment = urlPath.substring(urlPath.lastIndexOf('/') + 1);
        if (lastSegment.includes('.')) {
          extension = lastSegment.split('.').pop();
        }
      } catch (e) {
        console.warn('URL parsing failed', e);
      }

      if ((!extension || extension === 'file') && contentType && !contentType.includes('octet-stream')) {
        const mimeMap = {
          'application/pdf': 'pdf',
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'text/plain': 'txt'
        };
        extension = mimeMap[contentType.toLowerCase()] || 'pdf';
      }

      const filename = `${docName || 'document'}-${new Date().getTime()}.${extension}`;
      const blob = await response.blob();

      const finalBlob = extension === 'pdf' && contentType.includes('octet-stream')
        ? new Blob([blob], { type: 'application/pdf' })
        : blob;

      const blobUrl = window.URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error('Error downloading document:', error);
      window.open(docUrl, '_blank');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'disbursed':
      case 'repaid':
        return <FaCheckCircle className="text-green-600" />;
      case 'pending':
        return <FaClock className="text-yellow-600" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-600" />;
      case 'defaulted':
        return <FaTimesCircle className="text-orange-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Loan Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-1">
          {LOAN_TYPE_LABELS[loan.loanType] || loan.loanType}
        </h3>
        <p className="text-sm text-blue-700 font-mono">Loan ID: {loan.loanId}</p>
        {contract && (
          <>
            <p className="text-sm text-blue-700">Property: {contract.listingId?.name || 'Unknown'}</p>
            <p className="text-sm text-blue-700">Contract: {contract.contractId || 'Unknown'}</p>
          </>
        )}
      </div>

      {/* Status Badge */}
      <div className={`p-4 rounded-lg border-2 ${STATUS_COLORS[loan.status] || STATUS_COLORS.pending}`}>
        <div className="flex items-center gap-3">
          {getStatusIcon(loan.status)}
          <div>
            <div className="font-bold text-lg">Status: {STATUS_LABELS[loan.status] || loan.status}</div>
            {loan.approvedAt && (
              <div className="text-sm mt-1">
                Approved on: {formatDate(loan.approvedAt)}
              </div>
            )}
            {loan.rejectedAt && (
              <div className="text-sm mt-1">
                Rejected on: {formatDate(loan.rejectedAt)}
              </div>
            )}
            {loan.disbursedAt && (
              <div className="text-sm mt-1">
                Disbursed on: {formatDate(loan.disbursedAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaCreditCard /> Loan Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Loan Amount</p>
            <p className="font-bold text-gray-800">{formatCurrency(loan.loanAmount)}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">EMI Amount</p>
            <p className="font-bold text-gray-800">{formatCurrency(loan.emiAmount)}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
            <p className="font-bold text-gray-800">{loan.interestRate}% p.a.</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Tenure</p>
            <p className="font-bold text-gray-800">{loan.tenure} months</p>
          </div>
        </div>
      </div>

      {/* Disbursement Details */}
      {loan.status === 'disbursed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">Disbursement Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Disbursed Amount:</span>
              <span className="font-semibold text-green-800">{formatCurrency(loan.disbursedAmount || loan.loanAmount)}</span>
            </div>
            {loan.disbursementReference && (
              <div className="flex justify-between">
                <span className="text-green-700">Reference:</span>
                <span className="font-mono text-green-800">{loan.disbursementReference}</span>
              </div>
            )}
            {loan.totalRemaining > 0 && (
              <div className="flex justify-between">
                <span className="text-green-700">Outstanding:</span>
                <span className="font-semibold text-green-800">{formatCurrency(loan.totalRemaining)}</span>
              </div>
            )}
            {loan.totalPaid > 0 && (
              <div className="flex justify-between">
                <span className="text-green-700">Total Paid:</span>
                <span className="font-semibold text-green-800">{formatCurrency(loan.totalPaid)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Reason */}
      {loan.status === 'rejected' && loan.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">Rejection Reason</h4>
          <p className="text-sm text-red-700">{loan.rejectionReason}</p>
        </div>
      )}

      {/* Eligibility Check */}
      {loan.eligibilityCheck && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaCheckCircle /> Eligibility Check
          </h3>
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Eligibility Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${loan.eligibilityCheck.passed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                {loan.eligibilityCheck.passed ? 'Passed' : 'Pending'}
              </span>
            </div>
            {loan.eligibilityCheck.creditScore && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Credit Score:</span>
                <span className="font-semibold text-gray-800">{loan.eligibilityCheck.creditScore}</span>
              </div>
            )}
            {loan.eligibilityCheck.eligibilityScore && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Eligibility Score:</span>
                <span className="font-semibold text-gray-800">{loan.eligibilityCheck.eligibilityScore}/100</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Income Verified:</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${loan.eligibilityCheck.incomeVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                {loan.eligibilityCheck.incomeVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Employment Verified:</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${loan.eligibilityCheck.employmentVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                {loan.eligibilityCheck.employmentVerified ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* EMI Schedule */}
      {loan.emiSchedule && loan.emiSchedule.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaCalendarAlt /> EMI Schedule
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Month</th>
                    <th className="px-4 py-2 text-left">Due Date</th>
                    <th className="px-4 py-2 text-right">EMI Amount</th>
                    <th className="px-4 py-2 text-right">Penalty</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loan.emiSchedule.map((emi, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{emi.month}/{emi.year}</td>
                      <td className="px-4 py-2">{formatDate(emi.dueDate)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(loan.emiAmount)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(emi.penaltyAmount || 0)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${emi.status === 'completed' ? 'bg-green-100 text-green-700' :
                          emi.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            emi.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {emi.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Documents */}
      {loan.documents && loan.documents.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaFile /> Documents
          </h3>
          <div className="space-y-2">
            {loan.documents.map((doc, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
                <FaFile className="text-gray-600" />
                <span className="flex-1 text-sm text-gray-700 capitalize">{doc.type.replace('_', ' ')}</span>
                <button
                  onClick={() => handleDownloadDocument(doc.url, doc.type)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1 cursor-pointer"
                >
                  <FaDownload /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Notes */}
      {loan.adminNotes && isAdmin && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Admin Notes</h4>
          <p className="text-sm text-gray-700">{loan.adminNotes}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
        <div>Created: {formatDate(loan.createdAt)}</div>
        <div>Last Updated: {formatDate(loan.updatedAt)}</div>
      </div>
    </div>
  );
}


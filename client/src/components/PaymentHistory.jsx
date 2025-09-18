import React, { useState, useEffect } from 'react';
import { FaRupeeSign, FaDownload, FaEye, FaClock, FaCheckCircle, FaTimes, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PaymentHistory = ({ userId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    paymentType: ''
  });

  useEffect(() => {
    fetchPayments();
  }, [currentPage, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/history?${queryParams}`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        setPayments(data.payments);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.message || 'Failed to fetch payment history');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('An error occurred while fetching payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'failed':
        return <FaTimes className="text-red-500" />;
      case 'refunded':
        return <FaExclamationTriangle className="text-blue-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'refunded':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatPaymentType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const downloadReceipt = (receiptUrl) => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    } else {
      toast.info('Receipt not available');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <FaSpinner className="animate-spin text-2xl text-blue-600" />
        <span className="ml-2 text-gray-600">Loading payment history...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Payment History</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <select
          value={filters.paymentType}
          onChange={(e) => handleFilterChange('paymentType', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="advance">Advance Payment</option>
          <option value="monthly_rent">Monthly Rent</option>
          <option value="security_deposit">Security Deposit</option>
          <option value="booking_fee">Booking Fee</option>
          <option value="split_payment">Split Payment</option>
        </select>
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="text-center py-8">
          <FaRupeeSign className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Payments Found</h3>
          <p className="text-gray-500">You haven't made any payments yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(payment.status)}
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {payment.appointmentId?.propertyName || 'Property Payment'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatPaymentType(payment.paymentType)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">
                    {((payment.currency || 'USD') === 'USD') ? `$ ${Number(payment.amount).toFixed(2)}` : `₹${payment.amount.toLocaleString()}`}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                <div>
                  <span className="font-medium">Payment ID:</span>
                  <p className="font-mono text-xs">{payment.paymentId}</p>
                </div>
                <div>
                  <span className="font-medium">Date:</span>
                  <p>{new Date(payment.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium">Property:</span>
                  <p className="truncate">{payment.listingId?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Receipt:</span>
                  <p className="font-mono text-xs">{payment.receiptNumber}</p>
                </div>
              </div>

              {payment.refundAmount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-red-800 font-medium">Refunded Amount:</span>
                      <p className="text-red-600">₹{payment.refundAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600">
                        {payment.refundedAt ? new Date(payment.refundedAt).toLocaleDateString() : 'N/A'}
                      </p>
                      {payment.refundReason && (
                        <p className="text-xs text-red-500">{payment.refundReason}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {payment.completedAt ? (
                    <span>Completed on {new Date(payment.completedAt).toLocaleDateString()}</span>
                  ) : (
                    <span>Created on {new Date(payment.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadReceipt(payment.receiptUrl)}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                  >
                    <FaDownload className="text-xs" />
                    Receipt
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to payment details
                      window.location.href = `/user/payment-details/${payment.paymentId}`;
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    <FaEye className="text-xs" />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-6 gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
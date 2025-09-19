import React, { useState, useEffect, useCallback } from 'react';
import { FaUndo, FaDollarSign, FaExclamationTriangle, FaCheckCircle, FaTimes, FaSpinner, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';

const RefundManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    refundAmount: '',
    reason: '',
    type: 'full' // full or partial
  });
  const [processingRefund, setProcessingRefund] = useState(false);
  const [filters, setFilters] = useState({
    status: 'completed',
    search: ''
  });
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Debounced search effect - no loading indicator for search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      fetchPayments(false); // No loading indicator for search
    }, 300); // 300ms debounce
    
    setSearchTimeout(timeout);
    
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [filters.search]);

  // Status filter effect (immediate, no debounce) - show loading for status changes
  useEffect(() => {
    fetchPayments(true); // Show loading for status filter changes
  }, [filters.status]);

  // Initial load effect
  useEffect(() => {
    fetchPayments(true); // Show loading for initial load
  }, []);

  const fetchPayments = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const queryParams = new URLSearchParams({
        status: 'completed',
        ...filters
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/history?${queryParams}`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        setPayments(data.payments);
      } else {
        toast.error(data.message || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('An error occurred while fetching payments');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleRefundClick = (payment) => {
    setSelectedPayment(payment);
    setRefundForm({
      refundAmount: payment.amount,
      reason: '',
      type: 'full'
    });
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;

    try {
      setProcessingRefund(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentId: selectedPayment.paymentId,
          refundAmount: parseFloat(refundForm.refundAmount),
          reason: refundForm.reason
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Refund processed successfully');
        setShowRefundModal(false);
        fetchPayments(false); // Refresh the list without loading indicator
      } else {
        toast.error(data.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('An error occurred while processing refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const canRefund = (payment) => {
    return payment.status === 'completed' && payment.refundAmount === 0;
  };

  const getRefundStatus = (payment) => {
    if (payment.refundAmount === 0) return 'No Refund';
    if (payment.refundAmount === payment.amount) return 'Fully Refunded';
    return 'Partially Refunded';
  };

  const getRefundStatusColor = (payment) => {
    if (payment.refundAmount === 0) return 'text-gray-600 bg-gray-100';
    if (payment.refundAmount === payment.amount) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FaSpinner className="animate-spin text-2xl text-blue-600" />
        <span className="ml-2 text-gray-600">Loading payments...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaUndo className="text-red-600" />
          Refund Management
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by property name or payment ID..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="completed">Completed Payments</option>
          <option value="refunded">Refunded Payments</option>
          <option value="partially_refunded">Partially Refunded</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Refund Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-800">
                      {payment.appointmentId?.propertyName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {payment.listingId?.name || 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-gray-600">
                    {payment.paymentId}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-gray-800">
                    ${payment.amount.toLocaleString()}
                  </div>
                  {payment.refundAmount > 0 && (
                    <div className="text-sm text-red-600">
                      Refunded: ${payment.refundAmount.toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRefundStatusColor(payment)}`}>
                    {getRefundStatus(payment)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {canRefund(payment) ? (
                    <button
                      onClick={() => handleRefundClick(payment)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                    >
                      <FaUndo className="text-xs" />
                      Refund
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payments.length === 0 && (
        <div className="text-center py-8">
          <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Payments Found</h3>
          <p className="text-gray-500">No completed payments available for refund.</p>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaUndo className="text-red-600" />
                  Process Refund
                </h3>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleRefundSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Details
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Property:</span>
                    <span className="font-medium">{selectedPayment.appointmentId?.propertyName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">${selectedPayment.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-mono text-sm">{selectedPayment.paymentId}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="full"
                      checked={refundForm.type === 'full'}
                      onChange={(e) => {
                        setRefundForm(prev => ({
                          ...prev,
                          type: e.target.value,
                          refundAmount: e.target.value === 'full' ? selectedPayment.amount : prev.refundAmount
                        }));
                      }}
                      className="mr-2"
                    />
                    Full Refund (${selectedPayment.amount.toLocaleString()})
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="partial"
                      checked={refundForm.type === 'partial'}
                      onChange={(e) => setRefundForm(prev => ({ ...prev, type: e.target.value }))}
                      className="mr-2"
                    />
                    Partial Refund
                  </label>
                </div>
              </div>

              {refundForm.type === 'partial' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount
                  </label>
                  <div className="relative">
                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={refundForm.refundAmount}
                      onChange={(e) => setRefundForm(prev => ({ ...prev, refundAmount: e.target.value }))}
                      max={selectedPayment.amount}
                      min="1"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Reason
                </label>
                <textarea
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason for refund..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingRefund}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingRefund ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaUndo />
                      Process Refund
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagement;
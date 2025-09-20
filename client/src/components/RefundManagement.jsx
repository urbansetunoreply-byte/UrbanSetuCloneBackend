import React, { useState, useEffect, useCallback } from 'react';
import { FaUndo, FaDollarSign, FaExclamationTriangle, FaCheckCircle, FaTimes, FaSpinner, FaSearch, FaFilter, FaRedo } from 'react-icons/fa';
import { toast } from 'react-toastify';

const RefundManagement = () => {
  const [payments, setPayments] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
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
  const [refundRequestFilters, setRefundRequestFilters] = useState({
    search: '',
    status: '',
    type: '',
    currency: '',
    dateFrom: '',
    dateTo: '',
    user: ''
  });
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' or 'requests'
  const [selectedRefundRequest, setSelectedRefundRequest] = useState(null);
  const [showRefundRequestModal, setShowRefundRequestModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingRequest, setProcessingRequest] = useState(false);
  const [processingApprove, setProcessingApprove] = useState(false);
  const [processingReject, setProcessingReject] = useState(false);

  // Lock body scroll when refund request modal is open
  useEffect(() => {
    if (showRefundRequestModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showRefundRequestModal]);

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

  // Refund request search effect - debounced
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      fetchRefundRequests(false); // No loading indicator for search
    }, 300); // 300ms debounce
    
    setSearchTimeout(timeout);
    
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [refundRequestFilters.search, refundRequestFilters.user]);

  // Refund request filter effects (immediate, no debounce) - show loading for filter changes
  useEffect(() => {
    fetchRefundRequests(true); // Show loading for filter changes
  }, [refundRequestFilters.status, refundRequestFilters.type, refundRequestFilters.currency, refundRequestFilters.dateFrom, refundRequestFilters.dateTo]);

  // Initial load effect
  useEffect(() => {
    fetchPayments(true); // Show loading for initial load
    fetchRefundRequests(true); // Show loading for initial load
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

  const fetchRefundRequests = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const queryParams = new URLSearchParams();
      Object.entries(refundRequestFilters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/refund-requests?${queryParams}`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        setRefundRequests(data.refundRequests);
      } else {
        toast.error(data.message || 'Failed to fetch refund requests');
      }
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      toast.error('An error occurred while fetching refund requests');
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

  const handleRefundRequestClick = (request) => {
    setSelectedRefundRequest(request);
    setAdminNotes('');
    setShowRefundRequestModal(true);
  };

  const handleRefundRequestAction = async (action) => {
    if (!selectedRefundRequest) return;

    try {
      if (action === 'approved') {
        setProcessingApprove(true);
      } else if (action === 'rejected') {
        setProcessingReject(true);
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/refund-request/${selectedRefundRequest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: action,
          adminNotes: adminNotes
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`Refund request ${action} successfully`);
        setShowRefundRequestModal(false);
        setAdminNotes('');
        fetchRefundRequests(false);
        fetchPayments(false);
      } else {
        toast.error(data.message || `Failed to ${action} refund request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing refund request:`, error);
      toast.error(`An error occurred while ${action}ing refund request`);
    } finally {
      setProcessingApprove(false);
      setProcessingReject(false);
    }
  };

  const handleReopenCase = async (request) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/refund-request/${request._id}/reopen`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Case reopened successfully');
        fetchRefundRequests(false);
      } else {
        toast.error(data.message || 'Failed to reopen case');
      }
    } catch (error) {
      console.error('Error reopening case:', error);
      toast.error('An error occurred while reopening case');
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

  const getRefundRequestStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'processed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRefundRequestStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'processed': return 'Processed';
      default: return status;
    }
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

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'payments'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Direct Refunds
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Refund Requests
        </button>
      </div>

      {activeTab === 'payments' && (
        <>
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
                    {new Date(payment.createdAt).toLocaleDateString('en-GB')}
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
        </>
      )}

      {activeTab === 'requests' && (
        <>
          {/* Refund Requests Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FaFilter className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Filter Refund Requests</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by property, user, or reason..."
                  value={refundRequestFilters.search}
                  onChange={(e) => setRefundRequestFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={refundRequestFilters.status}
                onChange={(e) => setRefundRequestFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processed">Processed</option>
              </select>

              {/* Type Filter */}
              <select
                value={refundRequestFilters.type}
                onChange={(e) => setRefundRequestFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="full">Full Refund</option>
                <option value="partial">Partial Refund</option>
              </select>

              {/* Currency Filter */}
              <select
                value={refundRequestFilters.currency}
                onChange={(e) => setRefundRequestFilters(prev => ({ ...prev, currency: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Currencies</option>
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={refundRequestFilters.dateFrom}
                  onChange={(e) => setRefundRequestFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={refundRequestFilters.dateTo}
                  onChange={(e) => setRefundRequestFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <input
                  type="text"
                  placeholder="Search by user name or email..."
                  value={refundRequestFilters.user}
                  onChange={(e) => setRefundRequestFilters(prev => ({ ...prev, user: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={() => setRefundRequestFilters({
                    search: '',
                    status: '',
                    type: '',
                    currency: '',
                    dateFrom: '',
                    dateTo: '',
                    user: ''
                  })}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <FaTimes className="text-sm" />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Refund Requests Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests && refundRequests.map((request) => (
                  <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-800">
                          {request.appointmentId?.propertyName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Payment ID: {request.paymentId?.paymentId || request.paymentId}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-800">
                          {request.userId?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {request.userId?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">
                        {request.paymentId?.currency === 'INR' ? '₹' : '$'}{request.requestedAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {request.type === 'full' ? 'Full Refund' : 'Partial Refund'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {request.reason}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRefundRequestStatusColor(request.status)}`}>
                        {getRefundRequestStatusText(request.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {new Date(request.createdAt).toLocaleDateString('en-GB')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleTimeString('en-GB')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {request.status === 'pending' ? (
                        <button
                          onClick={() => handleRefundRequestClick(request)}
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                        >
                          <FaCheckCircle className="text-xs" />
                          Review
                        </button>
                      ) : request.status === 'rejected' ? (
                        <button
                          onClick={() => handleReopenCase(request)}
                          className="px-3 py-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                        >
                          <FaUndo className="text-xs" />
                          Reopen Case
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          {request.processedBy?.name || 'N/A'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {refundRequests.length === 0 && (
            <div className="text-center py-8">
              <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Refund Requests</h3>
              <p className="text-gray-500">No refund requests found.</p>
            </div>
          )}
        </>
      )}

      {/* Refund Request Modal */}
      {showRefundRequestModal && selectedRefundRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaCheckCircle className="text-blue-600" />
                  Review Refund Request
                </h3>
                <button
                  onClick={() => setShowRefundRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Request Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property:</span>
                      <span className="font-medium">{selectedRefundRequest.appointmentId?.propertyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">User:</span>
                      <span className="font-medium">{selectedRefundRequest.userId?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">
                        {selectedRefundRequest.paymentId?.currency === 'INR' ? '₹' : '$'}{selectedRefundRequest.requestedAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{selectedRefundRequest.type} Refund</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requested Date:</span>
                      <span className="font-medium">{new Date(selectedRefundRequest.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requested Time:</span>
                      <span className="font-medium">{new Date(selectedRefundRequest.createdAt).toLocaleTimeString('en-GB')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRefundRequestStatusColor(selectedRefundRequest.status)}`}>
                        {getRefundRequestStatusText(selectedRefundRequest.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Payment Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-mono text-sm">{selectedRefundRequest.paymentId?.paymentId || selectedRefundRequest.paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Amount:</span>
                      <span className="font-medium">
                        {selectedRefundRequest.paymentId?.currency === 'INR' ? '₹' : '$'}{selectedRefundRequest.paymentId?.amount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gateway:</span>
                      <span className="font-medium capitalize">{selectedRefundRequest.paymentId?.gateway}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Appointment Status:</span>
                      <span className="font-medium capitalize">{selectedRefundRequest.appointmentId?.status?.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Refund Reason</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700">{selectedRefundRequest.reason}</p>
                </div>
              </div>

              {selectedRefundRequest.isAppealed && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <FaUndo className="text-purple-600" />
                    Appeal Information
                  </h4>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-600">Appeal Reason:</span>
                      <p className="text-gray-700">{selectedRefundRequest.appealReason}</p>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-600">Appeal Details:</span>
                      <p className="text-gray-700">{selectedRefundRequest.appealText}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      Submitted: {new Date(selectedRefundRequest.appealSubmittedAt).toLocaleString('en-GB')}
                    </div>
                  </div>
                </div>
              )}

              {selectedRefundRequest.caseReopened && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <FaRedo className="text-green-600" />
                    Case Reopened
                  </h4>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-gray-700">This case has been reopened for review.</p>
                    <div className="text-xs text-gray-500 mt-1">
                      Reopened: {new Date(selectedRefundRequest.caseReopenedAt).toLocaleString('en-GB')}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this refund request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

            </div>

            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRefundRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRefundRequestAction('rejected')}
                  disabled={processingApprove || processingReject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingReject ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaTimes />
                  )}
                  Reject
                </button>
                <button
                  onClick={() => handleRefundRequestAction('approved')}
                  disabled={processingApprove || processingReject}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingApprove ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCheckCircle />
                  )}
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagement;

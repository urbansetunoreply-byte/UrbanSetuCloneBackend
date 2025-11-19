import React, { useState, useMemo } from "react";
import { FaHistory, FaDownload, FaFilter, FaSearch, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function RentPaymentHistory({ wallet, contract }) {
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending', 'failed', 'overdue'
  const [searchTerm, setSearchTerm] = useState('');

  const payments = useMemo(() => {
    if (!wallet?.paymentSchedule) return [];
    
    let filtered = wallet.paymentSchedule;
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(p => {
        if (filter === 'overdue') {
          return (p.status === 'pending' || p.status === 'overdue') && new Date(p.dueDate) < new Date();
        }
        return p.status === filter;
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        const dateStr = new Date(p.dueDate).toLocaleDateString('en-GB').toLowerCase();
        const amountStr = p.amount.toString();
        const statusStr = p.status.toLowerCase();
        return dateStr.includes(term) || amountStr.includes(term) || statusStr.includes(term);
      });
    }
    
    return filtered.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
  }, [wallet, filter, searchTerm]);

  const getStatusIcon = (payment) => {
    switch (payment.status) {
      case 'completed':
        return <FaCheckCircle className="text-green-600" />;
      case 'failed':
        return <FaTimesCircle className="text-red-600" />;
      case 'overdue':
        return <FaExclamationTriangle className="text-red-600" />;
      case 'processing':
        return <FaClock className="text-blue-600 animate-pulse" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getStatusColor = (payment) => {
    switch (payment.status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDownloadReceipt = async (payment) => {
    if (!payment.paymentId) {
      toast.warning("Receipt not available for this payment.");
      return;
    }

    try {
      // TODO: Implement receipt download
      toast.info("Receipt download feature coming soon!");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt.");
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!wallet?.paymentSchedule) return { total: 0, totalPaid: 0, totalDue: 0 };
    
    const allPayments = wallet.paymentSchedule;
    const completed = allPayments.filter(p => p.status === 'completed');
    const pending = allPayments.filter(p => p.status === 'pending' || p.status === 'overdue');
    
    return {
      total: allPayments.length,
      totalPaid: completed.reduce((sum, p) => sum + p.amount + (p.penaltyAmount || 0), 0),
      totalDue: pending.reduce((sum, p) => sum + p.amount + (p.penaltyAmount || 0), 0),
      completed: completed.length,
      pending: pending.length
    };
  }, [wallet]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        <FaHistory className="inline mr-2" />
        Payment History
      </h2>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{stats.totalPaid.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Due</p>
          <p className="text-2xl font-bold text-yellow-600">
            ₹{stats.totalDue.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Status Filter */}
        <div className="flex-1">
          <label className="block text-gray-700 font-medium mb-2">
            <FaFilter className="inline mr-2" />
            Filter by Status
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Payments</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1">
          <label className="block text-gray-700 font-medium mb-2">
            <FaSearch className="inline mr-2" />
            Search
          </label>
          <input
            type="text"
            placeholder="Search by date, amount, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        {payments.length > 0 ? (
          payments.map((payment, index) => {
            const dueDate = new Date(payment.dueDate);
            const isOverdue = payment.status === 'pending' && dueDate < new Date();

            return (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 transition ${getStatusColor(payment)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl">
                      {getStatusIcon(payment)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-lg">
                          {dueDate.toLocaleDateString('en-GB', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${getStatusColor(payment)}`}>
                          {payment.status}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        {payment.paidAt && (
                          <p>
                            Paid: <span className="font-semibold">
                              {new Date(payment.paidAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </p>
                        )}
                        {payment.remarks && (
                          <p className="text-gray-600">Note: {payment.remarks}</p>
                        )}
                        {payment.paymentId && (
                          <p className="text-xs text-gray-500">
                            Payment ID: {typeof payment.paymentId === 'object' ? payment.paymentId.paymentId : payment.paymentId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-xl font-bold mb-1">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </p>
                    {payment.penaltyAmount > 0 && (
                      <p className="text-sm text-red-600 mb-1">
                        Penalty: ₹{payment.penaltyAmount.toLocaleString('en-IN')}
                      </p>
                    )}
                    <p className="text-lg font-semibold">
                      Total: ₹{(payment.amount + (payment.penaltyAmount || 0)).toLocaleString('en-IN')}
                    </p>
                  </div>
                  {payment.status === 'completed' && (
                    <button
                      onClick={() => handleDownloadReceipt(payment)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition flex items-center gap-2"
                    >
                      <FaDownload />
                      Receipt
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <FaHistory className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No payments found.</p>
          </div>
        )}
      </div>

      {/* Export Button */}
      {payments.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              toast.info("Export feature coming soon!");
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition flex items-center gap-2 mx-auto"
          >
            <FaDownload />
            Export Payment History
          </button>
        </div>
      )}
    </div>
  );
}


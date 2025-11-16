import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaDollarSign, FaCreditCard, FaChartLine, FaDownload, FaUndo, FaCheckCircle, FaTimes, FaExclamationTriangle, FaSpinner, FaUsers, FaHome, FaCalendar, FaMoneyBill, FaLock, FaShare, FaEye, FaCopy, FaExternalLinkAlt, FaCalendar } from 'react-icons/fa';
import PaymentHistory from '../components/PaymentHistory';
import RefundManagement from '../components/RefundManagement';
import { signoutUserStart, signoutUserSuccess, signoutUserFailure } from '../redux/user/userSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import { socket } from '../utils/socket';

import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PaymentDashboard = () => {
  // Set page title
  usePageTitle("Payment Dashboard - Financial Management");
  
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    totalAmountUsd: 0,
    totalAmountInr: 0,
    totalRefunds: 0,
    totalRefundsUsd: 0,
    totalRefundsInr: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0
  });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usdPayments, setUsdPayments] = useState([]);
  const [inrPayments, setInrPayments] = useState([]);
  const [allUsdPayments, setAllUsdPayments] = useState([]);
  const [allInrPayments, setAllInrPayments] = useState([]);
  
  // Pagination states for payment history
  const [usdPaymentsPage, setUsdPaymentsPage] = useState(1);
  const [usdPaymentsTotalPages, setUsdPaymentsTotalPages] = useState(1);
  const [inrPaymentsPage, setInrPaymentsPage] = useState(1);
  const [inrPaymentsTotalPages, setInrPaymentsTotalPages] = useState(1);
  
  // Preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Export password modal states
  const [showExportPasswordModal, setShowExportPasswordModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportPasswordError, setExportPasswordError] = useState('');
  const [exportPasswordLoading, setExportPasswordLoading] = useState(false);

  useEffect(() => {
    fetchPaymentStats();
    fetchAdminPayments();
  }, []);

  // Pagination effect for USD payments
  useEffect(() => {
    const itemsPerPage = 10;
    const totalPages = Math.ceil(allUsdPayments.length / itemsPerPage);
    setUsdPaymentsTotalPages(totalPages);
    
    const startIndex = (usdPaymentsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageUsdPayments = allUsdPayments.slice(startIndex, endIndex);
    setUsdPayments(currentPageUsdPayments);
  }, [allUsdPayments, usdPaymentsPage]);

  // Pagination effect for INR payments
  useEffect(() => {
    const itemsPerPage = 10;
    const totalPages = Math.ceil(allInrPayments.length / itemsPerPage);
    setInrPaymentsTotalPages(totalPages);
    
    const startIndex = (inrPaymentsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageInrPayments = allInrPayments.slice(startIndex, endIndex);
    setInrPayments(currentPageInrPayments);
  }, [allInrPayments, inrPaymentsPage]);

  // Listen for payment status updates to refresh stats
  useEffect(() => {
    if (!socket) return;
    
    const handlePaymentStatusUpdate = () => {
      // Refresh stats when payment status changes
      fetchPaymentStats();
    };
    
    const handlePaymentCreated = () => {
      // Refresh stats when new payment is created
      fetchPaymentStats();
    };
    
    socket.on('paymentStatusUpdated', handlePaymentStatusUpdate);
    socket.on('paymentCreated', handlePaymentCreated);
    
    return () => {
      socket.off('paymentStatusUpdated', handlePaymentStatusUpdate);
      socket.off('paymentCreated', handlePaymentCreated);
    };
  }, []);

  const fetchPaymentStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/stats/overview`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.overview);
        setMonthlyStats(data.monthlyStats);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminPayments = async () => {
    try {
      const statusSel = document.getElementById('admin-pay-status');
      const gatewaySel = document.getElementById('admin-pay-gateway');
      const qSel = document.getElementById('admin-pay-q');
      const fromSel = document.getElementById('admin-pay-from');
      const toSel = document.getElementById('admin-pay-to');
      const status = statusSel ? statusSel.value : '';
      const gateway = gatewaySel ? gatewaySel.value : '';
      const q = qSel ? qSel.value : '';
      const fromDate = fromSel ? fromSel.value : '';
      const toDate = toSel ? toSel.value : '';
      const [usdRes, inrRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/admin/list?currency=USD&limit=1000&status=${encodeURIComponent(status)}&gateway=${encodeURIComponent(gateway)}&q=${encodeURIComponent(q)}&fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, { credentials: 'include' }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/admin/list?currency=INR&limit=1000&status=${encodeURIComponent(status)}&gateway=${encodeURIComponent(gateway)}&q=${encodeURIComponent(q)}&fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, { credentials: 'include' })
      ]);
      const usdData = await usdRes.json();
      const inrData = await inrRes.json();
      if (usdRes.ok) {
        setAllUsdPayments(usdData.payments || []);
        setUsdPaymentsPage(1); // Reset to first page when filters change
      }
      if (inrRes.ok) {
        setAllInrPayments(inrData.payments || []);
        setInrPaymentsPage(1); // Reset to first page when filters change
      }
    } catch (e) {
      // non-fatal
    }
  };

  const statusBadge = (status) => {
    const cls = status === 'completed' ? 'bg-green-100 text-green-700' : status === 'failed' ? 'bg-red-100 text-red-700' : status === 'refunded' || status === 'partially_refunded' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700';
    return <span className={`px-2 py-1 text-[10px] rounded-full font-semibold ${cls}`}>{status}</span>;
  };

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setShowPreviewModal(true);
  };

  const downloadReceipt = async (url) => {
    if (!url) return;
    try {
      const receiptUrl = url.includes('?') ? `${url}&admin=true` : `${url}?admin=true`;
      const res = await fetch(receiptUrl, { credentials: 'include' });
      if (!res.ok) return;
      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = 'receipt.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objUrl);
      toast.success('Receipt downloaded successfully');
    } catch {
      toast.error('Failed to download receipt');
    }
  };

  const sharePayment = async (payment) => {
    const shareText = `Payment Details:\nProperty: ${payment.appointmentId?.propertyName || 'N/A'}\nBuyer: ${payment.userId?.username || 'N/A'}\nAmount: ${payment.currency === 'INR' ? '₹' : '$'}${Number(payment.amount).toFixed(2)}\nStatus: ${payment.status}\nPayment ID: ${payment.paymentId}`;
    const shareUrl = window.location.origin + `/admin/payments?paymentId=${payment.paymentId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Payment Receipt',
          text: shareText,
          url: shareUrl
        });
        toast.success('Payment shared successfully');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyPaymentLink(shareUrl, shareText);
        }
      }
    } else {
      copyPaymentLink(shareUrl, shareText);
    }
  };

  const copyPaymentLink = async (url, text) => {
    try {
      await navigator.clipboard.writeText(text + '\n' + url);
      toast.success('Payment details copied to clipboard');
    } catch {
      toast.error('Failed to copy payment details');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaChartLine },
    { id: 'history', label: 'Payment History', icon: FaCreditCard },
    { id: 'refunds', label: 'Refund Management', icon: FaUndo }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-6 sm:py-10 px-2 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaMoneyBill className="text-green-600" />
                Payment Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Manage payments, refunds, and financial analytics</p>
            </div>
            <button
              onClick={fetchPaymentStats}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              title="Refresh stats"
            >
              <FaSpinner className="animate-spin" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto no-scrollbar px-2 sm:px-6 gap-4 sm:gap-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Net Revenue (USD)</p>
                      <p className="text-3xl font-bold">${Math.max(0, (stats.totalAmountUsd - stats.totalRefundsUsd)).toLocaleString()}</p>
                    </div>
                    <FaDollarSign className="text-4xl text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Net Revenue (INR)</p>
                      <p className="text-3xl font-bold">₹{Math.max(0, (stats.totalAmountInr - stats.totalRefundsInr)).toLocaleString('en-IN')}</p>
                    </div>
                    <FaCreditCard className="text-4xl text-emerald-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Payments</p>
                      <p className="text-3xl font-bold">{stats.totalPayments}</p>
                    </div>
                    <FaCreditCard className="text-4xl text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Completed Payments</p>
                      <p className="text-3xl font-bold">{stats.completedPayments}</p>
                    </div>
                    <FaCheckCircle className="text-4xl text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-medium">Pending Payments</p>
                      <p className="text-3xl font-bold">{stats.pendingPayments}</p>
                    </div>
                    <FaExclamationTriangle className="text-4xl text-yellow-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">Failed Payments</p>
                      <p className="text-3xl font-bold">{stats.failedPayments}</p>
                    </div>
                    <FaTimes className="text-4xl text-red-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Total Refunds</p>
                      <p className="text-lg font-bold">$ {stats.totalRefundsUsd.toLocaleString()} • ₹ {stats.totalRefundsInr.toLocaleString('en-IN')}</p>
                    </div>
                    <FaUndo className="text-4xl text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Monthly Stats Chart */}
              {monthlyStats.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaChartLine className="text-blue-600" />
                    Monthly Payment Trends (USD & INR)
                  </h3>
                  <div className="space-y-4">
                    {monthlyStats.map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 text-sm text-gray-600">
                            {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                            <div className="absolute inset-y-0 left-0 flex w-full gap-1 px-1">
                              <div
                                className="h-4 rounded-l-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, (Math.max(0, ((month.amountUsd || 0) - (month.refundsUsd || 0))) / Math.max(1, ...monthlyStats.map(m => Math.max(0, ((m.amountUsd || 0) - (m.refundsUsd || 0)))))) * 100)}%` }}
                                title={`USD Net: $${Math.max(0, ((month.amountUsd || 0) - (month.refundsUsd || 0))).toLocaleString()}`}
                              />
                              <div
                                className="h-4 rounded-r-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, (Math.max(0, ((month.amountInr || 0) - (month.refundsInr || 0))) / Math.max(1, ...monthlyStats.map(m => Math.max(0, ((m.amountInr || 0) - (m.refundsInr || 0)))))) * 100)}%` }}
                                title={`INR Net: ₹${Math.max(0, ((month.amountInr || 0) - (month.refundsInr || 0))).toLocaleString('en-IN')}`}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-800">$ {Math.max(0, ((month.amountUsd || 0) - (month.refundsUsd || 0))).toLocaleString()} • ₹ {Math.max(0, ((month.amountInr || 0) - (month.refundsInr || 0))).toLocaleString('en-IN')}</div>
                          <div className="text-sm text-gray-500">{month.count} payments</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="bg-blue-100 text-blue-800 p-3 sm:p-4 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 sm:gap-3"
                  >
                    <FaCreditCard className="text-lg sm:text-xl" />
                    <div className="text-left">
                      <div className="font-semibold text-sm sm:text-base">View Payment History</div>
                      <div className="text-xs sm:text-sm">Browse all payments</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('refunds')}
                    className="bg-red-100 text-red-800 p-3 sm:p-4 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 sm:gap-3"
                  >
                    <FaUndo className="text-lg sm:text-xl" />
                    <div className="text-left">
                      <div className="font-semibold text-sm sm:text-base">Manage Refunds</div>
                      <div className="text-xs sm:text-sm">Process refunds</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowExportPasswordModal(true);
                      setExportPassword('');
                      setExportPasswordError('');
                    }}
                    className="bg-green-100 text-green-800 p-3 sm:p-4 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2 sm:gap-3"
                    title="Export CSV of payments"
                  >
                    <FaDownload className="text-lg sm:text-xl" />
                    <div className="text-left">
                      <div className="font-semibold text-sm sm:text-base">Export Reports</div>
                      <div className="text-xs sm:text-sm">Download financial reports</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <input id="admin-pay-q" placeholder="Search payment ID, receipt, user" className="px-3 py-2 border rounded-lg text-sm" onChange={async ()=>{ setUsdPaymentsPage(1); setInrPaymentsPage(1); await fetchAdminPayments(); }} />
                <label className="text-sm text-gray-600">From:</label>
                <input id="admin-pay-from" type="date" max={new Date().toISOString().split('T')[0]} className="px-3 py-2 border rounded-lg text-sm" onChange={async ()=>{ setUsdPaymentsPage(1); setInrPaymentsPage(1); await fetchAdminPayments(); }} />
                <label className="text-sm text-gray-600">To:</label>
                <input id="admin-pay-to" type="date" max={new Date().toISOString().split('T')[0]} className="px-3 py-2 border rounded-lg text-sm" onChange={async ()=>{ setUsdPaymentsPage(1); setInrPaymentsPage(1); await fetchAdminPayments(); }} />
                <select id="admin-pay-status" onChange={async () => { setUsdPaymentsPage(1); setInrPaymentsPage(1); await fetchAdminPayments(); }} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="partially_refunded">Partially Refunded</option>
                </select>
                <select id="admin-pay-gateway" onChange={async () => { setUsdPaymentsPage(1); setInrPaymentsPage(1); await fetchAdminPayments(); }} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Gateways</option>
                  <option value="paypal">PayPal</option>
                  <option value="razorpay">Razorpay</option>
                </select>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">USD Payments ($)</h3>
                {usdPayments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <FaMoneyBill className="text-4xl text-gray-300 mx-auto mb-2" />
                    <div>No USD payments found.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usdPayments.map((p) => (
                      <div key={p._id} className={`border rounded-lg p-4 cursor-pointer ${
                        p.status === 'completed' ? 'border-green-200 bg-green-50' : 
                        p.status === 'failed' ? 'border-red-200 bg-red-50' : 
                        p.status === 'refunded' || p.status === 'partially_refunded' ? 'border-blue-200 bg-blue-50' :
                        'border-yellow-200 bg-yellow-50'
                      } hover:shadow-lg transition-all`} onClick={() => handlePaymentClick(p)}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{p.appointmentId?.propertyName || 'Property Payment'}</div>
                            <div className="text-xs text-gray-500">Buyer: {p.userId?.username || 'N/A'}</div>
                          </div>
                          <div className="flex flex-col sm:items-end gap-2">
                            <div className="text-lg font-bold">$ {Number(p.amount).toFixed(2)}</div>
                            {p.refundAmount > 0 && (
                              <div className="text-sm text-red-600 font-semibold">
                                Refunded: $ {Number(p.refundAmount).toFixed(2)}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 space-y-1">
                              {p.completedAt ? (
                                <div className="text-right">
                                  <div className="font-medium">Paid: {new Date(p.completedAt).toLocaleDateString('en-GB')}</div>
                                  <div className="text-gray-400">{new Date(p.completedAt).toLocaleTimeString('en-GB')}</div>
                                  <div className="text-gray-300 mt-1">Created: {new Date(p.createdAt).toLocaleDateString('en-GB')}</div>
                                  <div className="text-gray-300">{new Date(p.createdAt).toLocaleTimeString('en-GB')}</div>
                                  {p.refundedAt && (
                                    <>
                                      <div className="text-red-400 mt-1">Refunded: {new Date(p.refundedAt).toLocaleDateString('en-GB')}</div>
                                      <div className="text-red-300">{new Date(p.refundedAt).toLocaleTimeString('en-GB')}</div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="text-right">
                                  <div className="font-medium">Created: {new Date(p.createdAt).toLocaleDateString('en-GB')}</div>
                                  <div className="text-gray-400">{new Date(p.createdAt).toLocaleTimeString('en-GB')}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className={`px-2 py-1 text-[10px] rounded-full font-semibold ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : p.status === 'refunded' || p.status === 'partially_refunded' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">Payment ID: <span className="font-mono">{p.paymentId}</span></div>
                        <div className="mt-1 text-xs text-gray-600">Gateway: {p.gateway?.toUpperCase()}</div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          {p.receiptUrl && (
                            <button
                              onClick={async () => {
                                downloadReceipt(p.receiptUrl);
                              }}
                              className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-xs flex items-center gap-1"
                            >
                              <FaDownload className="text-xs" /> Receipt
                            </button>
                          )}
                          <button
                            onClick={() => sharePayment(p)}
                            className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 text-xs flex items-center gap-1"
                          >
                            <FaShare className="text-xs" /> Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* USD Payments Pagination */}
                {allUsdPayments.length > 10 && usdPaymentsTotalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-2">
                    <div className="text-sm text-gray-700">
                      Page {usdPaymentsPage} of {usdPaymentsTotalPages}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setUsdPaymentsPage(Math.max(1, usdPaymentsPage - 1));
                          toast.info(`Navigated to page ${Math.max(1, usdPaymentsPage - 1)}`);
                        }}
                        disabled={usdPaymentsPage === 1}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => {
                          setUsdPaymentsPage(Math.min(usdPaymentsTotalPages, usdPaymentsPage + 1));
                          toast.info(`Navigated to page ${Math.min(usdPaymentsTotalPages, usdPaymentsPage + 1)}`);
                        }}
                        disabled={usdPaymentsPage === usdPaymentsTotalPages}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">INR Payments (₹)</h3>
                {inrPayments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <FaMoneyBill className="text-4xl text-gray-300 mx-auto mb-2" />
                    <div>No INR payments found.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inrPayments.map((p) => (
                      <div key={p._id} className={`border rounded-lg p-4 cursor-pointer ${
                        p.status === 'completed' ? 'border-green-200 bg-green-50' : 
                        p.status === 'failed' ? 'border-red-200 bg-red-50' : 
                        p.status === 'refunded' || p.status === 'partially_refunded' ? 'border-blue-200 bg-blue-50' :
                        'border-yellow-200 bg-yellow-50'
                      } hover:shadow-lg transition-all`} onClick={() => handlePaymentClick(p)}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{p.appointmentId?.propertyName || 'Property Payment'}</div>
                            <div className="text-xs text-gray-500">Buyer: {p.userId?.username || 'N/A'}</div>
                          </div>
                          <div className="flex flex-col sm:items-end gap-2">
                            <div className="text-lg font-bold">₹ {Number(p.amount).toFixed(2)}</div>
                            {p.refundAmount > 0 && (
                              <div className="text-sm text-red-600 font-semibold">
                                Refunded: ₹ {Number(p.refundAmount).toFixed(2)}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 space-y-1">
                              {p.completedAt ? (
                                <div className="text-right">
                                  <div className="font-medium">Paid: {new Date(p.completedAt).toLocaleDateString('en-GB')}</div>
                                  <div className="text-gray-400">{new Date(p.completedAt).toLocaleTimeString('en-GB')}</div>
                                  <div className="text-gray-300 mt-1">Created: {new Date(p.createdAt).toLocaleDateString('en-GB')}</div>
                                  <div className="text-gray-300">{new Date(p.createdAt).toLocaleTimeString('en-GB')}</div>
                                  {p.refundedAt && (
                                    <>
                                      <div className="text-red-400 mt-1">Refunded: {new Date(p.refundedAt).toLocaleDateString('en-GB')}</div>
                                      <div className="text-red-300">{new Date(p.refundedAt).toLocaleTimeString('en-GB')}</div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="text-right">
                                  <div className="font-medium">Created: {new Date(p.createdAt).toLocaleDateString('en-GB')}</div>
                                  <div className="text-gray-400">{new Date(p.createdAt).toLocaleTimeString('en-GB')}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className={`px-2 py-1 text-[10px] rounded-full font-semibold ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : p.status === 'refunded' || p.status === 'partially_refunded' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">Payment ID: <span className="font-mono">{p.paymentId}</span></div>
                        <div className="mt-1 text-xs text-gray-600">Gateway: {p.gateway?.toUpperCase()}</div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          {p.receiptUrl && (
                            <button
                              onClick={async () => {
                                downloadReceipt(p.receiptUrl);
                              }}
                              className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-xs flex items-center gap-1"
                            >
                              <FaDownload className="text-xs" /> Receipt
                            </button>
                          )}
                          <button
                            onClick={() => sharePayment(p)}
                            className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 text-xs flex items-center gap-1"
                          >
                            <FaShare className="text-xs" /> Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* INR Payments Pagination */}
                {allInrPayments.length > 10 && inrPaymentsTotalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-2">
                    <div className="text-sm text-gray-700">
                      Page {inrPaymentsPage} of {inrPaymentsTotalPages}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setInrPaymentsPage(Math.max(1, inrPaymentsPage - 1));
                          toast.info(`Navigated to page ${Math.max(1, inrPaymentsPage - 1)}`);
                        }}
                        disabled={inrPaymentsPage === 1}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => {
                          setInrPaymentsPage(Math.min(inrPaymentsTotalPages, inrPaymentsPage + 1));
                          toast.info(`Navigated to page ${Math.min(inrPaymentsTotalPages, inrPaymentsPage + 1)}`);
                        }}
                        disabled={inrPaymentsPage === inrPaymentsTotalPages}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'refunds' && (
            <RefundManagement onRefundProcessed={fetchPaymentStats} />
          )}
        </div>
      </div>
      
      {/* Payment Preview Modal */}
      {showPreviewModal && selectedPayment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10 p-4 sm:p-6 pb-3 sm:pb-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaEye className="text-blue-600" />
                  Payment Details
                </h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6">
              {/* Payment Overview */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-800 break-words">{selectedPayment.appointmentId?.propertyName || 'Property Payment'}</h4>
                    <p className="text-sm text-gray-600 mt-1">Buyer: {selectedPayment.userId?.username || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mt-1 break-all">Payment ID: <span className="font-mono text-xs">{selectedPayment.paymentId}</span></p>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-800 break-words">
                      {selectedPayment.currency === 'INR' ? '₹' : '$'}{Number(selectedPayment.amount).toFixed(2)}
                    </div>
                    <div className="mt-2">{statusBadge(selectedPayment.status)}</div>
                  </div>
                </div>
              </div>

              {/* Payment Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Gateway</div>
                  <div className="font-semibold text-gray-800">{selectedPayment.gateway?.toUpperCase() || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Currency</div>
                  <div className="font-semibold text-gray-800">{selectedPayment.currency || 'N/A'}</div>
                </div>
                {selectedPayment.completedAt && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Paid Date</div>
                    <div className="font-semibold text-gray-800">
                      {new Date(selectedPayment.completedAt).toLocaleDateString('en-GB', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(selectedPayment.completedAt).toLocaleTimeString('en-GB')}
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Created Date</div>
                  <div className="font-semibold text-gray-800">
                    {new Date(selectedPayment.createdAt).toLocaleDateString('en-GB', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(selectedPayment.createdAt).toLocaleTimeString('en-GB')}
                  </div>
                </div>
                {selectedPayment.refundedAt && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-red-600 mb-1">Refunded Date</div>
                    <div className="font-semibold text-red-800">
                      {new Date(selectedPayment.refundedAt).toLocaleDateString('en-GB', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-red-500 mt-1">
                      {new Date(selectedPayment.refundedAt).toLocaleTimeString('en-GB')}
                    </div>
                  </div>
                )}
                {selectedPayment.refundAmount > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-red-600 mb-1">Refund Amount</div>
                    <div className="font-semibold text-red-800">
                      {selectedPayment.currency === 'INR' ? '₹' : '$'}{Number(selectedPayment.refundAmount).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {selectedPayment.receiptUrl && (
                  <button
                    onClick={() => {
                      downloadReceipt(selectedPayment.receiptUrl);
                      setShowPreviewModal(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FaDownload /> Download Receipt
                  </button>
                )}
                <button
                  onClick={() => {
                    sharePayment(selectedPayment);
                    setShowPreviewModal(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <FaShare /> Share Payment
                </button>
                <button
                  onClick={() => {
                    copyPaymentLink(
                      window.location.origin + `/admin/payments?paymentId=${selectedPayment.paymentId}`,
                      `Payment Details:\nProperty: ${selectedPayment.appointmentId?.propertyName || 'N/A'}\nBuyer: ${selectedPayment.userId?.username || 'N/A'}\nAmount: ${selectedPayment.currency === 'INR' ? '₹' : '$'}${Number(selectedPayment.amount).toFixed(2)}\nStatus: ${selectedPayment.status}\nPayment ID: ${selectedPayment.paymentId}`
                    );
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <FaCopy /> Copy Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Export Password Modal */}
      {showExportPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form 
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col gap-4" 
            onSubmit={async (e) => {
              e.preventDefault();
              setExportPasswordLoading(true);
              setExportPasswordError("");
              try {
                const { data } = await axios.post(`${API_BASE_URL}/api/auth/verify-password`, 
                  { password: exportPassword },
                  { 
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" }
                  }
                );
                if (data.success) {
                  // Reset attempts on successful password
                  localStorage.removeItem('adminPaymentExportPwAttempts');
                  setShowExportPasswordModal(false);
                  setExportPassword("");
                  setExportPasswordError("");
                  
                  // Download export file
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/payments/admin/export`, { credentials: 'include' });
                    if (!res.ok) {
                      toast.error('Failed to export payments');
                      return;
                    }
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'payments_export.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    toast.success('Payments exported successfully');
                  } catch (exportError) {
                    toast.error('Failed to export payments');
                  }
                }
              } catch (err) {
                // Track wrong attempts locally (allow up to 3 attempts before logout)
                const key = 'adminPaymentExportPwAttempts';
                const prev = parseInt(localStorage.getItem(key) || '0');
                const next = prev + 1;
                localStorage.setItem(key, String(next));

                if (next >= 3) {
                  // Sign out and redirect on third wrong attempt
                  localStorage.removeItem(key);
                  setShowExportPasswordModal(false);
                  setExportPassword("");
                  setExportPasswordError("");
                  toast.error("Too many incorrect attempts. You've been signed out for security.");
                  dispatch(signoutUserStart());
                  try {
                    const signoutRes = await fetch(`${API_BASE_URL}/api/auth/signout`, { credentials: 'include' });
                    const signoutData = await signoutRes.json();
                    if (signoutData.success === false) {
                      dispatch(signoutUserFailure(signoutData.message));
                    } else {
                      dispatch(signoutUserSuccess(signoutData));
                    }
                  } catch (signoutErr) {
                    dispatch(signoutUserFailure(signoutErr.message));
                  }
                  setTimeout(() => {
                    navigate('/sign-in');
                  }, 800);
                  setExportPasswordLoading(false);
                  return;
                } else {
                  // Keep modal open and show remaining attempts
                  const remaining = 3 - next;
                  setExportPasswordError(`Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} left before logout.`);
                }
              } finally {
                setExportPasswordLoading(false);
              }
            }}
          >
            <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2"><FaLock /> Confirm Password</h3>
            <input
              type="password"
              className="border rounded p-2 w-full"
              placeholder="Enter your password"
              value={exportPassword}
              onChange={e => setExportPassword(e.target.value)}
              autoFocus
              required
            />
            {exportPasswordError && <div className="text-red-600 text-sm">{exportPasswordError}</div>}
            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold" 
                onClick={() => {
                  setShowExportPasswordModal(false);
                  setExportPassword("");
                  setExportPasswordError("");
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-blue-700 text-white font-semibold" 
                disabled={exportPasswordLoading}
              >
                {exportPasswordLoading ? 'Verifying...' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PaymentDashboard;

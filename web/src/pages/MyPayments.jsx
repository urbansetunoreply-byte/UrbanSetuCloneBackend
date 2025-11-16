import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaDollarSign, FaCreditCard, FaDownload, FaClock, FaCheckCircle, FaTimes, FaExclamationTriangle, FaSpinner, FaMoneyBill, FaLock, FaShare, FaCopy, FaEye, FaExternalLinkAlt, FaCalendar, FaSync } from 'react-icons/fa';
import { signoutUserStart, signoutUserSuccess, signoutUserFailure } from '../redux/user/userSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import PaymentModal from '../components/PaymentModal';

import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MyPayments = () => {
  // Set page title
  usePageTitle("My Payments - Payment History");
  
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', gateway: '', currency: '', q: '', fromDate: '', toDate: '' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState(null);
  const [loadingPaymentId, setLoadingPaymentId] = useState(null); // Track which payment is loading
  
  // Export password modal states
  const [showExportPasswordModal, setShowExportPasswordModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportPasswordError, setExportPasswordError] = useState('');
  const [exportPasswordLoading, setExportPasswordLoading] = useState(false);

  useEffect(() => { fetchPayments(); }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.gateway) params.set('gateway', filters.gateway);
      if (filters.currency) params.set('currency', filters.currency);
      if (filters.q) params.set('q', filters.q);
      if (filters.fromDate) params.set('fromDate', filters.fromDate);
      if (filters.toDate) params.set('toDate', filters.toDate);
      // Show all payments (high cap)
      params.set('limit', '1000');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/history?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setAllPayments(data.payments || []);
        setCurrentPage(1); // Reset to first page when filters change
      }
    } catch {}
    finally { setLoading(false); }
  };

  // Pagination effect with duplicate payment filtering
  useEffect(() => {
    // First pass: Group payments by appointment ID
    const paymentsByAppointment = {};
    allPayments.forEach(payment => {
      const appointmentId = payment.appointmentId?._id || payment.appointmentId;
      if (!appointmentId) {
        // If no appointment ID, add to a special group
        if (!paymentsByAppointment['no-appointment']) {
          paymentsByAppointment['no-appointment'] = [];
        }
        paymentsByAppointment['no-appointment'].push(payment);
        return;
      }
      
      if (!paymentsByAppointment[appointmentId]) {
        paymentsByAppointment[appointmentId] = [];
      }
      paymentsByAppointment[appointmentId].push(payment);
    });
    
    // Second pass: Filter payments per appointment
    const filteredPayments = [];
    
    Object.keys(paymentsByAppointment).forEach(key => {
      const appointmentPayments = paymentsByAppointment[key];
      
      // For payments without appointment ID, include all
      if (key === 'no-appointment') {
        filteredPayments.push(...appointmentPayments);
        return;
      }
      
      // Check if there's a completed payment for this appointment
      const hasCompleted = appointmentPayments.some(p => p.status === 'completed');
      
      if (hasCompleted) {
        // If there's a completed payment, only include completed, failed, refunded payments
        // Remove all pending/processing/cancelled payments
        appointmentPayments.forEach(payment => {
          if (payment.status === 'completed' || payment.status === 'failed' || 
              payment.status === 'refunded' || payment.status === 'partially_refunded') {
            filteredPayments.push(payment);
          }
          // Skip pending/processing/cancelled payments when there's a completed payment
        });
      } else {
        // No completed payment - include failed, refunded, and only the most recent pending/processing
        // Exclude cancelled payments from display
        const completedOrFailed = appointmentPayments.filter(p => 
          p.status === 'failed' || p.status === 'refunded' || p.status === 'partially_refunded'
        );
        filteredPayments.push(...completedOrFailed);
        
        // For pending/processing, keep only the most recent one (exclude cancelled)
        const pendingPayments = appointmentPayments.filter(p => 
          (p.status === 'pending' || p.status === 'processing') && p.status !== 'cancelled'
        );
        if (pendingPayments.length > 0) {
          // Sort by createdAt descending and take the first (most recent)
          const mostRecentPending = pendingPayments.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          )[0];
          filteredPayments.push(mostRecentPending);
        }
      }
    });
    
    // Sort all payments by createdAt descending (most recent first)
    filteredPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    setTotalPages(totalPages);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPagePayments = filteredPayments.slice(startIndex, endIndex);
    setPayments(currentPagePayments);
  }, [allPayments, currentPage]);

  const payNow = async (payment) => {
    if (!payment || !payment.appointmentId) return;
    
    try {
      // Track which payment is loading
      setLoadingPaymentId(payment._id);
      
      // Extract appointment ID (could be object or string)
      const appointmentId = payment.appointmentId?._id || payment.appointmentId;
      if (!appointmentId) {
        toast.error('Appointment ID not found');
        setLoadingPaymentId(null);
        return;
      }
      
      // Check if payment is already completed before proceeding
      try {
        const paymentCheckRes = await fetch(`${API_BASE_URL}/api/payments/history?appointmentId=${appointmentId}`, {
          credentials: 'include'
        });
        const paymentCheckData = await paymentCheckRes.json();
        
        if (paymentCheckRes.ok && paymentCheckData.payments && paymentCheckData.payments.length > 0) {
          const latestPayment = paymentCheckData.payments[0];
          
          // Check if payment is already completed
          if (latestPayment.status === 'completed' || latestPayment.metadata?.adminMarked) {
            toast.success('Payment already completed!');
            // Refresh payments to show updated status
            await fetchPayments();
            // Dispatch event to update MyAppointments page if it's open
            window.dispatchEvent(new CustomEvent('paymentStatusUpdated', {
              detail: { 
                appointmentId: appointmentId,
                paymentConfirmed: true
              }
            }));
            setLoadingPaymentId(null);
            return;
          }
          
          // Check for active (pending/processing) payments that are NOT cancelled
          const activePayment = paymentCheckData.payments.find(p => 
            (p.status === 'pending' || p.status === 'processing') && 
            p.status !== 'cancelled'
          );
          
          if (activePayment) {
            // Check if the active payment has expired
            const now = new Date();
            const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
            let isExpired = false;
            
            if (activePayment.expiresAt) {
              const expiresAt = new Date(activePayment.expiresAt);
              isExpired = expiresAt <= now;
            } else if (activePayment.createdAt) {
              const createdAt = new Date(activePayment.createdAt);
              isExpired = createdAt <= tenMinutesAgo;
            }
            
            if (isExpired) {
              // Payment expired, allow opening modal (will create new payment)
              toast.info('Previous payment session expired. Opening a new payment session.');
            } else {
              // Payment not expired, allow opening modal (will reuse existing payment)
              toast.info('Resuming existing payment session.');
            }
            // Continue to open modal - backend will handle reusing or creating new payment
          }
          
          // If latest payment is cancelled, failed, or expired, show appropriate message and allow retry
          if (latestPayment.status === 'cancelled' && !activePayment) {
            toast.info('Previous payment was cancelled. You can initiate a new payment.');
          } else if (latestPayment.status === 'failed' && !activePayment) {
            toast.info('Previous payment failed. You can retry the payment.');
          }
        }
      } catch (paymentCheckError) {
        console.error('Error checking payment status:', paymentCheckError);
        // Continue with payment flow if check fails
      }
      
      // If payment status is completed, don't proceed
      if (payment.status === 'completed') {
        toast.success('Payment already completed!');
        await fetchPayments();
        setLoadingPaymentId(null);
        return;
      }
      
      // Fetch appointment details - API returns the booking object directly (not wrapped)
      const res = await fetch(`${API_BASE_URL}/api/bookings/${appointmentId}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to load appointment' }));
        toast.error(errorData.message || 'Failed to load appointment details');
        setLoadingPaymentId(null);
        return;
      }
      
      // API returns booking object directly, not wrapped in { success, appointment }
      const appointment = await res.json();
      
      if (!appointment || !appointment._id) {
        toast.error('Appointment not found');
        setLoadingPaymentId(null);
        return;
      }
      
      // Prepare appointment object for PaymentModal (same format as MyAppointments)
      // PaymentModal expects appointment with region field
      const appointmentForModal = {
        ...appointment,
        region: appointment.region || 'india' // Default to 'india' if not specified
      };
      
      setPaymentAppointment(appointmentForModal);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Failed to load appointment details');
    } finally {
      setLoadingPaymentId(null);
    }
  };

  const goToAppointment = (payment) => {
    if (!payment || !payment.appointmentId) return;
    
    // Extract appointment ID (could be object or string)
    const appointmentId = payment.appointmentId?._id || payment.appointmentId;
    if (!appointmentId) return;
    
    // Navigate to MyAppointments and dispatch custom event to highlight the appointment
    navigate('/user/my-appointments', {
      state: { highlightAppointmentId: appointmentId }
    });
    
    // Also dispatch a custom event for immediate highlighting if already on the page
    window.dispatchEvent(new CustomEvent('highlightAppointment', {
      detail: { appointmentId: appointmentId }
    }));
  };

  const downloadReceipt = async (url) => {
    if (!url) return;
    try {
      const res = await fetch(url, { credentials: 'include' });
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

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setShowPreviewModal(true);
  };

  const sharePayment = async (payment) => {
    const shareText = `Payment Details:\nProperty: ${payment.appointmentId?.propertyName || 'N/A'}\nAmount: ${payment.currency === 'INR' ? '₹' : '$'}${Number(payment.amount).toFixed(2)}\nStatus: ${payment.status}\nPayment ID: ${payment.paymentId}`;
    const shareUrl = window.location.origin + `/user/my-payments?paymentId=${payment.paymentId}`;
    
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

  const statusBadge = (status) => {
    const cls = status === 'completed' ? 'bg-green-100 text-green-700' : status === 'failed' ? 'bg-red-100 text-red-700' : status === 'refunded' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700';
    return <span className={`px-2 py-1 text-[10px] rounded-full font-semibold ${cls}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-6 sm:py-10 px-2 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaMoneyBill className="text-green-600" />
                My Payments
              </h1>
              <p className="text-gray-600 mt-2">View and manage your payments and receipts</p>
            </div>
            <button
              onClick={fetchPayments}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              title="Refresh stats"
            >
              <FaSpinner className="animate-spin" />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input value={filters.q} onChange={(e)=>{setFilters(prev=>({...prev,q:e.target.value})); setCurrentPage(1);}} placeholder="Search payment ID or receipt" className="px-3 py-2 border rounded-lg text-sm" />
            <label className="text-sm text-gray-600">From:</label>
            <input type="date" value={filters.fromDate} max={new Date().toISOString().split('T')[0]} onChange={(e)=>{setFilters(prev=>({...prev,fromDate:e.target.value})); setCurrentPage(1);}} className="px-3 py-2 border rounded-lg text-sm" />
            <label className="text-sm text-gray-600">To:</label>
            <input type="date" value={filters.toDate} max={new Date().toISOString().split('T')[0]} onChange={(e)=>{setFilters(prev=>({...prev,toDate:e.target.value})); setCurrentPage(1);}} className="px-3 py-2 border rounded-lg text-sm" />
            <select value={filters.status} onChange={(e)=>{setFilters(prev=>({...prev,status:e.target.value})); setCurrentPage(1);}} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
            </select>
            <select value={filters.gateway} onChange={(e)=>{setFilters(prev=>({...prev,gateway:e.target.value})); setCurrentPage(1);}} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Gateways</option>
              <option value="paypal">PayPal</option>
              <option value="razorpay">Razorpay</option>
            </select>
            <select value={filters.currency} onChange={(e)=>{setFilters(prev=>({...prev,currency:e.target.value})); setCurrentPage(1);}} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Currencies</option>
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
            </select>
            <button
              onClick={() => {
                setShowExportPasswordModal(true);
                setExportPassword('');
                setExportPasswordError('');
              }}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-2"
            >
              <FaDownload /> Export CSV
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="animate-spin text-2xl text-blue-600" />
              <span className="ml-2 text-gray-600">Loading payments...</span>
            </div>
          ) : (payments?.length || 0) === 0 ? (
            <div className="text-center py-8">
              <FaMoneyBill className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Payments Found</h3>
              <p className="text-gray-500">You don't have any payments yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(payments) && payments.map((p) => (
                <div key={p._id} className={`rounded-lg p-4 border cursor-pointer ${
                  p.status === 'completed' ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 
                  p.status === 'failed' ? 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50' : 
                  p.status === 'refunded' || p.status === 'partially_refunded' ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50' :
                  'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50'
                } hover:shadow-lg transition-all`} onClick={() => handlePaymentClick(p)}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{p.appointmentId?.propertyName || 'Property Payment'}</div>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{p.gateway?.toUpperCase()}</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{p.currency || 'USD'}</span>
                        <span>{p.currency === 'INR' ? '₹' : '$'}{Number(p.amount).toFixed(2)}</span>
                        {p.refundAmount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            Refunded: {p.currency === 'INR' ? '₹' : '$'}{Number(p.refundAmount).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {(p.appointmentId?._id || p.appointmentId) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToAppointment(p);
                          }}
                          className="mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-xs flex items-center gap-1 w-fit"
                          title="Go to appointment"
                        >
                          <FaCalendar className="text-xs" /> Go to Appointment
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
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
                      <div>{statusBadge(p.status)}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">Payment ID: <span className="font-mono">{p.paymentId}</span></div>
                  <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {p.receiptUrl && (
                      <button onClick={()=>downloadReceipt(p.receiptUrl)} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-xs flex items-center gap-1">
                        <FaDownload className="text-xs" /> Receipt
                      </button>
                    )}
                    <button onClick={() => sharePayment(p)} className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 text-xs flex items-center gap-1">
                      <FaShare className="text-xs" /> Share
                    </button>
                    {p.status !== 'completed' && p.status !== 'refunded' && p.status !== 'partially_refunded' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          payNow(p);
                        }} 
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs flex items-center gap-1"
                        disabled={loadingPaymentId === p._id}
                      >
                        {loadingPaymentId === p._id ? (
                          <>
                            <FaSpinner className="text-xs animate-spin" /> Loading...
                          </>
                        ) : (
                          <>
                            <FaCreditCard className="text-xs" /> Pay Now
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {allPayments.length > 10 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-2">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setCurrentPage(Math.max(1, currentPage - 1));
                    toast.info(`Navigated to page ${Math.max(1, currentPage - 1)}`);
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                    toast.info(`Navigated to page ${Math.min(totalPages, currentPage + 1)}`);
                  }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Preview Modal */}
      {showPreviewModal && selectedPayment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10 p-6 pb-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
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
            
            <div className="p-6 space-y-6">
              {/* Payment Overview */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-800 break-words">{selectedPayment.appointmentId?.propertyName || 'Property Payment'}</h4>
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
                      window.location.origin + `/user/my-payments?paymentId=${selectedPayment.paymentId}`,
                      `Payment Details:\nProperty: ${selectedPayment.appointmentId?.propertyName || 'N/A'}\nAmount: ${selectedPayment.currency === 'INR' ? '₹' : '$'}${Number(selectedPayment.amount).toFixed(2)}\nStatus: ${selectedPayment.status}\nPayment ID: ${selectedPayment.paymentId}`
                    );
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <FaCopy /> Copy Details
                </button>
                {selectedPayment.status !== 'completed' && selectedPayment.status !== 'refunded' && selectedPayment.status !== 'partially_refunded' && (
                  <button
                    onClick={() => {
                      payNow(selectedPayment);
                      setShowPreviewModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    disabled={loadingPaymentId === selectedPayment._id}
                  >
                    {loadingPaymentId === selectedPayment._id ? (
                      <>
                        <FaSpinner className="animate-spin" /> Loading...
                      </>
                    ) : (
                      <>
                        <FaCreditCard /> Pay Now
                      </>
                    )}
                  </button>
                )}
                {(selectedPayment.appointmentId?._id || selectedPayment.appointmentId) && (
                  <button
                    onClick={() => {
                      goToAppointment(selectedPayment);
                      setShowPreviewModal(false);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <FaCalendar /> Go to Appointment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && paymentAppointment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentAppointment(null);
          }}
          appointment={paymentAppointment}
          onPaymentSuccess={(payment) => {
            setShowPaymentModal(false);
            setPaymentAppointment(null);
            setLoadingPaymentId(null);
            // Refresh payments to show updated status
            fetchPayments();
            toast.success('Payment completed successfully!');
            // Dispatch event to update MyAppointments page if it's open
            const appointmentId = paymentAppointment?._id || payment?.appointmentId?._id || payment?.appointmentId;
            if (appointmentId) {
              window.dispatchEvent(new CustomEvent('paymentStatusUpdated', {
                detail: { 
                  appointmentId: appointmentId,
                  paymentConfirmed: true
                }
              }));
            }
          }}
        />
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
                  localStorage.removeItem('userPaymentExportPwAttempts');
                  setShowExportPasswordModal(false);
                  setExportPassword("");
                  setExportPasswordError("");
                  
                  // Download export file
                  try {
                    const params = new URLSearchParams();
                    if (filters.status) params.set('status', filters.status);
                    if (filters.gateway) params.set('gateway', filters.gateway);
                    if (filters.q) params.set('q', filters.q);
                    if (filters.fromDate) params.set('fromDate', filters.fromDate);
                    if (filters.toDate) params.set('toDate', filters.toDate);
                    const qs = params.toString();
                    const url = `${API_BASE_URL}/api/payments/export-csv${qs ? `?${qs}` : ''}`;
                    const res = await fetch(url, { credentials: 'include' });
                    if (!res.ok) {
                      toast.error('Failed to export payments');
                      return;
                    }
                    const blob = await res.blob();
                    const objUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = objUrl;
                    a.download = 'my_payments.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(objUrl);
                    toast.success('Payments exported successfully');
                  } catch (exportError) {
                    toast.error('Failed to export payments');
                  }
                }
              } catch (err) {
                // Track wrong attempts locally (allow up to 3 attempts before logout)
                const key = 'userPaymentExportPwAttempts';
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

export default MyPayments;


import React, { useState, useMemo } from "react";
import { FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaMoneyBillWave } from "react-icons/fa";
import { toast } from 'react-toastify';
import PaymentModal from '../PaymentModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PaymentSchedule({ wallet, contract }) {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const payments = useMemo(() => {
    if (!wallet?.paymentSchedule) return [];
    return wallet.paymentSchedule.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [wallet]);

  const getPaymentStatusIcon = (payment) => {
    switch (payment.status) {
      case 'completed':
        return <FaCheckCircle className="text-green-600" />;
      case 'overdue':
        return <FaExclamationTriangle className="text-red-600" />;
      case 'processing':
        return <FaClock className="text-blue-600 animate-pulse" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getPaymentStatusColor = (payment) => {
    switch (payment.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handlePayNow = async (payment) => {
    if (!contract || !payment) {
      toast.error("Payment information not available.");
      return;
    }

    // Create a temporary booking object for PaymentModal
    const bookingForPayment = {
      _id: contract.bookingId,
      listingId: contract.listingId,
      buyerId: contract.tenantId,
      sellerId: contract.landlordId
    };

    setSelectedPayment({ ...payment, booking: bookingForPayment });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    toast.success("Payment successful!");
    setShowPaymentModal(false);
    setSelectedPayment(null);
    // Reload page to refresh wallet data
    window.location.reload();
  };

  // Group payments by year
  const paymentsByYear = useMemo(() => {
    const grouped = {};
    payments.forEach(payment => {
      const year = new Date(payment.dueDate).getFullYear();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(payment);
    });
    return grouped;
  }, [payments]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = payments.length;
    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const overdue = payments.filter(p => p.status === 'overdue').length;
    const processing = payments.filter(p => p.status === 'processing').length;

    return { total, completed, pending, overdue, processing };
  }, [payments]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        <FaCalendarAlt className="inline mr-2" />
        Payment Schedule
      </h2>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-600 mt-1">Total</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-600 mt-1">Paid</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-gray-600 mt-1">Pending</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          <p className="text-xs text-gray-600 mt-1">Overdue</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
          <p className="text-xs text-gray-600 mt-1">Processing</p>
        </div>
      </div>

      {/* Payment List by Year */}
      <div className="space-y-6">
        {Object.keys(paymentsByYear)
          .sort((a, b) => b - a) // Sort years descending
          .map(year => (
            <div key={year}>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">{year}</h3>
              <div className="space-y-2">
                {paymentsByYear[year].map((payment, index) => {
                  const dueDate = new Date(payment.dueDate);
                  const isOverdue = payment.status === 'pending' && dueDate < new Date();
                  const isUpcoming = payment.status === 'pending' && dueDate >= new Date();

                  return (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-4 transition ${getPaymentStatusColor(payment)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-2xl">
                            {getPaymentStatusIcon(payment)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-800">
                                {dueDate.toLocaleDateString('en-GB', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              {isOverdue && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                  Overdue
                                </span>
                              )}
                              {isUpcoming && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                                  Upcoming
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Status: <span className="font-semibold capitalize">{payment.status}</span>
                            </p>
                            {payment.paidAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Paid: {new Date(payment.paidAt).toLocaleDateString('en-GB')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right mr-4">
                          <p className="text-xl font-bold text-gray-800 mb-1">
                            ₹{payment.amount.toLocaleString('en-IN')}
                          </p>
                          {payment.penaltyAmount > 0 && (
                            <p className="text-sm text-red-600">
                              + Penalty: ₹{payment.penaltyAmount.toLocaleString('en-IN')}
                            </p>
                          )}
                          {payment.status === 'pending' && (
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {contract.dueDate} of month
                            </p>
                          )}
                        </div>
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => handlePayNow(payment)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                          >
                            <FaMoneyBillWave className="inline mr-1" />
                            Pay Now
                          </button>
                        )}
                        {payment.status === 'completed' && payment.paymentId && (
                          <button
                            onClick={() => {
                              // Navigate to payment receipt or download
                              toast.info("Download receipt feature coming soon!");
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
                          >
                            Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {payments.length === 0 && (
        <div className="text-center py-12">
          <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No payment schedule available.</p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
          appointment={selectedPayment.booking}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}


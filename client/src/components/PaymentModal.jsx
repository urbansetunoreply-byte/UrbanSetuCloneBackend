import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaRupeeSign, FaShieldAlt, FaDownload, FaCheckCircle, FaTimes, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PaymentModal = ({ isOpen, onClose, appointment, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');

  useEffect(() => {
    if (isOpen && appointment) {
      createPaymentIntent();
    }
    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen, appointment]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          appointmentId: appointment._id,
          paymentType: 'advance'
        })
      });

      const data = await response.json();
      if (response.ok) {
        setPaymentData(data);
      } else {
        toast.error(data.message || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('An error occurred while creating payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentData) return;

    try {
      setLoading(true);
      // Use Razorpay Checkout if available, else show error
      if (window && window.Razorpay) {
        const options = {
          key: paymentData.key,
          amount: paymentData.razorpayOrder.amount,
          currency: paymentData.razorpayOrder.currency,
          name: "Property Booking",
          description: `Advance payment for ${appointment.propertyName}`,
          order_id: paymentData.razorpayOrder.id,
          handler: async function (response) {
            await verifyPayment(response);
          },
          prefill: {
            name: appointment.buyerId?.username || '',
            email: appointment.buyerId?.email || '',
          },
          theme: { color: "#3B82F6" }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function () {
          toast.error('Payment failed or cancelled.');
          setLoading(false);
        });
        rzp.open();
      } else {
        toast.error('Payment gateway unavailable. Please try again later.');
        setLoading(false);
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const verifyPayment = async (response) => {
    try {
      const verifyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentId: paymentData.payment.paymentId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature
        })
      });

      const verifyData = await verifyResponse.json();
      if (verifyResponse.ok) {
        setPaymentSuccess(true);
        setReceiptUrl(verifyData.receiptUrl);
        toast.success('Payment successful!');
        onPaymentSuccess(verifyData.payment);
      } else {
        toast.error(verifyData.message || 'Payment verification failed');
        if (verifyData.message && verifyData.message.toLowerCase().includes('signature')) {
          toast.info('Dev mode: signature bypass is enabled. Please try again.');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ overscrollBehavior: 'contain' }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {!paymentSuccess ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaCreditCard className="text-blue-600" />
                  Payment Required
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Complete your advance payment to confirm the booking
              </p>
            </div>

            {/* Payment Details */}
            <div className="p-6">
              {loading && !paymentData ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-2xl text-blue-600" />
                  <span className="ml-2 text-gray-600">Preparing payment...</span>
                </div>
              ) : paymentData ? (
                <>
                  {/* Property Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">{appointment.propertyName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{appointment.propertyDescription}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Appointment Date:</span>
                      <span className="text-sm font-medium">{new Date(appointment.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Time:</span>
                      <span className="text-sm font-medium">{appointment.time}</span>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-800 mb-3">Payment Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Advance Payment (Flat)</span>
                        <span className="font-medium">₹{paymentData.payment.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Note</span>
                        <span>₹100 advance to confirm booking</span>
                      </div>
                    </div>
                    <div className="border-t border-blue-200 mt-3 pt-3">
                      <div className="flex justify-between font-semibold text-blue-800">
                        <span>Total Amount</span>
                        <span>₹{paymentData.payment.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <FaShieldAlt className="text-green-600 mt-1" />
                      <div>
                        <h5 className="font-semibold text-green-800 mb-1">Secure Payment</h5>
                        <p className="text-sm text-green-700">
                          Your payment is processed securely through Razorpay. 
                          You can request a full refund if the appointment is cancelled.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <FaRupeeSign />
                        Pay ₹{paymentData.payment.amount.toLocaleString()}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Failed to initialize payment. Please try again.</p>
                  <button
                    onClick={createPaymentIntent}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Success Screen */}
            <div className="p-6 text-center">
              <div className="mb-6">
                <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
                <p className="text-gray-600">
                  Your advance payment has been processed successfully.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium">₹{paymentData.payment.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-mono text-xs">{paymentData.payment.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receipt No:</span>
                    <span className="font-mono text-xs">{paymentData.payment.receiptNumber}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={downloadReceipt}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FaDownload />
                  Download Receipt
                </button>
                
                <button
                  onClick={() => {
                    onClose();
                    // Navigate to MyAppointments
                    window.location.href = '/user/my-appointments';
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  View My Appointments
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;

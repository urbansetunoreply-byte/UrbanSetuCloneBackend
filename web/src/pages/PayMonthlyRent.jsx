import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from 'react-toastify';
import { FaMoneyBillWave, FaCheckCircle, FaChevronRight, FaChevronLeft, FaCalendarAlt, FaFileContract, FaCreditCard, FaHome, FaLock, FaSpinner, FaTimesCircle } from "react-icons/fa";
import { usePageTitle } from '../hooks/usePageTitle';
import PaymentModal from '../components/PaymentModal';
import ContractPreview from '../components/rental/ContractPreview';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PayMonthlyRent() {
  usePageTitle("Pay Monthly Rent - UrbanSetu");

  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const contractId = searchParams.get('contractId');
  const scheduleIndex = searchParams.get('scheduleIndex');

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Select Month, 2: Review Details, 3: Contract Review, 4: Payment, 5: Confirmation
  const [contract, setContract] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [booking, setBooking] = useState(null);
  const [createdPayment, setCreatedPayment] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('razorpay');

  useEffect(() => {
    if (!contractId) {
      toast.error("Contract ID is required.");
      navigate("/user/rental-contracts");
      return;
    }

    if (!currentUser) {
      toast.error("Please sign in to pay rent.");
      navigate("/sign-in");
      return;
    }

    fetchContractAndWallet();
  }, [contractId, currentUser]);

  const fetchContractAndWallet = async () => {
    try {
      setLoading(true);

      // Fetch contract
      const contractRes = await fetch(`${API_BASE_URL}/api/rental/contracts/${contractId}`, {
        credentials: 'include'
      });

      if (!contractRes.ok) {
        throw new Error("Failed to fetch contract");
      }

      const contractData = await contractRes.json();
      const contractObj = contractData.contract || contractData;

      // Verify user is tenant
      const isTenant = contractObj.tenantId?._id === currentUser._id || contractObj.tenantId === currentUser._id;
      if (!isTenant) {
        toast.error("Only tenants can pay rent.");
        navigate("/user/rental-contracts");
        return;
      }

      if (contractObj.status !== 'active') {
        toast.error("Contract must be active to pay rent.");
        navigate("/user/rental-contracts");
        return;
      }

      setContract(contractObj);

      // Fetch wallet - try to fetch regardless of walletId field
      // The API endpoint uses contractId to find the wallet
      const walletRes = await fetch(`${API_BASE_URL}/api/rental/wallet/${contractId}`, {
        credentials: 'include'
      });

      if (!walletRes.ok) {
        toast.error("Wallet not found for this contract.");
        navigate("/user/rental-contracts");
        return;
      }

      const walletData = await walletRes.json();
      if (!walletData.success || !walletData.wallet) {
        toast.error("Wallet not found for this contract.");
        navigate("/user/rental-contracts");
        return;
      }

      const walletObj = walletData.wallet;
      setWallet(walletObj);

      // Find pending payments
      const pendingPayments = walletObj.paymentSchedule?.filter(p => p.status === 'pending' || p.status === 'overdue' || p.status === 'processing') || [];

      if (pendingPayments.length === 0) {
        toast.info("All rent payments are up to date.");
        navigate("/user/rental-contracts");
        return;
      }

      // If scheduleIndex provided, use that payment
      if (scheduleIndex !== null) {
        const idx = parseInt(scheduleIndex);
        const payment = walletObj.paymentSchedule?.[idx];
        if (payment && (payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'processing')) {
          setSelectedPayment({ ...payment, scheduleIndex: idx });
        } else {
          setSelectedPayment({ ...pendingPayments[0], scheduleIndex: walletObj.paymentSchedule.indexOf(pendingPayments[0]) });
        }
      } else {
        // Use first pending payment (usually next due)
        setSelectedPayment({ ...pendingPayments[0], scheduleIndex: walletObj.paymentSchedule.indexOf(pendingPayments[0]) });
      }

      // Fetch booking for payment modal
      if (contractObj.bookingId) {
        const bookingRes = await fetch(`${API_BASE_URL}/api/bookings/${contractObj.bookingId._id || contractObj.bookingId}`, {
          credentials: 'include'
        });
        if (bookingRes.ok) {
          const bookingData = await bookingRes.json();
          setBooking(bookingData.booking || bookingData);
        }
      }
    } catch (error) {
      console.error("Error fetching contract and wallet:", error);
      toast.error("Failed to load contract details.");
      navigate("/user/rental-contracts");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
    setStep(5);
    setShowPaymentModal(false);

    // Refresh contract and wallet
    setTimeout(() => {
      fetchContractAndWallet();
    }, 2000);

    // Dispatch event for other pages to refresh
    window.dispatchEvent(new CustomEvent('rentalPaymentStatusUpdated', {
      detail: { contractId: contract._id, paymentConfirmed: true }
    }));
  };

  const getTotalAmount = () => {
    if (!selectedPayment || !contract) return 0;
    const baseAmount = selectedPayment.amount || contract.lockedRentAmount || 0;
    const penalty = selectedPayment.penaltyAmount || 0;
    const maintenance = contract.maintenanceCharges || 0;
    // Note: Security deposit is paid upfront during contract creation, not in monthly rent payments
    return baseAmount + penalty + maintenance;
  };

  const handleCreatePayment = async () => {
    if (!selectedPayment || !contract || !wallet) {
      toast.error("Payment information not available.");
      return;
    }

    // Check if payment is already completed locally
    if (selectedPayment.status === 'completed' || selectedPayment.status === 'paid') {
      toast.success("Rent for this month is already paid.");
      setCreatedPayment({
        amount: selectedPayment.amount,
        rentMonth: selectedPayment.month,
        rentYear: selectedPayment.year,
        status: 'completed',
        paymentId: selectedPayment.paymentId
      });
      setStep(5);
      return;
    }

    try {
      setLoading(true);

      // Create monthly rent payment via API
      const res = await fetch(`${API_BASE_URL}/api/payments/monthly-rent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contractId: contract._id,
          walletId: wallet._id,
          scheduleIndex: selectedPayment.scheduleIndex,
          amount: selectedPayment.amount || contract.lockedRentAmount,
          month: selectedPayment.month,
          year: selectedPayment.year,
          isAutoDebit: false,
          gateway: selectedGateway
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create payment");
      }

      // Payment created, now open PaymentModal
      if (booking) {
        const bookingForPayment = {
          ...booking,
          contractId: contract._id,
          isRentalPayment: true,
          paymentId: data.payment.paymentId,
          paymentType: 'monthly_rent'
        };

        // If payment is already completed (idempotency), show success immediately
        if (data.payment.status === 'completed' || data.payment.status === 'paid') {
          setCreatedPayment(data.payment);
          setStep(5);
          return;
        }

        setCreatedPayment(data.payment);
        setShowPaymentModal(true);
      } else {
        toast.error("Booking information not available for payment.");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error(error.message || "Failed to create payment");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!contract || !wallet || !selectedPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Contract or payment information not found.</p>
          <button
            onClick={() => navigate("/user/rental-contracts")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Contracts
          </button>
        </div>
      </div>
    );
  }

  const dueDate = new Date(selectedPayment.dueDate);
  const isOverdue = selectedPayment.status === 'overdue' || (selectedPayment.status === 'pending' && dueDate < new Date());

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
            <FaMoneyBillWave className="text-blue-600" />
            Pay Monthly Rent
          </h1>
          <p className="text-gray-600">
            Contract ID: <span className="font-semibold">{contract.contractId}</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center cursor-pointer min-w-[50px]" onClick={() => {
                  if (step > s || paymentCompleted) {
                    setStep(s);
                  }
                }}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                    {step > s || paymentCompleted ? <FaCheckCircle /> : s}
                  </div>
                  <span className="text-[10px] md:text-xs mt-1 md:mt-2 text-gray-600 text-center whitespace-nowrap">
                    {s === 1 ? 'Select' : s === 2 ? 'Review' : s === 3 ? 'Contract' : s === 4 ? 'Pay' : 'Confirm'}
                  </span>
                </div>
                {s < 5 && (
                  <div className={`flex-1 h-0.5 md:h-1 mx-1 md:mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Select Payment Month */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <FaCalendarAlt /> Select Payment Month
            </h2>

            <div className="space-y-4">
              {wallet.paymentSchedule
                .filter(p => p.status === 'pending' || p.status === 'overdue' || p.status === 'processing')
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .map((payment, idx) => {
                  const originalIdx = wallet.paymentSchedule.indexOf(payment);
                  const payDueDate = new Date(payment.dueDate);
                  const isPayOverdue = payment.status === 'overdue' || (payment.status === 'pending' && payDueDate < new Date());

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedPayment({ ...payment, scheduleIndex: originalIdx });
                        setStep(2);
                      }}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition ${selectedPayment?.scheduleIndex === originalIdx
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                        } ${isPayOverdue ? 'bg-red-50 border-red-300' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">
                            {payDueDate.toLocaleDateString('en-GB', {
                              month: 'long',
                              year: 'numeric'
                            })} Rent
                          </h3>
                          <p className="text-sm text-gray-600">
                            Due: {payDueDate.toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          {isPayOverdue && (
                            <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                              Overdue
                            </span>
                          )}
                          {payment.status === 'processing' && (
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded ml-2">
                              Payment in Progress
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-800">
                            ₹{(payment.amount || contract.lockedRentAmount || 0).toLocaleString('en-IN')}
                          </p>
                          {payment.penaltyAmount > 0 && (
                            <p className="text-sm text-red-600">
                              + Penalty: ₹{payment.penaltyAmount.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {selectedPayment && (
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => navigate("/user/rental-contracts")}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue <FaChevronRight className="inline ml-2" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review Payment Details */}
        {step === 2 && selectedPayment && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <FaFileContract /> Review Payment Details
            </h2>

            <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
              <h3 className="font-semibold text-lg mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Month:</span>
                  <span className="font-semibold">
                    {dueDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <span className={`font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                    {dueDate.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                    {isOverdue && ' (Overdue)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Rent:</span>
                  <span className="font-semibold">₹{(selectedPayment.amount || contract.lockedRentAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedPayment.penaltyAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Late Fee:</span>
                    <span className="font-semibold">₹{selectedPayment.penaltyAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {contract.maintenanceCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Maintenance:</span>
                    <span className="font-semibold">₹{contract.maintenanceCharges.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 mt-2 font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">₹{getTotalAmount().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <FaChevronLeft /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Review Contract <FaChevronRight className="inline ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contract Review */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <FaFileContract /> Contract Review
            </h2>

            <div className="mb-6">
              <ContractPreview
                contract={contract}
                listing={contract.listingId}
                tenant={contract.tenantId}
                landlord={contract.landlordId}
                onDownload={() => { }}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <FaChevronLeft /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Proceed to Payment <FaChevronRight className="inline ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <FaCreditCard /> Complete Payment
            </h2>

            <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
              <h3 className="font-semibold text-lg mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monthly Rent:</span>
                  <span className="font-semibold">₹{(selectedPayment?.amount || contract?.lockedRentAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedPayment?.penaltyAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Late Fee:</span>
                    <span className="font-semibold">₹{selectedPayment.penaltyAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {contract?.maintenanceCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Maintenance:</span>
                    <span className="font-semibold">₹{contract.maintenanceCharges.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {contract?.securityDeposit > 0 && contract?.depositPlan !== 'zero' && (
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-gray-600 italic">Note: Security deposit (₹{contract.securityDeposit.toLocaleString('en-IN')}) was paid upfront</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 mt-2 font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">₹{getTotalAmount().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">Select Payment Method</h4>
              <div className="flex flex-col gap-3">
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedGateway === 'razorpay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="gateway"
                    value="razorpay"
                    checked={selectedGateway === 'razorpay'}
                    onChange={() => setSelectedGateway('razorpay')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">Razorpay (India)</span>
                      <span className="font-bold text-gray-800">₹{getTotalAmount().toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-xs text-gray-500">Pay via UPI, Cards, Netbanking (INR)</div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedGateway === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="gateway"
                    value="paypal"
                    checked={selectedGateway === 'paypal'}
                    onChange={() => setSelectedGateway('paypal')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">PayPal (International)</span>
                      <span className="font-bold text-gray-800">$ {((getTotalAmount() / 84).toFixed(2))}</span>
                    </div>
                    <div className="text-xs text-gray-500">Pay via PayPal Wallet or Cards (USD)</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <FaChevronLeft /> Back
              </button>
              <button
                onClick={handleCreatePayment}
                disabled={loading}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <FaMoneyBillWave /> Proceed to Payment
                    <FaChevronRight />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && paymentCompleted && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your rent payment has been processed successfully and is being held in escrow.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate("/user/rental-contracts")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Contracts
                </button>
                <button
                  onClick={() => navigate(`/user/rent-wallet?contractId=${contract._id}`, { state: { refresh: true } })}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  View Wallet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && booking && contract && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            appointment={{
              ...booking,
              lockExpiryTime: null,
              contractId: contract._id,
              isRentalPayment: true,
              paymentType: 'monthly_rent'
            }}
            existingPayment={createdPayment}
            onPaymentSuccess={(payment) => {
              setCreatedPayment(payment);
              setPaymentCompleted(true);
              setStep(5);
              setShowPaymentModal(false);
              // Refresh wallet data to update UI immediately
              fetchContractAndWallet();
            }}
          />
        )}
      </div>
    </div>
  );
}


import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from 'react-toastify';
import { FaWallet, FaCalendarAlt, FaHistory, FaCog, FaMoneyBillWave, FaExclamationTriangle, FaCheckCircle, FaClock, FaSpinner, FaDownload } from "react-icons/fa";
import { usePageTitle } from '../hooks/usePageTitle';
import PaymentSchedule from '../components/rental/PaymentSchedule';
import AutoDebitSettings from '../components/rental/AutoDebitSettings';
import RentPaymentHistory from '../components/rental/RentPaymentHistory';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function RentWallet() {
  // Set page title
  usePageTitle("Rent Wallet - Manage Your Rent Payments");

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  // Get contractId from URL params or state
  const searchParams = new URLSearchParams(location.search);
  const contractId = searchParams.get('contractId');

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [contract, setContract] = useState(null);
  const [isTenant, setIsTenant] = useState(false);
  const [isLandlord, setIsLandlord] = useState(false);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'schedule', 'history', 'settings'

  const fetchWalletDetails = useCallback(async () => {
    if (!contractId) {
      toast.error("Contract ID is required.");
      navigate("/user/my-appointments");
      return;
    }

    if (!currentUser) {
      toast.error("Please sign in to access your rent wallet.");
      navigate("/sign-in");
      return;
    }

    try {
      setLoading(true);

      // Fetch wallet
      const walletRes = await fetch(`${API_BASE_URL}/api/rental/wallet/${contractId}`, {
        credentials: 'include'
      });

      if (!walletRes.ok) {
        throw new Error("Failed to fetch wallet");
      }

      const walletData = await walletRes.json();
      if (walletData.success && walletData.wallet) {
        setWallet(walletData.wallet);
      }

      // Fetch contract
      const contractRes = await fetch(`${API_BASE_URL}/api/rental/contracts/${contractId}`, {
        credentials: 'include'
      });

      if (contractRes.ok) {
        const contractData = await contractRes.json();
        if (contractData.success && contractData.contract) {
          setContract(contractData.contract);
          // Set role
          const c = contractData.contract;
          if (currentUser) {
            setIsTenant(c.tenantId?._id === currentUser._id || c.tenantId === currentUser._id);
            setIsLandlord(c.landlordId?._id === currentUser._id || c.landlordId === currentUser._id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
      toast.error("Failed to load wallet details.");
      navigate("/user/my-appointments");
    } finally {
      setLoading(false);
    }
  }, [contractId, currentUser, navigate]);

  // Fetch wallet details
  useEffect(() => {
    fetchWalletDetails();
  }, [fetchWalletDetails]);

  useEffect(() => {
    const normalizedId = contractId?.toString();
    const handlePaymentUpdate = (event) => {
      const updatedId = event.detail?.contractId;
      if (!updatedId || !normalizedId || updatedId.toString() === normalizedId) {
        // Add a small delay to allow backend to process
        setTimeout(fetchWalletDetails, 1000);
      }
    };

    window.addEventListener('rentalPaymentStatusUpdated', handlePaymentUpdate);
    return () => {
      window.removeEventListener('rentalPaymentStatusUpdated', handlePaymentUpdate);
    };
  }, [contractId, fetchWalletDetails]);

  // Poll for updates if any payment is processing
  useEffect(() => {
    if (!wallet?.paymentSchedule) return;

    const hasProcessing = wallet.paymentSchedule.some(p => p.status === 'processing');
    if (hasProcessing) {
      const interval = setInterval(fetchWalletDetails, 3000);
      return () => clearInterval(interval);
    }
  }, [wallet, fetchWalletDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading wallet details...</p>
        </div>
      </div>
    );
  }

  if (!wallet || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Wallet not found.</p>
          <button
            onClick={() => navigate("/user/my-appointments")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to My Appointments
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const overduePayments = wallet.paymentSchedule?.filter(p => {
    const now = new Date();
    const dueDate = new Date(p.dueDate);
    return (p.status === 'pending' || p.status === 'overdue') && dueDate < now;
  }) || [];

  const upcomingPayments = wallet.paymentSchedule?.filter(p => {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(p.dueDate);
    return p.status === 'pending' && dueDate >= now && dueDate <= nextMonth;
  }) || [];

  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount + (p.penaltyAmount || 0), 0);
  const totalUpcoming = upcomingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-700 mb-2">
                <FaWallet className="inline mr-2" />
                Rent Wallet
              </h1>
              <p className="text-gray-600">
                Contract ID: <span className="font-semibold">{contract.contractId}</span>
              </p>
              {contract.listingId && typeof contract.listingId === 'object' && (
                <p className="text-gray-600">
                  Property: <span className="font-semibold">{contract.listingId.name}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => navigate("/user/my-appointments")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Back to Appointments
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {[
              { id: 'overview', label: 'Overview', icon: FaWallet },
              { id: 'schedule', label: 'Payment Schedule', icon: FaCalendarAlt },
              { id: 'history', label: 'Payment History', icon: FaHistory },
              ...(isTenant ? [{ id: 'settings', label: 'Auto-Debit Settings', icon: FaCog }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-semibold transition ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
                  }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Wallet Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Paid */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-600 font-medium">Total Paid</h3>
                  <FaCheckCircle className="text-green-600 text-xl" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ₹{wallet.totalPaid?.toLocaleString('en-IN') || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">All-time payments</p>
              </div>

              {/* Total Due */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-600 font-medium">Total Due</h3>
                  <FaMoneyBillWave className="text-blue-600 text-xl" />
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{wallet.totalDue?.toLocaleString('en-IN') || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Remaining payments</p>
              </div>

              {/* Overdue */}
              {totalOverdue > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-600 font-medium">Overdue</h3>
                    <FaExclamationTriangle className="text-red-600 text-xl" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{totalOverdue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    {overduePayments.length} payment{overduePayments.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Upcoming */}
              {totalUpcoming > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-600 font-medium">Upcoming (30 days)</h3>
                    <FaClock className="text-yellow-600 text-xl" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    ₹{totalUpcoming.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {upcomingPayments.length} payment{upcomingPayments.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Contract Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Contract Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Monthly Rent</p>
                  <p className="font-semibold text-lg">₹{contract.lockedRentAmount?.toLocaleString('en-IN') || '0'}/month</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Lock Duration</p>
                  <p className="font-semibold text-lg">{contract.lockDuration} months</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Start Date</p>
                  <p className="font-semibold text-lg">
                    {new Date(contract.startDate).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">End Date</p>
                  <p className="font-semibold text-lg">
                    {new Date(contract.endDate).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Payment Due Date</p>
                  <p className="font-semibold text-lg">Day {contract.dueDate} of each month</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Auto-Debit</p>
                  <p className="font-semibold text-lg">
                    {wallet.autoDebitEnabled ? (
                      <span className="text-green-600">Enabled</span>
                    ) : (
                      <span className="text-gray-500">Disabled</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Payments</h2>
              {wallet.paymentSchedule && wallet.paymentSchedule.length > 0 ? (
                <div className="space-y-2">
                  {wallet.paymentSchedule
                    .filter(p => p.status === 'completed' || p.status === 'paid')
                    .sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0))
                    .slice(0, 5)
                    .map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold">
                            {new Date(payment.dueDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-600">
                            Paid: {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-GB') : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            ₹{payment.amount.toLocaleString('en-IN')}
                          </p>
                          {payment.penaltyAmount > 0 && (
                            <p className="text-xs text-red-600">
                              Penalty: ₹{payment.penaltyAmount.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No payments yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Payment Schedule Tab */}
        {activeTab === 'schedule' && (
          <PaymentSchedule wallet={wallet} contract={contract} />
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <RentPaymentHistory wallet={wallet} contract={contract} />
        )}

        {/* Auto-Debit Settings Tab */}
        {activeTab === 'settings' && (
          <AutoDebitSettings wallet={wallet} contract={contract} onUpdate={setWallet} />
        )}
      </div>
    </div>
  );
}


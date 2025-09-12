import React, { useState, useEffect } from 'react';
import { FaRupeeSign, FaCreditCard, FaChartLine, FaDownload, FaUndo, FaCheckCircle, FaTimes, FaExclamationTriangle, FaSpinner, FaUsers, FaHome, FaCalendar, FaBolt, FaSync } from 'react-icons/fa';
import PaymentHistory from '../components/PaymentHistory';
import RefundManagement from '../components/RefundManagement';

const PaymentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    totalRefunds: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0
  });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentStats();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-6 sm:py-10 px-2 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-blue-200 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-200 rounded-full opacity-20 animate-ping"></div>
            <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-yellow-200 rounded-full opacity-20 animate-pulse"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3 mb-2">
                  <FaRupeeSign className="text-green-600" />
                  💳 Payment Dashboard
                </h1>
                <p className="text-gray-600 text-lg">Manage payments, refunds, and financial analytics with advanced insights</p>
              </div>
              <button
                onClick={fetchPaymentStats}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
                title="Refresh stats"
              >
                <FaSpinner className="animate-spin" />
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 border-2 border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto no-scrollbar px-4 sm:px-8 gap-2 sm:gap-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 py-4 sm:py-5 px-4 sm:px-6 border-b-3 font-semibold text-sm sm:text-base flex items-center gap-2 sm:gap-3 transition-all duration-300 transform hover:scale-105 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-xl'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t-xl'
                    }`}
                  >
                    <Icon className="text-lg sm:text-xl" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Enhanced Tab Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-gray-100">
          {activeTab === 'overview' && (
            <div>
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-semibold mb-2">💰 Total Revenue</p>
                      <p className="text-4xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
                      <p className="text-green-200 text-xs mt-1">All time earnings</p>
                    </div>
                    <FaRupeeSign className="text-5xl text-green-200 animate-pulse" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-semibold mb-2">💳 Total Payments</p>
                      <p className="text-4xl font-bold">{stats.totalPayments}</p>
                      <p className="text-blue-200 text-xs mt-1">All transactions</p>
                    </div>
                    <FaCreditCard className="text-5xl text-blue-200 animate-bounce" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-semibold mb-2">✅ Completed Payments</p>
                      <p className="text-4xl font-bold">{stats.completedPayments}</p>
                      <p className="text-purple-200 text-xs mt-1">Successful transactions</p>
                    </div>
                    <FaCheckCircle className="text-5xl text-purple-200 animate-pulse" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-semibold mb-2">⏳ Pending Payments</p>
                      <p className="text-4xl font-bold">{stats.pendingPayments}</p>
                      <p className="text-yellow-200 text-xs mt-1">Awaiting processing</p>
                    </div>
                    <FaExclamationTriangle className="text-5xl text-yellow-200 animate-bounce" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-semibold mb-2">❌ Failed Payments</p>
                      <p className="text-4xl font-bold">{stats.failedPayments}</p>
                      <p className="text-red-200 text-xs mt-1">Require attention</p>
                    </div>
                    <FaTimes className="text-5xl text-red-200 animate-pulse" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-semibold mb-2">🔄 Total Refunds</p>
                      <p className="text-4xl font-bold">₹{stats.totalRefunds.toLocaleString()}</p>
                      <p className="text-orange-200 text-xs mt-1">Amount refunded</p>
                    </div>
                    <FaUndo className="text-5xl text-orange-200 animate-bounce" />
                  </div>
                </div>
              </div>

              {/* Enhanced Monthly Stats Chart */}
              {monthlyStats.length > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-xl border-2 border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <FaChartLine className="text-blue-500 text-3xl animate-pulse" />
                    📊 Monthly Payment Trends
                  </h3>
                  <div className="space-y-6">
                    {monthlyStats.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-100">
                        <div className="flex items-center gap-6">
                          <div className="w-24 text-lg font-semibold text-gray-700">
                            {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-6 relative shadow-inner">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full transition-all duration-700 shadow-lg"
                              style={{
                                width: `${Math.min(100, (month.amount / Math.max(...monthlyStats.map(m => m.amount))) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-800">₹{month.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-500 font-medium">{month.count} payments</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Quick Actions */}
              <div className="mt-10">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <FaBolt className="text-yellow-500 text-2xl animate-pulse" />
                  ⚡ Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-4"
                  >
                    <FaCreditCard className="text-3xl" />
                    <div className="text-left">
                      <div className="font-bold text-lg">📊 View Payment History</div>
                      <div className="text-blue-100 text-sm">Browse all payments</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('refunds')}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-4"
                  >
                    <FaUndo className="text-3xl" />
                    <div className="text-left">
                      <div className="font-bold text-lg">🔄 Manage Refunds</div>
                      <div className="text-orange-100 text-sm">Process refunds</div>
                    </div>
                  </button>
                  
                  <button
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-4"
                    title="Export CSV of payments"
                  >
                    <FaDownload className="text-3xl" />
                    <div className="text-left">
                      <div className="font-bold text-lg">📥 Export Reports</div>
                      <div className="text-green-100 text-sm">Download financial reports</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-gray-100">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <FaCreditCard className="text-blue-500 text-2xl" />
                  💳 Payment History
                </h2>
                <p className="text-gray-600 mt-2">View and manage all payment transactions</p>
              </div>
              <PaymentHistory userId="all" />
            </div>
          )}

          {activeTab === 'refunds' && (
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-gray-100">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <FaUndo className="text-orange-500 text-2xl" />
                  🔄 Refund Management
                </h2>
                <p className="text-gray-600 mt-2">Process and manage payment refunds</p>
              </div>
              <RefundManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDashboard;
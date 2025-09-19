import React, { useState, useEffect } from 'react';
import { FaDollarSign, FaCreditCard, FaChartLine, FaDownload, FaUndo, FaCheckCircle, FaTimes, FaExclamationTriangle, FaSpinner, FaUsers, FaHome, FaCalendar } from 'react-icons/fa';
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
  const [usdPayments, setUsdPayments] = useState([]);
  const [inrPayments, setInrPayments] = useState([]);

  useEffect(() => {
    fetchPaymentStats();
    fetchAdminPayments();
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
      const [usdRes, inrRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/admin/list?currency=USD&limit=50`, { credentials: 'include' }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/admin/list?currency=INR&limit=50`, { credentials: 'include' })
      ]);
      const usdData = await usdRes.json();
      const inrData = await inrRes.json();
      if (usdRes.ok) setUsdPayments(usdData.payments || []);
      if (inrRes.ok) setInrPayments(inrData.payments || []);
    } catch (e) {
      // non-fatal
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
                <FaDollarSign className="text-green-600" />
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
                      <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold">${stats.totalAmount.toLocaleString()}</p>
                    </div>
                    <FaDollarSign className="text-4xl text-green-200" />
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
                      <p className="text-3xl font-bold">${stats.totalRefunds.toLocaleString()}</p>
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
                    Monthly Payment Trends
                  </h3>
                  <div className="space-y-4">
                    {monthlyStats.map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 text-sm text-gray-600">
                            {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                            <div
                              className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (month.amount / Math.max(...monthlyStats.map(m => m.amount))) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-800">${month.amount.toLocaleString()}</div>
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
            <div className="space-y-10">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">USD Payments ($)</h3>
                {usdPayments.length === 0 ? (
                  <div className="text-sm text-gray-500">No USD payments found.</div>
                ) : (
                  <div className="space-y-3">
                    {usdPayments.map((p) => (
                      <div key={p._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-800">{p.appointmentId?.propertyName || 'Property Payment'}</div>
                            <div className="text-xs text-gray-500">Buyer: {p.userId?.username || 'N/A'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">$ {Number(p.amount).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">Gateway: {p.gateway?.toUpperCase()}</div>
                        {p.receiptUrl && (
                          <div className="mt-2 text-xs"><a className="text-blue-600 underline" href={p.receiptUrl} target="_blank" rel="noreferrer">Receipt</a></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">INR Payments (₹)</h3>
                {inrPayments.length === 0 ? (
                  <div className="text-sm text-gray-500">No INR payments found.</div>
                ) : (
                  <div className="space-y-3">
                    {inrPayments.map((p) => (
                      <div key={p._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-800">{p.appointmentId?.propertyName || 'Property Payment'}</div>
                            <div className="text-xs text-gray-500">Buyer: {p.userId?.username || 'N/A'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">₹ {Number(p.amount).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">Gateway: {p.gateway?.toUpperCase()}</div>
                        {p.receiptUrl && (
                          <div className="mt-2 text-xs"><a className="text-blue-600 underline" href={p.receiptUrl} target="_blank" rel="noreferrer">Receipt</a></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'refunds' && (
            <RefundManagement />
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDashboard;
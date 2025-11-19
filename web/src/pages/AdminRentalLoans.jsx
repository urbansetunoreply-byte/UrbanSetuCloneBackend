import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCreditCard, FaSpinner, FaSearch, FaTimes, FaCheckCircle, FaClock, FaTimesCircle, FaHome, FaUser, FaMoneyBillWave, FaCheck, FaBan, FaDownload, FaFile } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';
import LoanStatusDisplay from '../components/loans/LoanStatusDisplay';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  disbursed: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  repaid: 'bg-purple-100 text-purple-700 border-purple-200',
  defaulted: 'bg-orange-100 text-orange-700 border-orange-200'
};

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  disbursed: 'Disbursed',
  rejected: 'Rejected',
  repaid: 'Repaid',
  defaulted: 'Defaulted'
};

const LOAN_TYPE_LABELS = {
  security_deposit: 'Security Deposit',
  first_month_rent: 'First Month Rent',
  maintenance_charges: 'Maintenance Charges'
};

export default function AdminRentalLoans() {
  usePageTitle("Admin Rental Loans - UrbanSetu");

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loanTypeFilter, setLoanTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showLoanDisplay, setShowLoanDisplay] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  
  // Approve modal fields
  const [eligibilityCheck, setEligibilityCheck] = useState({
    passed: false,
    creditScore: null,
    incomeVerified: false,
    employmentVerified: false,
    eligibilityScore: null
  });
  const [adminNotes, setAdminNotes] = useState('');
  const [disbursementDate, setDisbursementDate] = useState('');
  
  // Reject modal fields
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Disburse modal fields
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [disbursementReference, setDisbursementReference] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin') {
      navigate('/user');
      return;
    }

    fetchAllLoans();
  }, [currentUser, navigate, statusFilter, loanTypeFilter]);

  const fetchAllLoans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (loanTypeFilter !== 'all') {
        params.set('loanType', loanTypeFilter);
      }

      const res = await fetch(`${API_BASE_URL}/api/rental/loans?${params.toString()}`, {
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLoans(data.loans || []);
      } else {
        toast.error(data.message || 'Failed to fetch loans');
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering for search
  const filteredLoans = React.useMemo(() => {
    if (!searchQuery) return loans;
    
    const query = searchQuery.toLowerCase();
    return loans.filter(loan =>
      loan.loanId?.toLowerCase().includes(query) ||
      loan.userId?.username?.toLowerCase().includes(query) ||
      loan.userId?.email?.toLowerCase().includes(query) ||
      loan.contractId?.contractId?.toLowerCase().includes(query) ||
      loan.contractId?.listingId?.name?.toLowerCase().includes(query) ||
      loan.contractId?.listingId?.address?.toLowerCase().includes(query)
    );
  }, [loans, searchQuery]);

  const handleViewLoan = async (loan) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rental/loans/${loan._id}`, {
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedLoan(data.loan);
        setShowLoanDisplay(true);
      }
    } catch (error) {
      console.error('Error fetching loan:', error);
      toast.error('Failed to fetch loan details');
    }
  };

  const handleApprove = async () => {
    if (!selectedLoan) return;

    try {
      setActionLoading('approve');
      const res = await fetch(`${API_BASE_URL}/api/rental/loans/${selectedLoan._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eligibilityCheck,
          adminNotes: adminNotes || undefined,
          disbursementDate: disbursementDate || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Loan approved successfully');
        setShowApproveModal(false);
        resetApproveFields();
        await fetchAllLoans();
        if (showLoanDisplay) {
          handleViewLoan({ _id: selectedLoan._id });
        }
      } else {
        toast.error(data.message || 'Failed to approve loan');
      }
    } catch (error) {
      console.error('Error approving loan:', error);
      toast.error('Failed to approve loan');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async () => {
    if (!selectedLoan || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading('reject');
      const res = await fetch(`${API_BASE_URL}/api/rental/loans/${selectedLoan._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rejectionReason,
          adminNotes: adminNotes || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Loan rejected');
        setShowRejectModal(false);
        resetRejectFields();
        await fetchAllLoans();
        if (showLoanDisplay) {
          handleViewLoan({ _id: selectedLoan._id });
        }
      } else {
        toast.error(data.message || 'Failed to reject loan');
      }
    } catch (error) {
      console.error('Error rejecting loan:', error);
      toast.error('Failed to reject loan');
    } finally {
      setActionLoading('');
    }
  };

  const handleDisburse = async () => {
    if (!selectedLoan) return;

    try {
      setActionLoading('disburse');
      const res = await fetch(`${API_BASE_URL}/api/rental/loans/${selectedLoan._id}/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          disbursedAmount: disbursedAmount || undefined,
          disbursementReference: disbursementReference || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Loan disbursed successfully');
        setShowDisburseModal(false);
        resetDisburseFields();
        await fetchAllLoans();
        if (showLoanDisplay) {
          handleViewLoan({ _id: selectedLoan._id });
        }
      } else {
        toast.error(data.message || 'Failed to disburse loan');
      }
    } catch (error) {
      console.error('Error disbursing loan:', error);
      toast.error('Failed to disburse loan');
    } finally {
      setActionLoading('');
    }
  };

  const resetApproveFields = () => {
    setEligibilityCheck({
      passed: false,
      creditScore: null,
      incomeVerified: false,
      employmentVerified: false,
      eligibilityScore: null
    });
    setAdminNotes('');
    setDisbursementDate('');
  };

  const resetRejectFields = () => {
    setRejectionReason('');
    setAdminNotes('');
  };

  const resetDisburseFields = () => {
    setDisbursedAmount('');
    setDisbursementReference('');
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
  };

  // Statistics
  const stats = React.useMemo(() => {
    return {
      total: loans.length,
      pending: loans.filter(l => l.status === 'pending').length,
      approved: loans.filter(l => l.status === 'approved').length,
      disbursed: loans.filter(l => l.status === 'disbursed').length,
      rejected: loans.filter(l => l.status === 'rejected').length
    };
  }, [loans]);

  if (loading && loans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaCreditCard className="text-blue-600" />
                Admin Rental Loans
              </h1>
              <p className="text-gray-600 mt-2">Manage all rental loan applications across the platform</p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Loans</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
                <FaCreditCard className="text-3xl text-blue-500" />
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
                <FaClock className="text-3xl text-yellow-500" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.approved}</p>
                </div>
                <FaCheckCircle className="text-3xl text-blue-500" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disbursed</p>
                  <p className="text-2xl font-bold text-green-700">{stats.disbursed}</p>
                </div>
                <FaCheckCircle className="text-3xl text-green-500" />
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                </div>
                <FaTimesCircle className="text-3xl text-red-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by loan ID, user, contract, or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disbursed">Disbursed</option>
              <option value="rejected">Rejected</option>
              <option value="repaid">Repaid</option>
              <option value="defaulted">Defaulted</option>
            </select>
            <select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="security_deposit">Security Deposit</option>
              <option value="first_month_rent">First Month Rent</option>
              <option value="maintenance_charges">Maintenance Charges</option>
            </select>
          </div>
        </div>

        {filteredLoans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaCreditCard className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Loans Found</h3>
            <p className="text-gray-500">No loans match your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLoans.map((loan) => {
              const status = loan.status;
              const contract = loan.contractId;

              return (
                <div
                  key={loan._id}
                  className={`bg-white rounded-xl shadow-lg p-6 border-2 ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {LOAN_TYPE_LABELS[loan.loanType] || loan.loanType}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
                          {STATUS_LABELS[status] || status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-mono mb-2">Loan ID: {loan.loanId}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Applicant</p>
                          <p className="font-semibold text-gray-800">{loan.userId?.username || loan.userId?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Loan Amount</p>
                          <p className="font-semibold text-gray-800">{formatCurrency(loan.loanAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">EMI Amount</p>
                          <p className="font-semibold text-gray-800">{formatCurrency(loan.emiAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Interest Rate</p>
                          <p className="font-semibold text-gray-800">{loan.interestRate}% p.a.</p>
                        </div>
                      </div>
                      {contract && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">
                            <FaHome className="inline mr-1" /> Property: {contract.listingId?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <FaFile className="inline mr-1" /> Contract: {contract.contractId || 'Unknown'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleViewLoan(loan)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <FaUser /> View Details
                      </button>
                      
                      {/* Admin Actions */}
                      {loan.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setEligibilityCheck(loan.eligibilityCheck || {
                                passed: false,
                                creditScore: null,
                                incomeVerified: false,
                                employmentVerified: false,
                                eligibilityScore: null
                              });
                              setShowApproveModal(true);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                            <FaCheck /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowRejectModal(true);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                          >
                            <FaBan /> Reject
                          </button>
                        </>
                      )}
                      {loan.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setDisbursedAmount(loan.loanAmount?.toString() || '');
                            setShowDisburseModal(true);
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                        >
                          <FaDownload /> Disburse
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loan Details Modal */}
      {showLoanDisplay && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Loan Details</h2>
              <button
                onClick={() => {
                  setShowLoanDisplay(false);
                  setSelectedLoan(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <LoanStatusDisplay
              loan={selectedLoan}
              currentUser={currentUser}
              onUpdate={() => {
                fetchAllLoans();
                if (selectedLoan) {
                  handleViewLoan({ _id: selectedLoan._id });
                }
              }}
              STATUS_COLORS={STATUS_COLORS}
              STATUS_LABELS={STATUS_LABELS}
              LOAN_TYPE_LABELS={LOAN_TYPE_LABELS}
            />
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Approve Loan</h2>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  resetApproveFields();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Loan ID</label>
                <p className="text-gray-600 font-mono">{selectedLoan.loanId}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Eligibility Check</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={eligibilityCheck.passed}
                      onChange={(e) => setEligibilityCheck({ ...eligibilityCheck, passed: e.target.checked })}
                      className="rounded"
                    />
                    <span>Eligibility Passed</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Credit Score (300-900)"
                    value={eligibilityCheck.creditScore || ''}
                    onChange={(e) => setEligibilityCheck({ ...eligibilityCheck, creditScore: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="300"
                    max="900"
                  />
                  <input
                    type="number"
                    placeholder="Eligibility Score (0-100)"
                    value={eligibilityCheck.eligibilityScore || ''}
                    onChange={(e) => setEligibilityCheck({ ...eligibilityCheck, eligibilityScore: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                    max="100"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={eligibilityCheck.incomeVerified}
                      onChange={(e) => setEligibilityCheck({ ...eligibilityCheck, incomeVerified: e.target.checked })}
                      className="rounded"
                    />
                    <span>Income Verified</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={eligibilityCheck.employmentVerified}
                      onChange={(e) => setEligibilityCheck({ ...eligibilityCheck, employmentVerified: e.target.checked })}
                      className="rounded"
                    />
                    <span>Employment Verified</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Disbursement Date (Optional)</label>
                <input
                  type="date"
                  value={disbursementDate}
                  onChange={(e) => setDisbursementDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">If provided, loan will be marked as disbursed immediately</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Add any notes for this approval..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    resetApproveFields();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading === 'approve'}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'approve' ? (
                    <>
                      <FaSpinner className="animate-spin" /> Approving...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Approve Loan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Reject Loan</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  resetRejectFields();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Loan ID</label>
                <p className="text-gray-600 font-mono">{selectedLoan.loanId}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Provide a reason for rejection..."
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Add any internal notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    resetRejectFields();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === 'reject' || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'reject' ? (
                    <>
                      <FaSpinner className="animate-spin" /> Rejecting...
                    </>
                  ) : (
                    <>
                      <FaBan /> Reject Loan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {showDisburseModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Disburse Loan</h2>
              <button
                onClick={() => {
                  setShowDisburseModal(false);
                  resetDisburseFields();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Loan ID</label>
                <p className="text-gray-600 font-mono">{selectedLoan.loanId}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Approved Amount</label>
                <p className="text-gray-600 font-semibold">{formatCurrency(selectedLoan.loanAmount)}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Disbursed Amount</label>
                <input
                  type="number"
                  value={disbursedAmount}
                  onChange={(e) => setDisbursedAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={`Default: ${formatCurrency(selectedLoan.loanAmount)}`}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Disbursement Reference (Optional)</label>
                <input
                  type="text"
                  value={disbursementReference}
                  onChange={(e) => setDisbursementReference(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Transaction reference number..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisburseModal(false);
                    resetDisburseFields();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisburse}
                  disabled={actionLoading === 'disburse'}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'disburse' ? (
                    <>
                      <FaSpinner className="animate-spin" /> Disbursing...
                    </>
                  ) : (
                    <>
                      <FaDownload /> Disburse Loan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCreditCard, FaFileUpload, FaSpinner, FaSearch, FaTimes, FaCheckCircle, FaClock, FaTimesCircle, FaHome, FaUser, FaMoneyBillWave } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';
import LoanApplicationForm from '../components/loans/LoanApplicationForm';
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

export default function RentalLoans() {
  usePageTitle("Rental Loans - UrbanSetu");

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  const [loans, setLoans] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showLoanDisplay, setShowLoanDisplay] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    loanType: 'all',
    search: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }
    fetchLoans();
    fetchContracts();
  }, [currentUser, filters.status, filters.loanType]);

  // Handle URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const contractIdParam = searchParams.get('contractId');

    if (contractIdParam) {
      const contract = contracts.find(c => 
        c._id === contractIdParam || c.contractId === contractIdParam
      );
      
      if (contract) {
        handleApplyForLoan(contract);
        navigate('/user/rental-loans', { replace: true });
      }
    }
  }, [location.search, contracts]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters.loanType !== 'all') {
        params.set('loanType', filters.loanType);
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

  const fetchContracts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rental/contracts?status=active`, {
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Filter only contracts where user is tenant
        const tenantContracts = (data.contracts || []).filter(contract => 
          contract.tenantId?._id === currentUser._id || contract.tenantId === currentUser._id
        );
        setContracts(tenantContracts);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const handleApplyForLoan = (contract) => {
    setSelectedContract(contract);
    setShowLoanForm(true);
  };

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

  const handleLoanSubmitted = () => {
    setShowLoanForm(false);
    setSelectedContract(null);
    fetchLoans();
    toast.success('Loan application submitted successfully');
  };

  const handleLoanUpdated = () => {
    fetchLoans();
    if (selectedLoan) {
      handleViewLoan(selectedLoan);
    }
  };

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = filters.search === '' || 
      loan.loanId?.toLowerCase().includes(filters.search.toLowerCase()) ||
      loan.contractId?.contractId?.toLowerCase().includes(filters.search.toLowerCase()) ||
      loan.contractId?.listingId?.name?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
  };

  if (loading) {
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
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaCreditCard className="text-blue-600" />
                Rental Loans
              </h1>
              <p className="text-gray-600 mt-2">Apply for rental loans and manage your loan applications</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search loans..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              value={filters.loanType}
              onChange={(e) => setFilters({ ...filters, loanType: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="security_deposit">Security Deposit</option>
              <option value="first_month_rent">First Month Rent</option>
              <option value="maintenance_charges">Maintenance Charges</option>
            </select>
          </div>
        </div>

        {/* Contracts Available for Loan */}
        {contracts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaHome /> Available for Loan Application
            </h2>
            <div className="space-y-3">
              {contracts
                .filter(contract => {
                  // Check if any active loans exist for this contract
                  const hasActiveLoan = loans.some(loan => 
                    (loan.contractId?._id?.toString() === contract._id || loan.contractId?.toString() === contract._id) &&
                    ['pending', 'approved', 'disbursed'].includes(loan.status)
                  );
                  return !hasActiveLoan;
                })
                .slice(0, 5)
                .map(contract => (
                  <div key={contract._id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{contract.listingId?.name || 'Property'}</h3>
                      <p className="text-sm text-gray-600">Contract ID: {contract.contractId}</p>
                      <p className="text-sm text-gray-600">Rent: {formatCurrency(contract.lockedRentAmount)}/month</p>
                    </div>
                    <button
                      onClick={() => handleApplyForLoan(contract)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FaCreditCard /> Apply for Loan
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Loans List */}
        {filteredLoans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaCreditCard className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Loans Found</h3>
            <p className="text-gray-500 mb-6">
              {filters.status !== 'all' || filters.loanType !== 'all' || filters.search !== ''
                ? 'Try adjusting your filters'
                : 'You don\'t have any loan applications yet'}
            </p>
            {contracts.length > 0 && (
              <button
                onClick={() => setFilters({ status: 'all', loanType: 'all', search: '' })}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Available Contracts
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLoans.map((loan) => {
              const status = loan.status;
              const contract = loan.contractId;

              return (
                <div
                  key={loan._id}
                  className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:shadow-xl transition-all"
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
                      <p className="text-sm text-gray-600 mb-3">
                        Property: {contract?.listingId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        Contract: {contract?.contractId || 'Unknown'}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
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
                        <div>
                          <p className="text-xs text-gray-500">Tenure</p>
                          <p className="font-semibold text-gray-800">{loan.tenure} months</p>
                        </div>
                      </div>
                      {loan.status === 'disbursed' && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <FaCheckCircle className="text-green-600" />
                            <span className="text-sm font-semibold text-green-800">Disbursed</span>
                          </div>
                          {loan.disbursedAt && (
                            <p className="text-xs text-green-700">
                              Disbursed on: {new Date(loan.disbursedAt).toLocaleDateString()}
                            </p>
                          )}
                          {loan.totalRemaining > 0 && (
                            <p className="text-xs text-green-700 mt-1">
                              Outstanding: {formatCurrency(loan.totalRemaining)}
                            </p>
                          )}
                        </div>
                      )}
                      {loan.status === 'rejected' && loan.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-700">{loan.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleViewLoan(loan)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <FaCreditCard /> View Details
                      </button>
                      {contract && (
                        <Link
                          to={`/user/rental-contracts?contractId=${contract._id || contract}`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center text-sm"
                        >
                          View Contract
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loan Application Form Modal */}
        {showLoanForm && selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Apply for Rental Loan</h2>
                <button
                  onClick={() => {
                    setShowLoanForm(false);
                    setSelectedContract(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>
              <LoanApplicationForm
                contract={selectedContract}
                currentUser={currentUser}
                onSuccess={handleLoanSubmitted}
                onCancel={() => {
                  setShowLoanForm(false);
                  setSelectedContract(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Loan Status Display Modal */}
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
                  <FaTimes />
                </button>
              </div>
              <LoanStatusDisplay
                loan={selectedLoan}
                currentUser={currentUser}
                onUpdate={handleLoanUpdated}
                STATUS_COLORS={STATUS_COLORS}
                STATUS_LABELS={STATUS_LABELS}
                LOAN_TYPE_LABELS={LOAN_TYPE_LABELS}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


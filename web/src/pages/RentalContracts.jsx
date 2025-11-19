import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaFileContract, FaDownload, FaEye, FaCalendarAlt, FaMoneyBillWave, FaLock, FaCheckCircle, FaTimesCircle, FaSpinner, FaHome, FaUser, FaChevronRight, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';
import ContractPreview from '../components/rental/ContractPreview';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function RentalContracts() {
  usePageTitle("My Rental Contracts - UrbanSetu");
  
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'pending_signature', 'expired', 'terminated'
  const [selectedContract, setSelectedContract] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, [filter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }
      
      const res = await fetch(`${API_BASE_URL}/api/rental/contracts?${params.toString()}`, {
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.contracts) {
        setContracts(data.contracts);
      } else {
        toast.error(data.message || "Failed to fetch contracts");
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (contract) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rental/contracts/${contract.contractId || contract._id}/download`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download contract');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rent_contract_${contract.contractId || contract._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Contract PDF downloaded!");
    } catch (error) {
      console.error('Error downloading contract:', error);
      toast.error('Failed to download contract');
    }
  };

  const handleView = (contract) => {
    setSelectedContract(contract);
    setShowPreviewModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending_signature':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'expired':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'terminated':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    return status?.replace('_', ' ').toUpperCase() || 'UNKNOWN';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaFileContract className="text-blue-600" />
                My Rental Contracts
              </h1>
              <p className="text-gray-600 mt-2">View and manage your rent-lock contracts</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'pending_signature', 'expired', 'terminated'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Contracts' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {contracts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaFileContract className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Contracts Found</h3>
            <p className="text-gray-500 mb-6">You don't have any rental contracts yet.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div
                key={contract._id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getStatusColor(contract.status)}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FaFileContract className="text-2xl text-blue-600" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {contract.listingId?.name || 'Property Contract'}
                        </h3>
                        <p className="text-sm text-gray-600 font-mono">
                          {contract.contractId}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1 flex items-center gap-1">
                          <FaMoneyBillWave className="text-green-600" /> Monthly Rent
                        </p>
                        <p className="font-semibold">
                          ₹{contract.lockedRentAmount?.toLocaleString('en-IN') || contract.rentAmount?.toLocaleString('en-IN') || '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1 flex items-center gap-1">
                          <FaLock className="text-purple-600" /> Duration
                        </p>
                        <p className="font-semibold">{contract.lockDuration} months</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1 flex items-center gap-1">
                          <FaCalendarAlt className="text-indigo-600" /> Start Date
                        </p>
                        <p className="font-semibold">
                          {contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-GB') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1 flex items-center gap-1">
                          <FaCalendarAlt className="text-red-600" /> End Date
                        </p>
                        <p className="font-semibold">
                          {contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-GB') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Signature Status */}
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Tenant:</span>
                        {contract.tenantSignature?.signed ? (
                          <FaCheckCircle className="text-green-600" />
                        ) : (
                          <FaTimesCircle className="text-yellow-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Landlord:</span>
                        {contract.landlordSignature?.signed ? (
                          <FaCheckCircle className="text-green-600" />
                        ) : (
                          <FaTimesCircle className="text-yellow-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleView(contract)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <FaEye /> View Details
                    </button>
                    <button
                      onClick={() => handleDownload(contract)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <FaDownload /> Download PDF
                    </button>
                    {contract.status === 'active' && contract.walletId && (
                      <button
                        onClick={() => navigate(`/user/rent-wallet?contractId=${contract._id}`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                      >
                        <FaMoneyBillWave /> Rent Wallet
                      </button>
                    )}
                    {contract.status === 'active' && (
                      <>
                        <button
                          onClick={() => navigate(`/user/services?contractId=${contract._id}&checklist=move_in`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <FaSignInAlt /> Move-In Checklist
                        </button>
                        <button
                          onClick={() => navigate(`/user/services?contractId=${contract._id}&checklist=move_out`)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                        >
                          <FaSignOutAlt /> Move-Out Checklist
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Preview Modal */}
      {showPreviewModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Contract Details</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedContract(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <ContractPreview
              contract={selectedContract}
              listing={selectedContract.listingId}
              tenant={selectedContract.tenantId}
              landlord={selectedContract.landlordId}
              onDownload={() => {
                handleDownload(selectedContract);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaExclamationTriangle, FaPlus, FaSearch, FaFilter, FaTimes, FaFileAlt, FaComments, FaCheckCircle, FaClock, FaGavel, FaUser, FaPaperclip, FaImage, FaVideo, FaFile, FaDownload } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';
import DisputeForm from '../components/dispute/DisputeForm';
import DisputeList from '../components/dispute/DisputeList';
import DisputeDetail from '../components/dispute/DisputeDetail';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DISPUTE_CATEGORIES = {
  payment_issue: 'Payment Issue',
  property_maintenance: 'Property Maintenance',
  behavior: 'Behavior',
  contract_violation: 'Contract Violation',
  damage_assessment: 'Damage Assessment',
  early_termination: 'Early Termination',
  other: 'Other'
};

const DISPUTE_STATUS = {
  open: 'Open',
  under_review: 'Under Review',
  resolved: 'Resolved',
  closed: 'Closed',
  escalated: 'Escalated'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export default function DisputeResolution() {
  usePageTitle("Dispute Resolution - UrbanSetu");

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showDisputeDetail, setShowDisputeDetail] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }
    fetchDisputes();
  }, [currentUser, filters.status, filters.category]);

  // Handle URL parameters for opening dispute form or detail
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const contractIdParam = searchParams.get('contractId');
    const disputeIdParam = searchParams.get('disputeId');

    if (contractIdParam && !disputeIdParam) {
      // Open dispute form for a contract
      fetchContract(contractIdParam).then(contract => {
        if (contract) {
          setSelectedContract(contract);
          setShowDisputeForm(true);
          navigate('/user/disputes', { replace: true });
        }
      });
    } else if (disputeIdParam) {
      // Open dispute detail
      fetchDispute(disputeIdParam).then(dispute => {
        if (dispute) {
          setSelectedDispute(dispute);
          setShowDisputeDetail(true);
          navigate('/user/disputes', { replace: true });
        }
      });
    }
  }, [location.search]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters.category !== 'all') {
        params.set('category', filters.category);
      }

      const res = await fetch(`${API_BASE_URL}/api/rental/disputes?${params.toString()}`, {
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDisputes(data.disputes || []);
      } else {
        toast.error(data.message || 'Failed to fetch disputes');
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const fetchContract = async (contractId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rental/contracts/${contractId}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.contract;
      }
      return null;
    } catch (error) {
      console.error('Error fetching contract:', error);
      return null;
    }
  };

  const fetchDispute = async (disputeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rental/disputes/${disputeId}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.dispute;
      }
      return null;
    } catch (error) {
      console.error('Error fetching dispute:', error);
      return null;
    }
  };

  const handleCreateDispute = () => {
    setShowDisputeForm(true);
    setSelectedContract(null);
  };

  const handleDisputeCreated = () => {
    setShowDisputeForm(false);
    setSelectedContract(null);
    fetchDisputes();
    toast.success('Dispute created successfully');
  };

  const handleViewDispute = async (dispute) => {
    const fullDispute = await fetchDispute(dispute._id);
    if (fullDispute) {
      setSelectedDispute(fullDispute);
      setShowDisputeDetail(true);
    }
  };

  const handleDisputeUpdated = () => {
    fetchDisputes();
    if (selectedDispute) {
      fetchDispute(selectedDispute._id).then(dispute => {
        if (dispute) {
          setSelectedDispute(dispute);
        }
      });
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = filters.search === '' || 
      dispute.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      dispute.disputeId.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'escalated':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaClock className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading disputes...</p>
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
                <FaGavel className="text-blue-600" />
                Dispute Resolution
              </h1>
              <p className="text-gray-600 mt-2">Raise and manage disputes for your rental contracts</p>
            </div>
            <button
              onClick={handleCreateDispute}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg"
            >
              <FaPlus /> Raise New Dispute
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search disputes..."
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
              {Object.entries(DISPUTE_STATUS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {Object.entries(DISPUTE_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Disputes Found</h3>
            <p className="text-gray-500 mb-6">
              {filters.status !== 'all' || filters.category !== 'all' || filters.search !== ''
                ? 'Try adjusting your filters'
                : 'You don\'t have any disputes yet'}
            </p>
            <button
              onClick={handleCreateDispute}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Raise New Dispute
            </button>
          </div>
        ) : (
          <DisputeList
            disputes={filteredDisputes}
            onViewDispute={handleViewDispute}
            getStatusColor={getStatusColor}
            DISPUTE_CATEGORIES={DISPUTE_CATEGORIES}
            DISPUTE_STATUS={DISPUTE_STATUS}
            PRIORITY_COLORS={PRIORITY_COLORS}
          />
        )}

        {/* Dispute Form Modal */}
        {showDisputeForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Raise New Dispute</h2>
                <button
                  onClick={() => {
                    setShowDisputeForm(false);
                    setSelectedContract(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>
              <DisputeForm
                contract={selectedContract}
                onSuccess={handleDisputeCreated}
                onCancel={() => {
                  setShowDisputeForm(false);
                  setSelectedContract(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Dispute Detail Modal */}
        {showDisputeDetail && selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Dispute Details</h2>
                <button
                  onClick={() => {
                    setShowDisputeDetail(false);
                    setSelectedDispute(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>
              <DisputeDetail
                dispute={selectedDispute}
                currentUser={currentUser}
                onUpdate={handleDisputeUpdated}
                getStatusColor={getStatusColor}
                DISPUTE_CATEGORIES={DISPUTE_CATEGORIES}
                DISPUTE_STATUS={DISPUTE_STATUS}
                PRIORITY_COLORS={PRIORITY_COLORS}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


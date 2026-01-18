import React, { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaSearch, FaUserTie } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AdminAgents = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

    // Rejection modal
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedAgentId, setSelectedAgentId] = useState(null);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/agent/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setAgents(data);
            } else {
                toast.error("Failed to fetch agents");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status, reason = null) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/agent/admin/status/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({ status, rejectionReason: reason })
            });

            if (res.ok) {
                toast.success(`Agent ${status} successfully`);
                fetchAgents(); // Refresh list
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        }
    };

    const openRejectModal = (id) => {
        setSelectedAgentId(id);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const submitRejection = () => {
        if (!rejectReason.trim()) return toast.warning("Please provide a reason");
        handleUpdateStatus(selectedAgentId, 'rejected', rejectReason);
        setShowRejectModal(false);
    };

    const filteredAgents = agents.filter(agent => {
        if (filter === 'all') return true;
        return agent.status === filter;
    });

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FaUserTie className="text-blue-600" /> Agent Management
                </h1>

                {/* Filter Tabs */}
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
                    {['all', 'pending', 'approved', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === f
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold border-b dark:border-gray-700">Agent Details</th>
                                <th className="p-4 font-semibold border-b dark:border-gray-700">Location</th>
                                <th className="p-4 font-semibold border-b dark:border-gray-700">Experience</th>
                                <th className="p-4 font-semibold border-b dark:border-gray-700">Status</th>
                                <th className="p-4 font-semibold border-b dark:border-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading agents...</td></tr>
                            ) : filteredAgents.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No agents found with this status.</td></tr>
                            ) : (
                                filteredAgents.map(agent => (
                                    <tr key={agent._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={agent.photo} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{agent.name}</p>
                                                    <p className="text-xs text-gray-500">{agent.email} • {agent.mobileNumber}</p>
                                                    {agent.agencyName && <p className="text-xs text-blue-500">{agent.agencyName}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                            <p className="font-medium">{agent.city}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{agent.areas.join(', ')}</p>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{agent.experience} Years</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${agent.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300' :
                                                    agent.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {agent.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {agent.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(agent._id, 'approved')}
                                                        className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(agent._id)}
                                                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            )}
                                            {agent.status !== 'pending' && (
                                                <span className="text-xs text-gray-400">No actions</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Reject Application</h3>
                        <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none h-32"
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRejection}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                            >
                                Reject Agent
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAgents;

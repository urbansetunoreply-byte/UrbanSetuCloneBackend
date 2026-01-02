import React, { useEffect, useState } from 'react';
import { FaCoins, FaFire, FaUsers, FaChartLine, FaHistory, FaArrowUp, FaArrowDown, FaSearch, FaUser, FaCheck, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { usePageTitle } from '../hooks/usePageTitle';
import { authenticatedFetch } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminCoinStats() {
    usePageTitle("Admin - SetuCoins Management");
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // User Search and Management
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Adjustment state
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [adjustmentType, setAdjustmentType] = useState('credit');
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/coins/admin/stats`);
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            } else {
                toast.error("Failed to fetch stats");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching stats");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setSearching(true);
            const res = await authenticatedFetch(`${API_BASE_URL}/api/user/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (res.ok) {
                setSearchResults(data.users || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    const fetchUserHistory = async (userId) => {
        try {
            setHistoryLoading(true);
            const res = await authenticatedFetch(`${API_BASE_URL}/api/coins/history?userId=${userId}&limit=50`);
            const data = await res.json();
            if (data.success) {
                setUserHistory(data.transactions);
            }
        } catch (error) {
            console.error(error);
            toast.error("Could not load user transaction history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const selectUser = async (user) => {
        // Set basic info first so UI updates immediately
        setSelectedUser(user);
        setSearchQuery(user.email);
        setSearchResults([]);

        // Fetch history
        fetchUserHistory(user._id);

        // Fetch full user details (including gamification)
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/user/id/${user._id}`);
            const fullUserData = await res.json();
            if (fullUserData) {
                setSelectedUser(fullUserData);
            }
        } catch (error) {
            console.error("Error fetching full user details:", error);
        }
    };

    const handleAdjustment = async () => {
        if (!adjustmentAmount || !adjustmentReason) {
            toast.error("Amount and reason are required");
            return;
        }

        try {
            setIsProcessing(true);
            const res = await authenticatedFetch(`${API_BASE_URL}/api/coins/admin/adjust`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUser._id,
                    type: adjustmentType,
                    amount: parseInt(adjustmentAmount),
                    reason: adjustmentReason
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Succesfully ${adjustmentType === 'credit' ? 'added' : 'revoked'} coins`);
                setShowAdjustmentModal(false);
                setAdjustmentAmount('');
                setAdjustmentReason('');
                fetchUserHistory(selectedUser._id);
                fetchStats();

                // Refresh user data to show updated balance
                try {
                    const userRes = await authenticatedFetch(`${API_BASE_URL}/api/user/id/${selectedUser._id}`);
                    const userData = await userRes.json();
                    if (userData) setSelectedUser(userData);
                } catch (e) {
                    console.error("Failed to refresh user data", e);
                }
            } else {
                toast.error(data.message || "Adjustment failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error processing adjustment");
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="h-12 w-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-32 animate-pulse flex justify-between">
                        <div className="space-y-3 w-1/2">
                            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    </div>
                ))}
            </div>
            <div className="h-96 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-12 w-full bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
                    ))}
                </div>
            </div>
        </div>
    );
    if (!stats) return <div className="p-10 text-center">No data available.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <FaCoins className="text-indigo-600 dark:text-indigo-400" />
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        SetuCoins Loyalty Management
                    </span>
                </h1>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search users by name or email..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                    />

                    {searching && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-300 font-medium">Searching users...</span>
                        </div>
                    )}

                    {!searching && searchResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-64 overflow-y-auto">
                            {searchResults.map(user => (
                                <button
                                    key={user._id}
                                    onClick={() => selectUser(user)}
                                    className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/40 flex items-center gap-3 transition-colors border-b last:border-none border-gray-50 dark:border-gray-700"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                        {user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{user.username}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">Circulating Supply</p>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-white mt-1">{stats.circulatingSupply?.toLocaleString()}</h3>
                        </div>
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <FaCoins size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-gray-500">
                        <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">Active Assets</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">Lifetime Earning</p>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-white mt-1">{stats.totalMintedLifetime?.toLocaleString()}</h3>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                            <FaArrowUp size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-gray-500">
                        <span className="bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">Total Minted</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">Redeemed Coins</p>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-white mt-1">{stats.totalBurned?.toLocaleString()}</h3>
                        </div>
                        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-2xl text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                            <FaFire size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-gray-500">
                        <span className="bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">Total Burned</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">Coin Holders</p>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-white mt-1">{stats.holdersCount?.toLocaleString()}</h3>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <FaUsers size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-gray-500">
                        <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">Unique Users</span>
                    </div>
                </div>
            </div>

            {selectedUser ? (
                <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-indigo-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black border border-white/30">
                                    {selectedUser.username?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">{selectedUser.username}</h2>
                                    <p className="text-indigo-100 flex items-center gap-2 text-sm">
                                        <FaUser className="text-xs" /> {selectedUser.email}
                                    </p>
                                    <div className="flex flex-wrap gap-4 mt-1 text-xs font-semibold">
                                        <div className="bg-white/20 px-2 py-1 rounded text-white border border-white/20 flex items-center gap-1">
                                            <FaCoins className="text-yellow-300" />
                                            <span>Total:</span>
                                            <span className="text-indigo-100 font-bold">
                                                {selectedUser.gamification?.setuCoinsBalance?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        {selectedUser.gamification?.coinsExpiryDate && (
                                            <div className="bg-white/20 px-2 py-1 rounded text-white border border-white/20 flex items-center gap-1">
                                                <span>Expires:</span>
                                                <span className="text-indigo-100">{new Date(selectedUser.gamification.coinsExpiryDate).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {selectedUser.gamification?.frozenCoins > 0 && (
                                            <div className="bg-red-500/30 px-2 py-1 rounded text-white border border-red-400/30 flex items-center gap-1">
                                                <span>Frozen:</span>
                                                <span className="text-red-100">{selectedUser.gamification.frozenCoins.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setAdjustmentType('credit'); setShowAdjustmentModal(true); }}
                                    className="bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
                                >
                                    <FaArrowUp /> Grant Coins
                                </button>
                                <button
                                    onClick={() => { setAdjustmentType('debit'); setShowAdjustmentModal(true); }}
                                    className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-red-600 transition-all flex items-center gap-2"
                                >
                                    <FaArrowDown /> Revoke Coins
                                </button>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="bg-black/20 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/30 transition-all"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        <div className="p-0">
                            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest text-xs flex items-center gap-2">
                                    <FaHistory className="text-indigo-500" /> User Transaction History
                                </h3>
                                <span className="text-xs text-gray-400">Showing last 50 activities</span>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Activity</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Source</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Expiry</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                        {historyLoading ? (
                                            <tr><td colSpan="4" className="text-center py-20 text-gray-400">Syncing history...</td></tr>
                                        ) : userHistory.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-20 text-gray-400">No transactions for this user.</td></tr>
                                        ) : (
                                            userHistory.map(tx => (
                                                <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                                {tx.type === 'credit' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{tx.description}</p>
                                                                {tx.adminId && <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-tighter italic">By Administrator</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${tx.source === 'referral' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                            }`}>
                                                            {tx.source.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-gray-400">
                                                        {tx.expiryDate ? new Date(tx.expiryDate).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-black text-lg ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <FaHistory className="text-indigo-400" /> Recent System-wide Transactions
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-300 text-[10px] font-black uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Activity</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Balance Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {stats.recentTransactions?.map((tx) => (
                                    <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-400 dark:text-gray-400 font-bold text-xs">
                                                    {tx.userId?.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{tx.userId?.username || 'Unknown'}</p>
                                                    <p className="text--[10px] text-gray-400 dark:text-gray-500">{tx.userId?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{tx.description}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">{tx.source?.replace(/_/g, ' ')}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-black text-lg ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Adjustment Modal */}
            {showAdjustmentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdjustmentModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden animate-[scaleIn_0.3s_ease-out]">
                        <div className={`p-6 ${adjustmentType === 'credit' ? 'bg-indigo-600' : 'bg-red-600'} text-white`}>
                            <h3 className="text-xl font-black flex items-center gap-2">
                                {adjustmentType === 'credit' ? <FaArrowUp /> : <FaArrowDown />}
                                {adjustmentType === 'credit' ? 'Grant SetuCoins' : 'Revoke SetuCoins'}
                            </h3>
                            <p className="text-white/70 text-sm mt-1">Manual adjustment for {selectedUser.username}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Coin Amount</label>
                                <input
                                    type="number"
                                    value={adjustmentAmount}
                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                    placeholder="Enter amount (e.g. 100)"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-lg bg-white dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reason for Adjustment</label>
                                <textarea
                                    value={adjustmentReason}
                                    onChange={(e) => setAdjustmentReason(e.target.value)}
                                    placeholder="Explain why coins are being adjusted (visible to user)"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[100px] text-sm bg-white dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {adjustmentType === 'debit' && (
                                <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-2xl flex gap-3 border border-amber-100 dark:border-amber-900/50">
                                    <FaExclamationTriangle className="text-amber-500 dark:text-amber-400 mt-1 flex-shrink-0" />
                                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                                        Revoking coins will immediately deduct them from the user's balance.
                                        An automated notification email will be sent with your reason.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => setShowAdjustmentModal(false)}
                                    className="flex-1 py-3.5 border border-gray-200 dark:border-gray-600 rounded-2xl font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={isProcessing}
                                    onClick={handleAdjustment}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${adjustmentType === 'credit' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing ? 'Processing...' : (adjustmentType === 'credit' ? 'Confirm Grant' : 'Confirm Revoke')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

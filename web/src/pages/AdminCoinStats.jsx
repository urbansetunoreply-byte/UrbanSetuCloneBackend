import React, { useEffect, useState } from 'react';
import { FaCoins, FaFire, FaUsers, FaChartLine, FaHistory, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { usePageTitle } from '../hooks/usePageTitle';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminCoinStats() {
    usePageTitle("Admin - SetuCoins Analytics");
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/coins/admin/stats`, { credentials: 'include' });
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

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading Analytics...</div>;
    if (!stats) return <div className="p-10 text-center">No data availble.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FaChartLine className="text-indigo-600" /> SetuCoin Economy Analytics
            </h1>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Circulating Supply */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase">Circulating Supply</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.circulatingSupply?.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                            <FaCoins size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Currently held by users</p>
                </div>

                {/* Total Lifetime Minted */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase">Lifetime Minted</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalMintedLifetime?.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                            <FaArrowUp size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Total coins ever earned</p>
                </div>

                {/* Total Burned */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase">Total Redeemed (Burned)</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalBurned?.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full text-red-600">
                            <FaFire size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Coins spent on discounts/services</p>
                </div>

                {/* Total Holders */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase">Active Holders</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.holdersCount?.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                            <FaUsers size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Users with &gt; 0 balance</p>
                </div>
            </div>

            {/* Economy Health / Burn Rate Visualization (Simple Bar) */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Economy Health</h3>
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
                    {/* Minted Bar */}
                    <div
                        className="bg-indigo-500 h-full flex items-center justify-center text-xs text-white font-bold"
                        style={{ width: `${stats.totalMintedLifetime > 0 ? ((stats.totalMintedLifetime - stats.totalBurned) / stats.totalMintedLifetime * 100) : 0}%` }}
                    >
                        Circulating
                    </div>
                    {/* Burned Bar */}
                    <div
                        className="bg-red-500 h-full flex items-center justify-center text-xs text-white font-bold"
                        style={{ width: `${stats.totalMintedLifetime > 0 ? (stats.totalBurned / stats.totalMintedLifetime * 100) : 0}%` }}
                    >
                        Burned
                    </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Circulating Supply ({((stats.totalMintedLifetime - stats.totalBurned) / (stats.totalMintedLifetime || 1) * 100).toFixed(1)}%)</span>
                    <span>Burn Rate ({((stats.totalBurned) / (stats.totalMintedLifetime || 1) * 100).toFixed(1)}%)</span>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FaHistory /> Recent System Transactions
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">User</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Source/Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.recentTransactions?.map((tx) => (
                                <tr key={tx._id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 text-sm text-gray-600">
                                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-4 text-sm font-medium">
                                        {tx.userId?.username || 'Unknown'}
                                        <div className="text-xs text-gray-400">{tx.userId?.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {tx.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className={`p-4 font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="font-medium text-gray-800 capitalize">{tx.source?.replace(/_/g, ' ')}</div>
                                        <div className="text-xs italic">{tx.description}</div>
                                    </td>
                                </tr>
                            ))}
                            {stats.recentTransactions?.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        No transactions recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

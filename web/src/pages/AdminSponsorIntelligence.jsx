import React, { useState, useEffect, useMemo } from 'react';
import {
    FaGlobe, FaChartPie, FaChartLine, FaUsers,
    FaExternalLinkAlt, FaSync, FaArrowUp, FaArrowDown,
    FaBullhorn, FaMousePointer, FaClock, FaFilter,
    FaCalendarAlt, FaChevronRight, FaTrophy, FaRocket
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import { authenticatedFetch } from '../utils/auth';
import { toast } from 'react-toastify';
import { usePageTitle } from '../hooks/usePageTitle';
import AdminDashboardSkeleton from '../components/skeletons/AdminDashboardSkeleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];

const AdminSponsorIntelligence = () => {
    usePageTitle("Sponsor Intelligence - Marketing ROI");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [days, setDays] = useState(30);
    const [stats, setStats] = useState(null);

    const fetchMarketingStats = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/visitors/marketing-stats?days=${days}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            } else {
                toast.error(data.message || "Failed to fetch marketing stats");
            }
        } catch (error) {
            console.error("Marketing stats error:", error);
            toast.error("Network error fetching marketing intelligence");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMarketingStats();
    }, [days]);

    // Format duration from ms to readable string
    const formatDuration = (ms) => {
        if (!ms) return "0s";
        const seconds = Math.round(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    };

    const sourceData = useMemo(() => {
        if (!stats?.sources) return [];
        return stats.sources.map(s => ({
            name: s._id,
            value: s.count,
            avgPages: Math.round(s.avgPageViews * 10) / 10,
            avgDuration: formatDuration(s.avgDuration)
        }));
    }, [stats]);

    const mediumData = useMemo(() => {
        if (!stats?.mediums) return [];
        return stats.mediums.map(m => ({
            name: m._id,
            value: m.count
        }));
    }, [stats]);

    if (loading) return <AdminDashboardSkeleton />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                {/* Header */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 text-white">
                                    <FaRocket className="text-2xl animate-pulse" />
                                </div>
                                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                                    Sponsor Intelligence
                                </h1>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-lg ml-1">
                                Complete acquisition funnel & referral tracking
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl flex gap-1 border border-gray-200 dark:border-gray-700">
                                {[7, 30, 90].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDays(d)}
                                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${days === d
                                            ? 'bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        {d}D
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => fetchMarketingStats(true)}
                                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                disabled={refreshing}
                            >
                                <FaSync className={refreshing ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Top Source"
                        value={stats?.sources?.[0]?._id || 'N/A'}
                        subtitle={`${stats?.sources?.[0]?.count || 0} visits`}
                        icon={<FaGlobe className="text-blue-500" />}
                        color="blue"
                    />
                    <KPICard
                        title="Main Medium"
                        value={stats?.mediums?.[0]?._id || 'N/A'}
                        subtitle="Primary channel"
                        icon={<FaBullhorn className="text-purple-500" />}
                        color="purple"
                    />
                    <KPICard
                        title="Lead Quality"
                        value={stats?.sources?.[0]?.avgPageViews?.toFixed(1) || '0.0'}
                        subtitle="Avg pages/session"
                        icon={<FaMousePointer className="text-pink-500" />}
                        color="pink"
                    />
                    <KPICard
                        title="Retention"
                        value={formatDuration(stats?.sources?.[0]?.avgDuration)}
                        subtitle="Avg session time"
                        icon={<FaClock className="text-indigo-500" />}
                        color="indigo"
                    />
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Source Breakdown Pie */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <FaChartPie className="text-blue-500" /> Source Distribution
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {sourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Source Performance Bar */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <FaTrophy className="text-yellow-500" /> Source Performance (Engagement)
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sourceData.slice(0, 5)}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="avgPages" name="Pages/Session" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Comprehensive Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Campaigns Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <FaBullhorn className="text-purple-500" /> Active Campaigns
                            </h3>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Tracking Live</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-100 dark:border-gray-800">
                                    <tr className="text-left text-gray-400 text-xs font-black uppercase tracking-widest">
                                        <th className="pb-4">Campaign Name</th>
                                        <th className="pb-4 text-center">Inbound Hits</th>
                                        <th className="pb-4 text-right">Trend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                    {(stats?.campaigns || []).map((c, i) => (
                                        <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="py-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                                                {c._id}
                                            </td>
                                            <td className="py-4 text-sm text-center">
                                                <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg font-mono">
                                                    {c.count}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <FaArrowUp className="inline text-green-500 text-xs" />
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats?.campaigns || stats.campaigns.length === 0) && (
                                        <tr><td colSpan="3" className="py-8 text-center text-gray-400">No campaign data detected</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Referrers Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <FaExternalLinkAlt className="text-indigo-500" /> Redirect Sponsors
                            </h3>
                            <FaFilter className="text-gray-300" />
                        </div>
                        <div className="space-y-4">
                            {(stats?.referrers || []).map((r, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl hover:translate-x-1 transition-transform border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900">
                                    <div className="flex items-center gap-4 truncate mr-2">
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <FaGlobe className="text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{r._id}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-indigo-500">{r.count} LEADS</span>
                                        <FaChevronRight className="text-gray-300 text-sm" />
                                    </div>
                                </div>
                            ))}
                            {(!stats?.referrers || stats.referrers.length === 0) && (
                                <div className="py-12 text-center text-gray-400">No direct referring domains detected</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

const KPICard = ({ title, value, subtitle, icon, color }) => {
    const colorClasses = {
        blue: 'from-blue-500/10 to-blue-500/5 text-blue-600 hover:border-blue-200 shadow-blue-500/5',
        purple: 'from-purple-500/10 to-purple-500/5 text-purple-600 hover:border-purple-200 shadow-purple-500/5',
        pink: 'from-pink-500/10 to-pink-500/5 text-pink-600 hover:border-pink-200 shadow-pink-500/5',
        indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600 hover:border-indigo-200 shadow-indigo-500/5'
    };

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${colorClasses[color]}`}>
            <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-xl">
                    {icon}
                </div>
                <h4 className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">{title}</h4>
            </div>
            <div className="space-y-1">
                <div className="text-2xl font-black text-gray-900 dark:text-white truncate" title={value}>
                    {value}
                </div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-tighter">
                    {subtitle}
                </div>
            </div>
        </div>
    );
};

export default AdminSponsorIntelligence;

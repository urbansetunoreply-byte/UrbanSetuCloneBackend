import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import {
    FaExclamationTriangle, FaSearch, FaFilter, FaBug, FaDesktop,
    FaMapMarkerAlt, FaGlobe, FaClock, FaTrash, FaCheckCircle,
    FaUserShield, FaCode, FaSpinner, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import ClientErrorSkeleton from '../components/skeletons/ClientErrorSkeleton';
import { toast } from 'react-toastify';

const ClientErrorMonitoring = () => {
    usePageTitle("Client Error Monitoring - Admin");
    const { currentUser } = useSelector((state) => state.user);

    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalErrors, setTotalErrors] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState('all');

    useEffect(() => {
        fetchErrors();
    }, [currentPage, searchQuery, dateRange]);

    const fetchErrors = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: 10,
                search: searchQuery,
                dateRange
            });

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/visitors/client-errors?${queryParams}`, {
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                setErrors(data.errors || []);
                setTotalErrors(data.total || 0);
                setTotalPages(data.pages || 1);
            } else {
                toast.error(data.message || 'Failed to fetch errors');
            }
        } catch (error) {
            console.error('Error fetching client errors:', error);
            toast.error('Network error while fetching logs');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page
        fetchErrors();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setDateRange('all');
        setCurrentPage(1);
    };

    if (currentUser?.role !== 'admin' && currentUser?.role !== 'rootadmin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center p-8">
                    <FaUserShield className="text-6xl text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h1>
                    <p className="text-gray-600 dark:text-gray-400">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                                <FaBug className="text-red-500" />
                                Client Error Monitoring
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Monitor and analyze critical client-side exceptions and crashes reported by users.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <Link to="/admin/session-audit-logs" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                                <FaUserShield />
                                <span className="font-medium">Audit Logs</span>
                            </Link>

                            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                <FaExclamationTriangle className="text-red-500" />
                                <div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Issues</div>
                                    <div className="text-xl font-bold text-red-600 dark:text-red-400">{totalErrors}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Errors</label>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by error message, path, IP..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-48">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Range</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="7days">Last 7 Days</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
                            >
                                <FaFilter /> Filter
                            </button>
                            {(searchQuery || dateRange !== 'all') && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Error List */}
                {loading ? (
                    <ClientErrorSkeleton />
                ) : errors.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCheckCircle className="text-4xl text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Errors Found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Everything seems to be running smoothly within the selected constraints.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {errors.map((error, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                                {/* Error Header */}
                                <div className="bg-red-50 dark:bg-red-900/10 p-4 border-b border-red-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                                            <FaCode className="text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-red-600 dark:text-red-400 text-lg break-all">
                                                {error.message || "Unknown Error"}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <FaClock className="text-xs" />
                                                    {new Date(error.timestamp).toLocaleString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                    })}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <FaDesktop className="text-xs" />
                                                    {error.deviceType || 'Unknown Device'}
                                                </span>
                                                <span>•</span>
                                                <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-700 dark:text-gray-300 font-mono">
                                                    {error.path || '/'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions (Future: Mark Resolved, Assign) */}
                                    <div className="flex items-center gap-2">
                                        {/* Placeholder for future actions */}
                                    </div>
                                </div>

                                {/* Error Details Body */}
                                <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Stack Trace / Technical Info */}
                                    <div className="lg:col-span-2 space-y-3">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Stack Trace / Source</h4>
                                            <div className="bg-gray-900 text-gray-300 p-3 rounded-lg text-xs font-mono overflow-auto max-h-40 whitespace-pre-wrap border border-gray-700 custom-scrollbar">
                                                {error.stack || error.source || "No stack trace available."}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Context Info */}
                                    <div className="space-y-4 border-l border-gray-100 dark:border-gray-700 pl-0 lg:pl-6 pt-4 lg:pt-0">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">User Environment</h4>
                                            <ul className="space-y-2 text-sm">
                                                <li className="flex items-start gap-2">
                                                    <FaGlobe className="mt-1 text-blue-500" />
                                                    <span className="text-gray-600 dark:text-gray-300 break-all">
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">Browser:</span> {error.browser} {error.browserVersion}
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <FaDesktop className="mt-1 text-purple-500" />
                                                    <span className="text-gray-600 dark:text-gray-300">
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">OS:</span> {String(error.os).replace('undefined', 'Unknown')}
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <FaMapMarkerAlt className="mt-1 text-red-500" />
                                                    <span className="text-gray-600 dark:text-gray-300">
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">IP:</span> {error.ip}
                                                    </span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <div className="mt-1 text-green-500 font-bold text-xs border border-green-500 rounded px-1">LOC</div>
                                                    <span className="text-gray-600 dark:text-gray-300">
                                                        {error.location || 'Unknown Location'}
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-200"
                            >
                                <FaChevronLeft /> Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-200"
                            >
                                Next <FaChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientErrorMonitoring;

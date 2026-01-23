import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaChartLine, FaEnvelope, FaPlus, FaStar, } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../../config/api';
import { authenticatedFetch } from '../../utils/auth';

const AgentDashboard = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [agentProfile, setAgentProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgentProfile();
    }, []);

    const fetchAgentProfile = async () => {
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/agent/status/me`);
            const data = await res.json();
            if (res.ok && data.isAgent) {
                // Now fetch full profile details
                const profileRes = await fetch(`${API_BASE_URL}/api/agent/profile/${data.agentId}`);
                const profileData = await profileRes.json();
                setAgentProfile(profileData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

    if (!agentProfile) return (
        <div className="p-10 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p>You do not have an active agent profile.</p>
            <Link to="/user/become-an-agent" className="text-blue-500 hover:underline">Apply Now</Link>
        </div>
    );

    if (agentProfile.status !== 'approved') return (
        <div className="p-10 text-center">
            <h2 className="text-2xl font-bold mb-4">Application Status: {agentProfile.status.toUpperCase()}</h2>
            <p>Your agent application is currently under review or has been rejected.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-400">Welcome back, {agentProfile.name}</p>
                    </div>
                    <Link to={`/agents/${agentProfile._id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full md:w-auto text-center">
                        View Public Profile
                    </Link>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                <FaChartLine className="text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Leads</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{agentProfile.leadsReceived}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                                <FaHome className="text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Active Listings</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{agentProfile.propertiesListed || 0}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg">
                                <FaStar className="text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{agentProfile.rating.toFixed(1)}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Link to="/user/create-listing" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-xl shadow-md transition-all transform hover:-translate-y-1 group">
                        <FaPlus className="text-3xl mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold mb-1">Add New Property</h3>
                        <p className="text-blue-100 text-sm">List a new property to the market</p>
                    </Link>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-xl shadow-md transition-all transform hover:-translate-y-1 group cursor-pointer">
                        <FaEnvelope className="text-3xl mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold mb-1">Check Messages</h3>
                        <p className="text-green-100 text-sm">View and reply to client inquiries</p>
                    </div>
                </div>

                {/* Content Tabs (Simplified) */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                    <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">Recent Activities</h3>
                    </div>
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        <p>No recent activity.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AgentDashboard;

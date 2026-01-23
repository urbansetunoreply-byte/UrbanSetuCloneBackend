import React, { useEffect, useState } from 'react';
import { FaSearch, FaMapMarkerAlt, FaFilter, FaUserPlus, FaUserTie, FaInfoCircle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import AgentCard from '../../components/AgentCard';
import AgentInfoModal from '../../components/AgentInfoModal';
import { usePageTitle } from '../../hooks/usePageTitle';

const FindAgent = () => {
    usePageTitle('Find Agents - UrbanSetu');
    const navigate = useNavigate();
    const { currentUser } = useSelector(state => state.user);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchAgents();
    }, [debouncedSearch, cityFilter]);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            let query = `?status=approved`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (cityFilter) query += `&city=${encodeURIComponent(cityFilter)}`;

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/agent${query}`);
            const data = await res.json();
            if (res.ok) {
                setAgents(data.agents || []);
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 pb-12 transition-colors duration-300">
            <AgentInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-16 mb-10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/city-fields.png')]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in-down flex items-center justify-center gap-3">
                        Find Your Perfect Real Estate Agent
                        <button
                            onClick={() => setShowInfoModal(true)}
                            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                            title="About Agents"
                        >
                            <FaInfoCircle className="text-2xl sm:text-3xl" />
                        </button>
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8 animate-fade-in-up">
                        Connect with verified professionals who can help you buy, sell, or rent with confidence.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 animate-fade-in-up delay-100">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, area, or agency..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-none outline-none text-gray-800 placeholder-gray-500 focus:ring-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="sm:w-1/3 relative border-t sm:border-t-0 sm:border-l border-gray-200">
                            <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="City (e.g. Mumbai)"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-none outline-none text-gray-800 placeholder-gray-500 focus:ring-0"
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchAgents}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-2"><FaUserTie className="text-blue-600" /> Expert Agents</span>
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                            {agents.length} Found
                        </span>
                    </h2>
                    <button
                        onClick={() => {
                            if (!currentUser) {
                                toast.info("Please sign in to become an agent");
                                // Optionally redirect to sign-in with return URL
                                // navigate('/sign-in?redirect=/user/become-an-agent');
                            } else {
                                navigate('/user/become-an-agent');
                            }
                        }}
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-transparent border-none cursor-pointer"
                    >
                        <FaUserPlus /> Become an Agent
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-800 h-80 rounded-xl shadow-lg animate-pulse"></div>
                        ))}
                    </div>
                ) : agents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {agents.map(agent => (
                            <AgentCard key={agent._id} agent={agent} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                        <div className="text-6xl mb-4">🕵️</div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No agents found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try adjusting your search filters or check back later.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default FindAgent;

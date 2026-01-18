import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaStar, FaBuilding, FaUserTie, FaCheckCircle, FaCommentDots, FaCalendarCheck, FaIdCard } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const AgentProfile = () => {
    const { id } = useParams();
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useSelector(state => state.user);

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const url = `${import.meta.env.VITE_API_BASE_URL}/api/agent/profile/${id}`;
                const res = await fetch(url);
                const data = await res.json();

                if (res.ok) {
                    setAgent(data);
                } else {
                    console.error("Failed to fetch agent profile");
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchAgent();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen pt-20 flex justify-center items-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!agent) return (
        <div className="min-h-screen pt-20 flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold dark:text-white">Agent Not Found</h2>
            <Link to="/agents" className="text-blue-500 mt-4 hover:underline">Back to Agents</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12 transition-colors duration-300">
            {/* Header / Cover */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 h-64 md:h-80 relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/city-fields.png')]"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="md:flex">
                        {/* Sidebar / Left Info */}
                        <div className="md:w-1/3 bg-gray-50 dark:bg-gray-800/50 p-6 md:p-8 text-center md:text-left border-r border-gray-100 dark:border-gray-700">
                            <div className="relative inline-block md:block mb-4">
                                <img
                                    src={agent.photo}
                                    alt={agent.name}
                                    className="w-40 h-40 md:w-56 md:h-56 rounded-full md:rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-lg mx-auto md:mx-0"
                                />
                                {agent.isVerified && (
                                    <div className="absolute bottom-2 right-2 md:-bottom-2 md:-right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-gray-800" title="Verified Agent">
                                        <FaUserTie />
                                    </div>
                                )}
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{agent.name}</h1>

                            {agent.agencyName && (
                                <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2 mb-4">
                                    <FaBuilding /> {agent.agencyName}
                                </p>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 text-center">
                                    <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{agent.experience}+</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-300">Years Exp.</span>
                                </div>
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 text-center">
                                    <span className="block text-2xl font-bold text-yellow-500 flex justify-center items-center gap-1">
                                        {agent.rating.toFixed(1)} <FaStar className="text-base" />
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-300">{agent.reviewCount || 0} Review(s)</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {currentUser ? (
                                <div className="space-y-3">
                                    <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition-all hover:scale-105">
                                        <FaCommentDots /> Message Agent
                                    </button>
                                    <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-md transition-all hover:scale-105">
                                        <FaCalendarCheck /> Book Appointment
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 text-center">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2 font-medium">Log in to contact this agent</p>
                                    <Link to="/sign-in" className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                                        Sign In
                                    </Link>
                                </div>
                            )}

                        </div>

                        {/* Main Content */}
                        <div className="md:w-2/3 p-6 md:p-10">
                            {/* About Section */}
                            <section className="mb-10">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">About {agent.name.split(' ')[0]}</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                    {agent.about || "No description provided."}
                                </p>
                            </section>

                            {/* Details Grid */}
                            <section className="mb-10">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Professional Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-300">
                                            <FaMapMarkerAlt />
                                        </div>
                                        <div>
                                            <span className="block text-sm text-gray-500 dark:text-gray-400">Operating City</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{agent.city}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-300">
                                            <FaBuilding />
                                        </div>
                                        <div>
                                            <span className="block text-sm text-gray-500 dark:text-gray-400">Areas Served</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {agent.areas && agent.areas.length > 0 ? agent.areas.join(', ') : 'Not specified'}
                                            </span>
                                        </div>
                                    </div>
                                    {agent.reraId && (
                                        <div className="flex items-start gap-3">
                                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-300">
                                                <FaIdCard />
                                            </div>
                                            <div>
                                                <span className="block text-sm text-gray-500 dark:text-gray-400">RERA Registration</span>
                                                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-sm text-gray-800 dark:text-gray-200">{agent.reraId}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Listings Section (Placeholder for now) */}
                            <section>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Active Listings</h3>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl text-center border border-dashed border-gray-300 dark:border-gray-600">
                                    <p className="text-gray-500 dark:text-gray-400">Listings integration coming soon...</p>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentProfile;

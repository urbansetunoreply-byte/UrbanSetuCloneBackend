import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaStar, FaBuilding, FaUserTie, FaCheckCircle, FaCommentDots, FaCalendarCheck, FaIdCard, FaArrowLeft, FaEdit, FaTimes, FaSpinner } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../../config/api';
import { authenticatedFetch } from '../../utils/auth';
import { toast } from 'react-toastify';

const AgentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useSelector(state => state.user);

    // Edit Mode State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchAgent();
    }, [id]);

    const fetchAgent = async () => {
        try {
            const url = `${API_BASE_URL} /api/agent / profile / ${id} `;
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

    const handleBack = () => {
        if (currentUser) {
            navigate('/user/agents');
        } else {
            navigate('/agents');
        }
    };

    const isOwner = currentUser && agent && agent.userId && (agent.userId._id === currentUser._id || agent.userId === currentUser._id);

    const openEditModal = () => {
        setEditFormData({
            name: agent.name,
            mobileNumber: agent.mobileNumber,
            city: agent.city,
            agencyName: agent.agencyName || '',
            experience: agent.experience,
            about: agent.about || '',
            areas: agent.areas ? agent.areas.join(', ') : '',
            reraId: agent.reraId || ''
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            const res = await authenticatedFetch(`${API_BASE_URL} /api/agent / update / me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData)
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Profile updated successfully!");
                setAgent(data); // Update local state with new data
                setShowEditModal(false);
            } else {
                toast.error(data.message || "Failed to update profile");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen pt-20 flex justify-center items-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!agent) return (
        <div className="min-h-screen pt-20 flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold dark:text-white">Agent Not Found</h2>
            <button onClick={handleBack} className="text-blue-500 mt-4 hover:underline">Back to Agents</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12 transition-colors duration-300">
            {/* Header / Cover */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 h-64 md:h-80 relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/city-fields.png')]"></div>

                {/* Header Content & Buttons */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 h-full flex flex-col justify-center">
                    <div className="absolute top-6 w-full flex justify-between pr-8">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
                        >
                            <FaArrowLeft /> Back to Agents
                        </button>

                        {isOwner && (
                            <button
                                onClick={openEditModal}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105"
                            >
                                <FaEdit /> Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="text-center md:text-left md:ml-64 lg:ml-72 mt-8 animate-fade-in-up">
                        <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-blue-200 text-xs font-semibold tracking-wider uppercase mb-2">
                            Professional Agent
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{agent.name}</h1>
                        <p className="text-gray-300 max-w-xl">{agent.city} • {agent.experience} Years Experience</p>
                    </div>
                </div>
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

                            {/* Name logic moved to header, but we can keep subtle branding here or remove H1 */}
                            {/* Let's keep a smaller version or just agency info */}

                            {agent.agencyName && (
                                <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2 mb-4 mt-2">
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

                            {/* Action Buttons: Show contact ONLY if NOT owner */}
                            {!isOwner && currentUser && (
                                <div className="space-y-3">
                                    <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition-all hover:scale-105">
                                        <FaCommentDots /> Message Agent
                                    </button>
                                    <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-md transition-all hover:scale-105">
                                        <FaCalendarCheck /> Book Appointment
                                    </button>
                                </div>
                            )}

                            {!currentUser && (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 text-center">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2 font-medium">Log in to contact this agent</p>
                                    <Link to="/sign-in" className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                                        Sign In
                                    </Link>
                                </div>
                            )}

                            {/* Owner Info: Maybe show some status or simple text */}
                            {isOwner && (
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">This is your public profile view.</p>
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

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 transform transition-all scale-100 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editFormData.name}
                                        onChange={handleEditChange}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                                    <input
                                        type="text"
                                        name="mobileNumber"
                                        value={editFormData.mobileNumber}
                                        onChange={handleEditChange}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operating City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={editFormData.city}
                                        onChange={handleEditChange}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience (Years)</label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={editFormData.experience}
                                        onChange={handleEditChange}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agency Name</label>
                                    <input
                                        type="text"
                                        name="agencyName"
                                        value={editFormData.agencyName}
                                        onChange={handleEditChange}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RERA ID</label>
                                    <input
                                        type="text"
                                        name="reraId"
                                        value={editFormData.reraId}
                                        onChange={handleEditChange}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Areas Served (comma separated)</label>
                                <input
                                    type="text"
                                    name="areas"
                                    value={editFormData.areas}
                                    onChange={handleEditChange}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Area1, Area2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio / About</label>
                                <textarea
                                    name="about"
                                    rows="4"
                                    value={editFormData.about}
                                    onChange={handleEditChange}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105 disabled:opacity-70 disabled:scale-100 flex justify-center items-center gap-2"
                                >
                                    {updating ? <FaSpinner className="animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentProfile;


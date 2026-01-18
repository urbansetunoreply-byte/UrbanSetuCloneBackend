import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaStar, FaBuilding, FaUserTie } from 'react-icons/fa';

const AgentCard = ({ agent }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col group">
            {/* Header / Cover (Pattern) */}
            <div className="h-24 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>

            <div className="px-6 relative flex-grow flex flex-col">
                {/* Avatar */}
                <div className="relative -mt-12 mb-4 flex justify-between items-end">
                    <div className="relative">
                        <img
                            src={agent.photo || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                            alt={agent.name}
                            className="w-24 h-24 rounded-xl object-cover border-4 border-white dark:border-gray-800 shadow-md bg-white dark:bg-gray-700"
                        />
                        {agent.isVerified && (
                            <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1 rounded-full shadow-sm" title="Verified Agent">
                                <FaUserTie className="text-xs" />
                            </div>
                        )}
                    </div>
                    <div className="mb-1 flex flex-col items-end">
                        {agent.rating > 0 && (
                            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-lg">
                                <FaStar className="text-yellow-500 text-sm" />
                                <span className="font-bold text-gray-800 dark:text-yellow-200 text-sm">{agent.rating.toFixed(1)}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">({agent.reviewCount})</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {agent.name}
                    </h3>
                    {agent.agencyName && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                            <FaBuilding className="text-xs" /> {agent.agencyName}
                        </p>
                    )}

                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <FaMapMarkerAlt className="text-red-500 mr-1.5" />
                        <span className="truncate">{agent.city} {agent.areas?.length > 0 && `• ${agent.areas.slice(0, 2).join(', ')}${agent.areas.length > 2 ? '...' : ''}`}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Experience Badge */}
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md border border-blue-100 dark:border-blue-800 font-medium">
                            {agent.experience} Yrs Exp
                        </span>
                        {/* RERA Badge (if exists) */}
                        {agent.reraId && (
                            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-md border border-green-100 dark:border-green-800 font-medium">
                                RERA Reg.
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-auto pb-6">
                    <Link
                        to={`/agents/${agent._id}`}
                        className="block w-full text-center py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity font-medium shadow-sm hover:shadow-md"
                    >
                        View Profile
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AgentCard;

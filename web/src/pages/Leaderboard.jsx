import React, { useState, useEffect } from "react";
import { FaTrophy, FaMedal, FaCoins, FaUserCircle, FaCrown } from "react-icons/fa";
import { useSelector } from "react-redux";
import { usePageTitle } from "../hooks/usePageTitle";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Leaderboard() {
    usePageTitle("Community Leaderboard - Top Earners");
    const { currentUser } = useSelector((state) => state.user);

    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRank, setUserRank] = useState(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/coins/leaderboard?limit=10`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setLeaderboard(data.leaderboard);

                // Find current user rank if in top 10, else we might need a separate call or just logic
                if (currentUser) {
                    const myRank = data.leaderboard.find(u => u.userId === currentUser._id);
                    if (myRank) setUserRank(myRank);
                }
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <FaCrown className="text-yellow-500 text-3xl drop-shadow-md animate-bounce" />;
            case 2: return <FaMedal className="text-gray-400 text-2xl" />;
            case 3: return <FaMedal className="text-amber-700 text-2xl" />;
            default: return <span className="text-gray-500 font-bold w-8 text-center">#{rank}</span>;
        }
    };

    const getRankStyle = (rank) => {
        switch (rank) {
            case 1: return "bg-gradient-to-r from-yellow-50 to-amber-100 border-yellow-300 scale-105 shadow-yellow-200/50";
            case 2: return "bg-gradient-to-r from-gray-50 to-slate-100 border-gray-300";
            case 3: return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
            default: return "bg-white border-gray-100 hover:bg-gray-50";
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen py-10 px-4 md:px-8">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3 flex items-center justify-center gap-3">
                        <FaTrophy className="text-yellow-500" /> Community Leaderboard
                    </h1>
                    <p className="text-gray-600 text-lg">
                        See who's leading the SetuCoins race! Earn coins to climb the ranks.
                    </p>
                </div>

                {/* User Stats Card (if logged in) */}
                {currentUser && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-indigo-500 flex items-center justify-between transform transition hover:scale-[1.01]">
                        <div className="flex items-center gap-4">
                            <img
                                src={currentUser.avatar}
                                alt="Profile"
                                className="w-16 h-16 rounded-full border-2 border-indigo-100 object-cover"
                            />
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Your Status</h3>
                                {userRank ? (
                                    <p className="text-indigo-600 font-medium">Rank #{userRank.rank}</p>
                                ) : (
                                    <p className="text-gray-500 text-sm">Keep earning to reach the top 10!</p>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm mb-1">Total Earned</p>
                            <p className="text-2xl font-bold text-yellow-600 flex items-center justify-end gap-2">
                                <FaCoins /> {currentUser.gamification?.totalCoinsEarned || 0}
                            </p>
                        </div>
                    </div>
                )}

                {/* Leaderboard List */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/50">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading champions...</div>
                    ) : leaderboard.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No data available yet.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {leaderboard.map((user) => (
                                <div
                                    key={user.rank}
                                    className={`flex items-center justify-between p-5 transition-all duration-300 border shadow-sm ${getRankStyle(user.rank)} ${user.userId === currentUser?._id ? 'ring-2 ring-indigo-400 ring-offset-2' : ''} mb-3 rounded-xl mx-2 my-1`}
                                >
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className="flex-shrink-0 w-10 flex justify-center">
                                            {getRankIcon(user.rank)}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img
                                                    src={user.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                    alt={user.name}
                                                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                                                />
                                                {user.rank === 1 && <FaCrown className="absolute -top-3 -right-1 text-yellow-500 text-sm bg-white rounded-full p-0.5 shadow-sm" />}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold ${user.userId === currentUser?._id ? 'text-indigo-700' : 'text-gray-800'}`}>
                                                    {user.name} {user.userId === currentUser?._id && "(You)"}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                                                        {user.streak} Day Streak
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-gray-800 text-lg flex items-center gap-1.5">
                                            {user.totalCoins.toLocaleString()} <FaCoins className="text-yellow-500 text-sm" />
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Earned</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { FaCoins, FaTrophy, FaFire, FaCrown, FaMedal, FaStar, FaInfoCircle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import LeaderboardSkeleton from '../skeletons/LeaderboardSkeleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CommunityLeaderboard = ({ limit = 10, showHeader = true, showYourStatus = false }) => {
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
            const res = await fetch(`${API_BASE_URL}/api/coins/leaderboard?limit=${limit}`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                setLeaderboard(data.leaderboard);

                if (currentUser) {
                    const myRank = data.leaderboard.find(u => u.userId === currentUser._id);
                    if (myRank) setUserRank(myRank);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getRankStyle = (rank) => {
        switch (rank) {
            case 1: return "bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 border-yellow-300 shadow-yellow-200/40 transform scale-[1.02]";
            case 2: return "bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200";
            case 3: return "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200";
            default: return "bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50";
        }
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <FaCrown className="text-yellow-500 text-xl" />;
            case 2: return <FaMedal className="text-slate-400 text-lg" />;
            case 3: return <FaMedal className="text-orange-500 text-lg" />;
            default: return <span className="text-slate-400 font-bold text-sm">#{rank}</span>;
        }
    };

    if (loading) {
        return <LeaderboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Your Status Card (Optional) */}
            {showYourStatus && currentUser && (
                <div className="bg-white rounded-[2rem] shadow-xl p-6 border-l-8 border-indigo-600 flex flex-col md:flex-row items-center justify-between gap-6 transform transition hover:scale-[1.01]">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <img
                                src={currentUser.avatar}
                                alt="Profile"
                                className="w-20 h-20 rounded-2xl border-4 border-indigo-50 object-cover shadow-lg"
                            />
                            {userRank?.rank === 1 && <FaCrown className="absolute -top-3 -right-2 text-yellow-500 text-xl animate-bounce" />}
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-xl">Your Status</h3>
                            {userRank ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg shadow-indigo-200">
                                        Rank #{userRank.rank}
                                    </span>
                                    <span className="text-slate-500 text-sm font-medium">Top Tier Finisher!</span>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                                    <FaStar className="text-yellow-500" /> Keep earning to reach the top 10!
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-center md:text-right bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 min-w-[180px]">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Earned</p>
                        <p className="text-3xl font-black text-indigo-900 flex items-center justify-center md:justify-end gap-2">
                            {currentUser.gamification?.totalCoinsEarned || 0}
                            <FaCoins className="text-yellow-500 text-lg" />
                        </p>
                    </div>
                </div>
            )}

            {/* Leaderboard Main Container */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                {showHeader && (
                    <div className="p-8 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-1 flex items-center gap-3">
                                <FaTrophy className="text-yellow-400" /> Top Earners
                            </h2>
                            <p className="text-indigo-200 text-sm font-medium">See who's leading the UrbanSetu community.</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 hidden sm:block">
                            <FaTrophy className="text-5xl text-yellow-400 drop-shadow-lg" />
                        </div>
                    </div>
                )}

                <div className="p-4 sm:p-8 space-y-4">
                    {leaderboard.length === 0 ? (
                        <div className="text-center py-20">
                            <FaTrophy className="text-6xl text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold text-lg">No champions yet.</p>
                            <p className="text-slate-300 text-sm">Be the first to climb the leaderboard!</p>
                        </div>
                    ) : (
                        leaderboard.map((user, idx) => (
                            <div
                                key={user.rank}
                                className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-300 border ${getRankStyle(user.rank)} ${user.userId === currentUser?._id ? 'ring-2 ring-indigo-500 ring-offset-4' : ''}`}
                            >
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="w-8 flex justify-center">
                                        {getRankIcon(user.rank)}
                                    </div>
                                    <div className="relative">
                                        <img
                                            src={user.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                            className={`w-14 h-14 rounded-2xl object-cover shadow-md bg-slate-100 border-2 ${idx === 0 ? 'border-yellow-400' : 'border-white'}`}
                                            alt={user.name}
                                        />
                                        {idx === 0 && (
                                            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white rounded-lg p-1 shadow-lg">
                                                <FaCrown size={10} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className={`font-black tracking-tight ${user.userId === currentUser?._id ? 'text-indigo-800' : 'text-slate-800'}`}>
                                            {user.name} {user.userId === currentUser?._id && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full ml-1">YOU</span>}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                                <FaFire className="text-orange-500" /> {user.streak} Month Streak
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-800 text-xl flex items-center justify-end gap-1.5 tabular-nums">
                                        {user.totalCoins.toLocaleString()}
                                        <FaCoins className="text-yellow-500 text-sm" />
                                    </p>
                                    <span className="text-[10px] uppercase font-black text-slate-300 tracking-[0.1em]">Total Earned</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {leaderboard.length > 0 && (
                    <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                            <FaInfoCircle className="text-indigo-300" /> Leaderboard resets every month. Keep earning!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityLeaderboard;

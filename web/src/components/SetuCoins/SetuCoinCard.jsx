import React, { useState } from 'react';
import { FaCoins, FaFire, FaHistory, FaGift, FaArrowRight, FaQuestionCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const SetuCoinCard = ({ balance = 0, streak = 0, loading = false, onViewHistory }) => {
    // Conversion rate: 10 Coins = ₹1 (as per plan)
    const rupeeValue = (balance / 10).toFixed(2);

    // Gradient background based on balance tier (gamification visual)
    const getGradient = () => {
        if (balance > 1000) return 'from-yellow-400 via-amber-500 to-yellow-600'; // Gold
        if (balance > 500) return 'from-gray-300 via-gray-400 to-gray-500'; // Silver
        return 'from-orange-300 via-orange-400 to-orange-500'; // Bronze
    };

    if (loading) {
        return (
            <div className="w-full h-48 rounded-2xl bg-gray-200 animate-pulse shadow-lg"></div>
        );
    }

    return (
        <div className={`relative w-full overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] bg-gradient-to-br ${getGradient()}`}>
            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

            {/* Coin Icon Background Overlay */}
            <FaCoins className="absolute -bottom-8 -right-8 text-9xl text-white/10 rotate-12" />

            <div className="relative p-6 text-white">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold tracking-wide text-white/90 uppercase flex items-center gap-2">
                            <FaCoins className="text-yellow-200" />
                            SetuCoins Balance
                        </h3>
                        <p className="text-xs text-white/70 mt-1">Loyalty Rewards Program</p>
                    </div>

                    {/* Streak Badge */}
                    <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 shadow-sm" title="Current Rent Streak">
                        <FaFire className={`text-orange-400 ${streak > 0 ? 'animate-pulse' : ''}`} />
                        <span className="font-bold text-sm">{streak} Month Streak</span>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-2">
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-extrabold tracking-tight drop-shadow-sm">
                                {balance.toLocaleString()}
                            </span>
                            <span className="text-lg font-medium text-white/80">Coins</span>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium border border-white/10 transition-colors hover:bg-white/30">
                            <span>≈ ₹{rupeeValue} Value</span>
                            <FaQuestionCircle className="text-xs opacity-70" title="10 Coins = ₹1 on redemption" />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onViewHistory}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/90 text-gray-800 px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:bg-white active:scale-95 transition-all group"
                    >
                        <FaHistory className="text-blue-500 group-hover:rotate-12 transition-transform" />
                        <span>History</span>
                    </button>

                    <Link
                        to="/user/rewards" // Placeholder route for later
                        className="flex-1 flex items-center justify-center gap-2 bg-black/20 text-white px-4 py-2.5 rounded-xl font-semibold border border-white/20 hover:bg-black/30 active:scale-95 transition-all backdrop-blur-sm group"
                    >
                        <FaGift className="text-pink-300 group-hover:-translate-y-1 transition-transform" />
                        <span>Redeem</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SetuCoinCard;

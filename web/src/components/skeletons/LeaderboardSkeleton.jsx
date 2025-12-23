import React from 'react';

export default function LeaderboardSkeleton() {
    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans">
            <div className="max-w-4xl mx-auto">

                {/* Header Skeleton */}
                <div className="text-center mb-10 space-y-4 flex flex-col items-center">
                    <div className="h-10 w-3/4 max-w-sm bg-gray-300 rounded"></div>
                    <div className="h-6 w-1/2 max-w-md bg-gray-200 rounded"></div>
                </div>

                {/* Leaderboard List Skeleton */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    {/* Table Header Mimic */}
                    <div className="p-8 bg-gray-200 flex justify-between items-center h-24 mb-2"></div>

                    <div className="p-4 sm:p-8 space-y-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white">
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                                    <div className="space-y-2">
                                        <div className="h-5 w-32 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="h-6 w-20 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

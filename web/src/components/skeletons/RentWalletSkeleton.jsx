import React from 'react';

export default function RentWalletSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans">
            <div className="max-w-6xl mx-auto">

                {/* Header Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="space-y-3">
                            <div className="h-8 w-48 bg-gray-200 rounded"></div>
                            <div className="h-4 w-64 bg-gray-200 rounded"></div>
                            <div className="h-4 w-56 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                    </div>

                    {/* Tabs Skeleton */}
                    <div className="flex gap-4 border-b pb-2 overflow-x-auto">
                        <div className="h-8 w-24 bg-gray-200 rounded"></div>
                        <div className="h-8 w-32 bg-gray-200 rounded"></div>
                        <div className="h-8 w-32 bg-gray-200 rounded"></div>
                        <div className="h-8 w-32 bg-gray-200 rounded"></div>
                    </div>
                </div>

                {/* Content Skeleton (Overview) */}
                <div className="space-y-6">

                    {/* Gamification Banner Skeleton */}
                    <div className="w-full h-32 bg-gray-300 rounded-xl shadow-lg mb-6"></div>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-xl shadow-lg p-6 space-y-3">
                                <div className="flex justify-between">
                                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                    <div className="h-5 w-5 rounded-full bg-gray-200"></div>
                                </div>
                                <div className="h-8 w-32 bg-gray-200 rounded"></div>
                                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Contract Summary Skeleton */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                    <div className="h-5 w-32 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Payments Skeleton */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div>
                                        <div className="h-3 w-16 bg-gray-200 rounded ml-auto"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

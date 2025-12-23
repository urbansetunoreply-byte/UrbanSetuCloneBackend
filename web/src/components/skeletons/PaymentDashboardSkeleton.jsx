import React from 'react';

export default function PaymentDashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-6 sm:py-10 px-2 md:px-8 animate-pulse font-sans">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="space-y-2">
                                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="bg-white rounded-xl shadow-lg mb-6 sm:mb-8 p-1">
                    <div className="flex gap-4 px-4 py-2">
                        <div className="h-10 w-24 bg-gray-200 rounded"></div>
                        <div className="h-10 w-32 bg-gray-200 rounded"></div>
                        <div className="h-10 w-32 bg-gray-200 rounded"></div>
                    </div>
                </div>

                {/* Dashboard Content Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-gray-100 rounded-lg p-6 h-32 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                        <div className="h-8 w-32 bg-gray-300 rounded"></div>
                                    </div>
                                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Monthly Chart Skeleton */}
                    <div className="bg-gray-50 rounded-lg p-6 h-64 mb-8"></div>

                    {/* Quick Actions */}
                    <div className="mt-8">
                        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-gray-100 p-4 rounded-lg h-24"></div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

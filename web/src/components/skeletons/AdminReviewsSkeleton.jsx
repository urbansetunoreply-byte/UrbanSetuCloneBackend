import React from 'react';

export default function AdminReviewsSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-4 sm:py-10 px-1 sm:px-2 md:px-8 animate-pulse font-sans">
            <div className="max-w-full sm:max-w-3xl md:max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-2 sm:p-4 md:p-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 gap-4">
                    <div className="h-10 w-64 bg-gray-200 rounded"></div>
                    <div className="flex gap-2">
                        <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
                        <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>

                {/* Analytics Dashboard Skeleton */}
                <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-lg p-4 h-24"></div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg p-6 h-64"></div>
                        <div className="bg-white rounded-lg p-6 h-64"></div>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="h-10 w-full sm:w-1/2 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                </div>

                {/* List/Table Skeleton */}
                <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 flex flex-col sm:flex-row gap-4">
                            <div className="sm:w-1/4 flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="sm:w-1/4 space-y-2">
                                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                <div className="h-3 w-full bg-gray-200 rounded"></div>
                                <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
                            </div>
                            <div className="sm:w-1/4 space-y-2">
                                <div className="h-5 w-24 bg-gray-200 rounded-full"></div>
                                <div className="h-3 w-20 bg-gray-200 rounded"></div>
                            </div>
                            <div className="sm:w-1/4 flex gap-2">
                                <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
                                <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

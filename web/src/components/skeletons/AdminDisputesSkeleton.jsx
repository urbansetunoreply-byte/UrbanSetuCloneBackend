import React from 'react';

export default function AdminDisputesSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-950 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-2">
                        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center space-y-2 transition-colors duration-300 border border-transparent dark:border-gray-700">
                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                        </div>
                    ))}
                </div>

                {/* Disputes List */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700 transition-colors duration-300">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1 space-y-4">
                                    {/* Dispute Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="space-y-2">
                                            <div className="h-6 w-56 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map(j => (
                                            <div key={j} className="space-y-1">
                                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>

                                {/* Action Buttons */}
                                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

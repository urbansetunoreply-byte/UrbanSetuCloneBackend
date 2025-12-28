import React from 'react';

export default function AdminRentalRatingsSkeleton() {
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
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-24 flex flex-col justify-center space-y-2 transition-colors duration-300">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-24 flex flex-col justify-center space-y-2 transition-colors duration-300">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-24 flex flex-col justify-center space-y-2 transition-colors duration-300">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>

                {/* Ratings List Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 transition-colors duration-300">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    </div>
                                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>

                                    {/* Mini Rating Blocks */}
                                    <div className="space-y-2">
                                        <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg transition-colors duration-300"></div>
                                        <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg transition-colors duration-300"></div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                    <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

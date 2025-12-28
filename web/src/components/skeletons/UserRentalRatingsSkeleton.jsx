import React from 'react';

export default function UserRentalRatingsSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-950 dark:to-gray-900 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-transparent dark:border-gray-700 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                    </div>
                </div>

                {/* Available Contracts Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-transparent dark:border-gray-700 transition-colors duration-300">
                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 transition-colors duration-300"></div>
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between transition-colors duration-300">
                                <div className="space-y-2">
                                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                </div>
                                <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ratings List Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 transition-colors duration-300">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300"></div>
                                    </div>
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>

                                    {/* Rating Block 1 */}
                                    <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2 transition-colors duration-300">
                                        <div className="h-5 w-40 bg-gray-300 dark:bg-gray-600 rounded transition-colors duration-300"></div>
                                        <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded transition-colors duration-300"></div>
                                        <div className="h-4 w-full bg-gray-300 dark:bg-gray-600 rounded transition-colors duration-300"></div>
                                    </div>

                                    {/* Rating Block 2 */}
                                    <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2 transition-colors duration-300">
                                        <div className="h-5 w-40 bg-gray-300 dark:bg-gray-600 rounded transition-colors duration-300"></div>
                                        <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded transition-colors duration-300"></div>
                                        <div className="h-4 w-full bg-gray-300 dark:bg-gray-600 rounded transition-colors duration-300"></div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                                    <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

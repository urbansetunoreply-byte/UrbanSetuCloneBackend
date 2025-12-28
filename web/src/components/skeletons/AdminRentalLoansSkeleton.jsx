import React from 'react';

export default function AdminRentalLoansSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-950 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="space-y-2">
                            <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 h-24 flex items-center justify-between border border-blue-100 dark:border-blue-800 transition-colors duration-300">
                                <div className="space-y-2">
                                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-40 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-40 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Loans List Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 transition-colors duration-300">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    </div>

                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                        {[1, 2, 3, 4].map(j => (
                                            <div key={j} className="space-y-1">
                                                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="h-10 bg-gray-50 dark:bg-gray-900/50 rounded-lg w-full mt-2 transition-colors duration-300"></div>
                                </div>

                                <div className="flex flex-col gap-2">
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

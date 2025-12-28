import React from 'react';

export default function AdminServicesSkeleton() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse font-sans transition-colors duration-300">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded shadow p-3 text-center flex flex-col items-center justify-center h-20 border border-transparent dark:border-gray-700 transition-colors duration-300">
                        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
            </div>

            {/* Services Table Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden mb-10 transition-colors duration-300">
                <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-1/4 space-y-2">
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="w-full sm:w-1/4 space-y-2">
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="w-full sm:w-1/4 space-y-2">
                            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="w-full sm:w-1/4 flex gap-2">
                            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Movers Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8 transition-colors duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-transparent dark:border-gray-700 transition-colors duration-300">
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 h-24 bg-white dark:bg-gray-800 transition-colors duration-300"></div>
                    ))}
                </div>
            </div>

        </div>
    );
}

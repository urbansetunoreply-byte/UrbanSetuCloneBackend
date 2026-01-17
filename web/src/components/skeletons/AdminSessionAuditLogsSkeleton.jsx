import React from 'react';

export default function AdminSessionAuditLogsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6 relative z-10">

                {/* Header Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 mb-8 relative overflow-hidden transition-colors duration-300">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                        <div className="flex-1 space-y-3">
                            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-5 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex rounded-lg shadow-sm bg-gray-50 dark:bg-gray-900/50 p-1 border border-gray-200 dark:border-gray-700 gap-1 transition-colors duration-300">
                                <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 mb-8 inline-flex gap-2 w-auto transition-colors duration-300">
                    <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
                    <div className="mb-6">
                        <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="flex gap-2">
                            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Audit Logs Table Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-8 transition-colors duration-300">
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                        <div className="flex gap-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            ))}
                        </div>
                    </div>

                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors duration-300">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                            </div>
                            <div className="w-32 hidden md:block">
                                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            </div>
                            <div className="w-32 hidden md:block">
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                            <div className="w-10">
                                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

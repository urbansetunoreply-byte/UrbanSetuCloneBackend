import React from 'react';

export default function AdminPropertyVerificationSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-950 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                        <div className="flex-1 py-3 flex items-center justify-center gap-2">
                            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="flex-1 py-3 flex items-center justify-center gap-2">
                            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-40 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Verifications List */}
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-50 dark:border-gray-700 transition-colors duration-300">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-56 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    </div>
                                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
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

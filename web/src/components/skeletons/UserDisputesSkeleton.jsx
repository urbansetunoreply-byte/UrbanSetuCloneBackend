import React from 'react';

export default function UserDisputesSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-950 dark:to-gray-900 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-transparent dark:border-gray-700 transition-colors duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="space-y-2">
                            <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>
                        <div className="h-12 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-2 transition-colors duration-300">
                        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-t-lg transition-colors duration-300"></div>
                        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-t-lg transition-colors duration-300"></div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                    </div>
                </div>

                {/* Disputes List */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-100 dark:border-gray-700 transition-colors duration-300">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1 space-y-4">
                                    {/* Dispute Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                        <div className="space-y-2">
                                            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map(j => (
                                            <div key={j} className="space-y-1">
                                                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                </div>

                                {/* Action Buttons */}
                                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

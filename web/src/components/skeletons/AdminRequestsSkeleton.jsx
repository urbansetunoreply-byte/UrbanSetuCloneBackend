import React from 'react';

export default function AdminRequestsSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-96 max-w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        ))}
                    </div>

                    {/* Grid of Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-64 flex flex-col justify-between transition-colors duration-300">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                                    <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                    <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}

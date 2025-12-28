import React from 'react';

export default function MyPaymentsSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-950 dark:to-gray-900 py-6 sm:py-10 px-2 md:px-8 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-transparent dark:border-gray-700 transition-colors duration-300">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="space-y-2">
                                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Filters and List */}
                <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-100 dark:border-gray-700 transition-colors duration-300">

                    {/* Filters */}
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>

                    {/* Payment Cards Skeleton */}
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="rounded-lg p-4 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 transition-colors duration-300">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="flex gap-2">
                                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:items-end gap-2">
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}

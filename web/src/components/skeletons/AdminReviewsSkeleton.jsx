import React from 'react';

export default function AdminReviewsSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-950 py-4 sm:py-10 px-1 sm:px-2 md:px-8 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-full sm:max-w-3xl md:max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 sm:p-4 md:p-8 transition-colors duration-300">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 gap-4">
                    <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex gap-2">
                        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Analytics Dashboard Skeleton */}
                <div className="mb-8 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 h-24 border border-transparent dark:border-gray-700"></div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-64 border border-transparent dark:border-gray-700"></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-64 border border-transparent dark:border-gray-700"></div>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="h-10 w-full sm:w-1/2 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>

                {/* List/Table Skeleton */}
                <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-6">
                                {/* Column 1: User & Property Info (4 cols) */}
                                <div className="md:col-span-4 flex gap-4">
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
                                    </div>
                                </div>

                                {/* Column 2: Rating & Content (4 cols) */}
                                <div className="md:col-span-4 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>)}
                                        </div>
                                        <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                </div>

                                {/* Column 3: Status & Metadata (2 cols) */}
                                <div className="md:col-span-2 flex flex-col gap-3">
                                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>

                                {/* Column 4: Actions (2 cols) */}
                                <div className="md:col-span-2 flex flex-col gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-700">
                                    <div className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                    <div className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

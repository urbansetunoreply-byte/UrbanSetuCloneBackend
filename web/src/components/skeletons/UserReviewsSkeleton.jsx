import React from 'react';

export default function UserReviewsSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-950 dark:to-gray-900 min-h-screen py-2 sm:py-10 px-1 sm:px-2 md:px-8 overflow-x-hidden animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 sm:p-4 lg:p-6 border border-transparent dark:border-gray-700 transition-colors duration-300">

                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300"></div>
                        <div className="space-y-2">
                            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                    </div>
                </div>

                {/* Analytics Placeholder */}
                <div className="mb-6 h-40 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300"></div>

                {/* Search Placeholder */}
                <div className="mb-6 h-10 w-full bg-gray-100 dark:bg-gray-900/50 rounded-lg transition-colors duration-300"></div>

                {/* Reviews Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 h-full flex flex-col bg-white dark:bg-gray-800 transition-colors duration-300">
                            <div className="flex justify-between items-center mb-3">
                                <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300"></div>
                                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>

                            <div className="flex justify-center mb-3 space-x-1">
                                {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300"></div>)}
                            </div>

                            <div className="space-y-2 mb-3">
                                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 mt-auto transition-colors duration-300">
                                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1 transition-colors duration-300"></div>
                                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

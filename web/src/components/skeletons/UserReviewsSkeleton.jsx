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
                        <div key={i} className="rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col bg-white dark:bg-gray-800 transition-colors duration-300">

                            {/* Card Header Skeleton */}
                            <div className="p-5 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700 relative">
                                <div className="absolute top-4 right-4 w-20 h-6 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                                <div className="space-y-2 pr-20">
                                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                </div>
                            </div>

                            {/* Card Body Skeleton */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>)}
                                    </div>
                                    <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>

                                <div className="space-y-2 mb-4 flex-1">
                                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>

                                {/* Card Footer Skeleton */}
                                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
                                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

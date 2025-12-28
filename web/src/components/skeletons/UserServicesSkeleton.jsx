import React from 'react';

export default function UserServicesSkeleton() {
    return (
        <div className="max-w-5xl mx-auto px-2 sm:px-4 py-6 sm:py-10 animate-pulse font-sans transition-colors duration-300">

            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center gap-2 h-24 border border-transparent dark:border-gray-700 transition-colors duration-300">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300"></div>
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                    </div>
                ))}
            </div>

            {/* Request Details Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5 mb-10 border border-transparent dark:border-gray-700 transition-colors duration-300">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 transition-colors duration-300"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                    </div>
                </div>
                <div className="mt-4 h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
            </div>

            {/* Movers Section Skeleton */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8 transition-colors duration-300">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 transition-colors duration-300"></div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5 space-y-4 border border-transparent dark:border-gray-700 transition-colors duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                    </div>
                    <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                </div>
            </div>

        </div>
    );
}

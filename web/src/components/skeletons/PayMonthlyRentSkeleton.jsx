import React from 'react';

export default function PayMonthlyRentSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-950 dark:to-gray-900 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-4xl mx-auto">

                {/* Header Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 space-y-3 border border-transparent dark:border-gray-700 transition-colors duration-300">
                    <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                    <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                </div>

                {/* Progress Steps Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6 border border-transparent dark:border-gray-700 transition-colors duration-300">
                    <div className="flex items-center justify-between w-full px-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300"></div>
                                <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Skeleton (Select Month simulation) */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 border border-transparent dark:border-gray-700 transition-colors duration-300">
                    <div className="h-7 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-4 transition-colors duration-300"></div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="border-2 border-gray-100 dark:border-gray-700 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-900/50 transition-colors duration-300">
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                    </div>
                                    <div className="sm:text-right space-y-2">
                                        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded sm:ml-auto transition-colors duration-300"></div>
                                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded sm:ml-auto transition-colors duration-300"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
                        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        <div className="h-10 w-full sm:flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                    </div>
                </div>

            </div>
        </div>
    );
}

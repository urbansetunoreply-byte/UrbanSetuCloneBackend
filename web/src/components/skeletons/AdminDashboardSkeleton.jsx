import React from 'react';

const SkeletonCard = ({ className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 ${className} transition-colors duration-300`}>
        <div className="flex justify-between items-start mb-4">
            <div className="space-y-3 w-full">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse mt-2"></div>
    </div>
);

const SkeletonChart = ({ className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 ${className} transition-colors duration-300`}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700/50 rounded overflow-hidden">
                        <div className="h-full bg-gray-200 dark:bg-gray-600 animate-pulse" style={{ width: `${Math.random() * 60 + 20}%` }}></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 animate-pulse"></div>
                </div>
            ))}
        </div>
    </div>
);

export default function AdminDashboardSkeleton() {
    return (
        <div className="bg-gray-50/50 dark:bg-gray-900 min-h-screen pb-12 transition-colors duration-300">
            {/* Header Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-colors duration-300">
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                                </div>
                            </div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-2xl animate-pulse"></div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                            <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Analytics Header */}
                <div className="flex justify-center mb-12">
                    <div className="space-y-3 text-center">
                        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse"></div>
                        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse"></div>
                    </div>
                </div>

                {/* Critical Operations Grid */}
                <div className="mb-8">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>

                {/* Detailed Stats Grid */}
                <div className="mb-8 ">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <SkeletonChart />
                        </div>
                        <div className="lg:col-span-1">
                            <SkeletonCard className="h-full" />
                        </div>
                    </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonChart />
                    <SkeletonChart />
                </div>
            </div>
        </div>
    );
}

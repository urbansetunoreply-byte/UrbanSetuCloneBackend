import React from "react";

export default function MarketTrendsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
            {/* Hero Section Skeleton */}
            <section className="relative h-[300px] bg-gray-200 dark:bg-gray-800 animate-pulse overflow-hidden">
                <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 opacity-20"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                    <div className="w-32 h-8 bg-gray-300 dark:bg-gray-700 rounded-full mb-4"></div>
                    <div className="w-3/4 md:w-1/2 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg mb-6"></div>
                    <div className="w-full md:w-2/3 h-6 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                </div>
            </section>

            {/* Quick Stats Skeleton */}
            <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20 mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mx-auto mb-3"></div>
                            <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2"></div>
                            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">

                {/* Search Bar Skeleton */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 animate-pulse">
                    <div className="w-64 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    </div>

                    <div className="mt-12 w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                        <div className="text-gray-400">Loading Market Data...</div>
                    </div>
                </div>

                {/* Charts Section Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-pulse h-80">
                        <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                        <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-pulse h-80">
                        <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                        <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Trends List Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
                            <div className="w-3/4 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

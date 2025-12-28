import React from 'react';

const CommunitySkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans pb-20 transition-colors duration-300">

            {/* Hero Header Skeleton */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-blue-900 dark:to-indigo-950 pb-24 pt-10 px-4 shadow-xl relative overflow-hidden transition-colors duration-300">
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="h-12 w-96 bg-white/20 dark:bg-white/10 rounded mx-auto mb-4 animate-pulse"></div>
                    <div className="h-6 w-1/2 bg-white/10 dark:bg-white/5 rounded mx-auto animate-pulse"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">

                {/* Stats Row Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center border border-transparent dark:border-gray-700 transition-colors duration-300">
                            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 animate-pulse"></div>
                            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse"></div>
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Sidebar (Categories) Skeleton */}
                    <div className="lg:col-span-3 space-y-6 hidden lg:block">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors duration-300">
                            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Feed Skeleton */}
                    <div className="lg:col-span-6 space-y-6">

                        {/* Create/Search Bar Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors duration-300">
                            <div className="h-12 w-full bg-gray-100 dark:bg-gray-900/50 rounded-lg animate-pulse transition-colors duration-300"></div>
                        </div>

                        {/* Posts Skeleton */}
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                                <div className="p-6">
                                    {/* Author Info */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                        <div className="space-y-2 flex-grow">
                                            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                            <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-3 mb-6">
                                        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </div>

                                    {/* Tags/Badges */}
                                    <div className="flex gap-2 mb-6">
                                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-4 transition-colors duration-300">
                                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Sidebar (Trending) Skeleton */}
                    <div className="lg:col-span-3 space-y-6 hidden lg:block">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
                            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse transition-colors duration-300"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                            <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CommunitySkeleton;

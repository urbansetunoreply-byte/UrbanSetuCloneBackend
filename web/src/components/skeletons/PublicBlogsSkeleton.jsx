import React from 'react';

export default function PublicBlogsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans text-slate-800 transition-colors duration-300">
            {/* Search Header / Hero Skeleton */}
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-900 dark:to-gray-800 pb-24 pt-12 px-4 shadow-lg mb-8 relative overflow-hidden animate-pulse transition-colors duration-300">
                <div className="max-w-7xl mx-auto text-center relative z-20">
                    <div className="h-12 w-64 bg-gray-400 dark:bg-gray-700 rounded-lg mx-auto mb-4 opacity-50 transition-colors duration-300"></div>
                    <div className="h-6 w-96 bg-gray-400 dark:bg-gray-700 rounded mx-auto mb-8 opacity-50 transition-colors duration-300"></div>

                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        <div className="h-8 w-24 bg-gray-400 dark:bg-gray-700 rounded-full opacity-50 transition-colors duration-300"></div>
                        <div className="h-8 w-32 bg-gray-400 dark:bg-gray-700 rounded-full opacity-50 transition-colors duration-300"></div>
                        <div className="h-8 w-24 bg-gray-400 dark:bg-gray-700 rounded-full opacity-50 transition-colors duration-300"></div>
                    </div>

                    {/* Search Bar Skeleton */}
                    <div className="max-w-3xl mx-auto h-16 bg-white/50 dark:bg-gray-800/50 rounded-2xl backdrop-blur-xl transition-colors duration-300"></div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-grow max-w-7xl mx-auto px-4 w-full -mt-20 relative z-10 pb-20">

                {/* Filters Card Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Categories */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
                                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse transition-colors duration-300"></div>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-700 pt-6 lg:pt-0 lg:pl-8 transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
                                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse transition-colors duration-300"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blogs Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full animate-pulse transition-colors duration-300">
                            {/* Thumbnail */}
                            <div className="h-56 bg-gray-200 dark:bg-gray-700 transition-colors duration-300"></div>

                            {/* Content */}
                            <div className="p-6 flex-grow flex flex-col">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3 transition-colors duration-300"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 transition-colors duration-300"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4 transition-colors duration-300"></div>

                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-auto">
                                    <div className="flex justify-between mb-4">
                                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                    </div>
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                    </div>
                                    <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl transition-colors duration-300"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Newsletter CTA Skeleton */}
                <div className="mt-20 bg-gray-200 dark:bg-gray-800 rounded-3xl p-8 md:p-12 h-64 animate-pulse border border-transparent dark:border-gray-700 transition-colors duration-300">
                </div>
            </main>
        </div>
    );
}

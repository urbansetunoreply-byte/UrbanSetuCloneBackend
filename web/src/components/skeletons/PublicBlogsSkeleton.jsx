import React from 'react';

export default function PublicBlogsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">
            {/* Search Header / Hero Skeleton */}
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 pb-24 pt-12 px-4 shadow-lg mb-8 relative overflow-hidden animate-pulse">
                <div className="max-w-7xl mx-auto text-center relative z-20">
                    <div className="h-12 w-64 bg-gray-400 rounded-lg mx-auto mb-4 opacity-50"></div>
                    <div className="h-6 w-96 bg-gray-400 rounded mx-auto mb-8 opacity-50"></div>

                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        <div className="h-8 w-24 bg-gray-400 rounded-full opacity-50"></div>
                        <div className="h-8 w-32 bg-gray-400 rounded-full opacity-50"></div>
                        <div className="h-8 w-24 bg-gray-400 rounded-full opacity-50"></div>
                    </div>

                    {/* Search Bar Skeleton */}
                    <div className="max-w-3xl mx-auto h-16 bg-white/50 rounded-2xl backdrop-blur-xl"></div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-grow max-w-7xl mx-auto px-4 w-full -mt-20 relative z-10 pb-20">

                {/* Filters Card Skeleton */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Categories */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-9 w-20 bg-gray-200 rounded-xl animate-pulse"></div>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-7 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blogs Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-full animate-pulse">
                            {/* Thumbnail */}
                            <div className="h-56 bg-gray-200"></div>

                            {/* Content */}
                            <div className="p-6 flex-grow flex flex-col">
                                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>

                                <div className="border-t border-gray-100 pt-4 mt-auto">
                                    <div className="flex justify-between mb-4">
                                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-6 w-12 bg-gray-200 rounded"></div>
                                        <div className="h-6 w-12 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="h-12 w-full bg-gray-200 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Newsletter CTA Skeleton */}
                <div className="mt-20 bg-gray-200 rounded-3xl p-8 md:p-12 h-64 animate-pulse">
                </div>
            </main>
        </div>
    );
}

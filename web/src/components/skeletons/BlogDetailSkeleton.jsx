import React from 'react';

const BlogDetailSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans pb-20 transition-colors duration-300">

            {/* Hero Header Skeleton */}
            <div className="bg-gray-800 dark:bg-gray-900 relative overflow-hidden h-96 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 pt-12 relative z-10">
                    <div className="h-8 w-40 bg-gray-700 dark:bg-gray-600 rounded mb-8 animate-pulse"></div>

                    <div className="space-y-6">
                        <div className="flex gap-3">
                            <div className="h-6 w-24 bg-gray-700 dark:bg-gray-600 rounded-full animate-pulse"></div>
                            <div className="h-6 w-24 bg-gray-700 dark:bg-gray-600 rounded-full animate-pulse"></div>
                        </div>

                        <div className="h-12 w-3/4 bg-gray-700 dark:bg-gray-600 rounded animate-pulse"></div>

                        <div className="flex flex-wrap items-center gap-6 border-t border-gray-700 dark:border-gray-600 pt-6 mt-4 transition-colors duration-300">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gray-700 dark:bg-gray-600 animate-pulse"></div>
                                <div className="space-y-1">
                                    <div className="h-3 w-10 bg-gray-700 dark:bg-gray-600 rounded animate-pulse"></div>
                                    <div className="h-4 w-24 bg-gray-700 dark:bg-gray-600 rounded animate-pulse"></div>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-gray-700 dark:bg-gray-600 hidden sm:block"></div>
                            <div className="h-4 w-32 bg-gray-700 dark:bg-gray-600 rounded animate-pulse"></div>
                            <div className="h-8 w-px bg-gray-700 dark:bg-gray-600 hidden sm:block"></div>
                            <div className="h-4 w-32 bg-gray-700 dark:bg-gray-600 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
                {/* Abstract Shapes */}
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gray-700 dark:bg-gray-600 rounded-full opacity-20 animate-pulse"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 -mt-16 relative z-20">

                {/* Main Content Column */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                        {/* Media Placeholder */}
                        <div className="h-[400px] bg-gray-200 dark:bg-gray-700 animate-pulse"></div>

                        {/* Content Body */}
                        <div className="p-8 md:p-12 space-y-6">
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

                            <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-900/50 animate-pulse my-8 transition-colors duration-300"></div>

                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

                            {/* Actions Bar */}
                            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700 flex gap-4 transition-colors duration-300">
                                <div className="h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                                <div className="h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                                <div className="flex-grow"></div>
                                <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Author Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 text-center transition-colors duration-300">
                        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 animate-pulse"></div>
                        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2 animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-6 animate-pulse"></div>
                        <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                    </div>

                    {/* Related Posts */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
                        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i}>
                                    <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-700 mb-3 animate-pulse"></div>
                                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BlogDetailSkeleton;

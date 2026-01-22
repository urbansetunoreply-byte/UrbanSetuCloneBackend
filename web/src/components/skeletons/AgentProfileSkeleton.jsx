import React from 'react';

const AgentProfileSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12 transition-colors duration-300">
            {/* Header / Cover Skeleton */}
            <div className="bg-gray-200 dark:bg-gray-800 h-64 md:h-80 relative animate-pulse">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                    <div className="md:w-1/3"></div>
                    <div className="md:w-2/3 md:pl-8 lg:pl-10 space-y-4 pt-12 md:pt-0">
                        <div className="h-5 w-32 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-10 w-64 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-4 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-30">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Sidebar Skeleton */}
                    <div className="md:w-1/3 flex flex-col items-center md:items-start relative z-10">
                        {/* Profile Image */}
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-2xl shadow-xl w-64 h-64 md:w-full md:max-w-xs aspect-square mb-6 animate-pulse"></div>
                        {/* Contact Card */}
                        <div className="w-full bg-white dark:bg-gray-800 h-60 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse"></div>
                    </div>

                    {/* Main Content Skeleton */}
                    <div className="md:w-2/3 p-6 md:p-10 space-y-10">
                        {/* About */}
                        <div className="space-y-4">
                            <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                                <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                                <div className="h-4 w-4/6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentProfileSkeleton;

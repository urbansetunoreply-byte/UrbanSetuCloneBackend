import React from 'react';

const AdminMyListingsSkeleton = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-950 py-10 px-2 md:px-8 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-6xl w-full mx-auto px-2 sm:px-4 md:px-8 py-8 overflow-x-hidden">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">

                    {/* Header Section Skeleton */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div className="h-8 w-64 bg-blue-200 dark:bg-blue-900/40 rounded"></div>
                        <div className="h-10 w-48 bg-purple-200 dark:bg-purple-900/40 rounded-lg mt-4 md:mt-0"></div>
                    </div>

                    {/* Filters Skeleton */}
                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>

                    {/* Listings Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden transition-colors duration-300">
                                {/* Image Placeholder */}
                                <div className="relative h-48 bg-gray-300 dark:bg-gray-700"></div>

                                {/* Content */}
                                <div className="p-4 space-y-3">
                                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>

                                    <div className="h-6 w-24 bg-blue-100 dark:bg-blue-900/20 rounded mb-2"></div>

                                    <div className="flex justify-between items-center text-sm">
                                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <div className="flex-1 h-9 bg-blue-200 dark:bg-blue-900/40 rounded"></div>
                                        <div className="flex-1 h-9 bg-yellow-200 dark:bg-yellow-900/40 rounded"></div>
                                        <div className="flex-1 h-9 bg-red-200 dark:bg-red-900/40 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminMyListingsSkeleton;

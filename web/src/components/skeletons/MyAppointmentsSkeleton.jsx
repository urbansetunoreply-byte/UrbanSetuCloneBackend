import React from 'react';

export default function MyAppointmentsSkeleton() {
    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-2 sm:py-6 px-1 sm:px-2 md:px-8 font-sans animate-pulse transition-colors duration-300">
            <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 sm:p-4 lg:p-6 border border-transparent dark:border-gray-700 transition-colors duration-300">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div>
                            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                    <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>

                {/* Filters and Search Bar */}
                <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-6">
                    <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="flex gap-2">
                        <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Appointments List */}
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm p-4 transition-colors duration-300">
                            {/* Mobile Layout Skeleton */}
                            <div className="block sm:hidden">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                                <div className="space-y-2 mb-3">
                                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                            </div>

                            {/* Desktop Layout Skeleton */}
                            <div className="hidden sm:flex gap-4 items-center">
                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="flex justify-center mt-8 gap-2">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>

            </div>
        </div>
    );
}

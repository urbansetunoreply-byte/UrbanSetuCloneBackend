import React from 'react';

export default function SavedPropertiesSkeleton() {
    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-2 sm:py-10 px-1 sm:px-2 md:px-8 overflow-x-hidden animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 sm:p-4 lg:p-6 border border-transparent dark:border-gray-700 transition-colors duration-300">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300"></div>
                        <div>
                            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2 transition-colors duration-300"></div>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="w-20 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        <div className="w-20 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                    </div>
                </div>

                {/* Sub-Header / Search Area */}
                <div className="mb-6 space-y-4">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full transition-colors duration-300"></div>
                    <div className="flex gap-4">
                        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden h-[340px] flex flex-col relative transition-colors duration-300">
                            {/* Image Placeholder */}
                            <div className="h-48 bg-gray-200 dark:bg-gray-700 w-full relative transition-colors duration-300">
                                <div className="absolute top-2 right-2 w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full transition-colors duration-300"></div>
                            </div>
                            {/* Content Placeholder */}
                            <div className="p-3 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 transition-colors duration-300"></div>
                                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-3 transition-colors duration-300"></div>
                                    <div className="flex gap-2">
                                        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                    </div>
                                </div>
                                <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mt-3 transition-colors duration-300"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

import React from 'react';

export default function RewardsSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 py-8 px-4 md:px-8 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-6xl mx-auto">

                {/* Hero Section Skeleton */}
                <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-3xl p-8 mb-8 h-80 transition-colors duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 h-full">
                        <div className="w-full md:w-1/2 space-y-4">
                            <div className="h-10 w-64 bg-gray-300 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-48 bg-gray-300 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="flex gap-4 mt-6">
                                <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl transition-colors duration-300"></div>
                                <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl transition-colors duration-300"></div>
                            </div>
                        </div>
                        <div className="w-full md:w-auto md:min-w-[280px]">
                            <div className="h-40 w-full bg-gray-300 dark:bg-gray-700 rounded-[2rem] transition-colors duration-300"></div>
                        </div>
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="flex gap-2 mb-8 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-x-auto transition-colors duration-300">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0 transition-colors duration-300"></div>
                    ))}
                </div>

                {/* Content Skeleton Area - Mimics Overview Tab */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl transition-colors duration-300"></div>
                            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl transition-colors duration-300"></div>
                        </div>
                        <div className="h-40 w-full bg-gray-200 dark:bg-gray-700 rounded-3xl transition-colors duration-300"></div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-gray-700 transition-colors duration-300">
                        <div className="flex justify-between mb-6">
                            <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                        </div>
                                    </div>
                                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

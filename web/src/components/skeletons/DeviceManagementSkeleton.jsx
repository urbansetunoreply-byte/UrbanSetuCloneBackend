import React from 'react';

export default function DeviceManagementSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 relative overflow-hidden animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 mb-8 relative overflow-hidden transition-colors duration-300">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                        <div className="flex-1 space-y-3">
                            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-5 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex rounded-lg shadow-sm bg-gray-50 dark:bg-gray-900/50 p-1 border border-gray-200 dark:border-gray-700 gap-1 transition-colors duration-300">
                                <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>
                            <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Limit Card */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 shadow-sm flex items-start gap-4 transition-colors duration-300">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>

                    {/* Security Status Card */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-3 transition-colors duration-300">
                        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>

                {/* Sessions List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>

                        <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="px-6 py-6">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-5 flex-1 w-full">
                                        <div className="h-14 w-14 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0"></div>

                                        <div className="flex-1 min-w-0 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                {i === 1 && <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 w-full md:w-auto pl-16 md:pl-0">
                                        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Security Tips */}
                <div className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex items-start gap-4 transition-colors duration-300">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>

            </div>
        </div>
    );
}

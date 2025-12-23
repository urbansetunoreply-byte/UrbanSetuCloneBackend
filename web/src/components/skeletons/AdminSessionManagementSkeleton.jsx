import React from 'react';

export default function AdminSessionManagementSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-pulse font-sans">
            <div className="max-w-7xl mx-auto space-y-6 relative z-10">

                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                        <div className="flex-1 space-y-3">
                            <div className="h-8 w-64 bg-gray-200 rounded"></div>
                            <div className="h-5 w-96 bg-gray-200 rounded"></div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex rounded-lg shadow-sm bg-gray-50 p-1 border border-gray-200 gap-1">
                                <div className="h-9 w-24 bg-gray-200 rounded"></div>
                                <div className="h-9 w-24 bg-gray-200 rounded"></div>
                            </div>
                            <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative overflow-visible z-20">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <div className="h-12 w-full bg-gray-200 rounded-xl"></div>
                        </div>
                        <div className="h-12 w-32 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>

                {/* Sessions Table Skeleton */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div className="h-6 w-48 bg-gray-200 rounded"></div>
                        <div className="h-6 w-24 bg-gray-200 rounded"></div>
                    </div>

                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center flex-1">
                                <div className="h-10 w-10 bg-gray-200 rounded-full shrink-0"></div>
                                <div className="ml-4 space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-40 bg-gray-200 rounded"></div>
                                </div>
                            </div>

                            <div className="hidden md:block flex-1">
                                <div className="flex items-start gap-3">
                                    <div className="h-5 w-5 bg-gray-200 rounded"></div>
                                    <div className="space-y-1">
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                        <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden md:block flex-1">
                                <div className="space-y-1">
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                </div>
                            </div>

                            <div className="hidden lg:block w-32">
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            </div>

                            <div className="w-24 flex justify-end gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

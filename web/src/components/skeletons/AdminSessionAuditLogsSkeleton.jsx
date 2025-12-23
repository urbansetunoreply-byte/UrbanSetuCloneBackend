import React from 'react';

export default function AdminSessionAuditLogsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-pulse font-sans">
            <div className="max-w-7xl mx-auto space-y-6 relative z-10">

                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-8 relative overflow-hidden">
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

                {/* Tab Switcher Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-8 inline-flex gap-2 w-auto">
                    <div className="h-10 w-40 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 w-40 bg-gray-200 rounded-lg"></div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                    <div className="mb-6">
                        <div className="h-12 w-full bg-gray-200 rounded-xl"></div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                        <div className="flex gap-2">
                            <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Audit Logs Table Skeleton */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex gap-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-4 w-24 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>

                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-40 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="w-32 hidden md:block">
                                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="w-32 hidden md:block">
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            </div>
                            <div className="w-10">
                                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

import React from 'react';

export default function AdminManagementSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-2 md:px-8 animate-pulse font-sans">
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8">

                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div className="h-10 w-64 bg-gray-200 rounded"></div>
                    <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
                </div>

                {/* Tabs and Stats */}
                <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-4 mb-8">
                    <div className="h-12 w-32 bg-gray-200 rounded-xl"></div>
                    <div className="h-12 w-32 bg-gray-200 rounded-xl"></div>
                </div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                    <div className="md:col-span-8">
                        <div className="h-12 w-full bg-gray-200 rounded-xl"></div>
                    </div>
                    <div className="md:col-span-4">
                        <div className="h-12 w-full bg-gray-200 rounded-xl"></div>
                    </div>
                </div>

                {/* Content Lists - Users/Admins Cards */}
                <div className="space-y-4">
                    {/* Simulate a few card items */}
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 gap-4">
                            <div className="flex items-center gap-4 w-full">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0"></div>

                                {/* Info */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-40 bg-gray-200 rounded"></div>
                                        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                                    </div>
                                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
                                <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

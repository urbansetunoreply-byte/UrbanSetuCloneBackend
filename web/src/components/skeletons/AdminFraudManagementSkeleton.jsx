import React from 'react';

const AdminFraudManagementSkeleton = () => {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-6 sm:py-10 px-2 md:px-8 animate-pulse font-sans">
            <div className="w-full mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6">

                {/* Header Section */}
                <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
                    <div className="h-10 w-64 bg-gray-200 rounded"></div>
                    <div className="flex gap-2 flex-wrap">
                        <div className="h-9 w-24 bg-blue-200 rounded-lg"></div>
                        <div className="h-9 w-20 bg-gray-200 rounded-lg"></div>
                        <div className="h-6 w-32 bg-gray-200 rounded self-center"></div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>

                {/* Controls / Filter Bar */}
                <div className="flex items-center gap-2 sm:gap-3 mb-6 flex-wrap">
                    <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    <div className="h-10 w-32 bg-gray-200 rounded"></div>
                    <div className="h-10 w-40 bg-gray-200 rounded"></div>
                    <div className="h-10 w-32 bg-gray-200 rounded"></div>
                    <div className="h-10 flex-1 min-w-[180px] bg-gray-200 rounded"></div>
                    <div className="h-10 w-24 bg-gray-200 rounded"></div>
                    <div className="h-10 w-20 bg-gray-200 rounded"></div>
                </div>

                {/* Table Skeleton */}
                <div className="space-y-6">
                    <div className="h-7 w-48 bg-gray-200 rounded mb-4"></div>
                    <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
                        <div className="min-w-full">
                            {/* Table Header */}
                            <div className="bg-gray-100 p-4 border-b grid grid-cols-5 gap-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                                ))}
                            </div>

                            {/* Table Rows */}
                            {[1, 2, 3, 4, 5, 6].map(row => (
                                <div key={row} className="p-4 border-b grid grid-cols-5 gap-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-12 bg-gray-200 rounded"></div>
                                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
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

export default AdminFraudManagementSkeleton;

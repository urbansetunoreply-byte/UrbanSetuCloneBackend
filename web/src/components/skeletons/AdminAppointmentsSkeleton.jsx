import React from 'react';

export default function AdminAppointmentsSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-10 px-2 md:px-8 animate-pulse font-sans">
            <div className="max-w-7xl mx-auto mb-4 flex justify-end">
                <div className="h-10 w-40 bg-gray-300 rounded-lg"></div>
            </div>

            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
                    <div className="h-10 w-64 bg-gray-300 rounded"></div>
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-gray-300 rounded-lg"></div>
                        <div className="h-10 w-24 bg-gray-300 rounded-lg"></div>
                        <div className="h-10 w-40 bg-gray-300 rounded-lg"></div>
                    </div>
                </div>

                <div className="h-4 w-full max-w-2xl mx-auto bg-gray-200 rounded mb-6"></div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-6">
                    <div className="flex gap-2">
                        <div className="h-10 w-48 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-64 bg-gray-200 rounded"></div>
                        <div className="h-10 w-64 bg-gray-200 rounded"></div>
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="h-12 bg-gray-200 border-b border-gray-300"></div> {/* Header Row */}
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center p-4 border-b border-gray-100">
                            <div className="w-1/6 space-y-2 pr-4">
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                            </div>
                            <div className="w-1/6 pr-4">
                                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                            </div>
                            <div className="w-1/6 pr-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="w-1/6 pr-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="w-1/6">
                                <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                    <div className="h-6 w-32 bg-gray-200 rounded"></div>
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-gray-300 rounded"></div>
                        <div className="h-10 w-24 bg-gray-300 rounded"></div>
                    </div>
                </div>

            </div>
        </div>
    );
}

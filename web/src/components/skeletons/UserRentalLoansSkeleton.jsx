import React from 'react';

export default function UserRentalLoansSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="space-y-2">
                            <div className="h-8 w-48 bg-gray-200 rounded"></div>
                            <div className="h-4 w-64 bg-gray-200 rounded"></div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-10 bg-gray-200 rounded-lg"></div>
                        <div className="h-10 bg-gray-200 rounded-lg"></div>
                        <div className="h-10 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>

                {/* Available Contracts Skeleton (Simulated) */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="h-6 w-56 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                        {[1].map(i => (
                            <div key={i} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-40 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loans List Skeleton */}
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    {/* Header Line */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-40 bg-gray-200 rounded"></div>
                                        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                                    </div>

                                    {/* Loan ID & Property */}
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-48 bg-gray-200 rounded"></div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                        {[1, 2, 3, 4].map(j => (
                                            <div key={j} className="space-y-1">
                                                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                                    <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

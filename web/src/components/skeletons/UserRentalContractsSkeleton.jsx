import React from 'react';

export default function UserRentalContractsSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-gray-200 rounded"></div>
                            <div className="h-4 w-48 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>

                {/* Contracts List */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1 space-y-4">
                                    {/* Contract Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                        <div className="space-y-2">
                                            <div className="h-6 w-48 bg-gray-200 rounded"></div>
                                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map(j => (
                                            <div key={j} className="space-y-1">
                                                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                                <div className="h-5 w-24 bg-gray-200 rounded"></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Signature Status */}
                                    <div className="flex items-center gap-4">
                                        <div className="h-5 w-32 bg-gray-200 rounded"></div>
                                        <div className="h-5 w-32 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex flex-wrap gap-2">
                                <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                                <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                                <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

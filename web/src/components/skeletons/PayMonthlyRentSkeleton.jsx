import React from 'react';

export default function PayMonthlyRentSkeleton() {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-4 md:px-8 animate-pulse font-sans">
            <div className="max-w-4xl mx-auto">

                {/* Header Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6 space-y-3">
                    <div className="h-8 w-64 bg-gray-200 rounded"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                </div>

                {/* Progress Steps Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
                    <div className="flex items-center justify-between w-full px-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                <div className="h-2 w-12 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Skeleton (Select Month simulation) */}
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                    <div className="h-7 w-56 bg-gray-200 rounded mb-4"></div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="border-2 border-gray-100 rounded-lg p-4 bg-gray-50/50">
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="h-5 w-40 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="sm:text-right space-y-2">
                                        <div className="h-6 w-24 bg-gray-200 rounded sm:ml-auto"></div>
                                        <div className="h-3 w-16 bg-gray-200 rounded sm:ml-auto"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
                        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                        <div className="h-10 w-full sm:flex-1 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>

            </div>
        </div>
    );
}

import React from 'react';

const MyListingsSkeleton = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-2 md:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    {/* Header Skeleton */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4 md:mb-0"></div>
                        <div className="h-10 w-full sm:w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>

                    {/* Filters Skeleton */}
                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                    </div>

                    {/* Listings Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-lg shadow-sm">

                                {/* Image Skeleton */}
                                <div className="relative h-48 bg-gray-200 rounded-t-lg animate-pulse">
                                    <div className="absolute top-2 right-2 w-20 h-6 bg-gray-300 rounded-full"></div>
                                </div>

                                {/* Content Skeleton */}
                                <div className="p-4 space-y-3">
                                    {/* Title */}
                                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>

                                    {/* Address */}
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>

                                    {/* Details Row */}
                                    <div className="flex gap-3">
                                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    </div>

                                    {/* Price Row */}
                                    <div className="flex justify-between items-center pt-2">
                                        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                                    </div>

                                    {/* Verification Status Skeleton */}
                                    <div className="h-16 bg-gray-100 rounded border-l-4 border-gray-300 animate-pulse my-3"></div>

                                    {/* Actions Skeleton */}
                                    <div className="flex gap-2 pt-2">
                                        <div className="flex-1 h-9 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="flex-1 h-9 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="flex-1 h-9 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyListingsSkeleton;

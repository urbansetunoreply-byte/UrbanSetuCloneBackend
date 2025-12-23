import React from 'react';

const ListingSkeleton = () => {
    return (
        <div className="bg-gray-50 min-h-screen animate-pulse font-sans">
            {/* Header Skeleton */}
            <div className="h-16 bg-white shadow-sm mb-4"></div>

            <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Breadcrumb Skeleton */}
                <div className="h-4 w-48 bg-gray-200 rounded mb-6"></div>

                {/* Gallery Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px] md:h-[500px] mb-8 rounded-xl overflow-hidden">
                    <div className="h-full bg-gray-300"></div>
                    <div className="hidden md:grid grid-cols-2 gap-2 h-full">
                        <div className="bg-gray-200 h-full"></div>
                        <div className="bg-gray-200 h-full"></div>
                        <div className="bg-gray-200 h-full"></div>
                        <div className="bg-gray-200 h-full relative">
                            {/* View Photos Button Placeholder */}
                            <div className="absolute bottom-4 right-4 bg-white/50 h-10 w-32 rounded-lg"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Title & Price Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-3 w-3/4">
                                    <div className="h-8 w-3/4 bg-gray-200 rounded"></div>
                                    <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="flex gap-4 border-t border-b py-4">
                                <div className="h-12 w-24 bg-gray-200 rounded"></div>
                                <div className="h-12 w-24 bg-gray-200 rounded"></div>
                                <div className="h-12 w-24 bg-gray-200 rounded"></div>
                            </div>
                            <div className="h-8 w-40 bg-gray-200 rounded"></div>
                        </div>

                        {/* Overview / Description */}
                        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                            <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                            <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Map Placeholder */}
                        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                            <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            <div className="h-64 w-full bg-gray-200 rounded-lg"></div>
                        </div>

                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Contact/Action Card */}
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2">
                                    <div className="h-5 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-12 w-full bg-blue-100 rounded-lg"></div>
                                <div className="h-12 w-full bg-green-100 rounded-lg"></div>
                            </div>
                            <hr />
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                            </div>
                        </div>

                        {/* Similar Properties / Ads */}
                        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                            <div className="h-6 w-40 bg-gray-200 rounded"></div>
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-24 bg-gray-100 rounded-lg flex gap-3 p-2">
                                        <div className="w-20 bg-gray-200 rounded h-full"></div>
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                            <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingSkeleton;

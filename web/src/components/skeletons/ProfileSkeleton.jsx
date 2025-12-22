import React from 'react';

export default function ProfileSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Profile Card */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative">
                        <div className="h-32 bg-gray-200 w-full relative">
                            <div className="absolute top-4 right-4 flex space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                            </div>
                        </div>

                        <div className="px-6 pb-6 relative">
                            {/* Avatar and Info */}
                            <div className="flex flex-col items-center -mt-16 mb-4">
                                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 shadow-lg relative mb-4"></div>
                                <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
                                <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                                <div className="h-5 w-40 bg-gray-200 rounded mb-4"></div>

                                {/* Stats Row */}
                                <div className="flex justify-around w-full mb-6">
                                    <div className="flex flex-col items-center">
                                        <div className="h-6 w-8 bg-gray-200 rounded mb-1"></div>
                                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="h-6 w-8 bg-gray-200 rounded mb-1"></div>
                                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="h-6 w-8 bg-gray-200 rounded mb-1"></div>
                                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                    </div>
                                </div>

                                {/* Edit Profile Button */}
                                <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Menu Skeleton */}
                    <div className="bg-white rounded-xl shadow-md p-4 space-y-2">
                        <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                        <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                        <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                        <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                        <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                    </div>
                </div>

                {/* Right Column: Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Section 1 */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="h-12 w-full bg-gray-200 rounded"></div>
                                <div className="h-12 w-full bg-gray-200 rounded"></div>
                            </div>
                            <div className="h-12 w-full bg-gray-200 rounded"></div>
                            <div className="h-32 w-full bg-gray-200 rounded"></div>
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="h-24 bg-gray-200 rounded"></div>
                            <div className="h-24 bg-gray-200 rounded"></div>
                            <div className="h-24 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

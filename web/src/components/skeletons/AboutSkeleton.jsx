import React from 'react';

const AboutSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Elements Skeleton */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-gray-200 rounded-full filter blur-3xl opacity-20"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-gray-200 rounded-full filter blur-3xl opacity-20"></div>
            </div>

            <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-pulse">

                {/* Hero Section Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="h-12 w-3/4 bg-gray-200 rounded mx-auto mb-6"></div>
                    <div className="h-4 w-full max-w-4xl bg-gray-200 rounded mx-auto mb-2"></div>
                    <div className="h-4 w-5/6 max-w-4xl bg-gray-200 rounded mx-auto mb-2"></div>
                    <div className="h-4 w-4/6 max-w-4xl bg-gray-200 rounded mx-auto"></div>
                </div>

                {/* Mission & Vision Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="flex justify-center mb-4">
                            <div className="h-8 w-40 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-5/6 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="flex justify-center mb-4">
                            <div className="h-8 w-40 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-5/6 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
                    </div>
                </div>

                {/* Core Values Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex justify-center mb-6">
                        <div className="h-8 w-48 bg-gray-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-gray-100 rounded-lg p-6 border border-gray-200">
                                <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
                                <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How It Works Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex justify-center mb-8">
                        <div className="h-8 w-56 bg-gray-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-gray-100 rounded-lg p-6 border border-gray-200">
                                <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((j) => (
                                        <div key={j} className="flex items-start gap-3">
                                            <div className="h-4 w-4 bg-gray-200 rounded-full flex-shrink-0 mt-1"></div>
                                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Key Features Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex justify-center mb-6">
                        <div className="h-8 w-48 bg-gray-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-14 bg-gray-100 rounded-lg border border-gray-200"></div>
                        ))}
                    </div>
                </div>

                {/* Team Skeleton */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex justify-center mb-6">
                        <div className="h-8 w-48 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 w-2/3 mx-auto bg-gray-200 rounded mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-gray-100 rounded-lg p-6 border border-gray-200 text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
                                <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                                <div className="h-16 w-full bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AboutSkeleton;

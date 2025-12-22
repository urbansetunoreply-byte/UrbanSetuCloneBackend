import React from "react";
import ListingSkeletonGrid from "./ListingSkeletonGrid";

export default function PublicHomeSkeleton() {
    return (
        <div className="bg-gray-50 min-h-screen relative overflow-hidden font-sans">
            {/* Background Elements Skeleton */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-gray-200 rounded-full filter blur-3xl opacity-30"></div>
            </div>

            <div className="relative z-10">
                {/* Hero Section Skeleton */}
                <div className="relative pt-20 pb-16 lg:pt-32 lg:pb-28 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center flex flex-col items-center">

                        {/* Platform Badge Pill */}
                        <div className="mb-8 w-64 h-10 bg-gray-200 rounded-full animate-pulse"></div>

                        {/* Title */}
                        <div className="w-3/4 md:w-1/2 h-16 bg-gray-200 rounded-lg mb-6 animate-pulse"></div>

                        {/* Subtitle */}
                        <div className="w-full md:w-2/3 h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="w-2/3 md:w-1/2 h-6 bg-gray-200 rounded mb-10 animate-pulse"></div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                            <div className="w-full sm:w-48 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                            <div className="w-full sm:w-48 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                        </div>

                        {/* Stats Cards Skeleton */}
                        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto w-full">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white/50 p-6 rounded-2xl shadow-lg border border-white/50 animate-pulse">
                                    <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-3"></div>
                                    <div className="w-24 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                                    <div className="w-16 h-4 bg-gray-200 rounded mx-auto"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Slider Skeleton */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex flex-col items-center mb-8 gap-4 text-center">
                        <div className="w-64 h-10 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="w-48 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="rounded-3xl overflow-hidden shadow-2xl bg-gray-200 h-[400px] md:h-[500px] lg:h-[600px] w-full animate-pulse relative">
                        <div className="absolute bottom-12 left-12 space-y-4">
                            <div className="w-32 h-8 bg-gray-300 rounded-full"></div>
                            <div className="w-96 h-12 bg-gray-300 rounded"></div>
                            <div className="w-40 h-6 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                </div>

                {/* Listing Sections Skeleton */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 py-16">
                    {/* Section 1 */}
                    <section>
                        <div className="flex justify-between items-center mb-8">
                            <div className="w-64 h-10 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <ListingSkeletonGrid count={4} />
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <div className="flex justify-between items-center mb-8">
                            <div className="w-64 h-10 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <ListingSkeletonGrid count={4} />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

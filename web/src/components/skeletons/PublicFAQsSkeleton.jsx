import React from 'react';

export default function PublicFAQsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-800 pb-20">
            {/* Hero Section Skeleton */}
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 relative overflow-hidden animate-pulse">
                <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 relative z-10 text-center">
                    <div className="inline-block h-8 w-32 bg-gray-400 rounded-full mb-6 opacity-50"></div>
                    <div className="h-12 w-64 md:w-[500px] bg-gray-400 rounded-lg mx-auto mb-6 opacity-50"></div>
                    <div className="h-6 w-full max-w-2xl bg-gray-400 rounded mx-auto mb-10 opacity-50"></div>

                    {/* Search Bar Skeleton */}
                    <div className="max-w-2xl mx-auto h-20 bg-white/50 rounded-2xl backdrop-blur-xl"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">

                {/* Categories & Filter Skeleton */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex flex-wrap gap-2 w-full">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FAQs List Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm animate-pulse">
                            <div className="space-y-2 w-full">
                                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                <div className="h-6 w-2/3 bg-gray-200 rounded"></div>
                            </div>
                            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        </div>
                    ))}
                </div>

                {/* CTA Section Skeleton */}
                <div className="mt-16 mb-12 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative h-64 animate-pulse">
                    <div className="p-8 md:p-12 text-center relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-6"></div>
                        <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 w-96 bg-gray-200 rounded mb-8"></div>
                        <div className="flex gap-4">
                            <div className="h-12 w-40 bg-gray-200 rounded-xl"></div>
                            <div className="h-12 w-40 bg-gray-200 rounded-xl"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

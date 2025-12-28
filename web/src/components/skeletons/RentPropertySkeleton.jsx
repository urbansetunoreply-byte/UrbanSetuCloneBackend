import React from 'react';

export default function RentPropertySkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 animate-pulse font-sans transition-colors duration-300">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Skeleton */}
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6 transition-colors duration-300"></div>

                {/* Main Content Card Skeleton (Plan Selection Phase) */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 md:p-8 space-y-8 border border-transparent dark:border-gray-700 transition-colors duration-300">

                    {/* Section Title */}
                    <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>

                    {/* Form Fields Simulation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Plan Option Card 1 */}
                        <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-xl space-y-3 h-48 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
                            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="space-y-2 mt-4">
                                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>
                        </div>

                        {/* Plan Option Card 2 */}
                        <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-xl space-y-3 h-48 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
                            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="space-y-2 mt-4">
                                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            </div>
                        </div>

                    </div>

                    {/* Date and Time Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                        </div>
                    </div>

                    {/* Text Area */}
                    <div className="space-y-2">
                        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                        <div className="h-12 w-full md:w-48 bg-gray-300 dark:bg-gray-600 rounded-lg ml-auto transition-colors duration-300"></div>
                    </div>

                </div>

            </div>
        </div>
    );
}

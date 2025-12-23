import React from 'react';

export default function RentPropertySkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 animate-pulse font-sans">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Skeleton */}
                <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>

                {/* Wizard Progress/Steps Placeholder - Optional visually but good for consistency if main page has it */}
                {/* Assuming the main page handles steps internally visually within cards, but we can simulate a top card */}

                {/* Main Content Card Skeleton (Plan Selection Phase) */}
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8 space-y-8">

                    {/* Section Title */}
                    <div className="h-7 w-48 bg-gray-200 rounded"></div>

                    {/* Form Fields Simulation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Plan Option Card 1 */}
                        <div className="border border-gray-200 p-4 rounded-xl space-y-3 h-48 bg-gray-50">
                            <div className="h-5 w-32 bg-gray-200 rounded"></div>
                            <div className="h-8 w-full bg-gray-200 rounded"></div>
                            <div className="space-y-2 mt-4">
                                <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                            </div>
                        </div>

                        {/* Plan Option Card 2 */}
                        <div className="border border-gray-200 p-4 rounded-xl space-y-3 h-48 bg-gray-50">
                            <div className="h-5 w-32 bg-gray-200 rounded"></div>
                            <div className="h-8 w-full bg-gray-200 rounded"></div>
                            <div className="space-y-2 mt-4">
                                <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                            </div>
                        </div>

                    </div>

                    {/* Date and Time Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>

                    {/* Text Area */}
                    <div className="space-y-2">
                        <div className="h-4 w-48 bg-gray-200 rounded"></div>
                        <div className="h-24 w-full bg-gray-200 rounded-lg"></div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                        <div className="h-12 w-full md:w-48 bg-gray-300 rounded-lg ml-auto"></div>
                    </div>

                </div>

            </div>
        </div>
    );
}

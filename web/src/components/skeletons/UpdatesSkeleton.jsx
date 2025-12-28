import React from 'react';

const UpdatesSkeleton = () => {
    return (
        <>
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-pulse transition-colors duration-300"
                >
                    {/* Timeline Icon Skeleton */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-300">
                    </div>

                    {/* Content Card Skeleton */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                        {/* Header: Badge & Date */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300"></div>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>

                        {/* Title */}
                        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4 transition-colors duration-300"></div>

                        {/* Version & Tags */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2 mb-4">
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>

                        {/* Image Placeholder */}
                        <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm h-48 bg-gray-200 dark:bg-gray-700 w-full transition-colors duration-300"></div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default UpdatesSkeleton;

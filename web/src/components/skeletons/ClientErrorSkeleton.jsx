import React from 'react';

const ClientErrorSkeleton = () => {
    return (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 animate-pulse border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="flex gap-2">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 h-24 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
                        <div className="col-span-1 space-y-2">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClientErrorSkeleton;

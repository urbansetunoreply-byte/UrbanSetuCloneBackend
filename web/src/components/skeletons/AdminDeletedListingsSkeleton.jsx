import React from 'react';
import { FaTrash } from 'react-icons/fa';

const AdminDeletedListingsSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans animate-pulse transition-colors duration-300">
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="h-10 w-64 bg-gray-300 dark:bg-gray-700 rounded mb-2 flex items-center gap-2">
                            {/* Icon mimic */}
                            <div className="w-8 h-8 rounded-full bg-red-200 dark:bg-red-900/50"></div>
                        </div>
                        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    </div>
                    <div className="h-10 w-40 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                </div>

                {/* Filters Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6 transition-colors duration-300">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-full md:w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            {/* Table Header */}
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                                <tr>
                                    <th className="px-6 py-4"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div></th>
                                    <th className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div></th>
                                    <th className="px-6 py-4"><div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div></th>
                                    <th className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div></th>
                                    <th className="px-6 py-4 text-right"><div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded ml-auto"></div></th>
                                </tr>
                            </thead>
                            {/* Table Body Rows */}
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <tr key={i} className="">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 bg-gray-300 dark:bg-gray-650 rounded"></div>
                                                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="h-5 w-24 bg-purple-100 dark:bg-purple-900/30 rounded"></div>
                                                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="h-3 w-20 bg-gray-300 dark:bg-gray-650 rounded"></div>
                                                    <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="h-3 w-24 bg-green-100 dark:bg-green-900/30 rounded"></div>
                                                <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-block h-8 w-24 bg-green-100 dark:bg-green-900/30 rounded-lg"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDeletedListingsSkeleton;

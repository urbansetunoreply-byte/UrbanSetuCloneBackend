import React from "react";

export default function MyDeletedListingsSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            <div className="p-4 border-b border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {[1, 2, 3, 4].map((i) => (
                                <th key={i} className="px-6 py-4">
                                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <tr key={item} className="">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                                        <div className="flex flex-col gap-2">
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="h-8 bg-gray-200 rounded w-24 inline-block"></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import React from "react";

export default function ListingSkeletonGrid({ count = 8 }) {
  const items = Array.from({ length: count });
  return (
    <>
      {items.map((_, idx) => (
        <div key={idx} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse transition-colors duration-300">
          <div className="aspect-[16/10] w-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 transition-colors duration-300" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 transition-colors duration-300" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 transition-colors duration-300" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded shadow-sm w-full mt-4 transition-colors duration-300" />
          </div>
        </div>
      ))}
    </>
  );
}

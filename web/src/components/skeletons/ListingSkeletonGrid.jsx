import React from "react";

export default function ListingSkeletonGrid({ count = 8 }) {
  const items = Array.from({ length: count });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((_, idx) => (
        <div key={idx} className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="aspect-[16/10] w-full bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-8 bg-gray-200 rounded w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

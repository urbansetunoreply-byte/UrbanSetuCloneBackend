import React from "react";

export default function ListingSkeletonGrid({ count = 8 }) {
  const items = Array.from({ length: count });
  return (
    <>
      {items.map((_, idx) => (
        <div key={idx} className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="aspect-[16/10] w-full bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-10 bg-gray-200 rounded shadow-sm w-full mt-4" />
          </div>
        </div>
      ))}
    </>
  );
}

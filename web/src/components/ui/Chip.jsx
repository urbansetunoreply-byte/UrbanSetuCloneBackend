import React from "react";

export default function Chip({ label, onRemove, className = "", icon = null }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border ${className}`}>
      {icon}
      {label}
      {onRemove && (
        <button
          type="button"
          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
          onClick={onRemove}
          aria-label="Remove filter"
        >
          ×
        </button>
      )}
    </span>
  );
}

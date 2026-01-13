import React from "react";

export default function StepIndicator({ steps = [], current = 0, className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {steps.map((label, idx) => {
        const active = idx === current;
        const done = idx < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={
                `h-2.5 w-2.5 rounded-full ` +
                (active ? "bg-blue-600 dark:bg-blue-500" : done ? "bg-green-500 dark:bg-green-400" : "bg-gray-300 dark:bg-gray-600")
              }
              title={label}
            />
            <span className={`text-xs ${active ? "text-gray-800 dark:text-white font-semibold" : "text-gray-500 dark:text-gray-400"}`}>
              {label}
            </span>
            {idx !== steps.length - 1 && (
              <div className="h-px w-6 bg-gray-300 dark:bg-gray-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}

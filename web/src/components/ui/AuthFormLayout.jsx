import React from "react";

export default function AuthFormLayout({ leftSlot, children }) {
  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950 transition-colors duration-300">
      {leftSlot}
      {children}
    </div>
  );
}

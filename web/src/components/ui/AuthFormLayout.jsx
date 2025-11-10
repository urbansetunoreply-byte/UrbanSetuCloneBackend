import React from "react";

export default function AuthFormLayout({ leftSlot, children }) {
  return (
    <div className="min-h-screen flex">
      {leftSlot}
      {children}
    </div>
  );
}

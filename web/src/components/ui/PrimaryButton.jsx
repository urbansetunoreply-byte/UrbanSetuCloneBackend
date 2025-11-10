import React from "react";

const variants = {
  blue: "from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
  green: "from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700",
  orange: "from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700",
  teal: "from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700",
};

export default function PrimaryButton({
  children,
  loading = false,
  loadingText = "",
  disabled = false,
  variant = "blue",
  className = "",
  type = "submit",
}) {
  const gradient = variants[variant] || variants.blue;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`w-full py-3 px-4 bg-gradient-to-r ${gradient} text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 ${className}`}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          {loadingText || children}
        </div>
      ) : (
        children
      )}
    </button>
  );
}

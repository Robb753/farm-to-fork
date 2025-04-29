import React from "react";

export function Badge({ children, className = "", variant = "default" }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        variant === "outline" ? "border" : "bg-green-100 text-green-700"
      } ${className}`}
    >
      {children}
    </span>
  );
}

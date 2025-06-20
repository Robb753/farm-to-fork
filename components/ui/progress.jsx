"use client";

import * as React from "react";

export function Progress({ value, className = "", ...props }) {
  return (
    <div
      className={`relative w-full h-2 bg-muted rounded overflow-hidden ${className}`}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

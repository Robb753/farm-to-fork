// app/_components/ui/Skeleton.tsx
"use client";
export default function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200/70 ${className}`} />
  );
}

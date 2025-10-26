// app/modules/listings/components/ListingSkeleton.tsx
"use client";
import Skeleton from "@/app/_components/ui/Skeleton";

export default function ListingSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <Skeleton className="h-28 w-40 rounded-lg" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function useUpdateExploreUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (updates = {}) => {
    const currentParams = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    const newUrl = `/explore?${currentParams.toString()}`;

    if (updates.returnUrlOnly) {
      return newUrl;
    }

    router.replace(newUrl, { scroll: false });
  };
}

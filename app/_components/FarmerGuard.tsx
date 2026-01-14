// app/_components/FarmerGuard.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { COLORS } from "@/lib/config";

interface FarmerGuardProps {
  children: ReactNode;
}

export default function FarmerGuard({ children }: FarmerGuardProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const role = user?.publicMetadata?.role;
  const isFarmer = role === "farmer";

  useEffect(() => {
    if (!isLoaded) return;

    // Not logged in → redirect to sign-in with redirect_url
    if (!user) {
      const redirectUrl =
        typeof window !== "undefined" ? window.location.href : pathname || "/";
      router.replace(
        `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
      );
      return;
    }

    // Logged in but not farmer → unauthorized
    if (!isFarmer) {
      router.replace("/unauthorized");
    }
  }, [isLoaded, user, isFarmer, router, pathname]);

  // Loading while Clerk is hydrating
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{
            borderTopColor: COLORS.PRIMARY,
            borderBottomColor: COLORS.PRIMARY,
          }}
        />
      </div>
    );
  }

  // While redirecting (not logged or not farmer), keep a loader (no flash)
  if (!user || !isFarmer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{
            borderTopColor: COLORS.PRIMARY,
            borderBottomColor: COLORS.PRIMARY,
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}

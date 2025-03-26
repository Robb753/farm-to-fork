// hooks/useUserRole.js
"use client";

import { useUser } from "@clerk/nextjs";

export function useUserRole() {
  const { user, isLoaded } = useUser();

  const role = user?.publicMetadata?.role || "user";
  const isFarmer = role === "farmer";
  const isUser = role === "user";

  return {
    role,
    isFarmer,
    isUser,
    isLoaded,
  };
}

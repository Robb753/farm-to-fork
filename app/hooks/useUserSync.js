"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { updateClerkRole, syncProfileToSupabase } from "@/lib/syncUserUtils";
import { supabase } from "@/utils/supabase/client";

const ADMIN_EMAILS = ["admin@farm2fork.fr"];

export default function useUserSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSyncing, setIsSyncing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const processedRef = useRef(false);
  const initialSyncCompleted = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (processedRef.current && initialSyncCompleted.current) return;

    const syncUser = async () => {
      if (!isSignedIn || !user) {
        setUserRole(null);
        setIsReady(true);
        return;
      }

      // ✅ Rôle admin prioritaire par email
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;
      if (email && ADMIN_EMAILS.includes(email)) {
        setUserRole("admin");
        setIsReady(true);
        return;
      }

      setIsSyncing(true);
      try {
        const isNewSignup = searchParams.get("newSignup") === "true";
        const urlRole = searchParams.get("role");

        if (isNewSignup && urlRole) {
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("newSignup");
          newParams.delete("role");

          if (newParams.toString()) {
            router.replace(`${pathname}?${newParams.toString()}`);
          } else {
            router.replace(pathname);
          }

          await processRole(urlRole);
        } else {
          await determineAndProcessRole();
        }

        initialSyncCompleted.current = true;
      } catch (error) {
        console.error("[DEBUG] Erreur de synchronisation:", error);
      } finally {
        setIsSyncing(false);
        setIsReady(true);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, router, pathname, searchParams]);

  const determineAndProcessRole = async () => {
    try {
      let role = "user";

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData?.role && !error) {
        role = profileData.role;
      }

      if (!["user", "farmer"].includes(role)) {
        console.warn("[DEBUG] Aucun rôle sûr trouvé, fallback 'user'");
        role = "user";
      }

      processedRef.current = true;
      await processRole(role);
    } catch (error) {
      console.error("[DEBUG] Erreur détermination rôle:", error);
    }
  };

  const processRole = async (role) => {
    if (!["user", "farmer"].includes(role)) {
      console.error("[SECURITE] processRole reçoit un rôle invalide:", role);
      return;
    }

    setUserRole(role);

    try {
      const currentClerkRole = user.publicMetadata?.role;
      if (!currentClerkRole || currentClerkRole !== role) {
        const updated = await updateClerkRole(user.id, role);

        if (updated && role === "user") {
          sessionStorage.removeItem("pendingUserRole");
          localStorage.removeItem("userRole");
        }
      }

      await syncProfileToSupabase(user, role, { createListing: false });
    } catch (err) {
      console.error("[DEBUG] Erreur processRole:", err);
    }
  };

  return {
    user,
    isLoaded,
    isSignedIn,
    isSyncing,
    isReady,
    role: userRole,
    isFarmer: userRole === "farmer",
    isUser: userRole === "user" || !userRole,
    isAdmin: userRole === "admin",
  };
}

// hooks/useUserSync.js
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  updateClerkRole,
  syncProfileToSupabase,
  ensureFarmerListing,
} from "@/lib/syncUserUtils";
import { supabase } from "@/utils/supabase/client";

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

      setIsSyncing(true);
      try {
        const isNewSignup = searchParams.get("newSignup") === "true";
        const urlRole = searchParams.get("role");

        console.log(
          `[DEBUG] Nouvelle inscription: ${isNewSignup}, Rôle URL: ${urlRole}`
        );
        console.log(`[DEBUG] Chemin actuel: ${pathname}`);

        if (
          isNewSignup &&
          urlRole === "farmer" &&
          pathname !== "/dashboard/farms"
        ) {
          console.log(
            "[DEBUG] Redirection immédiate d'un nouvel agriculteur vers dashboard"
          );
          localStorage.setItem("isNewFarmer", "true");
          localStorage.setItem("userRole", "farmer");

          if (user) {
            console.log(
              "[DEBUG] Mise à jour forcée du rôle farmer avant redirection"
            );
            await updateClerkRole(user.id, "farmer").catch((err) => {
              console.error(
                "[DEBUG] Erreur lors de la mise à jour du rôle:",
                err
              );
            });
          }

          processedRef.current = true;
          initialSyncCompleted.current = true;

          console.log("[DEBUG] Redirection vers /dashboard/farms");
          setTimeout(() => {
            window.location.href = "/dashboard/farms";
          }, 100);
          return;
        }

        if (isNewSignup && urlRole) {
          console.log(
            "[DEBUG] Nouvelle inscription détectée avec rôle:",
            urlRole
          );

          const role = urlRole;
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("newSignup");
          newParams.delete("role");

          if (newParams.toString()) {
            router.replace(`${pathname}?${newParams.toString()}`);
          } else {
            router.replace(pathname);
          }

          if (role) {
            await processRole(role);
          }
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
      let role = null;
      const isNewFarmer = localStorage.getItem("isNewFarmer") === "true";
      if (isNewFarmer) {
        role = "farmer";
        console.log("[DEBUG] Rôle 'farmer' récupéré depuis flag isNewFarmer");
      }

      if (!role) {
        role = user.publicMetadata?.role;
        if (role) {
          console.log("[DEBUG] Rôle récupéré depuis Clerk:", role);
        }
      }

      if (!role) {
        const pendingRole =
          sessionStorage.getItem("pendingUserRole") ||
          localStorage.getItem("userRole");
        if (pendingRole) {
          role = pendingRole;
          console.log("[DEBUG] Rôle récupéré depuis Storage:", role);
        }
      }

      if (!role) {
        try {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();

          if (error) {
            console.error("[DEBUG] Erreur récupération profil:", error);
          } else if (profileData?.role) {
            role = profileData.role;
            console.log("[DEBUG] Rôle récupéré depuis Supabase:", role);
          }
        } catch (err) {
          console.error("[DEBUG] Exception récupération profil:", err);
        }
      }

      if (!role) {
        const wasRedirectedFromSignup =
          document.referrer.includes("sign-up") ||
          document.referrer.includes("signup-role");

        if (
          wasRedirectedFromSignup &&
          (sessionStorage.getItem("isNewFarmer") === "true" ||
            document.referrer.includes("farmer") ||
            pathname.includes("dashboard") ||
            pathname.includes("farm"))
        ) {
          console.log("[DEBUG] Traces d'inscription farmer détectées");
          role = "farmer";
          localStorage.setItem("userRole", "farmer");
          localStorage.setItem("isNewFarmer", "true");
        } else {
          console.log("[DEBUG] Aucun rôle trouvé, fallback 'user'");
          role = "user";
        }
      }

      processedRef.current = true;
      await processRole(role);
    } catch (error) {
      console.error("[DEBUG] Erreur détermination rôle:", error);
    }
  };

  const processRole = async (role) => {
    console.log("[DEBUG] Traitement du rôle:", role);
    setUserRole(role);

    try {
      if (role === "farmer") {
        localStorage.setItem("userRole", "farmer");
      }

      const currentClerkRole = user.publicMetadata?.role;
      if (!currentClerkRole || currentClerkRole !== role) {
        console.log(
          `[DEBUG] Différence de rôle: Clerk=${currentClerkRole}, Local=${role}`
        );
        const updated = await updateClerkRole(user.id, role);

        if (updated && role !== "farmer") {
          sessionStorage.removeItem("pendingUserRole");
          localStorage.removeItem("userRole");
        }
      } else {
        console.log(`[DEBUG] Rôle déjà à jour dans Clerk: ${currentClerkRole}`);
      }

      await syncProfileToSupabase(user, role);
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
  };
}

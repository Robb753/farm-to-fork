"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  determineUserRole,
  updateClerkRole,
  syncProfileToSupabase,
} from "@/lib/syncUserUtils";
import { toast } from "sonner";

const UserRoleContext = createContext();

export const useUserRole = () => useContext(UserRoleContext);

export function UserRoleProvider({ children }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [role, setRole] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [isWaitingForProfile, setIsWaitingForProfile] = useState(false);


  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const sync = async () => {
      setIsSyncing(true);
      setIsWaitingForProfile(true);
      setSyncError(null);

      try {
        // 1. Déterminer le rôle (Clerk → Supabase)
        const resolvedRole = await determineUserRole(user);
        setRole(resolvedRole);

        // 2. Mettre à jour Clerk si nécessaire
        if (user.publicMetadata?.role !== resolvedRole) {
          await updateClerkRole(user.id, resolvedRole);
        }

        // 3. Synchroniser Supabase
        await syncProfileToSupabase(user, resolvedRole);

        setIsReady(true);
      } catch (error) {
        console.error("[UserRoleContext] Erreur de synchronisation:", error);
        setSyncError(error.message || "Erreur de synchronisation");

        toast.error(
          "Erreur de synchronisation du profil. Certaines fonctionnalités peuvent être limitées."
        );

        // En cas d’erreur, on fallback sur "user"
        setRole("user");
        setIsReady(true);
      } finally {
        setIsSyncing(false);
        setIsWaitingForProfile(false);
      }
    };

    sync();
  }, [isLoaded, isSignedIn, user?.id]);

  const resyncRole = async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const resolvedRole = await determineUserRole(user);
      setRole(resolvedRole);

      await updateClerkRole(user.id, resolvedRole);
      await syncProfileToSupabase(user, resolvedRole);

      toast.success("Profil synchronisé avec succès");
      setIsReady(true);
    } catch (error) {
      console.error("[UserRoleContext] Échec re-sync:", error);
      setSyncError(error.message || "Échec de la re-synchronisation");
      toast.error("Erreur pendant la re-synchronisation du rôle.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <UserRoleContext.Provider
      value={{
        role,
        setRole,
        isFarmer: role === "farmer",
        isUser: role === "user",
        isSyncing,
        isReady,
        isWaitingForProfile,
        syncError,
        resyncRole,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

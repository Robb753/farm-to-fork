// context/UserRoleContext.js
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

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    // Vérifier s'il y a eu une synchronisation récente pour éviter les appels inutiles
    const lastSyncTime = sessionStorage.getItem("lastRoleSyncTime");
    const now = Date.now();
    if (lastSyncTime && now - parseInt(lastSyncTime) < 30000) {
      // 30 secondes de cooldown
      // Utiliser le rôle déjà stocké
      const storedRole = localStorage.getItem("userRole");
      if (storedRole === "farmer" || storedRole === "user") {
        setRole(storedRole);
        setIsReady(true);
        return;
      }
    }

    const sync = async () => {
      setIsSyncing(true);
      setSyncError(null);

      try {
        // Déterminer le rôle de l'utilisateur
        const resolvedRole = await determineUserRole(user);
        setRole(resolvedRole);

        // Persister le rôle dans le localStorage pour le récupérer facilement
        localStorage.setItem("userRole", resolvedRole);

        // Mettre à jour Clerk si différent
        if (user.publicMetadata?.role !== resolvedRole) {
          const clerkUpdated = await updateClerkRole(user.id, resolvedRole);
          if (!clerkUpdated) {
            console.warn(
              "[DEBUG] Échec de mise à jour Clerk, utilisation du rôle local"
            );
            // On continue malgré l'erreur
          }
        }

        // Synchroniser le profil Supabase
        await syncProfileToSupabase(user, resolvedRole);

        // Marquer le moment de la dernière synchronisation
        sessionStorage.setItem("lastRoleSyncTime", now.toString());

        setIsReady(true);
      } catch (error) {
        console.error("[DEBUG] Erreur lors de la synchronisation:", error);
        setSyncError(error.message || "Erreur de synchronisation du profil");

        // Notification à l'utilisateur
        toast.error(
          "Problème de synchronisation du profil. Certaines fonctionnalités peuvent être limitées."
        );

        // Utiliser un rôle de secours
        const fallbackRole = localStorage.getItem("userRole") || "user";
        setRole(fallbackRole);
        setIsReady(true);
      } finally {
        setIsSyncing(false);
      }
    };

    sync();
  }, [isLoaded, isSignedIn, user?.id]); // Dépendance sur user.id au lieu de user

  // Fonction pour forcer une re-synchronisation si nécessaire
  const resyncRole = async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const resolvedRole = await determineUserRole(user);
      setRole(resolvedRole);
      localStorage.setItem("userRole", resolvedRole);

      // Mettre à jour Clerk
      await updateClerkRole(user.id, resolvedRole);

      // Synchroniser Supabase
      await syncProfileToSupabase(user, resolvedRole);

      // Mettre à jour le timestamp de synchronisation
      sessionStorage.setItem("lastRoleSyncTime", Date.now().toString());

      toast.success("Profil synchronisé avec succès");
      setIsReady(true);
    } catch (error) {
      console.error("[DEBUG] Erreur lors de la re-synchronisation:", error);
      setSyncError(error.message || "Échec de la synchronisation");
      toast.error("Échec de la synchronisation du profil");
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
        syncError,
        resyncRole, // Exposer la fonction de re-synchronisation
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

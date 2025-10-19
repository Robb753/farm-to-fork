// app/contexts/UserRoleTransitionProvider.tsx
"use client";

import { createContext, useContext, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  useUserStore,
  useUserRole,
  useUserSyncState,
  useUserActions,
} from "@/lib/store/userStore";

const UserRoleTransitionContext = createContext<any>(null);

/**
 * Provider de transition qui remplace UserRoleContext
 * mais utilise Zustand en arrière-plan
 */
export function UserRoleTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useUser();
  const role = useUserRole();
  const { isSyncing, isReady, isWaitingForProfile, syncError } =
    useUserSyncState();
  const { syncUser, resyncRole } = useUserActions();

  // Synchronisation automatique quand l'utilisateur Clerk change
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    syncUser(user);
  }, [isLoaded, isSignedIn, user?.id, syncUser]);

  // Fonction de re-sync compatible avec l'ancienne API
  const resyncRoleCompat = async () => {
    if (!user) return;
    await resyncRole(user);
  };

  // Expose la même API que l'ancien contexte
  const value = {
    role,
    setRole: () => {}, // Deprecated, géré automatiquement maintenant
    isFarmer: role === "farmer",
    isUser: role === "user",
    isSyncing,
    isReady,
    isWaitingForProfile,
    syncError,
    resyncRole: resyncRoleCompat,
  };

  return (
    <UserRoleTransitionContext.Provider value={value}>
      {children}
    </UserRoleTransitionContext.Provider>
  );
}

// Hook de transition qui garde la même signature
export const useUserRoleTransition = () => {
  const context = useContext(UserRoleTransitionContext);
  if (!context) {
    throw new Error(
      "useUserRoleTransition must be used within a UserRoleTransitionProvider"
    );
  }
  return context;
};

// Hook direct sans contexte (plus performant)
export const useUserRoleDirect = () => {
  const role = useUserRole();
  const syncState = useUserSyncState();
  const { resyncRole: resyncRoleAction } = useUserActions();
  const { user } = useUser();

  const resyncRole = async () => {
    if (!user) return;
    await resyncRoleAction(user);
  };

  return {
    role,
    isFarmer: role === "farmer",
    isUser: role === "user",
    ...syncState,
    resyncRole,
  };
};

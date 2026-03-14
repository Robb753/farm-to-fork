"use client";

import React, { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useUserActions } from "@/lib/store/userStore";
import type { ClerkUserDTO } from "@/lib/store/userStore";

const AuthSync: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { syncUser, setReady, setRole, logoutReset } = useUserActions();

  const syncingRef = useRef<boolean>(false);
  // Ref pour toujours avoir accès à l'objet user le plus récent dans l'effet,
  // sans en faire une dépendance instable (Clerk renvoie un nouvel objet à chaque render).
  const userRef = useRef(user);
  userRef.current = user;

  // Mémorise l'userId pour lequel la sync a déjà réussi.
  // Évite la double sync déclenchée par la mise à jour de user.updatedAt
  // après que updateClerkRole() modifie les métadonnées Clerk.
  const syncedForUserIdRef = useRef<string | null>(null);

  // Seul userId contrôle quand l'effet se relance (pas userUpdatedAt).
  const userId = user?.id;

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    const currentUser = userRef.current;

    const run = async () => {
      // ======================
      // CAS DÉCONNECTÉ
      // ======================
      if (!isSignedIn || !currentUser) {
        syncedForUserIdRef.current = null;
        try {
          await logoutReset?.();
        } finally {
          if (!cancelled) {
            setRole(null);
            setReady(true);
            syncingRef.current = false;
          }
        }
        return;
      }

      // ======================
      // CAS CONNECTÉ
      // ======================
      // Ne pas re-synchroniser si cet userId a déjà été traité avec succès.
      // Les mises à jour de rôle explicites passent par resyncRole(), pas par ici.
      if (syncedForUserIdRef.current === currentUser.id) return;
      if (syncingRef.current) return;
      syncingRef.current = true;

      try {
        const email =
          currentUser.primaryEmailAddress?.emailAddress ??
          currentUser.emailAddresses?.[0]?.emailAddress ??
          null;

        const publicMetadata: ClerkUserDTO["publicMetadata"] =
          (currentUser.publicMetadata ?? {}) as ClerkUserDTO["publicMetadata"];

        const dto: ClerkUserDTO = {
          id: currentUser.id,
          firstName: currentUser.firstName ?? null,
          lastName: currentUser.lastName ?? null,
          email,
          imageUrl: currentUser.imageUrl ?? null,
          username: currentUser.username ?? null,
          publicMetadata,
        };

        await syncUser(dto);

        if (!cancelled) {
          syncedForUserIdRef.current = currentUser.id;
          setReady(true);
        }
      } catch (error) {
        console.error("Erreur lors de la synchronisation utilisateur:", error);
        if (!cancelled) setReady(true);
      } finally {
        syncingRef.current = false;
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  // userId (stable) remplace user (objet instable) et userUpdatedAt (change après updateClerkRole).
  }, [isLoaded, isSignedIn, userId, syncUser, logoutReset, setReady, setRole]);

  return null;
};

export default AuthSync;

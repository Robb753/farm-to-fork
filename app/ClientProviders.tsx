// app/ClientProviders.tsx
"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useUserActions } from "@/lib/store/userStore";
import type { ClerkUserDTO } from "@/lib/store/userStore";

interface ClientProvidersProps {
  children: React.ReactNode;
}

const ModernAuthSystem = dynamic(
  () => import("./_components/auth/ModernAuthSystem"),
  { ssr: false, loading: () => null }
);

const AppLoadingNotifier = dynamic(() => import("@/utils/AppLoadingNotifier"), {
  ssr: false,
  loading: () => null,
});

const HashCleaner: React.FC = () => {
  useEffect(() => {
    const clearHash = (): void => {
      const h = window.location.hash || "";

      // garder les routes Clerk
      if (/^#\/(sign-in|sign-up)/.test(h)) return;

      // nettoyer les hashes temporaires d'auth
      if (/^#\/(factor-one|factor-two|sso-callback)/.test(h)) {
        window.setTimeout(() => {
          if (window.location.hash === h) {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search
            );
          }
        }, 1000);
      }
    };

    clearHash();
    window.addEventListener("hashchange", clearHash);
    return () => window.removeEventListener("hashchange", clearHash);
  }, []);

  return null;
};

const AuthSync: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { syncUser, setReady, setRole, logoutReset } = useUserActions();

  const syncingRef = useRef<boolean>(false);
  // Ref pour toujours avoir accès à l'objet user le plus récent dans l'effet,
  // sans en faire une dépendance instable (Clerk renvoie un nouvel objet à chaque render).
  const userRef = useRef(user);
  userRef.current = user;

  // Primitives stables extraites de user pour contrôler quand l'effet se relance.
  const userId = user?.id;
  const userUpdatedAt = user?.updatedAt?.getTime();

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    const currentUser = userRef.current;

    const run = async () => {
      // ======================
      // CAS DÉCONNECTÉ
      // ======================
      if (!isSignedIn || !currentUser) {
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
  // userId et userUpdatedAt remplacent `user` (objet instable) comme dépendances.
  }, [isLoaded, isSignedIn, userId, userUpdatedAt, syncUser, logoutReset, setReady, setRole]);

  return null;
};

export default function ClientProviders({
  children,
}: ClientProvidersProps): JSX.Element {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "white",
            color: "black",
            border: "1px solid #e5e7eb",
          },
        }}
      />

      <ModernAuthSystem />
      <HashCleaner />
      <AuthSync />
      <AppLoadingNotifier />

      {children}
    </>
  );
}

export type { ClientProvidersProps };

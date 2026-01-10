// app/ClientProviders.tsx
"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import { useUser } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";
import { useUserActions } from "@/lib/store/userStore";

/**
 * Interface pour les props de ClientProviders
 */
interface ClientProvidersProps {
  /** Contenu à wrapper avec les providers */
  children: React.ReactNode;
}

/**
 * Chargement dynamique des composants d'authentification
 */
const ModernAuthSystem = dynamic(
  () => import("./_components/auth/ModernAuthSystem"),
  {
    ssr: false,
    loading: () => null, // Évite les spinners multiples
  }
);

const AppLoadingNotifier = dynamic(() => import("@/utils/AppLoadingNotifier"), {
  ssr: false,
  loading: () => null,
});

/**
 * Composant pour nettoyer les hashes d'authentification
 *
 * Gère le nettoyage automatique des fragments d'URL liés à l'auth
 * après completion des flux Clerk (sign-in, sign-up, SSO, etc.)
 */
const HashCleaner: React.FC = () => {
  useEffect(() => {
    const clearHash = (): void => {
      const h = window.location.hash || "";

      // Garder les hashes de sign-in/sign-up actifs
      if (/^#\/(sign-in|sign-up)/.test(h)) return;

      // Nettoyer les hashes temporaires d'auth après délai
      if (/^#\/(factor-one|factor-two|sso-callback)/.test(h)) {
        setTimeout(() => {
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

    // Nettoyage initial et sur changement
    clearHash();
    window.addEventListener("hashchange", clearHash);

    return () => window.removeEventListener("hashchange", clearHash);
  }, []);

  return null;
};

/**
 * Composant pour synchroniser l'état utilisateur avec Clerk
 *
 * Maintient la synchronisation entre l'état d'authentification Clerk
 * et le store utilisateur de l'application. Gère les transitions
 * de connexion/déconnexion de manière robuste.
 */
const AuthSync: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { syncUser, setReady, setRole, logoutReset } = useUserActions();
  const syncingRef = useRef<boolean>(false);

  useEffect(() => {
    // Attendre que Clerk soit chargé
    if (!isLoaded) return;

    // Cas déconnecté : nettoyer le store
    if (!isSignedIn || !user) {
      if (logoutReset) {
        logoutReset();
      }
      setRole(null);
      setReady(true);
      return;
    }

    // Éviter les synchronisations multiples simultanées
    if (syncingRef.current) return;

    syncingRef.current = true;

    // Synchronisation asynchrone avec l'utilisateur Clerk
    (async () => {
      try {
        // Adaptateur pour convertir UserResource vers le format attendu
        const adaptedUser = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddresses: user.emailAddresses,
          primaryEmailAddressId: user.primaryEmailAddressId,
          primaryEmailAddress: user.primaryEmailAddress,
          imageUrl: user.imageUrl,
          username: user.username,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          publicMetadata: user.publicMetadata,
          // Propriétés manquantes avec valeurs par défaut
          banned: false,
          locked: false,
          privateMetadata: {},
          lastActiveAt: user.lastSignInAt || user.createdAt,
        };

        // Cast is safe as we've included all required properties
        await syncUser(adaptedUser as UserResource);
      } catch (error) {
        console.error("Erreur lors de la synchronisation utilisateur:", error);
        // En cas d'erreur, marquer comme prêt quand même
        setReady(true);
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [isLoaded, isSignedIn, user, syncUser, logoutReset, setReady, setRole]);

  return null;
};

/**
 * Providers client principaux de Farm To Fork
 *
 * Ce composant wrapper toutes les fonctionnalités globales côté client :
 * - Notifications avec Sonner
 * - Système d'authentification moderne
 * - Nettoyage automatique des URLs d'auth
 * - Synchronisation état utilisateur
 * - Indicateur de chargement global
 *
 * Features:
 * - Chargement dynamique pour optimiser les performances
 * - Gestion d'erreurs robuste
 * - Synchronisation Clerk bidirectionnelle
 * - Nettoyage automatique des artifacts d'auth
 * - Types TypeScript stricts
 * - Protection contre les renders multiples
 *
 * @param props - Configuration des providers
 * @returns Wrapper de providers complet
 */
export default function ClientProviders({
  children,
}: ClientProvidersProps): JSX.Element {
  return (
    <>
      {/* Système de notifications global */}
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

      {/* Système d'authentification moderne */}
      <ModernAuthSystem />

      {/* Nettoyeur de hash d'authentification */}
      <HashCleaner />

      {/* Synchronisateur d'état utilisateur */}
      <AuthSync />

      {/* Notificateur de chargement d'app */}
      <AppLoadingNotifier />

      {/* Contenu principal */}
      {children}
    </>
  );
}

/**
 * Export des types pour utilisation externe
 */
export type { ClientProvidersProps };

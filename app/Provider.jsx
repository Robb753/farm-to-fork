"use client";

import React, { useEffect, useRef } from "react";
import Header from "./_components/layout/Header";
import Footer from "./_components/layout/Footer";
import { Toaster } from "sonner";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useUserActions } from "@/lib/store/userStore";

// Lazy-load pour éviter les soucis d'hydratation et charger seulement si besoin
const ModernAuthSystem = dynamic(
  () => import("./_components/auth/ModernAuthSystem"),
  { ssr: false }
);
const AppLoadingNotifier = dynamic(() => import("@/utils/AppLoadingNotifier"), {
  ssr: false,
});

// Nettoie les hashes internes de Clerk (#/sign-in, #/factor-one, etc.)
function clearAuthHash() {
  if (typeof window === "undefined") return;

  const hash = window.location.hash || "";

  // NE PAS nettoyer si on est dans un processus d'auth actif
  const isActiveAuth = /^#\/(sign-in|sign-up)/.test(hash);
  if (isActiveAuth) return; // Laisser Clerk gérer

  // Nettoyer seulement les hash "orphelins" après auth
  const shouldClear = /^#\/(factor-one|factor-two|sso-callback)/.test(hash);
  if (shouldClear) {
    // Attendre un peu avant de nettoyer (laisser à Clerk le temps de traiter)
    setTimeout(() => {
      if (window.location.hash === hash) {
        // Si toujours là après 1s
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }
    }, 1000);
  }
}

function HashCleaner() {
  useEffect(() => {
    // Nettoyer au chargement
    clearAuthHash();

    // Nettoyer lors des changements de hash (si quelqu'un navigue avec le bouton retour)
    const handleHashChange = () => clearAuthHash();
    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  return null;
}

// Bridge minimal pour garder le store à jour
function AuthSyncBridge() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { syncUser, setReady, setRole, logoutReset } = useUserActions();

  // évite les doubles appels en mode Strict (montage/démontage)
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    // Déconnecté : purge propre du store + prêt UI
    if (!isSignedIn || !user) {
      logoutReset?.(); // efface aussi le persist local
      setRole(null);
      setReady(true);
      return;
    }

    // Connecté : synchronisation profil/rôle (évite multi-run)
    if (syncingRef.current) return;
    syncingRef.current = true;
    (async () => {
      try {
        await syncUser(user);
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [isLoaded, isSignedIn, user, syncUser, logoutReset, setReady, setRole]);

  return null;
}

export default function Provider({ children }) {
  return (
    <>
      <Toaster />
      <ModernAuthSystem />
      <HashCleaner />
      <AuthSyncBridge />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <AppLoadingNotifier />
    </>
  );
}

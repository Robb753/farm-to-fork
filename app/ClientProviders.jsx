// app/ClientProviders.jsx
"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useUserActions } from "@/lib/store/userStore";

const ModernAuthSystem = dynamic(
  () => import("./_components/auth/ModernAuthSystem"),
  { ssr: false }
);
const AppLoadingNotifier = dynamic(() => import("@/utils/AppLoadingNotifier"), {
  ssr: false,
});

function HashCleaner() {
  useEffect(() => {
    const clearHash = () => {
      const h = window.location.hash || "";
      if (/^#\/(sign-in|sign-up)/.test(h)) return;
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
    clearHash();
    window.addEventListener("hashchange", clearHash);
    return () => window.removeEventListener("hashchange", clearHash);
  }, []);
  return null;
}

function AuthSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { syncUser, setReady, setRole, logoutReset } = useUserActions();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      logoutReset?.();
      setRole(null);
      setReady(true);
      return;
    }

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

export default function ClientProviders({ children }) {
  return (
    <>
      <Toaster />
      <ModernAuthSystem />
      <HashCleaner />
      <AuthSync />
      <AppLoadingNotifier />
      {children}
    </>
  );
}

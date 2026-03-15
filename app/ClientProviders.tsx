// app/ClientProviders.tsx
"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";

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

const AuthSync = dynamic(() => import("./_components/AuthSync"), {
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

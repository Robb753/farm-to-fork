// app/ClientProviders.tsx
"use client";

import React, { useEffect, useLayoutEffect } from "react";
import { toast, Toaster } from "sonner";
import AuthSync from "./_components/AuthSync";
import { useSupabaseWithClerk } from "@/utils/supabase/client";
import { useUserActions } from "@/lib/store/userStore";
import { useCartStore } from "@/lib/store/cartStore";

interface ClientProvidersProps {
  children: React.ReactNode;
}

const SupabaseInitializer: React.FC = () => {
  const supabase = useSupabaseWithClerk();
  const { initSupabase } = useUserActions();

  useLayoutEffect(() => {
    initSupabase(supabase);
  }, [supabase, initSupabase]);

  return null;
};

const CART_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 heures

const CartExpiryChecker: React.FC = () => {
  useEffect(() => {
    const { cart, clearCart } = useCartStore.getState();
    if (cart.lastUpdated && Date.now() - cart.lastUpdated > CART_EXPIRY_MS) {
      clearCart();
      toast.info("Votre panier a expiré et a été vidé automatiquement.");
    }
  }, []);
  return null;
};

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

      <CartExpiryChecker />
      <HashCleaner />
      <SupabaseInitializer />
      <AuthSync />

      {children}
    </>
  );
}

export type { ClientProvidersProps };

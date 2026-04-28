"use client";

import { useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import type { Database } from "@/lib/types/database";

export function useSupabaseWithClerk(): SupabaseClient<Database> {
  const { getToken } = useAuth();

  // Stable ref to getToken — updated after each render via useEffect so the
  // accessToken callback always calls the latest Clerk function without a stale closure.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  });

  // useState initializer runs once per hook instance, giving a stable client
  // even when Clerk rotates the getToken reference during auth-state transitions.
  // getTokenRef.current is read only inside the async accessToken callback —
  // never during render. ESLint can't infer this from static analysis.
  /* eslint-disable react-hooks/refs */
  const [client] = useState<SupabaseClient<Database>>(() =>
    createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        accessToken: async () => {
          try {
            const token = await getTokenRef.current({ template: "supabase" });
            return token ?? null;
          } catch (_error) {
            // getToken() can fail during SSR / Next.js build — expected, return null.
            return null;
          }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    )
  );
  /* eslint-enable react-hooks/refs */

  return client;
}

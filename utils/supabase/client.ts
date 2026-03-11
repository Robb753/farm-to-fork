"use client";

import { useRef } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import type { Database } from "@/lib/types/database";

export function useSupabaseWithClerk(): SupabaseClient<Database> {
  const { getToken } = useAuth();

  // Always keep a fresh reference to getToken so the accessToken callback
  // never calls a stale closure, even if Clerk rotates the function reference.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create the client once per hook instance. Using useRef prevents a new
  // SupabaseClient (and new network connections) from being created every time
  // Clerk updates the getToken reference during auth-state transitions, which
  // would otherwise cause useAllListingsWithImages to re-fetch.
  const clientRef = useRef<SupabaseClient<Database> | null>(null);

  if (!clientRef.current) {
    clientRef.current = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
    });
  }

  return clientRef.current;
}

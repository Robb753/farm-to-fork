"use client";

import { useMemo } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import type { Database } from "@/lib/types/database";

export function useSupabaseWithClerk(): SupabaseClient<Database> {
  const { getToken } = useAuth();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return useMemo(() => {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => {
        try {
          const token = await getToken({ template: "supabase" });
          return token ?? null;
        } catch (error) {
          // Pendant le build Next.js ou SSR, getToken() peut échouer car il n'y a pas de contexte d'auth
          // C'est normal et attendu - on retourne simplement null
          return null;
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }, [supabaseUrl, supabaseAnonKey, getToken]);
}

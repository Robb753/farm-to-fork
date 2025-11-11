// utils/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Configuration et validation des variables d'environnement Supabase
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validation des variables d'environnement
if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL n'est pas définie dans les variables d'environnement"
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY n'est pas définie dans les variables d'environnement"
  );
}

/**
 * Client Supabase pour l'utilisation côté client avec types TypeScript
 *
 * Features:
 * - Types TypeScript complets pour votre base de données
 * - Validation des variables d'environnement au runtime
 * - Auto-completion pour toutes les tables et colonnes
 * - Type safety pour les requêtes et mutations
 *
 * @example
 * ```typescript
 * import { supabase } from "@/utils/supabase/client";
 *
 * // Types automatiques pour les requêtes
 * const { data, error } = await supabase
 *   .from("listing")
 *   .select("id, name, lat, lng")
 *   .eq("active", true);
 *
 * // data est maintenant typé comme Listing[]
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Export par défaut pour compatibilité
 */
export default supabase;

// utils/supabase/server-client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Configuration et validation des variables d'environnement Supabase (server-client)
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
 * Client Supabase pour les Server Components Next.js
 * 
 * Utilise la clé anonyme mais peut être utilisé côté serveur
 * pour les données publiques ou avec l'authentification utilisateur
 * 
 * Features:
 * - Respecte la RLS (Row Level Security)
 * - Types TypeScript complets
 * - Optimisé pour Server Components
 * - Session persistante si utilisateur connecté
 * 
 * @example
 * ```typescript
 * // Dans un Server Component
 * import { supabaseServerClient } from "@/utils/supabase/server-client";
 * 
 * export default async function ListingsPage() {
 *   const { data: listings } = await supabaseServerClient
 *     .from("listing")
 *     .select("*")
 *     .eq("active", true);
 * 
 *   return <ListingsGrid listings={listings} />;
 * }
 * ```
 */
export const supabaseServerClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Export par défaut pour compatibilité
 */
export default supabaseServerClient;
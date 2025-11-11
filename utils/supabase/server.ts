// utils/supabase/server.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Configuration et validation des variables d'environnement Supabase (serveur)
 */
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validation des variables d'environnement
if (!supabaseUrl) {
  throw new Error(
    "SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL n'est pas définie dans les variables d'environnement"
  );
}

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY n'est pas définie dans les variables d'environnement"
  );
}

/**
 * Client Supabase pour l'utilisation côté serveur avec clé service
 * 
 * ⚠️ ATTENTION: Ce client contourne la RLS (Row Level Security)
 * Utilisez uniquement dans les API routes et server components
 * 
 * Features:
 * - Accès complet à la base de données (bypass RLS)
 * - Types TypeScript complets
 * - Validation des variables d'environnement
 * - Optimisé pour les opérations administratives
 * 
 * @example
 * ```typescript
 * // Dans une API route
 * import { supabaseServer } from "@/utils/supabase/server";
 * 
 * export async function GET() {
 *   const { data, error } = await supabaseServer
 *     .from("farmer_requests")
 *     .select("*")
 *     .eq("status", "pending");
 * 
 *   return Response.json({ data });
 * }
 * ```
 */
export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
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
export default supabaseServer;
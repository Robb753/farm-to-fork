import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

let _client: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (!_client) {
    const url =
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase public client: SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and key are required"
      );
    }
    _client = createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

// Proxy so callers keep the `supabaseServerPublic.from(...)` API unchanged
// while the underlying client is created lazily on first use (not at module load).
export const supabaseServerPublic: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(_target, prop) {
      return (getClient() as any)[prop];
    },
  }
);

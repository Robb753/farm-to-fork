import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";

/**
 * Interface for Clerk auth result with getToken method
 */
interface ClerkAuthResult {
  userId: string | null;
  sessionId: string | null;
  getToken?: (options?: { template?: string }) => Promise<string | null>;
}

export async function createSupabaseServerWithClerk(): Promise<
  SupabaseClient<Database>
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authResult = (await Promise.resolve(auth())) as ClerkAuthResult;

  if (typeof authResult.getToken !== "function") {
    console.error(
      "Clerk auth() does not expose getToken(). Available keys:",
      Object.keys(authResult || {})
    );
    throw new Error("Clerk auth() does not expose getToken()");
  }

  const token = await authResult.getToken({ template: "supabase" });

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";

export async function createSupabaseServerWithClerk(): Promise<
  SupabaseClient<Database>
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authResult = await Promise.resolve(auth());
  const getToken = (authResult as any)?.getToken as
    | undefined
    | ((opts: any) => Promise<string | null>);

  if (typeof getToken !== "function") {
    console.log("Clerk auth() keys:", Object.keys(authResult || {}));
    throw new Error("Clerk auth() does not expose getToken()");
  }

  const token = await getToken({ template: "supabase" });

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

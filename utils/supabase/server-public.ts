import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export const supabaseServerPublic = createClient<Database>(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

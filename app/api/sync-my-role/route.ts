// app/api/sync-my-role/route.ts
// Synchronise le metadata Clerk de l'utilisateur connecté avec son rôle en DB.
// Seul l'utilisateur authentifié peut déclencher la sync de son propre rôle.

import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AllowedRole = "user" | "farmer" | "admin";
const ALLOWED_ROLES: AllowedRole[] = ["user", "farmer", "admin"];

export async function POST(): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Non authentifié" },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { success: false, error: "Configuration serveur manquante" },
      { status: 500 }
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Lire le rôle depuis Supabase — source de vérité, jamais depuis le body client
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json(
      { success: false, error: "Profil introuvable" },
      { status: 404 }
    );
  }

  const role = profile.role as AllowedRole;
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { success: false, error: "Rôle invalide en base de données" },
      { status: 400 }
    );
  }

  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { role },
    });
  } catch (err) {
    console.error("[SYNC-MY-ROLE] Erreur mise à jour Clerk:", err);
    return NextResponse.json(
      { success: false, error: "Impossible de synchroniser le rôle Clerk" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, role });
}

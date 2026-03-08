// app/api/admin/claims/route.ts
// GET — liste toutes les demandes de revendication (admin uniquement)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClaimStatus = "pending" | "approved" | "rejected";
type StatusFilter = ClaimStatus | "all";

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Variables Supabase manquantes");
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function isAdmin(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.publicMetadata?.role === "admin";
  } catch {
    return false;
  }
}

function parseStatus(value: string | null): StatusFilter {
  if (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "all"
  ) {
    return value;
  }

  return "pending";
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Non authentifié" },
      { status: 401 },
    );
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json(
      { success: false, message: "Accès refusé" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const status = parseStatus(searchParams.get("status"));

  const supabase = createSupabaseClient();

  let query = supabase
    .from("listing_claim_requests")
    .select(
      `
      id,
      listing_id,
      user_id,
      user_email,
      user_name,
      message,
      status,
      admin_note,
      reviewed_by,
      reviewed_at,
      created_at,
      listing ( id, name, address, osm_id )
    `,
    )
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[ADMIN/CLAIMS] Erreur fetch:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la récupération des demandes",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, claims: data ?? [] });
}

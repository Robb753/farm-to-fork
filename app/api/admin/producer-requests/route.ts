// app/api/admin/producer-requests/route.ts
// GET — liste toutes les demandes producteur (admin uniquement)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestStatus = "pending" | "approved" | "rejected";
type StatusFilter = RequestStatus | "all";
type TypeFilter = "create" | "claim" | "all";

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase manquantes");
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
  return "all";
}

function parseType(value: string | null): TypeFilter {
  if (value === "create" || value === "claim" || value === "all") return value;
  return "all";
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Non authentifié" },
      { status: 401 }
    );
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json(
      { success: false, message: "Accès refusé" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const status = parseStatus(searchParams.get("status"));
  const type = parseType(searchParams.get("type"));

  const supabase = createSupabaseClient();

  let query = supabase
    .from("producer_requests")
    .select(
      `
      id,
      type,
      user_id,
      user_email,
      user_name,
      farm_name,
      first_name,
      last_name,
      phone,
      siret,
      location,
      lat,
      lng,
      listing_id,
      status,
      admin_note,
      reviewed_by,
      reviewed_at,
      created_at,
      updated_at,
      listing ( id, name, address, osm_id )
    `
    )
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (type !== "all") {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[ADMIN/PRODUCER-REQUESTS] Erreur fetch:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la récupération des demandes" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, requests: data ?? [] });
}

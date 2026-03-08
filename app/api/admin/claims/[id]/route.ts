// app/api/admin/claims/[id]/route.ts
// PATCH — approuver ou rejeter une demande de revendication (admin uniquement)
//
// On approve :
//   1. Met à jour listing.clerk_user_id = user_id
//   2. Upsert profiles (role = farmer, farm_id)
//   3. Met à jour Clerk publicMetadata (role, claimedFarmId)
//   4. Met à jour listing_claim_requests.status = "approved"
//
// On reject :
//   1. Met à jour listing_claim_requests.status = "rejected"

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchBody {
  action: "approve" | "reject";
  admin_note?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const timestamp = new Date().toISOString();

  // 1. Auth + admin check
  const { userId: adminUserId } = await auth();
  if (!adminUserId) {
    return NextResponse.json(
      { success: false, message: "Non authentifié" },
      { status: 401 }
    );
  }

  if (!(await isAdmin(adminUserId))) {
    return NextResponse.json(
      { success: false, message: "Accès refusé" },
      { status: 403 }
    );
  }

  // 2. Parse body
  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  if (!["approve", "reject"].includes(body.action)) {
    return NextResponse.json(
      { success: false, message: "action doit être 'approve' ou 'reject'" },
      { status: 400 }
    );
  }

  const claimId = Number(params.id);
  if (!Number.isFinite(claimId) || claimId <= 0) {
    return NextResponse.json(
      { success: false, message: "ID de demande invalide" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient();

  // 3. Récupérer la demande
  const { data: claim, error: claimError } = await supabase
    .from("listing_claim_requests")
    .select("id, listing_id, user_id, user_email, status")
    .eq("id", claimId)
    .single();

  if (claimError || !claim) {
    return NextResponse.json(
      { success: false, message: "Demande introuvable" },
      { status: 404 }
    );
  }

  if (claim.status !== "pending") {
    return NextResponse.json(
      { success: false, message: `Cette demande est déjà "${claim.status}"` },
      { status: 409 }
    );
  }

  // 4. Selon l'action
  if (body.action === "reject") {
    const { error } = await supabase
      .from("listing_claim_requests")
      .update({
        status: "rejected",
        admin_note: body.admin_note ?? null,
        reviewed_by: adminUserId,
        reviewed_at: timestamp,
        updated_at: timestamp,
      })
      .eq("id", claimId);

    if (error) {
      console.error("[ADMIN/CLAIMS] Erreur reject:", error);
      return NextResponse.json(
        { success: false, message: "Erreur lors du rejet" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Demande rejetée." });
  }

  // ── action === "approve" ──────────────────────────────────────────────────

  // 4a. Vérifier que la ferme est toujours libre
  const { data: listing } = await supabase
    .from("listing")
    .select("id, clerk_user_id, name")
    .eq("id", claim.listing_id)
    .single();

  if (!listing) {
    return NextResponse.json(
      { success: false, message: "Ferme introuvable" },
      { status: 404 }
    );
  }

  if (listing.clerk_user_id) {
    await supabase
      .from("listing_claim_requests")
      .update({ status: "rejected", admin_note: "Ferme déjà revendiquée.", reviewed_by: adminUserId, reviewed_at: timestamp, updated_at: timestamp })
      .eq("id", claimId);

    return NextResponse.json(
      { success: false, message: "Cette ferme a déjà été revendiquée par un autre utilisateur." },
      { status: 409 }
    );
  }

  // 4b. Lier la ferme à l'utilisateur
  const { error: updateListingError } = await supabase
    .from("listing")
    .update({ clerk_user_id: claim.user_id, updated_at: timestamp })
    .eq("id", claim.listing_id)
    .is("clerk_user_id", null);

  if (updateListingError) {
    console.error("[ADMIN/CLAIMS] Erreur update listing:", updateListingError);
    return NextResponse.json(
      { success: false, message: "Impossible de lier la ferme à l'utilisateur" },
      { status: 500 }
    );
  }

  // 4c. Upsert profil (role = farmer, farm_id)
  await supabase
    .from("profiles")
    .upsert(
      {
        user_id: claim.user_id,
        email: claim.user_email,
        role: "farmer",
        farm_id: claim.listing_id,
        updated_at: timestamp,
      },
      { onConflict: "user_id" }
    );

  // 4d. Mettre à jour Clerk (non bloquant)
  try {
    const clerkClientInstance = await clerkClient();
    await clerkClientInstance.users.updateUser(claim.user_id, {
      publicMetadata: {
        role: "farmer",
        roleUpdatedAt: timestamp,
        claimedFarmId: claim.listing_id,
      },
    });
  } catch (clerkError) {
    console.error("[ADMIN/CLAIMS] Erreur Clerk update:", clerkError);
  }

  // 4e. Marquer la demande comme approuvée
  await supabase
    .from("listing_claim_requests")
    .update({
      status: "approved",
      admin_note: body.admin_note ?? null,
      reviewed_by: adminUserId,
      reviewed_at: timestamp,
      updated_at: timestamp,
    })
    .eq("id", claimId);

  return NextResponse.json({
    success: true,
    message: `Ferme "${listing.name ?? "Sans nom"}" attribuée avec succès.`,
  });
}

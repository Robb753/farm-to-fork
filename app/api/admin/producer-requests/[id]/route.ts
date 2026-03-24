// app/api/admin/producer-requests/[id]/route.ts
// PATCH — approuver ou rejeter une demande producteur (admin uniquement)
//
// Le trigger Supabase `handle_producer_request_approval` gère automatiquement :
//   - type="create" : crée listing + profil
//   - type="claim"  : lie le listing existant + crée profil
//
// Cette route se contente de :
//   1. Mettre à jour producer_requests.status (+ admin_note, reviewed_by, reviewed_at)
//   2. Mettre à jour Clerk publicMetadata.role = "farmer" si approved
//   3. Envoyer un email au demandeur

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sendFarmerRequestStatusEmail } from "@/lib/config/email-notifications";
import type { Database } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchBody {
  status: "approved" | "rejected";
  adminNote?: string;
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
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

  if (body.status !== "approved" && body.status !== "rejected") {
    return NextResponse.json(
      { success: false, message: "status doit être 'approved' ou 'rejected'" },
      { status: 400 }
    );
  }

  const { id: requestId } = await params;
  if (!requestId) {
    return NextResponse.json(
      { success: false, message: "ID de demande manquant" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient();

  // 3. Fetch the request
  const { data: request, error: fetchError } = await supabase
    .from("producer_requests")
    .select("id, type, user_id, user_email, farm_name, first_name, listing_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return NextResponse.json(
      { success: false, message: "Demande introuvable" },
      { status: 404 }
    );
  }

  if (request.status !== "pending") {
    return NextResponse.json(
      { success: false, message: `Cette demande est déjà "${request.status}"` },
      { status: 409 }
    );
  }

  // 4. For claim approval: verify listing is still unclaimed
  if (body.status === "approved" && request.type === "claim" && request.listing_id) {
    const { data: listing } = await supabase
      .from("listing")
      .select("clerk_user_id")
      .eq("id", request.listing_id)
      .single();

    if (listing?.clerk_user_id) {
      await supabase
        .from("producer_requests")
        .update({
          status: "rejected",
          admin_note: "Ferme déjà revendiquée.",
          reviewed_by: adminUserId,
          reviewed_at: timestamp,
        })
        .eq("id", requestId);

      return NextResponse.json(
        { success: false, message: "Cette ferme a déjà été revendiquée." },
        { status: 409 }
      );
    }
  }

  // 5. Update producer_requests (trigger fires on status→"approved")
  const { error: updateError } = await supabase
    .from("producer_requests")
    .update({
      status: body.status,
      admin_note: body.adminNote ?? null,
      reviewed_by: adminUserId,
      reviewed_at: timestamp,
    })
    .eq("id", requestId);

  if (updateError) {
    console.error("[ADMIN/PRODUCER-REQUESTS] Erreur update:", updateError);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }

  // 6. If approved: update Clerk publicMetadata
  if (body.status === "approved") {
    try {
      const clerkClientInstance = await clerkClient();
      await clerkClientInstance.users.updateUser(request.user_id, {
        publicMetadata: {
          role: "farmer",
          roleUpdatedAt: timestamp,
          roleUpdatedBy: adminUserId,
        },
      });
    } catch (clerkError) {
      console.error("[ADMIN/PRODUCER-REQUESTS] Erreur Clerk update:", clerkError);
      // Non-blocking: continue even if Clerk update fails
    }

    // Lier la ferme OSM au producteur si c'est une revendication approuvée
    if (request.type === "claim" && request.listing_id) {
      const { error: linkError } = await supabase
        .from("listing")
        .update({ clerk_user_id: request.user_id })
        .eq("id", request.listing_id)
        .is("clerk_user_id", null); // garde-fou : ne pas écraser si déjà lié
      if (linkError) {
        console.error("[ADMIN/PRODUCER-REQUESTS] Erreur liaison listing:", linkError);
        // Non-bloquant : Clerk est déjà mis à jour, logger pour traitement manuel
      }
    }
  }

  // 7. Resolve farm name for email (create: farm_name, claim: fetch listing name)
  let farmNameForEmail = request.farm_name;
  if (!farmNameForEmail && request.type === "claim" && request.listing_id) {
    const { data: listing } = await supabase
      .from("listing")
      .select("name")
      .eq("id", request.listing_id)
      .single();
    farmNameForEmail = listing?.name ?? "Ferme inconnue";
  }
  farmNameForEmail = farmNameForEmail ?? "Ferme inconnue";

  // 8. Send email (non-blocking)
  sendFarmerRequestStatusEmail(
    {
      farm_name: farmNameForEmail,
      email: request.user_email,
      location: "",
      first_name: request.first_name ?? undefined,
    },
    body.status
  ).catch((err) =>
    console.warn("[ADMIN/PRODUCER-REQUESTS] Email non envoyé:", err)
  );

  return NextResponse.json({
    success: true,
    message:
      body.status === "approved"
        ? "Demande approuvée. Le profil et la ferme seront créés automatiquement."
        : "Demande rejetée.",
  });
}

// app/api/claim-farm/route.ts
// Soumet une demande de revendication d'une ferme OSM.
// La demande est créée en statut "pending" et validée par un admin.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClaimFarmBody {
  listingId: number;
  message?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
  requestId?: number;
}

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase manquantes");
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  // 1. Auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Non authentifié", message: "Connexion requise" },
      { status: 401 }
    );
  }

  // 1b. Rate limiting (par userId)
  const rl = rateLimit(`claim-farm:${userId}`, RATE_LIMITS.claimFarm);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Trop de requêtes", message: "Réessayez dans un moment." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  // 2. Parse body
  let body: ClaimFarmBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON invalide", message: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const listingId = Number(body?.listingId);
  if (!Number.isFinite(listingId) || listingId <= 0) {
    return NextResponse.json(
      { success: false, error: "listingId invalide", message: "listingId doit être un entier positif" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient();

  // 3. Vérifier que le listing est bien une ferme OSM non encore revendiquée
  const { data: listing, error: listingError } = await supabase
    .from("listing")
    .select("id, osm_id, clerk_user_id, name")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json(
      { success: false, error: "Ferme introuvable", message: "Ce listing n'existe pas" },
      { status: 404 }
    );
  }

  if (!listing.osm_id) {
    return NextResponse.json(
      {
        success: false,
        error: "Non éligible",
        message: "Seules les fermes pré-enregistrées depuis OSM peuvent être revendiquées",
      },
      { status: 400 }
    );
  }

  if (listing.clerk_user_id) {
    return NextResponse.json(
      {
        success: false,
        error: "Déjà revendiquée",
        message: "Cette ferme a déjà été revendiquée par un autre utilisateur",
      },
      { status: 409 }
    );
  }

  // 4. Vérifier qu'il n'y a pas déjà une demande en cours de cet utilisateur pour cette ferme
  const { data: existingRequest } = await supabase
    .from("listing_claim_requests")
    .select("id, status")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .single();

  if (existingRequest) {
    if (existingRequest.status === "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Demande en cours",
          message: "Vous avez déjà une demande en attente pour cette ferme",
        },
        { status: 409 }
      );
    }
    if (existingRequest.status === "approved") {
      return NextResponse.json(
        {
          success: false,
          error: "Demande déjà approuvée",
          message: "Votre demande de revendication a déjà été approuvée",
        },
        { status: 409 }
      );
    }
    // Si rejected, on supprime l'ancienne entrée pour permettre une nouvelle soumission
    await supabase
      .from("listing_claim_requests")
      .delete()
      .eq("id", existingRequest.id);
  }

  // 5. Récupérer les infos utilisateur depuis Clerk
  const clerkClientInstance = await clerkClient();
  const clerkUser = await clerkClientInstance.users.getUser(userId);
  const userEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const userName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null;

  // 6. Créer la demande de revendication (statut pending)
  const { data: newRequest, error: insertError } = await supabase
    .from("listing_claim_requests")
    .insert({
      listing_id: listingId,
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      message: body.message?.trim() || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !newRequest) {
    console.error("[CLAIM-FARM] Erreur création demande:", insertError);
    return NextResponse.json(
      { success: false, error: "Erreur BDD", message: "Impossible de soumettre la demande" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Demande soumise pour la ferme "${listing.name ?? "Sans nom"}". Un administrateur va examiner votre demande.`,
    requestId: newRequest.id,
  });
}

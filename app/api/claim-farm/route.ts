// app/api/claim-farm/route.ts
// Permet à un utilisateur authentifié de revendiquer une ferme pré-enregistrée depuis OSM

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClaimFarmBody {
  listingId: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
  listingId?: number;
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
  const timestamp = new Date().toISOString();

  // 1. Auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Non authentifié", message: "Connexion requise" },
      { status: 401 }
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
    .select("id, osm_id, clerk_user_id, name, address")
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
        message: "Seules les fermes pré-enregistrées depuis OSM peuvent être revendiquées via cette voie",
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

  // 4. Vérifier que l'utilisateur n'a pas déjà une ferme
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("farm_id, role")
    .eq("user_id", userId)
    .single();

  if (existingProfile?.farm_id) {
    return NextResponse.json(
      {
        success: false,
        error: "Ferme déjà associée",
        message: "Vous avez déjà une ferme liée à votre compte",
      },
      { status: 409 }
    );
  }

  // 5. Revendiquer le listing : lier le clerk_user_id
  const { error: updateError } = await supabase
    .from("listing")
    .update({ clerk_user_id: userId, updated_at: timestamp })
    .eq("id", listingId)
    .is("clerk_user_id", null); // garde-fou : uniquement si encore libre

  if (updateError) {
    console.error("[CLAIM-FARM] Erreur update listing:", updateError);
    return NextResponse.json(
      { success: false, error: "Erreur BDD", message: "Impossible de revendiquer la ferme" },
      { status: 500 }
    );
  }

  // 6. Créer ou mettre à jour le profil avec role='farmer' et farm_id
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        role: "farmer",
        farm_id: listingId,
        updated_at: timestamp,
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    console.error("[CLAIM-FARM] Erreur upsert profile:", profileError);
    // Non bloquant : le listing est déjà lié, on continue
  }

  // 7. Mettre à jour le rôle dans Clerk
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        role: "farmer",
        roleUpdatedAt: timestamp,
        claimedFarmId: listingId,
      },
    });
  } catch (clerkError) {
    console.error("[CLAIM-FARM] Erreur Clerk update:", clerkError);
    // Non bloquant : le listing et le profil sont déjà mis à jour
  }

  return NextResponse.json({
    success: true,
    message: `La ferme "${listing.name ?? "Sans nom"}" a été revendiquée avec succès`,
    listingId,
  });
}

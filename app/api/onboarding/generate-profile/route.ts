// app/api/onboarding/generate-profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface GenerateProfileBody {
  requestId: number;
  story: string;
  website?: string;
  photos?: string[];
}

interface GeneratedProfile {
  farmProfile: {
    name: string;
    description: string;
    location: string;
    contact: string;
  };
  products: Array<{
    id: number;
    name: string;
    category: string;
    price: number;
    unit: string;
    status: string;
  }>;
  production_method?: string[];
  purchase_mode?: string[];
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    // ✅ Auth server-side Clerk
    const { userId: clerkUserId } = await Promise.resolve(auth());
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { requestId, story, website }: GenerateProfileBody = await req.json();

    // Validation
    if (!requestId || !story?.trim()) {
      return NextResponse.json(
        { success: false, error: "Données manquantes" },
        { status: 400 }
      );
    }

    // ✅ Charger la demande + ownership
    const { data: request, error: requestError } = await supabase
      .from("farmer_requests")
      .select("id, status, farm_name, user_id")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json(
        { success: false, error: "Demande introuvable" },
        { status: 404 }
      );
    }

    // ✅ Autorisation: owner uniquement (ou admin si tu veux l'ajouter plus tard)
    if (request.user_id !== clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Accès refusé" },
        { status: 403 }
      );
    }

    // ✅ Statut: doit être approved (sinon l'onboarding n'est pas validé)
    if (request.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Demande non approuvée" },
        { status: 403 }
      );
    }

    // Mock profile (ok pour dev)
    const mockProfile: GeneratedProfile = {
      farmProfile: {
        name: request.farm_name,
        description: story.substring(0, 200) + "...",
        location: "À définir",
        contact: "À compléter",
      },
      products: [
        {
          id: 1,
          name: "Produit 1",
          category: "légumes",
          price: 0,
          unit: "kg",
          status: "available",
        },
      ],
    };

    // ✅ Update farmer_requests (onboarding data)
    const { error: updateReqError } = await supabase
      .from("farmer_requests")
      .update({
        description: story.trim(),
        website: website?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateReqError) {
      console.error(
        "[GENERATE-PROFILE] update farmer_requests error:",
        updateReqError
      );
      return NextResponse.json(
        { success: false, error: "Update failed" },
        { status: 500 }
      );
    }

    // ✅ (Recommandé) Update listing correspondant (si déjà créé par le trigger)
    // On se base sur clerk_user_id = request.user_id
    const { error: updateListingError } = await supabase
      .from("listing")
      .update({
        description: story.trim(),
        website: website?.trim() || null,
        modified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_user_id", request.user_id);

    if (updateListingError) {
      // pas bloquant, mais utile en dev
      console.warn(
        "[GENERATE-PROFILE] update listing warning:",
        updateListingError
      );
    }

    return NextResponse.json({
      success: true,
      data: mockProfile,
      message: "Profil généré avec succès",
    });
  } catch (error) {
    console.error("[GENERATE-PROFILE] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la génération",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

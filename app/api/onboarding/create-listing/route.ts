// app/api/onboarding/create-listing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Interface pour le step 3
 */
interface CreateListingBody {
  requestId: number;
  userId: string;
  email: string;
  farmProfile: {
    name: string;
    description: string;
    location: string;
    contact: string;
  };
  products?: Array<{
    name: string;
    category: string;
    price: number;
    unit: string;
    status: string;
  }>;
  enableOrders: boolean;
  publishFarm: boolean;
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API Route pour créer le listing final (Step 3)
 *
 * Flow:
 * 1. Vérifier que la demande est approuvée
 * 2. Créer le listing dans la table listing
 * 3. Créer les produits si fournis
 * 4. Lier le profil au listing (farm_id)
 * 5. Retourner listingId
 */
export async function POST(req: NextRequest) {
  try {
    const body: CreateListingBody = await req.json();
    const {
      requestId,
      userId,
      email,
      farmProfile,
      products,
      enableOrders,
      publishFarm,
    } = body;

    // Validation
    if (!requestId || !userId || !email || !farmProfile) {
      return NextResponse.json(
        { success: false, error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe et est approuvée
    const { data: request, error: requestError } = await supabase
      .from("farmer_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json(
        { success: false, error: "Demande introuvable" },
        { status: 404 }
      );
    }

    if (request.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Demande non approuvée" },
        { status: 403 }
      );
    }

    // Vérifier qu'un listing n'existe pas déjà pour cet utilisateur
    const { data: existingListing } = await supabase
      .from("listing")
      .select("id")
      .eq("createdBy", email)
      .maybeSingle();

    if (existingListing) {
      return NextResponse.json(
        {
          success: false,
          error: "Listing existant",
          message: "Un listing existe déjà pour cet utilisateur",
        },
        { status: 409 }
      );
    }

    // Créer le listing
    const listingData = {
      createdBy: email,
      name: farmProfile.name,
      description: farmProfile.description,
      email: email,
      address: request.location || farmProfile.location,
      phoneNumber: request.phone || null,
      website: request.website || null,
      active: publishFarm,
      // Coordonnées par défaut (à géocoder plus tard)
      lat: 0,
      lng: 0,
      // Métadonnées
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: publishFarm ? new Date().toISOString() : null,
    };

    const { data: insertedListing, error: listingError } = await supabase
      .from("listing")
      .insert([listingData])
      .select("id")
      .single();

    if (listingError || !insertedListing) {
      console.error("[CREATE-LISTING] Erreur création:", listingError);
      return NextResponse.json(
        { success: false, error: "Erreur création listing" },
        { status: 500 }
      );
    }

    const listingId = insertedListing.id;

    // Créer les produits si fournis
    if (products && products.length > 0) {
      const productsData = products.map((p) => ({
        listing_id: listingId,
        farm_id: listingId,
        name: p.name,
        price: p.price || 0,
        unit: p.unit || "kg",
        active: publishFarm,
        available: true,
        stock_status: p.status || "in_stock",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: productsError } = await supabase
        .from("products")
        .insert(productsData);

      if (productsError) {
        console.warn(
          "[CREATE-LISTING] Erreur création produits:",
          productsError
        );
        // Non bloquant
      }
    }

    // Lier le profil au listing (si table profiles existe)
    try {
      await supabase
        .from("profiles")
        .update({
          farm_id: listingId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } catch (profileError) {
      console.warn("[CREATE-LISTING] Erreur liaison profil:", profileError);
      // Non bloquant
    }

    // Mettre à jour farmer_requests pour marquer comme "completed"
    await supabase
      .from("farmer_requests")
      .update({
        updated_at: new Date().toISOString(),
        // Optionnel: ajouter un champ "listing_id" ou "completed_at"
      })
      .eq("id", requestId);

    return NextResponse.json(
      {
        success: true,
        message: "Listing créé avec succès",
        listingId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CREATE-LISTING] Erreur serveur:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

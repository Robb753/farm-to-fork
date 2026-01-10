// app/api/onboarding/create-listing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CreateListingBody {
  requestId: number;
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
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    // ✅ Clerk auth (OBLIGATOIRE)
    const { userId: clerkUserId } = await Promise.resolve(auth());
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body: CreateListingBody = await req.json();
    const { requestId, farmProfile, products, enableOrders, publishFarm } =
      body;

    if (!requestId || !farmProfile?.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Données manquantes" },
        { status: 400 }
      );
    }

    // ✅ Charger la demande (service role) + ownership
    const { data: request, error: requestError } = await supabase
      .from("farmer_requests")
      .select(
        "id, status, user_id, email, farm_name, location, phone, website, description, lat, lng"
      )
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json(
        { success: false, error: "Demande introuvable" },
        { status: 404 }
      );
    }

    // ✅ Autorisation : owner uniquement (ou admin si tu veux l’ajouter plus tard)
    if (request.user_id !== clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Accès refusé" },
        { status: 403 }
      );
    }

    // ✅ Doit être approved
    if (request.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Demande non approuvée" },
        { status: 403 }
      );
    }

    // ✅ Récupérer le listing déjà créé par le trigger (1 par user)
    const { data: existingListing, error: existingListingError } =
      await supabase
        .from("listing")
        .select("id, published_at, active")
        .eq("clerk_user_id", request.user_id)
        .maybeSingle();

    if (existingListingError) {
      console.error(
        "[CREATE-LISTING] read listing error:",
        existingListingError
      );
      return NextResponse.json(
        { success: false, error: "Erreur lecture listing" },
        { status: 500 }
      );
    }

    if (!existingListing) {
      // Ton trigger est censé le créer au moment du approved
      return NextResponse.json(
        {
          success: false,
          error: "Listing introuvable",
          message:
            "Aucun listing n'a été créé pour cette demande. Vérifie ton trigger handle_farmer_request_status_change().",
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const shouldPublish = Boolean(publishFarm);

    // ✅ Finaliser le listing (UPDATE, pas INSERT)
    const listingUpdate = {
      // ownership
      clerk_user_id: request.user_id,
      createdBy: request.user_id, // cohérent avec ton trigger + unique(createdBy)

      // contenu
      name: farmProfile.name.trim() || request.farm_name,
      description: farmProfile.description?.trim() || request.description || "",
      address: request.location || farmProfile.location || "",
      email: request.email,
      phoneNumber: request.phone || null,
      website: request.website || null,

      // coords => depuis la demande
      ...(typeof request.lat === "number" ? { lat: request.lat } : {}),
      ...(typeof request.lng === "number" ? { lng: request.lng } : {}),

      // état
      orders_enabled: Boolean(enableOrders),
      active: shouldPublish,

      // timestamps
      modified_at: now,
      updated_at: now,
      published_at: shouldPublish
        ? (existingListing.published_at ?? now)
        : null,
    };

    const { data: updatedListing, error: updateListingError } = await supabase
      .from("listing")
      .update(listingUpdate)
      .eq("id", existingListing.id)
      .select("id")
      .single();

    if (updateListingError || !updatedListing) {
      console.error(
        "[CREATE-LISTING] update listing error:",
        updateListingError
      );
      return NextResponse.json(
        { success: false, error: "Erreur finalisation listing" },
        { status: 500 }
      );
    }

    const listingId = updatedListing.id;

    // ✅ Produits : optionnel, non-bloquant (mais on log si fail)
    if (products?.length) {
      const productsData = products.map((p) => ({
        listing_id: listingId,
        farm_id: listingId,
        name: p.name.trim(),
        description: null,
        price: Number(p.price) || 0,
        unit: p.unit?.trim() || "kg",
        active: shouldPublish,
        available: true,
        stock_status: p.status || "in_stock",
        created_at: now,
        updated_at: now,
      }));

      const { error: productsError } = await supabase
        .from("products")
        .insert(productsData);

      if (productsError) {
        console.warn(
          "[CREATE-LISTING] products insert warning:",
          productsError
        );
      }
    }

    // ✅ Lier profile -> farm_id (normalement déjà fait par trigger, mais on sécurise)
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ farm_id: listingId, updated_at: now })
      .eq("user_id", request.user_id);

    if (profileUpdateError) {
      console.warn(
        "[CREATE-LISTING] profile update warning:",
        profileUpdateError
      );
    }

    // ✅ farmer_requests : juste updated_at (tu gardes status approved)
    const { error: reqUpdateError } = await supabase
      .from("farmer_requests")
      .update({ updated_at: now })
      .eq("id", requestId);

    if (reqUpdateError) {
      console.warn(
        "[CREATE-LISTING] farmer_requests update warning:",
        reqUpdateError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Listing finalisé avec succès",
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

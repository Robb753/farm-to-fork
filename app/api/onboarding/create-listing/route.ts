// app/api/onboarding/create-listing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type {
  Database,
  ProductInsert,
  ListingUpdate,
} from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Types
 */
type StockStatus =
  Database["public"]["Tables"]["products"]["Row"]["stock_status"];

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
    status?: StockStatus; // ✅ plus "string"
  }>;
  enableOrders: boolean;
  publishFarm: boolean;
}

/**
 * Supabase client (Service Role)
 * - IMPORTANT: service role = bypass RLS (ok pour route serveur)
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables."
  );
}

const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Helpers
 */
const toStockStatus = (v: unknown): StockStatus => {
  if (v === "in_stock" || v === "low_stock" || v === "out_of_stock") return v;
  return "in_stock";
};

const safeTrim = (v: unknown): string =>
  typeof v === "string" ? v.trim() : "";

const toNumber = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export async function POST(req: NextRequest) {
  const now = new Date().toISOString();

  try {
    /**
     * Clerk auth (obligatoire)
     */
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    /**
     * Parse body
     */
    let body: CreateListingBody;
    try {
      body = (await req.json()) as CreateListingBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "JSON invalide" },
        { status: 400 }
      );
    }

    const requestId = toNumber(body.requestId);
    const farmName = safeTrim(body.farmProfile?.name);

    if (!requestId || requestId <= 0 || !farmName) {
      return NextResponse.json(
        { success: false, error: "Données manquantes" },
        { status: 400 }
      );
    }

    const publishFarm = Boolean(body.publishFarm);
    const enableOrders = Boolean(body.enableOrders);

    /**
     * Charger la demande (service role) + ownership
     */
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

    // Autorisation : owner uniquement
    if (request.user_id !== clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Accès refusé" },
        { status: 403 }
      );
    }

    // Doit être approved
    if (request.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Demande non approuvée" },
        { status: 403 }
      );
    }

    /**
     * Récupérer le listing déjà créé (trigger) (1 par user)
     */
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

    /**
     * Finaliser le listing (UPDATE, pas INSERT)
     * - on typpe en ListingUpdate pour éviter null/undefined mismatch
     */
    const listingUpdate: ListingUpdate = {
      clerk_user_id: request.user_id,
      createdBy: request.user_id,

      name: farmName || request.farm_name || null,

      // ✅ la colonne listing.description est string | null dans tes types
      description:
        safeTrim(body.farmProfile?.description) || request.description || null,

      address: request.location || safeTrim(body.farmProfile?.location) || null,
      email: request.email ?? null,
      phoneNumber: request.phone ?? null,
      website: request.website ?? null,

      // coords depuis la demande (si valides)
      lat: typeof request.lat === "number" ? request.lat : null,
      lng: typeof request.lng === "number" ? request.lng : null,

      orders_enabled: enableOrders,
      active: publishFarm,

      modified_at: now,
      updated_at: now,

      published_at: publishFarm ? (existingListing.published_at ?? now) : null,
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

    /**
     * Produits : optionnel, non-bloquant
     * - ✅ typage strict ProductInsert[]
     * - ✅ stock_status union (pas string)
     */
    if (body.products?.length) {
      const productsData: ProductInsert[] = body.products
        .map((p): ProductInsert | null => {
          const name = safeTrim(p.name);
          if (!name) return null;

          return {
            listing_id: listingId,
            farm_id: listingId,

            name,
            description: null,

            price: toNumber(p.price) || 0,
            unit: safeTrim(p.unit) || "kg",

            available: true,
            active: publishFarm,

            category: safeTrim(p.category) || null,

            stock_status: toStockStatus(p.status),

            created_at: now,
            updated_at: now,
          };
        })
        .filter((x): x is ProductInsert => x !== null);

      if (productsData.length) {
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
    }

    /**
     * Lier profile -> farm_id (sécurisation)
     */
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

    /**
     * farmer_requests : updated_at uniquement (status reste approved)
     */
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

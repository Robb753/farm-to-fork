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
  // ✅ Step3
  listingId?: number;

  // ✅ Step2/Step3 compat
  requestId?: number;

  farmProfile?: {
    name?: string;
    description?: string;
    location?: string;
    contact?: string;
  };

  products?: Array<{
    name: string;
    category: string;
    price: number;
    unit: string;
    status?: StockStatus;
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
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    let body: CreateListingBody;
    try {
      body = (await req.json()) as CreateListingBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "JSON invalide" },
        { status: 400 }
      );
    }

    const publishFarm = Boolean(body.publishFarm);
    const enableOrders = Boolean(body.enableOrders);

    const listingIdFromBody = toNumber(body.listingId);
    const requestIdFromBody = toNumber(body.requestId);

    /**
     * ✅ 1) Récupérer la request :
     * - si requestId fourni -> on l'utilise
     * - sinon -> on prend la dernière request approved du user
     */
    let requestQuery = supabase
      .from("farmer_requests")
      .select(
        "id, status, user_id, email, farm_name, location, phone, website, description, lat, lng"
      )
      .eq("user_id", clerkUserId);

    if (requestIdFromBody > 0) {
      requestQuery = requestQuery.eq("id", requestIdFromBody);
    } else {
      requestQuery = requestQuery.eq("status", "approved").order("id", {
        ascending: false,
      });
    }

    const { data: request, error: requestError } =
      await requestQuery.maybeSingle();

    if (requestError) {
      console.error("[CREATE-LISTING] read request error:", requestError);
      return NextResponse.json(
        { success: false, error: "Erreur lecture demande" },
        { status: 500 }
      );
    }

    if (!request) {
      return NextResponse.json(
        {
          success: false,
          error: "Demande introuvable",
          message:
            "Aucune demande approuvée trouvée pour cet utilisateur (ou requestId invalide).",
        },
        { status: 404 }
      );
    }

    if (request.user_id !== clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Accès refusé" },
        { status: 403 }
      );
    }

    if (request.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Demande non approuvée" },
        { status: 403 }
      );
    }

    /**
     * ✅ 2) Récupérer le listing existant :
     * - si listingId fourni -> on le charge (et on check owner)
     * - sinon -> on le prend via clerk_user_id
     */
    let existingListingQuery = supabase
      .from("listing")
      .select("id, published_at, active, clerk_user_id")
      .eq("clerk_user_id", clerkUserId);

    if (listingIdFromBody > 0) {
      existingListingQuery = supabase
        .from("listing")
        .select("id, published_at, active, clerk_user_id")
        .eq("id", listingIdFromBody);
    }

    const { data: existingListing, error: existingListingError } =
      await existingListingQuery.maybeSingle();

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
            "Aucun listing n'a été trouvé. Vérifie ton trigger handle_farmer_request_status_change().",
        },
        { status: 409 }
      );
    }

    // ✅ si listingId était fourni, sécurise que c'est bien le listing du user
    if (
      existingListing.clerk_user_id &&
      existingListing.clerk_user_id !== clerkUserId
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Listing non autorisé" },
        { status: 403 }
      );
    }

    /**
     * ✅ 3) Construire les champs : Step3 peut ne pas fournir farmProfile
     */
    const farmName =
      safeTrim(body.farmProfile?.name) || safeTrim(request.farm_name) || "";

    if (!farmName) {
      return NextResponse.json(
        { success: false, error: "Nom de ferme manquant" },
        { status: 400 }
      );
    }

    const listingUpdate: ListingUpdate = {
      clerk_user_id: clerkUserId,

      name: farmName || null,
      description:
        safeTrim(body.farmProfile?.description) || request.description || null,

      address: request.location || safeTrim(body.farmProfile?.location) || null,
      email: request.email ?? null,
      phoneNumber: request.phone ?? null,
      website: request.website ?? null,

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

    // ✅ produits (inchangé)
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

    // ✅ profile farm_id
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ farm_id: listingId, updated_at: now })
      .eq("user_id", clerkUserId);

    if (profileUpdateError) {
      console.warn(
        "[CREATE-LISTING] profile update warning:",
        profileUpdateError
      );
    }

    // ✅ farmer_requests updated_at
    const { error: reqUpdateError } = await supabase
      .from("farmer_requests")
      .update({ updated_at: now })
      .eq("id", request.id);

    if (reqUpdateError) {
      console.warn(
        "[CREATE-LISTING] farmer_requests update warning:",
        reqUpdateError
      );
    }

    return NextResponse.json(
      { success: true, message: "Listing finalisé avec succès", listingId },
      { status: 200 } // ✅ update => 200
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

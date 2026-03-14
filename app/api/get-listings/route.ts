// app/api/get-listings/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { apiOk, apiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ——— Types ———
interface ListingBasic {
  id: number;
  created_at: string;
  clerk_user_id: string | null;
  coordinates: any;
  active: boolean;
}

interface BboxParams {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface GetListingsParams {
  limit: number;
  offset: number;
  sortBy: "created_at" | "id";
  sortOrder: "asc" | "desc";
  includeInactive: boolean;
  bbox: BboxParams | null;
}

// ——— Supabase client ———
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Variables d'environnement Supabase manquantes. Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ——— Params validation ———
function validateListingParams(searchParams: URLSearchParams): {
  isValid: boolean;
  errors: string[];
  params: GetListingsParams;
} {
  const errors: string[] = [];

  const limitStr = searchParams.get("limit");
  const offsetStr = searchParams.get("offset");
  const sortByStr = searchParams.get("sortBy");
  const sortOrderStr = searchParams.get("sortOrder");
  const includeInactiveStr = searchParams.get("includeInactive");

  let limit = 50;
  if (limitStr) {
    const n = parseInt(limitStr, 10);
    if (Number.isNaN(n) || n < 1 || n > 100) {
      errors.push("limit ∈ [1,100]");
    } else {
      limit = n;
    }
  }

  let offset = 0;
  if (offsetStr) {
    const n = parseInt(offsetStr, 10);
    if (Number.isNaN(n) || n < 0) {
      errors.push("offset ≥ 0");
    } else {
      offset = n;
    }
  }

  const validSortFields = ["created_at", "id"] as const;
  const sortBy = validSortFields.includes(
    sortByStr as (typeof validSortFields)[number],
  )
    ? (sortByStr as "created_at" | "id")
    : "created_at";

  let sortOrder: "asc" | "desc" = "desc";
  if (sortOrderStr) {
    if (sortOrderStr === "asc" || sortOrderStr === "desc") {
      sortOrder = sortOrderStr;
    } else {
      errors.push("sortOrder ∈ {'asc','desc'}");
    }
  }

  const includeInactive = includeInactiveStr === "true";

  // Optional viewport bounding box — used for map-driven queries
  let bbox: BboxParams | null = null;
  const northStr = searchParams.get("north");
  const southStr = searchParams.get("south");
  const eastStr = searchParams.get("east");
  const westStr = searchParams.get("west");

  if (northStr && southStr && eastStr && westStr) {
    const north = parseFloat(northStr);
    const south = parseFloat(southStr);
    const east = parseFloat(eastStr);
    const west = parseFloat(westStr);

    if (
      [north, south, east, west].every(Number.isFinite) &&
      north > south &&
      north <= 90 && south >= -90 &&
      east <= 180 && west >= -180
    ) {
      bbox = { north, south, east, west };
    } else {
      errors.push("bbox invalide: north > south, lat ∈ [-90,90], lng ∈ [-180,180]");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    params: { limit, offset, sortBy, sortOrder, includeInactive, bbox },
  };
}

// ——— Handler ———
export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString();

  try {
    const { searchParams } = new URL(req.url);
    const { isValid, errors, params } = validateListingParams(searchParams);

    if (!isValid) {
      return apiError("Paramètres de requête invalides", 400, errors);
    }

    const supabase = createSupabaseClient();

    let countQuery = supabase
      .from("listing")
      .select("id", { count: "exact", head: true });

    if (!params.includeInactive) {
      countQuery = countQuery.eq("active", true);
    }

    const { count: total, error: headError } = await countQuery;

    if (headError) {
      console.error("[GET-LISTINGS] Count error:", headError);
      return apiError("Erreur lors du comptage", 500);
    }

    const totalCount = total ?? 0;

    if (params.offset >= totalCount && totalCount > 0) {
      const page = Math.floor(params.offset / params.limit);

      return apiOk(
        {
          listings: [] as ListingBasic[],
          count: totalCount,
          message: "Aucun résultat pour cette page (offset au-delà du total).",
          timestamp,
          pagination: {
            total: totalCount,
            page,
            limit: params.limit,
            hasMore: false,
          },
        },
        200,
        { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" },
      );
    }

    let dataQuery = supabase
      .from("listing")
      .select("id, created_at, clerk_user_id, coordinates, active")
      .order(params.sortBy, { ascending: params.sortOrder === "asc" });

    if (!params.includeInactive) {
      dataQuery = dataQuery.eq("active", true);
    }

    // Viewport bounding box filter — enables scalable map-driven queries
    if (params.bbox) {
      const { north, south, east, west } = params.bbox;
      dataQuery = dataQuery
        .gte("lat", south)
        .lte("lat", north)
        .gte("lng", west)
        .lte("lng", east);
    }

    const start = params.offset;
    const end = Math.max(start, start + params.limit - 1);
    dataQuery = dataQuery.range(start, end);

    const { data, error } = await dataQuery;

    if (error) {
      console.error("[GET-LISTINGS] Data error:", error);
      return apiError("Erreur lors de la récupération des listings", 500);
    }

    const currentPage = Math.floor(params.offset / params.limit);
    const hasMore = params.offset + params.limit < totalCount;

    return apiOk(
      {
        listings: (data ?? []) as ListingBasic[],
        count: totalCount,
        message: `${data?.length ?? 0} listing(s) ${params.includeInactive ? "total" : "actif(s)"} récupéré(s)`,
        timestamp,
        pagination: {
          total: totalCount,
          page: currentPage,
          limit: params.limit,
          hasMore,
        },
      },
      200,
      { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" },
    );
  } catch (err) {
    console.error("[GET-LISTINGS] Erreur serveur critique:", err);

    const isDev = process.env.NODE_ENV === "development";

    return apiError(
      "Erreur serveur lors de la récupération des listings",
      500,
      isDev && err instanceof Error ? err.message : undefined,
    );
  }
}

// app/api/get-listings/route.ts
import { NextRequest, NextResponse } from "next/server";
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

interface GetListingsResponse {
  success: boolean;
  listings?: ListingBasic[];
  error?: string;
  message?: string;
  count?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  timestamp?: string;
  details?: string;
}

interface GetListingsParams {
  limit: number; // always set (defaulted below)
  offset: number; // always set (defaulted below)
  sortBy: "created_at" | "id";
  sortOrder: "asc" | "desc";
  includeInactive: boolean;
}

// ——— Supabase client ———
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Variables d'environnement Supabase manquantes. Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY."
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
    if (Number.isNaN(n) || n < 1 || n > 100) errors.push("limit ∈ [1,100]");
    else limit = n;
  }

  let offset = 0;
  if (offsetStr) {
    const n = parseInt(offsetStr, 10);
    if (Number.isNaN(n) || n < 0) errors.push("offset ≥ 0");
    else offset = n;
  }

  const validSortFields = ["created_at", "id"] as const;
  const sortBy = validSortFields.includes(sortByStr as any)
    ? (sortByStr as "created_at" | "id")
    : "created_at";

  let sortOrder: "asc" | "desc" = "desc";
  if (sortOrderStr) {
    if (sortOrderStr === "asc" || sortOrderStr === "desc")
      sortOrder = sortOrderStr;
    else errors.push("sortOrder ∈ {'asc','desc'}");
  }

  const includeInactive = includeInactiveStr === "true";

  return {
    isValid: errors.length === 0,
    errors,
    params: { limit, offset, sortBy, sortOrder, includeInactive },
  };
}

// ——— Handler ———
export async function GET(
  req: NextRequest
): Promise<NextResponse<GetListingsResponse>> {
  const timestamp = new Date().toISOString();

  try {
    const { searchParams } = new URL(req.url);
    const { isValid, errors, params } = validateListingParams(searchParams);

    if (!isValid) {
      return apiError("Paramètres de requête invalides", 400, errors);
    }

    const supabase = createSupabaseClient();

    // 1) HEAD count first to avoid 416/PGRST103 on oversized offset
    let countQuery = supabase
      .from("listing")
      .select("id", { count: "exact", head: true });

    if (!params.includeInactive) countQuery = countQuery.eq("active", true);

    const { count: total, error: headError } = await countQuery;
    if (headError) {
      console.error("[GET-LISTINGS] Count error:", headError);
      return apiError("Erreur lors du comptage", 500);
    }

    const totalCount = total ?? 0;

    // If offset is beyond total, short-circuit with empty page
    if (params.offset >= totalCount && totalCount > 0) {
      const page = Math.floor(params.offset / params.limit);
      return apiOk(
        {
          listings: [] as ListingBasic[],
          count: totalCount,
          message: "Aucun résultat pour cette page (offset au-delà du total).",
          timestamp,
          pagination: { total: totalCount, page, limit: params.limit, hasMore: false },
        },
        200,
        { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" },
      );
    }

    // 2) Data query with range (safe now)
    let dataQuery = supabase
      .from("listing")
      .select("id, created_at, clerk_user_id, coordinates, active")
      .order(params.sortBy, { ascending: params.sortOrder === "asc" });

    if (!params.includeInactive) dataQuery = dataQuery.eq("active", true);

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

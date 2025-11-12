// app/api/get-listings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing de base retourné par l'API
 */
interface ListingBasic {
  id: number;
  created_at: string;
  createdBy: string;
  coordinates: any; // JSON type from Supabase
  active: boolean;
}

/**
 * Type pour la réponse API
 */
interface GetListingsResponse {
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
}

/**
 * Type pour les paramètres de requête optionnels
 */
interface GetListingsParams {
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "id";
  sortOrder?: "asc" | "desc";
  includeInactive?: boolean;
}

/**
 * Configuration pour Next.js 14.2 - Export obligatoire
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Création sécurisée du client Supabase
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Variables d'environnement Supabase manquantes. " +
        "Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env"
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Fonction utilitaire pour valider les paramètres de requête
 */
function validateListingParams(searchParams: URLSearchParams): {
  isValid: boolean;
  errors: string[];
  params: GetListingsParams;
} {
  const errors: string[] = [];
  const params: GetListingsParams = {};

  // Validation de limit
  const limitStr = searchParams.get("limit");
  if (limitStr) {
    const limit = parseInt(limitStr, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push("Le limit doit être un nombre entre 1 et 100");
    } else {
      params.limit = limit;
    }
  }

  // Validation de offset
  const offsetStr = searchParams.get("offset");
  if (offsetStr) {
    const offset = parseInt(offsetStr, 10);
    if (isNaN(offset) || offset < 0) {
      errors.push("L'offset doit être un nombre positif ou nul");
    } else {
      params.offset = offset;
    }
  }

  // Validation de sortBy
  const sortBy = searchParams.get("sortBy");
  const validSortFields = ["created_at", "id"] as const;
  if (sortBy) {
    if (validSortFields.includes(sortBy as any)) {
      params.sortBy = sortBy as (typeof validSortFields)[number];
    } else {
      errors.push(
        `sortBy doit être l'un des suivants: ${validSortFields.join(", ")}`
      );
    }
  } else {
    params.sortBy = "created_at"; // Valeur par défaut
  }

  // Validation de sortOrder
  const sortOrder = searchParams.get("sortOrder");
  if (sortOrder) {
    if (["asc", "desc"].includes(sortOrder)) {
      params.sortOrder = sortOrder as "asc" | "desc";
    } else {
      errors.push("sortOrder doit être 'asc' ou 'desc'");
    }
  } else {
    params.sortOrder = "desc"; // Valeur par défaut
  }

  // Validation de includeInactive (nouveau paramètre optionnel)
  const includeInactive = searchParams.get("includeInactive");
  if (includeInactive) {
    params.includeInactive = includeInactive === "true";
  } else {
    params.includeInactive = false; // Par défaut, on n'inclut que les actifs
  }

  return {
    isValid: errors.length === 0,
    errors,
    params,
  };
}

/**
 * API Route pour récupérer les listings de fermes
 *
 * Cette route permet de :
 * - Récupérer tous les listings actifs (par défaut)
 * - Supporter la pagination avec limit/offset
 * - Supporter le tri par différents champs
 * - Inclure optionnellement les listings inactifs
 * - Compter le nombre total de résultats
 * - Gérer les erreurs de manière robuste
 *
 * @param req - Requête avec paramètres de query optionnels
 * @returns Réponse JSON avec la liste des listings
 *
 * @example
 * ```typescript
 * // Récupération simple des listings actifs
 * const response = await fetch("/api/get-listings");
 * const { listings } = await response.json();
 *
 * // Avec pagination et tri
 * const response = await fetch("/api/get-listings?limit=10&offset=0&sortBy=created_at&sortOrder=desc");
 *
 * // Inclure les listings inactifs
 * const response = await fetch("/api/get-listings?includeInactive=true");
 * ```
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<GetListingsResponse>> {
  try {
    // Extraction et validation des paramètres de query
    const { searchParams } = new URL(req.url);
    const validation = validateListingParams(searchParams);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Paramètres de requête invalides",
          message: validation.errors.join(", "),
        },
        { status: 400 }
      );
    }

    const params = validation.params;
    console.log(`[API] Récupération des listings avec params:`, params);

    // Création du client Supabase
    const supabase = createSupabaseClient();

    // Construction de la requête Supabase avec count pour pagination
    let query = supabase
      .from("listing")
      .select("id, created_at, createdBy, coordinates, active", {
        count: "exact",
      })
      .order(params.sortBy!, { ascending: params.sortOrder === "asc" });

    // Filtrage par statut actif (sauf si includeInactive est true)
    if (!params.includeInactive) {
      query = query.eq("active", true);
    }

    // Application de la pagination si spécifiée
    if (params.limit !== undefined) {
      const start = params.offset || 0;
      const end = start + params.limit - 1;
      query = query.range(start, end);
    } else if (params.offset !== undefined) {
      // Si offset sans limit, on applique une limite par défaut
      const defaultLimit = 50;
      const end = params.offset + defaultLimit - 1;
      query = query.range(params.offset, end);
    }

    // Exécution de la requête
    const { data, error, count } = await query;

    if (error) {
      console.error("[API] Erreur Supabase:", error.message);
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des listings",
          message: "Impossible d'accéder à la base de données",
        },
        { status: 500 }
      );
    }

    // Validation des données retournées
    if (!Array.isArray(data)) {
      console.error("[API] Format de données inattendu:", typeof data);
      return NextResponse.json(
        {
          error: "Format de données inattendu",
          message: "La réponse de la base de données n'est pas valide",
        },
        { status: 500 }
      );
    }

    console.log(
      `✅ [API] ${data.length} listings récupérés avec succès (total: ${count})`
    );

    // Construction de la réponse avec métadonnées
    const response: GetListingsResponse = {
      listings: data as ListingBasic[],
      count: data.length,
      message: `${data.length} listing(s) ${params.includeInactive ? "total" : "actif(s)"} récupéré(s)`,
    };

    // Ajout des informations de pagination si utilisée
    if (params.limit !== undefined) {
      const currentPage = Math.floor((params.offset || 0) / params.limit);
      const totalCount = count ?? 0;

      response.pagination = {
        total: totalCount,
        page: currentPage,
        limit: params.limit,
        hasMore: (params.offset || 0) + params.limit < totalCount,
      };
    }

    // Retour avec headers appropriés pour Next.js 14.2
    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300", // Cache pendant 1 min
      },
    });
  } catch (error) {
    console.error("[API] Erreur serveur:", error);

    // Gestion d'erreur avec détails selon l'environnement
    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        error: "Erreur serveur lors de la récupération des listings",
        message: "Une erreur inattendue s'est produite",
        ...(isDev && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * Fonction utilitaire pour valider les paramètres de pagination
 * @deprecated Utilisez validateListingParams à la place
 */
export function validatePaginationParams(
  limit?: number,
  offset?: number
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (limit !== undefined) {
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push("Le limit doit être un nombre entre 1 et 100");
    }
  }

  if (offset !== undefined) {
    if (isNaN(offset) || offset < 0) {
      errors.push("L'offset doit être un nombre positif ou nul");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Export des types pour utilisation externe
 */
export type { ListingBasic, GetListingsResponse, GetListingsParams };

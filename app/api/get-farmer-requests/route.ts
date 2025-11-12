// app/api/get-farmer-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Type pour une demande de producteur
 */
interface FarmerRequest {
  id: number;
  user_id: string;
  email: string;
  farm_name: string;
  location: string;
  description: string;
  phone: string | null;
  website: string | null;
  products: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  approved_by_admin_at: string | null;
}

/**
 * Type pour la réponse API
 */
interface GetFarmerRequestsResponse {
  requests?: FarmerRequest[];
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
 * Type pour les paramètres de requête
 */
interface GetFarmerRequestsParams {
  status?: "pending" | "approved" | "rejected" | "all";
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "updated_at" | "farm_name";
  sortOrder?: "asc" | "desc";
}

/**
 * Configuration pour Next.js 14.2 - Export obligatoire
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Validation et initialisation de Supabase avec gestion d'erreur améliorée
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Variables d'environnement Supabase manquantes. " +
        "Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env"
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
function validateFarmerRequestParams(searchParams: URLSearchParams): {
  isValid: boolean;
  errors: string[];
  params: GetFarmerRequestsParams;
} {
  const errors: string[] = [];
  const params: GetFarmerRequestsParams = {};

  // Validation du status
  const status = searchParams.get("status");
  const validStatuses = ["pending", "approved", "rejected", "all"] as const;
  if (status) {
    if (validStatuses.includes(status as any)) {
      params.status = status as (typeof validStatuses)[number];
    } else {
      errors.push(
        `Le status doit être l'un des suivants: ${validStatuses.join(", ")}`
      );
    }
  } else {
    params.status = "pending"; // Valeur par défaut
  }

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
  const validSortFields = ["created_at", "updated_at", "farm_name"] as const;
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

  return {
    isValid: errors.length === 0,
    errors,
    params,
  };
}

/**
 * API Route pour récupérer les demandes de producteurs
 *
 * Cette route permet de :
 * - Récupérer les demandes par statut (pending par défaut)
 * - Supporter la pagination avec limit/offset
 * - Supporter le tri par différents champs
 * - Compter le nombre total de demandes
 * - Gérer les erreurs de manière robuste
 *
 * @param req - Requête avec paramètres de query optionnels
 * @returns Réponse JSON avec la liste des demandes
 *
 * @example
 * ```typescript
 * // Récupération des demandes en attente
 * const response = await fetch("/api/get-farmer-requests");
 *
 * // Avec filtres et pagination
 * const response = await fetch("/api/get-farmer-requests?status=all&limit=10&offset=0");
 *
 * // Tri par date de création
 * const response = await fetch("/api/get-farmer-requests?sortBy=created_at&sortOrder=desc");
 * ```
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<GetFarmerRequestsResponse>> {
  try {
    // Extraction et validation des paramètres de query
    const { searchParams } = new URL(req.url);
    const validation = validateFarmerRequestParams(searchParams);

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
    console.log(`[API] Récupération des demandes farmer avec params:`, params);

    // Création du client Supabase
    const supabase = createSupabaseClient();

    // Construction de la requête de base avec type safety amélioré
    let query = supabase
      .from("farmer_requests")
      .select("*", { count: "exact" })
      .order(params.sortBy!, { ascending: params.sortOrder === "asc" });

    // Application du filtre de statut
    if (params.status !== "all") {
      query = query.eq("status", params.status!);
    }

    // Application de la pagination si spécifiée
    if (params.limit !== undefined) {
      const start = params.offset || 0;
      const end = start + params.limit - 1;
      query = query.range(start, end);
    }

    // Exécution de la requête
    const { data, error, count } = await query;

    if (error) {
      console.error("[API] Erreur Supabase:", error.message);
      return NextResponse.json(
        {
          error: "Erreur lors du chargement des demandes",
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
      `✅ [API] ${data.length} demandes récupérées avec succès (total: ${count})`
    );

    // Construction de la réponse avec métadonnées
    const response: GetFarmerRequestsResponse = {
      requests: data as FarmerRequest[],
      count: data.length,
      message: `${data.length} demande(s) ${params.status === "all" ? "" : params.status} récupérée(s)`,
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

    // Retour avec headers CORS appropriés pour Next.js 14.2
    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[API] Erreur serveur:", error);

    // Gestion d'erreur avec détails selon l'environnement
    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        error: "Erreur serveur lors du chargement des demandes",
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
 * Export des types pour utilisation externe
 */
export type {
  FarmerRequest,
  GetFarmerRequestsResponse,
  GetFarmerRequestsParams,
};

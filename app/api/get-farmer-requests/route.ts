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

// Validation des variables d'environnement
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Variables d'environnement Supabase manquantes");
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
export async function GET(req: NextRequest): Promise<NextResponse<GetFarmerRequestsResponse>> {
  try {
    // Extraction des paramètres de query
    const { searchParams } = new URL(req.url);
    
    // Parse des paramètres avec valeurs par défaut
    const params: GetFarmerRequestsParams = {
      status: (searchParams.get("status") as "pending" | "approved" | "rejected" | "all") || "pending",
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
      sortBy: (searchParams.get("sortBy") as "created_at" | "updated_at" | "farm_name") || "created_at",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    // Validation des paramètres
    const validStatuses = ["pending", "approved", "rejected", "all"];
    if (!validStatuses.includes(params.status)) {
      return NextResponse.json(
        { 
          error: "Paramètre status invalide",
          message: `Le status doit être l'un des suivants: ${validStatuses.join(", ")}`
        },
        { status: 400 }
      );
    }

    const validSortFields = ["created_at", "updated_at", "farm_name"];
    if (!validSortFields.includes(params.sortBy)) {
      return NextResponse.json(
        { 
          error: "Paramètre sortBy invalide",
          message: `sortBy doit être l'un des suivants: ${validSortFields.join(", ")}`
        },
        { status: 400 }
      );
    }

    if (!["asc", "desc"].includes(params.sortOrder)) {
      return NextResponse.json(
        { 
          error: "Paramètre sortOrder invalide",
          message: "sortOrder doit être 'asc' ou 'desc'"
        },
        { status: 400 }
      );
    }

    // Validation des paramètres de pagination
    if (params.limit !== undefined && (isNaN(params.limit) || params.limit < 1 || params.limit > 100)) {
      return NextResponse.json(
        { 
          error: "Paramètre limit invalide",
          message: "Le limit doit être un nombre entre 1 et 100"
        },
        { status: 400 }
      );
    }

    if (params.offset !== undefined && (isNaN(params.offset) || params.offset < 0)) {
      return NextResponse.json(
        { 
          error: "Paramètre offset invalide",
          message: "L'offset doit être un nombre positif ou nul"
        },
        { status: 400 }
      );
    }

    console.log(`[API] Récupération des demandes farmer avec params:`, params);

    // Construction de la requête de base
    let query = supabase
      .from("farmer_requests")
      .select("*", { count: "exact" })
      .order(params.sortBy, { ascending: params.sortOrder === "asc" });

    // Application du filtre de statut
    if (params.status !== "all") {
      query = query.eq("status", params.status);
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
          message: "Impossible d'accéder à la base de données"
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
          message: "La réponse de la base de données n'est pas valide"
        },
        { status: 500 }
      );
    }

    console.log(`✅ [API] ${data.length} demandes récupérées avec succès (total: ${count})`);

    // Construction de la réponse avec métadonnées
    const response: GetFarmerRequestsResponse = {
      requests: data as FarmerRequest[],
      count: data.length,
      message: `${data.length} demande(s) ${params.status === "all" ? "" : params.status} récupérée(s)`,
    };

    // Ajout des informations de pagination si utilisée
    if (params.limit !== undefined) {
      const currentPage = Math.floor((params.offset || 0) / params.limit);
      const totalPages = Math.ceil((count || 0) / params.limit);
      
      response.pagination = {
        total: count || 0,
        page: currentPage,
        limit: params.limit,
        hasMore: (params.offset || 0) + params.limit < (count || 0),
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("[API] Erreur serveur:", error);
    
    // Gestion d'erreur avec détails selon l'environnement
    const isDev = process.env.NODE_ENV === "development";
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors du chargement des demandes",
        message: "Une erreur inattendue s'est produite",
        ...(isDev && { 
          details: error instanceof Error ? error.message : String(error) 
        })
      },
      { status: 500 }
    );
  }
}

/**
 * Fonction utilitaire pour valider les paramètres de requête
 * 
 * @param params - Paramètres à valider
 * @returns Objet avec validation result et erreurs
 */
export function validateFarmerRequestParams(params: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const validStatuses = ["pending", "approved", "rejected", "all"];
  if (params.status && !validStatuses.includes(params.status)) {
    errors.push(`Le status doit être l'un des suivants: ${validStatuses.join(", ")}`);
  }

  const validSortFields = ["created_at", "updated_at", "farm_name"];
  if (params.sortBy && !validSortFields.includes(params.sortBy)) {
    errors.push(`sortBy doit être l'un des suivants: ${validSortFields.join(", ")}`);
  }

  if (params.sortOrder && !["asc", "desc"].includes(params.sortOrder)) {
    errors.push("sortOrder doit être 'asc' ou 'desc'");
  }

  if (params.limit !== undefined) {
    const limit = parseInt(params.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push("Le limit doit être un nombre entre 1 et 100");
    }
  }

  if (params.offset !== undefined) {
    const offset = parseInt(params.offset);
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
export type {
  FarmerRequest,
  GetFarmerRequestsResponse,
  GetFarmerRequestsParams,
};
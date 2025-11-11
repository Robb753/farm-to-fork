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
}

/**
 * Type pour les paramètres de requête optionnels
 */
interface GetListingsParams {
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "id";
  sortOrder?: "asc" | "desc";
}

// Validation des variables d'environnement
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Variables d'environnement Supabase manquantes");
}

// Initialise un client Supabase sécurisé côté serveur
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * API Route pour récupérer les listings de fermes actives
 * 
 * Cette route permet de :
 * - Récupérer tous les listings actifs
 * - Supporter la pagination avec limit/offset
 * - Supporter le tri par différents champs
 * - Gérer les erreurs de manière robuste
 * 
 * @param req - Requête avec paramètres de query optionnels
 * @returns Réponse JSON avec la liste des listings
 * 
 * @example
 * ```typescript
 * // Récupération simple
 * const response = await fetch("/api/get-listings");
 * const { listings } = await response.json();
 * 
 * // Avec pagination et tri
 * const response = await fetch("/api/get-listings?limit=10&offset=0&sortBy=created_at&sortOrder=desc");
 * ```
 */
export async function GET(req: NextRequest): Promise<NextResponse<GetListingsResponse>> {
  try {
    // Extraction des paramètres de query
    const { searchParams } = new URL(req.url);
    
    // Parse des paramètres avec valeurs par défaut
    const params: GetListingsParams = {
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
      sortBy: (searchParams.get("sortBy") as "created_at" | "id") || "created_at",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    // Validation des paramètres numériques
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

    // Validation des paramètres de tri
    if (!["created_at", "id"].includes(params.sortBy)) {
      return NextResponse.json(
        { 
          error: "Paramètre sortBy invalide",
          message: "sortBy doit être 'created_at' ou 'id'"
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

    console.log(`[API] Récupération des listings avec params:`, params);

    // Construction de la requête Supabase
    let query = supabase
      .from("listing")
      .select("id, created_at, createdBy, coordinates, active")
      .eq("active", true)
      .order(params.sortBy, { ascending: params.sortOrder === "asc" });

    // Application de la pagination si spécifiée
    if (params.limit !== undefined) {
      query = query.limit(params.limit);
    }

    if (params.offset !== undefined) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    // Exécution de la requête
    const { data, error, count } = await query;

    if (error) {
      console.error("[API] Erreur Supabase:", error.message);
      return NextResponse.json(
        { 
          error: "Erreur lors de la récupération des listings.",
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

    console.log(`✅ [API] ${data.length} listings récupérés avec succès`);

    // Réponse avec métadonnées
    const response: GetListingsResponse = {
      listings: data as ListingBasic[],
      count: data.length,
    };

    // Ajout du count total si pagination utilisée
    if (params.limit !== undefined || params.offset !== undefined) {
      // Note: pour obtenir le count total, il faudrait faire une requête séparée
      // avec .select('*', { count: 'exact', head: true })
      response.message = `${data.length} listings retournés`;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("[API] Erreur serveur:", error);
    
    // Gestion d'erreur avec détails selon l'environnement
    const isDev = process.env.NODE_ENV === "development";
    
    return NextResponse.json(
      { 
        error: "Erreur serveur inattendue",
        message: "Une erreur s'est produite lors du traitement de votre demande",
        ...(isDev && { 
          details: error instanceof Error ? error.message : String(error) 
        })
      },
      { status: 500 }
    );
  }
}

/**
 * Fonction utilitaire pour valider les paramètres de pagination
 * 
 * @param limit - Limite de résultats
 * @param offset - Décalage
 * @returns Objet avec validation result et erreurs
 */
export function validatePaginationParams(limit?: number, offset?: number): {
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
export type {
  ListingBasic,
  GetListingsResponse,
  GetListingsParams,
};
// app/api/get-all-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un profil utilisateur
 */
interface UserProfile {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
  farm_id?: number | null;
  favorites?: string | null;
}

/**
 * Type pour la réponse API
 */
interface GetAllUsersResponse {
  users?: UserProfile[];
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
interface GetAllUsersParams {
  role?: "user" | "farmer" | "admin" | "all";
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "updated_at" | "email" | "role";
  sortOrder?: "asc" | "desc";
  search?: string;
}

// Sécurité : vérifie que les clés serveur sont bien définies
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
  throw new Error("Les variables d'environnement Supabase sont manquantes.");
}

// Initialisation du client Supabase côté serveur
const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * API Route pour récupérer tous les utilisateurs
 * 
 * Cette route permet de :
 * - Récupérer tous les profils utilisateurs
 * - Filtrer par rôle (user, farmer, admin, all)
 * - Supporter la pagination avec limit/offset
 * - Rechercher par email
 * - Supporter le tri par différents champs
 * - Compter le nombre total d'utilisateurs
 * 
 * @param req - Requête avec paramètres de query optionnels
 * @returns Réponse JSON avec la liste des utilisateurs
 * 
 * @example
 * ```typescript
 * // Récupération simple de tous les utilisateurs
 * const response = await fetch("/api/get-all-users");
 * 
 * // Filtrage par rôle farmer avec pagination
 * const response = await fetch("/api/get-all-users?role=farmer&limit=20&offset=0");
 * 
 * // Recherche par email
 * const response = await fetch("/api/get-all-users?search=john@example.com");
 * 
 * // Tri par date de création
 * const response = await fetch("/api/get-all-users?sortBy=created_at&sortOrder=desc");
 * ```
 */
export async function GET(req: NextRequest): Promise<NextResponse<GetAllUsersResponse>> {
  try {
    // Extraction des paramètres de query
    const { searchParams } = new URL(req.url);
    
    // Parse des paramètres avec valeurs par défaut
    const params: GetAllUsersParams = {
      role: (searchParams.get("role") as "user" | "farmer" | "admin" | "all") || "all",
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
      sortBy: (searchParams.get("sortBy") as "created_at" | "updated_at" | "email" | "role") || "created_at",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      search: searchParams.get("search") || undefined,
    };

    // Validation des paramètres
    const validRoles = ["user", "farmer", "admin", "all"];
    if (!validRoles.includes(params.role)) {
      return NextResponse.json(
        { 
          error: "Paramètre role invalide",
          message: `Le rôle doit être l'un des suivants: ${validRoles.join(", ")}`
        },
        { status: 400 }
      );
    }

    const validSortFields = ["created_at", "updated_at", "email", "role"];
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

    // Validation de la recherche
    if (params.search && params.search.length < 2) {
      return NextResponse.json(
        { 
          error: "Paramètre search invalide",
          message: "La recherche doit contenir au moins 2 caractères"
        },
        { status: 400 }
      );
    }

    console.log(`[GET USERS] Récupération des utilisateurs avec params:`, params);

    // Construction de la requête de base
    let query = supabase
      .from("profiles")
      .select("user_id, email, role, created_at, updated_at, farm_id, favorites", { count: "exact" })
      .order(params.sortBy, { ascending: params.sortOrder === "asc" });

    // Application du filtre de rôle
    if (params.role !== "all") {
      query = query.eq("role", params.role);
    }

    // Application de la recherche par email
    if (params.search) {
      query = query.ilike("email", `%${params.search}%`);
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
      console.error("[GET USERS] Erreur Supabase:", error);
      return NextResponse.json(
        { 
          error: "Erreur lors de la récupération des utilisateurs",
          message: "Impossible d'accéder à la base de données"
        },
        { status: 500 }
      );
    }

    // Validation des données retournées
    if (!Array.isArray(data)) {
      console.error("[GET USERS] Format de données inattendu:", typeof data);
      return NextResponse.json(
        { 
          error: "Format de données inattendu",
          message: "La réponse de la base de données n'est pas valide"
        },
        { status: 500 }
      );
    }

    console.log(`✅ [GET USERS] ${data.length} utilisateurs récupérés avec succès (total: ${count})`);

    // Construction de la réponse avec métadonnées
    const response: GetAllUsersResponse = {
      users: data as UserProfile[],
      count: data.length,
      message: `${data.length} utilisateur(s) ${params.role === "all" ? "" : `avec le rôle ${params.role} `}récupéré(s)`,
    };

    // Ajout des informations de pagination si utilisée
    if (params.limit !== undefined) {
      const currentPage = Math.floor((params.offset || 0) / params.limit);
      
      response.pagination = {
        total: count || 0,
        page: currentPage,
        limit: params.limit,
        hasMore: (params.offset || 0) + params.limit < (count || 0),
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("[GET USERS] Erreur serveur:", error);
    
    // Gestion d'erreur avec détails selon l'environnement
    const isDev = process.env.NODE_ENV === "development";
    
    return NextResponse.json(
      { 
        error: "Erreur interne du serveur",
        message: "Une erreur inattendue s'est produite lors de la récupération des utilisateurs",
        ...(isDev && { 
          details: error instanceof Error ? error.message : String(error) 
        })
      },
      { status: 500 }
    );
  }
}

/**
 * Fonction utilitaire pour valider les paramètres de requête utilisateurs
 * 
 * @param params - Paramètres à valider
 * @returns Objet avec validation result et erreurs
 */
export function validateUserParams(params: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const validRoles = ["user", "farmer", "admin", "all"];
  if (params.role && !validRoles.includes(params.role)) {
    errors.push(`Le rôle doit être l'un des suivants: ${validRoles.join(", ")}`);
  }

  const validSortFields = ["created_at", "updated_at", "email", "role"];
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

  if (params.search && params.search.length < 2) {
    errors.push("La recherche doit contenir au moins 2 caractères");
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
  UserProfile,
  GetAllUsersResponse,
  GetAllUsersParams,
};
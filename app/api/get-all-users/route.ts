// app/api/get-all-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Force dynamic pour éviter la mise en cache
export const dynamic = "force-dynamic";

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
 *
 * ➜ role, sortBy et sortOrder ne sont plus optionnels ici
 *    car on leur donne toujours une valeur par défaut.
 */
interface GetAllUsersParams {
  role: "user" | "farmer" | "admin" | "all";
  limit?: number;
  offset?: number;
  sortBy: "created_at" | "updated_at" | "email" | "role";
  sortOrder: "asc" | "desc";
  search?: string;
}

// Sécurité : vérifie que les clés serveur sont bien définies
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
  throw new Error("Les variables d'environnement Supabase sont manquantes.");
}

// On stocke dans des constantes typées string pour éviter le `string | undefined`
const SUPABASE_URL: string = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY: string =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialisation du client Supabase côté serveur
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/**
 * API Route pour récupérer tous les utilisateurs
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<GetAllUsersResponse>> {
  try {
    // Extraction des paramètres de query
    const { searchParams } = new URL(req.url);

    // Rôle depuis la query (ou null si non fourni)
    const roleParam = searchParams.get("role") as
      | "user"
      | "farmer"
      | "admin"
      | "all"
      | null;

    // Parse des paramètres avec valeurs par défaut
    const params: GetAllUsersParams = {
      role: roleParam ?? "all",
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit") as string, 10)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset") as string, 10)
        : undefined,
      sortBy:
        (searchParams.get("sortBy") as
          | "created_at"
          | "updated_at"
          | "email"
          | "role") || "created_at",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      search: searchParams.get("search") || undefined,
    };

    // Validation des paramètres
    const validRoles = ["user", "farmer", "admin", "all"] as const;
    if (!validRoles.includes(params.role)) {
      return NextResponse.json(
        {
          error: "Paramètre role invalide",
          message: `Le rôle doit être l'un des suivants: ${validRoles.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validSortFields = [
      "created_at",
      "updated_at",
      "email",
      "role",
    ] as const;
    if (!validSortFields.includes(params.sortBy)) {
      return NextResponse.json(
        {
          error: "Paramètre sortBy invalide",
          message: `sortBy doit être l'un des suivants: ${validSortFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!["asc", "desc"].includes(params.sortOrder)) {
      return NextResponse.json(
        {
          error: "Paramètre sortOrder invalide",
          message: "sortOrder doit être 'asc' ou 'desc'",
        },
        { status: 400 }
      );
    }

    // Validation des paramètres de pagination
    if (
      params.limit !== undefined &&
      (isNaN(params.limit) || params.limit < 1 || params.limit > 100)
    ) {
      return NextResponse.json(
        {
          error: "Paramètre limit invalide",
          message: "Le limit doit être un nombre entre 1 et 100",
        },
        { status: 400 }
      );
    }

    if (
      params.offset !== undefined &&
      (isNaN(params.offset) || params.offset < 0)
    ) {
      return NextResponse.json(
        {
          error: "Paramètre offset invalide",
          message: "L'offset doit être un nombre positif ou nul",
        },
        { status: 400 }
      );
    }

    // Validation de la recherche
    if (params.search && params.search.length < 2) {
      return NextResponse.json(
        {
          error: "Paramètre search invalide",
          message: "La recherche doit contenir au moins 2 caractères",
        },
        { status: 400 }
      );
    }

    // Construction de la requête de base
    let query = supabase
      .from("profiles")
      .select(
        "user_id, email, role, created_at, updated_at, farm_id, favorites",
        { count: "exact" }
      )
      .order(params.sortBy, { ascending: params.sortOrder === "asc" });

    // Application du filtre de rôle (on ne filtre pas si "all")
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
          message: "Impossible d'accéder à la base de données",
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
          message: "La réponse de la base de données n'est pas valide",
        },
        { status: 500 }
      );
    }

    // Construction de la réponse avec métadonnées
    const response: GetAllUsersResponse = {
      users: data as UserProfile[],
      count: data.length,
      message: `${data.length} utilisateur(s) ${
        params.role === "all" ? "" : `avec le rôle ${params.role} `
      }récupéré(s)`,
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
        message:
          "Une erreur inattendue s'est produite lors de la récupération des utilisateurs",
        ...(isDev && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

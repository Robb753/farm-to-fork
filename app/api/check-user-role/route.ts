// app/api/get-user-info/route.ts
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic pour éviter la mise en cache des données utilisateur
export const dynamic = "force-dynamic";

/**
 * Type pour les métadonnées publiques Clerk
 */
interface ClerkPublicMetadata {
  role?: string;
  [key: string]: any;
}

/**
 * Type pour la réponse API
 */
interface GetUserInfoResponse {
  success: boolean;
  userId?: string;
  email?: string;
  role?: string;
  isValidRole?: boolean;
  hasRole?: boolean;
  allMetadata?: ClerkPublicMetadata;
  error?: string;
  details?: string;
}

/**
 * Rôles valides dans l'application
 */
const VALID_ROLES = ["user", "farmer", "admin"] as const;
type ValidRole = typeof VALID_ROLES[number];

/**
 * API Route pour récupérer les informations utilisateur depuis Clerk
 * 
 * Cette route permet de :
 * - Récupérer les informations d'un utilisateur par son ID
 * - Extraire le rôle depuis les métadonnées publiques
 * - Valider si le rôle est autorisé dans l'application
 * - Retourner l'email principal de l'utilisateur
 * 
 * @param req - Requête avec userId en query parameter
 * @returns Réponse JSON avec les informations utilisateur
 * 
 * @example
 * ```typescript
 * // Récupération des infos utilisateur
 * const response = await fetch("/api/get-user-info?userId=user_123456");
 * const userInfo = await response.json();
 * 
 * if (userInfo.success) {
 *   console.log("Rôle:", userInfo.role);
 *   console.log("Email:", userInfo.email);
 *   console.log("Rôle valide:", userInfo.isValidRole);
 * }
 * ```
 */
export async function GET(req: NextRequest): Promise<NextResponse<GetUserInfoResponse>> {
  try {
    // Extraction du userId depuis les paramètres de query
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Validation du paramètre userId
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Paramètre userId manquant",
        },
        { status: 400 }
      );
    }

    if (typeof userId !== "string" || userId.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Paramètre userId invalide",
        },
        { status: 400 }
      );
    }

    // Validation du format userId Clerk (doit commencer par "user_")
    if (!userId.startsWith("user_")) {
      return NextResponse.json(
        { 
          success: false,
          error: "Format userId invalide - doit être un ID Clerk valide",
        },
        { status: 400 }
      );
    }

    console.log(`[GET USER INFO] Récupération infos pour userId: ${userId}`);

    // Récupération de l'utilisateur depuis Clerk
    let user;
    try {
      user = await clerkClient.users.getUser(userId);
    } catch (clerkError) {
      console.error("[GET USER INFO] Erreur Clerk:", clerkError);
      
      // Gestion spécifique des erreurs Clerk
      if (clerkError instanceof Error) {
        if (clerkError.message.includes("not found") || clerkError.message.includes("404")) {
          return NextResponse.json(
            { 
              success: false,
              error: "Utilisateur non trouvé",
            },
            { status: 404 }
          );
        }

        if (clerkError.message.includes("unauthorized") || clerkError.message.includes("403")) {
          return NextResponse.json(
            { 
              success: false,
              error: "Non autorisé à accéder à ces informations",
            },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { 
          success: false,
          error: "Erreur lors de la récupération des données utilisateur",
          details: process.env.NODE_ENV === "development" ? 
            (clerkError instanceof Error ? clerkError.message : String(clerkError)) : 
            undefined
        },
        { status: 500 }
      );
    }

    // Vérification que l'utilisateur existe
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: "Utilisateur non trouvé",
        },
        { status: 404 }
      );
    }

    // Extraction des informations utilisateur
    const publicMetadata = (user.publicMetadata || {}) as ClerkPublicMetadata;
    const userRole = publicMetadata.role as string | undefined;
    
    // Récupération de l'email principal
    const primaryEmail = user.primaryEmailAddress?.emailAddress;
    const fallbackEmail = user.emailAddresses?.[0]?.emailAddress;
    const email = primaryEmail || fallbackEmail;

    // Validation du rôle
    const hasRole = !!userRole;
    const isValidRole = userRole ? VALID_ROLES.includes(userRole as ValidRole) : false;

    console.log(`✅ [GET USER INFO] Infos récupérées pour ${userId}: role=${userRole}, email=${email}`);

    // Construction de la réponse
    const response: GetUserInfoResponse = {
      success: true,
      userId,
      email: email || "email inconnu",
      role: userRole || "undefined",
      isValidRole,
      hasRole,
      allMetadata: publicMetadata,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[GET USER INFO] Erreur serveur:", error);
    
    // Gestion d'erreur générale avec détails selon l'environnement
    const isDev = process.env.NODE_ENV === "development";
    
    return NextResponse.json(
      { 
        success: false,
        error: "Erreur interne du serveur",
        ...(isDev && { 
          details: error instanceof Error ? error.message : "Erreur inconnue"
        })
      },
      { status: 500 }
    );
  }
}

/**
 * Fonction utilitaire pour valider un rôle utilisateur
 * 
 * @param role - Rôle à valider
 * @returns true si le rôle est valide
 */
export function isValidUserRole(role: string | undefined): role is ValidRole {
  if (!role) return false;
  return VALID_ROLES.includes(role as ValidRole);
}

/**
 * Fonction utilitaire pour extraire le rôle depuis les métadonnées Clerk
 * 
 * @param metadata - Métadonnées publiques Clerk
 * @returns Rôle extrait et validation
 */
export function extractUserRole(metadata: ClerkPublicMetadata | null | undefined): {
  role: string | undefined;
  hasRole: boolean;
  isValid: boolean;
} {
  const role = metadata?.role as string | undefined;
  const hasRole = !!role;
  const isValid = isValidUserRole(role);

  return { role, hasRole, isValid };
}

/**
 * Export des types pour utilisation externe
 */
export type {
  GetUserInfoResponse,
  ClerkPublicMetadata,
  ValidRole,
};
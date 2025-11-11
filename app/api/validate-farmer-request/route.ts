// app/api/update-user-role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Types pour la requête de mise à jour de rôle
 */
interface UpdateUserRoleRequestBody {
  userId: string;
  role: "user" | "farmer" | "admin";
}

/**
 * Type pour la réponse API
 */
interface UpdateUserRoleResponse {
  success: boolean;
  error?: string;
  message?: string;
  details?: string;
}

/**
 * Rôles autorisés dans l'application
 */
const VALID_ROLES = ["user", "farmer", "admin"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

/**
 * API Route pour mettre à jour le rôle d'un utilisateur
 *
 * Cette route permet de :
 * - Mettre à jour le rôle d'un utilisateur dans Clerk
 * - Valider que le rôle est autorisé
 * - Gérer les erreurs de manière robuste
 *
 * @param req - Requête contenant userId et role
 * @returns Réponse JSON avec succès/erreur
 *
 * @example
 * ```typescript
 * // Côté client
 * const response = await fetch("/api/update-user-role", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     userId: "user_123456",
 *     role: "farmer"
 *   })
 * });
 * ```
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<UpdateUserRoleResponse>> {
  try {
    // Parse et validation du corps de requête
    let body: UpdateUserRoleRequestBody;

    try {
      body = await req.json();
    } catch (parseError) {
      console.error("[API] Erreur parsing JSON:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Corps de requête JSON invalide",
          message: "Impossible de parser la requête",
        },
        { status: 400 }
      );
    }

    const { userId, role } = body;

    // Validation des paramètres requis
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètre userId manquant",
          message: "L'ID utilisateur est requis",
        },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètre role manquant",
          message: "Le rôle est requis",
        },
        { status: 400 }
      );
    }

    // Validation du type de userId (doit être une string non vide)
    if (typeof userId !== "string" || userId.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "userId invalide",
          message: "L'ID utilisateur doit être une chaîne non vide",
        },
        { status: 400 }
      );
    }

    // Validation du rôle autorisé
    if (!VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json(
        {
          success: false,
          error: "Rôle invalide",
          message: `Le rôle doit être l'un des suivants: ${VALID_ROLES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    console.log(
      `[API] Mise à jour rôle pour userId: ${userId} vers rôle: ${role}`
    );

    // Mise à jour du rôle dans Clerk
    try {
      await clerkClient.users.updateUser(userId, {
        publicMetadata: { role },
      });

      console.log(
        `✅ [API] Rôle mis à jour avec succès pour userId: ${userId}`
      );

      return NextResponse.json({
        success: true,
        message: `Rôle mis à jour vers "${role}" avec succès`,
      });
    } catch (clerkError) {
      console.error("[API] Erreur Clerk updateUser:", clerkError);

      // Gestion des erreurs spécifiques de Clerk
      if (clerkError instanceof Error) {
        if (clerkError.message.includes("not found")) {
          return NextResponse.json(
            {
              success: false,
              error: "Utilisateur non trouvé",
              message: "L'utilisateur spécifié n'existe pas",
            },
            { status: 404 }
          );
        }

        if (clerkError.message.includes("unauthorized")) {
          return NextResponse.json(
            {
              success: false,
              error: "Non autorisé",
              message: "Permissions insuffisantes pour cette opération",
            },
            { status: 403 }
          );
        }
      }

      // Erreur Clerk générique
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la mise à jour du rôle",
          message: "Impossible de mettre à jour le rôle utilisateur",
          details:
            process.env.NODE_ENV === "development"
              ? clerkError instanceof Error
                ? clerkError.message
                : String(clerkError)
              : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API] Erreur update-user-role:", error);

    // Gestion d'erreur avec détails selon l'environnement
    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur interne",
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
 * Fonction utilitaire pour valider un rôle
 *
 * @param role - Rôle à valider
 * @returns true si le rôle est valide
 */
export function isValidRole(role: string): role is ValidRole {
  return VALID_ROLES.includes(role as ValidRole);
}

/**
 * Export des types pour utilisation externe
 */
export type { UpdateUserRoleRequestBody, UpdateUserRoleResponse, ValidRole };

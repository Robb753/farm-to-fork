// app/api/update-user-role/route.ts

import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";

/**
 * Types pour la gestion des rôles utilisateurs
 */
type UserRole = "user" | "farmer" | "admin";

/**
 * Interface pour la requête de mise à jour du rôle
 */
interface UpdateUserRoleRequestBody {
  userId: string;
  role: UserRole;
  reason?: string; // Optionnel : raison du changement de rôle
}

/**
 * Interface pour la réponse API
 */
interface UpdateUserRoleResponse {
  success: boolean;
  message: string;
  error?: string;
  details?: string;
  timestamp?: string;
  updatedUser?: {
    id: string;
    role: UserRole;
    updatedAt: string;
  };
}

/**
 * Interface pour la validation des données
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: UpdateUserRoleRequestBody;
}

/**
 * Constantes de validation
 */
const VALID_ROLES: readonly UserRole[] = ["user", "farmer", "admin"] as const;
const USER_ID_REGEX = /^user_[a-zA-Z0-9]{24,}$/; // Format Clerk user ID
const MAX_REASON_LENGTH = 500;

/**
 * Fonction pour valider et sanitiser les données de mise à jour de rôle
 */
function validateUpdateRoleData(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Aucune donnée fournie ou format invalide"],
    };
  }

  // Validation de l'userId
  const userId = typeof data.userId === "string" ? data.userId.trim() : "";
  if (!userId) {
    errors.push("L'ID utilisateur est requis");
  } else if (!USER_ID_REGEX.test(userId)) {
    errors.push("Format d'ID utilisateur invalide");
  }

  // Validation du rôle
  const role =
    typeof data.role === "string" ? data.role.trim().toLowerCase() : "";
  if (!role) {
    errors.push("Le rôle est requis");
  } else if (!VALID_ROLES.includes(role as UserRole)) {
    errors.push(
      `Le rôle doit être l'un des suivants: ${VALID_ROLES.join(", ")}`
    );
  }

  // Validation de la raison (optionnelle)
  const reason =
    typeof data.reason === "string" ? data.reason.trim() : undefined;
  if (reason && reason.length > MAX_REASON_LENGTH) {
    errors.push(
      `La raison ne peut pas dépasser ${MAX_REASON_LENGTH} caractères`
    );
  }

  // Si pas d'erreurs, retourner les données sanitisées
  if (errors.length === 0) {
    const sanitizedData: UpdateUserRoleRequestBody = {
      userId,
      role: role as UserRole,
      ...(reason && { reason }),
    };

    return {
      isValid: true,
      errors: [],
      sanitizedData,
    };
  }

  return {
    isValid: false,
    errors,
  };
}

/**
 * Fonction pour vérifier les permissions de l'utilisateur qui fait la requête
 */
async function checkUserPermissions(
  requestingUserId: string,
  targetUserId: string,
  newRole: UserRole
): Promise<{
  hasPermission: boolean;
  error?: string;
}> {
  try {
    // ⚠️ clerkClient est maintenant une fonction asynchrone
    const client = await clerkClient();
    const requestingUser = await client.users.getUser(requestingUserId);
    const requestingUserRole =
      (requestingUser.publicMetadata?.role as UserRole) || "user";

    // Règles de permissions :
    // 1. Les admins peuvent changer tous les rôles
    // 2. Les utilisateurs peuvent seulement devenir farmers (auto-promotion)
    // 3. Personne ne peut s'auto-promouvoir admin

    if (requestingUserRole === "admin") {
      return { hasPermission: true }; // Les admins peuvent tout faire
    }

    if (requestingUserId === targetUserId) {
      // Auto-modification
      if (newRole === "farmer" && requestingUserRole === "user") {
        return { hasPermission: true }; // User -> Farmer autorisé
      }
      if (newRole === "admin") {
        return {
          hasPermission: false,
          error: "Vous ne pouvez pas vous auto-promouvoir administrateur",
        };
      }
    } else {
      // Modification d'un autre utilisateur
      return {
        hasPermission: false,
        error:
          "Vous n'avez pas les permissions pour modifier le rôle d'un autre utilisateur",
      };
    }

    return {
      hasPermission: false,
      error: "Action non autorisée",
    };
  } catch (error) {
    console.error(
      "[PERMISSIONS] Erreur lors de la vérification des permissions:",
      error
    );
    return {
      hasPermission: false,
      error: "Impossible de vérifier les permissions",
    };
  }
}

/**
 * Fonction pour enregistrer le changement de rôle (audit trail)
 */
async function logRoleChange(data: {
  userId: string;
  previousRole: UserRole;
  newRole: UserRole;
  changedBy: string;
  reason?: string;
  timestamp: string;
}): Promise<void> {
  console.log("[AUDIT] Changement de rôle:", {
    action: "role_change",
    userId: data.userId,
    previousRole: data.previousRole,
    newRole: data.newRole,
    changedBy: data.changedBy,
    reason: data.reason,
    timestamp: data.timestamp,
  });
}

/**
 * API Route pour mettre à jour le rôle d'un utilisateur
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<UpdateUserRoleResponse>> {
  const timestamp = new Date().toISOString();

  try {
    // ⚠️ auth() est maintenant asynchrone
    const { userId: requestingUserId } = await auth();

    if (!requestingUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Non authentifié",
          message: "Vous devez être connecté pour effectuer cette action",
          timestamp,
        },
        { status: 401 }
      );
    }

    // Parse et validation du corps de requête
    let requestData: any;

    try {
      const contentType = req.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return NextResponse.json(
          {
            success: false,
            error: "Type de contenu invalide",
            message: "Le content-type doit être application/json",
            timestamp,
          },
          { status: 400 }
        );
      }

      requestData = await req.json();
    } catch (parseError) {
      console.error("[UPDATE-ROLE] Erreur parsing JSON:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Corps de requête JSON invalide",
          message: "Impossible de parser la requête JSON",
          timestamp,
        },
        { status: 400 }
      );
    }

    // Validation et sanitisation des données
    const validation = validateUpdateRoleData(requestData);

    if (!validation.isValid) {
      console.warn("[UPDATE-ROLE] Validation échouée:", validation.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Données de requête invalides",
          message: validation.errors.join(", "),
          timestamp,
        },
        { status: 400 }
      );
    }

    const { userId, role, reason } = validation.sanitizedData!;
    console.log(
      `[UPDATE-ROLE] Demande de changement de rôle: ${userId} -> ${role} par ${requestingUserId}`
    );

    // ⚠️ Récupération du client Clerk
    const client = await clerkClient();

    // Récupération de l'utilisateur cible pour vérifier son rôle actuel
    let targetUser;
    let currentRole: UserRole = "user";

    try {
      targetUser = await client.users.getUser(userId);
      currentRole = (targetUser.publicMetadata?.role as UserRole) || "user";
    } catch (clerkError: any) {
      console.error(
        "[UPDATE-ROLE] Erreur lors de la récupération de l'utilisateur:",
        clerkError
      );

      if (clerkError.status === 404 || clerkError.code === "not_found") {
        return NextResponse.json(
          {
            success: false,
            error: "Utilisateur introuvable",
            message: "L'utilisateur spécifié n'existe pas",
            timestamp,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l'accès aux données utilisateur",
          message: "Impossible de récupérer les informations de l'utilisateur",
          timestamp,
          details:
            process.env.NODE_ENV === "development"
              ? clerkError.message
              : undefined,
        },
        { status: 500 }
      );
    }

    // Vérifier si le rôle est déjà celui demandé
    if (currentRole === role) {
      return NextResponse.json({
        success: true,
        message: `L'utilisateur a déjà le rôle ${role}`,
        timestamp,
        updatedUser: {
          id: userId,
          role,
          updatedAt: timestamp,
        },
      });
    }

    // Vérification des permissions
    const permissionCheck = await checkUserPermissions(
      requestingUserId,
      userId,
      role
    );
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: "Permissions insuffisantes",
          message:
            permissionCheck.error ||
            "Vous n'avez pas les permissions pour effectuer cette action",
          timestamp,
        },
        { status: 403 }
      );
    }

    // Mise à jour du rôle dans Clerk
    try {
      await client.users.updateUser(userId, {
        publicMetadata: {
          ...targetUser.publicMetadata,
          role,
          roleUpdatedAt: timestamp,
          roleUpdatedBy: requestingUserId,
          ...(reason && { roleChangeReason: reason }),
        },
      });

      console.log(
        `✅ [UPDATE-ROLE] Rôle mis à jour avec succès: ${userId} ${currentRole} -> ${role}`
      );

      // Enregistrement pour audit
      await logRoleChange({
        userId,
        previousRole: currentRole,
        newRole: role,
        changedBy: requestingUserId,
        reason,
        timestamp,
      });

      // Retour avec succès
      return NextResponse.json(
        {
          success: true,
          message: `Rôle mis à jour de ${currentRole} vers ${role} avec succès`,
          timestamp,
          updatedUser: {
            id: userId,
            role,
            updatedAt: timestamp,
          },
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    } catch (clerkUpdateError: any) {
      console.error(
        "[UPDATE-ROLE] Erreur lors de la mise à jour Clerk:",
        clerkUpdateError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la mise à jour du rôle",
          message:
            "Impossible de mettre à jour le rôle dans le système d'authentification",
          timestamp,
          details:
            process.env.NODE_ENV === "development"
              ? clerkUpdateError.message
              : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[UPDATE-ROLE] Erreur serveur critique:", error);

    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la mise à jour du rôle",
        message: "Une erreur inattendue s'est produite sur le serveur",
        timestamp,
        details: isDev && error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

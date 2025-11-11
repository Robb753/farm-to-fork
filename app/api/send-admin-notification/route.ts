// app/api/admin/send-notification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendAdminNotificationEmail } from "@/lib/config/email-notifications";

/**
 * Types pour la requête de notification admin
 */
interface AdminNotificationRequestBody {
  farm_name: string;
  email: string;
  location: string; // Required pour FarmerRequest
  description: string; // Required pour FarmerRequest
  user_id?: string;
  phone?: string;
  website?: string;
  products?: string;
  created_at?: string;
  id?: number;
  status?: string;
  updated_at?: string;
  approved_by_admin_at?: string | null;
}

/**
 * Type pour la réponse de l'email service
 */
interface EmailServiceResponse {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Type pour la réponse API
 */
interface AdminNotificationResponse {
  success: boolean;
  message: string;
  error?: string;
  details?: string;
}

/**
 * API Route pour envoyer une notification aux administrateurs
 *
 * Cette route permet de :
 * - Notifier les admins d'une nouvelle demande de producteur
 * - Valider les données requises (farm_name, email)
 * - Gérer les erreurs d'envoi d'email
 *
 * @param req - Requête contenant les données de la demande
 * @returns Réponse JSON avec succès/erreur
 *
 * @example
 * ```typescript
 * // Côté client
 * const response = await fetch("/api/admin/send-notification", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     farm_name: "Ferme du Bonheur",
 *     email: "contact@fermebonheur.fr",
 *     location: "Lyon, France",
 *     description: "Producteur bio de légumes"
 *   })
 * });
 * ```
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<AdminNotificationResponse>> {
  try {
    // Parse et validation du corps de requête
    let requestData: AdminNotificationRequestBody;

    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("[NOTIFICATION] Erreur parsing JSON:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Corps de requête JSON invalide",
          message: "Impossible de parser la requête",
        },
        { status: 400 }
      );
    }

    // Validation des champs requis
    if (!requestData) {
      return NextResponse.json(
        {
          success: false,
          error: "Données manquantes",
          message: "Aucune donnée fournie",
        },
        { status: 400 }
      );
    }

    const { farm_name, email, location, description } = requestData;

    // Validation du nom de la ferme
    if (
      !farm_name ||
      typeof farm_name !== "string" ||
      farm_name.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Nom de ferme manquant ou invalide",
          message: "Le nom de la ferme est requis",
        },
        { status: 400 }
      );
    }

    // Validation de l'email
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Email manquant ou invalide",
          message: "L'adresse email est requise",
        },
        { status: 400 }
      );
    }

    // Validation de la localisation
    if (
      !location ||
      typeof location !== "string" ||
      location.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Localisation manquante ou invalide",
          message: "La localisation de la ferme est requise",
        },
        { status: 400 }
      );
    }

    // Validation de la description
    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Description manquante ou invalide",
          message: "La description de la ferme est requise",
        },
        { status: 400 }
      );
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Format email invalide",
          message: "L'adresse email n'est pas valide",
        },
        { status: 400 }
      );
    }

    console.log(
      `[NOTIFICATION] Envoi notification pour: ${farm_name} (${email})`
    );

    // Envoyer la notification par email aux administrateurs
    let emailResult: EmailServiceResponse;

    try {
      emailResult = await sendAdminNotificationEmail(requestData);
    } catch (emailError) {
      console.error(
        "[NOTIFICATION] Erreur lors de l'appel du service email:",
        emailError
      );
      return NextResponse.json(
        {
          success: false,
          error: "Erreur du service email",
          message: "Impossible d'accéder au service d'envoi d'email",
          details:
            process.env.NODE_ENV === "development"
              ? emailError instanceof Error
                ? emailError.message
                : String(emailError)
              : undefined,
        },
        { status: 500 }
      );
    }

    // Vérifier le résultat de l'envoi d'email
    if (!emailResult || !emailResult.success) {
      const errorMessage =
        emailResult?.error || "Erreur inconnue lors de l'envoi";
      console.error("[NOTIFICATION] Erreur d'envoi d'email:", errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l'envoi de l'email de notification",
          message: "L'email n'a pas pu être envoyé aux administrateurs",
          details:
            process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }

    console.log(
      `✅ [NOTIFICATION] Notification envoyée avec succès pour: ${farm_name}`
    );

    return NextResponse.json({
      success: true,
      message: "Notification envoyée avec succès aux administrateurs",
    });
  } catch (error) {
    console.error("[NOTIFICATION] Erreur serveur:", error);

    // Gestion d'erreur avec détails selon l'environnement
    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de l'envoi de la notification",
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
 * Fonction utilitaire pour valider les données de demande
 *
 * @param data - Données à valider
 * @returns Objet avec validation result et erreurs
 */
export function validateNotificationData(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    errors.push("Aucune donnée fournie");
    return { isValid: false, errors };
  }

  if (
    !data.farm_name ||
    typeof data.farm_name !== "string" ||
    data.farm_name.trim().length === 0
  ) {
    errors.push("Nom de ferme requis");
  }

  if (
    !data.email ||
    typeof data.email !== "string" ||
    data.email.trim().length === 0
  ) {
    errors.push("Email requis");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push("Format email invalide");
    }
  }

  if (
    !data.location ||
    typeof data.location !== "string" ||
    data.location.trim().length === 0
  ) {
    errors.push("Localisation requise");
  }

  if (
    !data.description ||
    typeof data.description !== "string" ||
    data.description.trim().length === 0
  ) {
    errors.push("Description requise");
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
  AdminNotificationRequestBody,
  AdminNotificationResponse,
  EmailServiceResponse,
};

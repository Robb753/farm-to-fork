// app/api/admin/send-notification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendAdminNotificationEmail } from "@/lib/config/email-notifications";

/**
 * Types pour la requête de notification admin
 */
interface AdminNotificationRequestBody {
  farm_name: string;
  email: string;
  location: string;
  description: string;
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
  timestamp?: string;
}

/**
 * Type pour la validation des données
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: AdminNotificationRequestBody;
}

/**
 * Configuration pour Next.js 14.2 - Export obligatoire
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Constantes de validation
 */
const VALIDATION_RULES = {
  MAX_FARM_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_LOCATION_LENGTH: 200,
  MAX_PHONE_LENGTH: 20,
  MAX_WEBSITE_LENGTH: 500,
  MAX_PRODUCTS_LENGTH: 1000,
} as const;

/**
 * Regex pour validation
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
const URL_REGEX = /^https?:\/\/.+/;

/**
 * Fonction utilitaire pour sanitiser et valider les données de notification
 */
function validateAndSanitizeNotificationData(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Aucune donnée fournie ou format invalide"],
    };
  }

  // Sanitisation et validation du nom de ferme
  const farm_name =
    typeof data.farm_name === "string" ? data.farm_name.trim() : "";
  if (!farm_name) {
    errors.push("Le nom de la ferme est requis");
  } else if (farm_name.length > VALIDATION_RULES.MAX_FARM_NAME_LENGTH) {
    errors.push(
      `Le nom de la ferme ne peut pas dépasser ${VALIDATION_RULES.MAX_FARM_NAME_LENGTH} caractères`
    );
  }

  // Sanitisation et validation de l'email
  const email =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!email) {
    errors.push("L'adresse email est requise");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Le format de l'email n'est pas valide");
  }

  // Sanitisation et validation de la localisation
  const location =
    typeof data.location === "string" ? data.location.trim() : "";
  if (!location) {
    errors.push("La localisation est requise");
  } else if (location.length > VALIDATION_RULES.MAX_LOCATION_LENGTH) {
    errors.push(
      `La localisation ne peut pas dépasser ${VALIDATION_RULES.MAX_LOCATION_LENGTH} caractères`
    );
  }

  // Sanitisation et validation de la description
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  if (!description) {
    errors.push("La description est requise");
  } else if (description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
    errors.push(
      `La description ne peut pas dépasser ${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} caractères`
    );
  }

  // Validation des champs optionnels
  const phone = typeof data.phone === "string" ? data.phone.trim() : undefined;
  if (phone && !PHONE_REGEX.test(phone)) {
    errors.push("Le format du numéro de téléphone n'est pas valide");
  } else if (phone && phone.length > VALIDATION_RULES.MAX_PHONE_LENGTH) {
    errors.push(
      `Le numéro de téléphone ne peut pas dépasser ${VALIDATION_RULES.MAX_PHONE_LENGTH} caractères`
    );
  }

  const website =
    typeof data.website === "string" ? data.website.trim() : undefined;
  if (website && !URL_REGEX.test(website)) {
    errors.push(
      "L'URL du site web n'est pas valide (doit commencer par http:// ou https://)"
    );
  } else if (website && website.length > VALIDATION_RULES.MAX_WEBSITE_LENGTH) {
    errors.push(
      `L\'URL du site web ne peut pas dépasser ${VALIDATION_RULES.MAX_WEBSITE_LENGTH} caractères`
    );
  }

  const products =
    typeof data.products === "string" ? data.products.trim() : undefined;
  if (products && products.length > VALIDATION_RULES.MAX_PRODUCTS_LENGTH) {
    errors.push(
      `La liste des produits ne peut pas dépasser ${VALIDATION_RULES.MAX_PRODUCTS_LENGTH} caractères`
    );
  }

  // Si pas d'erreurs, retourner les données sanitisées
  if (errors.length === 0) {
    const sanitizedData: AdminNotificationRequestBody = {
      farm_name,
      email,
      location,
      description,
      ...(phone && { phone }),
      ...(website && { website }),
      ...(products && { products }),
      ...(data.user_id && { user_id: String(data.user_id) }),
      ...(data.id && { id: Number(data.id) }),
      ...(data.status && { status: String(data.status) }),
      ...(data.created_at && { created_at: String(data.created_at) }),
      ...(data.updated_at && { updated_at: String(data.updated_at) }),
      ...(data.approved_by_admin_at !== undefined && {
        approved_by_admin_at: data.approved_by_admin_at
          ? String(data.approved_by_admin_at)
          : null,
      }),
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
 * Fonction pour gérer les erreurs d'email de manière robuste
 */
async function handleEmailSending(
  data: AdminNotificationRequestBody
): Promise<EmailServiceResponse> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 seconde

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[NOTIFICATION] Tentative d'envoi ${attempt}/${MAX_RETRIES} pour: ${data.farm_name}`
      );

      const result = await sendAdminNotificationEmail(data);

      if (result.success) {
        return result;
      } else {
        console.warn(
          `[NOTIFICATION] Échec tentative ${attempt}: ${result.error}`
        );

        // Si c'est la dernière tentative, retourner l'erreur
        if (attempt === MAX_RETRIES) {
          return result;
        }

        // Attendre avant la prochaine tentative
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * attempt)
        );
      }
    } catch (error) {
      console.error(`[NOTIFICATION] Erreur tentative ${attempt}:`, error);

      // Si c'est la dernière tentative, propager l'erreur
      if (attempt === MAX_RETRIES) {
        throw error;
      }

      // Attendre avant la prochaine tentative
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * attempt)
      );
    }
  }

  // Ceci ne devrait jamais être atteint, mais par sécurité
  return {
    success: false,
    error: "Nombre maximum de tentatives atteint",
  };
}

/**
 * API Route pour envoyer une notification aux administrateurs
 *
 * Cette route permet de :
 * - Notifier les admins d'une nouvelle demande de producteur
 * - Valider et sanitiser les données requises (farm_name, email, location, description)
 * - Gérer les erreurs d'envoi d'email avec retry automatique
 * - Fournir des messages d'erreur détaillés et sécurisés
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
 *     description: "Producteur bio de légumes",
 *     phone: "+33 6 12 34 56 78",
 *     website: "https://fermebonheur.fr"
 *   })
 * });
 *
 * const result = await response.json();
 * if (result.success) {
 *   console.log("Notification envoyée avec succès");
 * } else {
 *   console.error("Erreur:", result.error);
 * }
 * ```
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<AdminNotificationResponse>> {
  const timestamp = new Date().toISOString();

  try {
    // Parse du corps de requête avec gestion d'erreur robuste
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
      console.error("[NOTIFICATION] Erreur parsing JSON:", parseError);
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
    const validation = validateAndSanitizeNotificationData(requestData);

    if (!validation.isValid) {
      console.warn("[NOTIFICATION] Validation échouée:", validation.errors);
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

    const sanitizedData = validation.sanitizedData!;
    console.log(
      `[NOTIFICATION] Validation réussie pour: ${sanitizedData.farm_name} (${sanitizedData.email})`
    );

    // Envoi de la notification avec retry automatique
    let emailResult: EmailServiceResponse;

    try {
      emailResult = await handleEmailSending(sanitizedData);
    } catch (emailError) {
      console.error(
        "[NOTIFICATION] Erreur critique du service email:",
        emailError
      );
      return NextResponse.json(
        {
          success: false,
          error: "Service email indisponible",
          message: "Le service d'envoi d'email est temporairement indisponible",
          timestamp,
          details:
            process.env.NODE_ENV === "development"
              ? emailError instanceof Error
                ? emailError.message
                : String(emailError)
              : undefined,
        },
        { status: 503 }
      );
    }

    // Vérifier le résultat de l'envoi d'email
    if (!emailResult.success) {
      const errorMessage =
        emailResult.error || "Erreur inconnue lors de l'envoi";
      console.error(
        "[NOTIFICATION] Échec d'envoi d'email après toutes les tentatives:",
        errorMessage
      );

      return NextResponse.json(
        {
          success: false,
          error: "Échec de l'envoi de notification",
          message:
            "L'email de notification n'a pas pu être envoyé aux administrateurs",
          timestamp,
          details:
            process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }

    console.log(
      `✅ [NOTIFICATION] Notification envoyée avec succès pour: ${sanitizedData.farm_name}`
    );

    // Retour avec headers appropriés
    return NextResponse.json(
      {
        success: true,
        message: "Notification envoyée avec succès aux administrateurs",
        timestamp,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[NOTIFICATION] Erreur serveur critique:", error);

    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de l'envoi de la notification",
        message: "Une erreur inattendue s'est produite sur le serveur",
        timestamp,
        details: isDev && error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


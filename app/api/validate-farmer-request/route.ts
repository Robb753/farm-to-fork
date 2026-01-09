// app/api/admin/validate-farmer-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { sendFarmerRequestStatusEmail } from "@/lib/config/email-notifications";
import type { Database } from "@/lib/types/database";

// Si tu as exporté ce type dans email-notifications, tu peux l'importer.
// Sinon, tu peux supprimer cette ligne et laisser le `as any` plus bas.
import type { FarmerRequest as EmailFarmerRequest } from "@/lib/config/email-notifications";

/**
 * Types pour la requête de validation
 */
interface ValidateFarmerRequestBody {
  requestId: number; // ✅ on force number après sanitisation
  userId: string;
  role: "farmer" | "admin" | "user";
  status: "approved" | "rejected";
  reason?: string; // Optionnel : raison de la décision
}

/**
 * Types pour les données de la demande farmer
 */
interface FarmerRequestData {
  id: number;
  user_id: string;
  email: string;
  farm_name: string;
  location: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  products: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  approved_by_admin_at: string | null;
}

/**
 * Type pour la réponse API
 */
interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
  timestamp?: string;
  createdListingId?: number;
  details?: string;
}

/**
 * Type pour la validation des données
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: ValidateFarmerRequestBody;
}
/**
 * Constantes de validation
 */
const VALID_STATUSES = ["approved", "rejected"] as const;
const VALID_ROLES = ["farmer", "admin", "user"] as const;
const MAX_REASON_LENGTH = 500;

/**
 * Création sécurisée du client Supabase
 */
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
 * Fonction pour valider et sanitiser les données de validation
 */
function validateFarmerRequestData(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Aucune donnée fournie ou format invalide"],
    };
  }

  // Validation du requestId
  const requestIdRaw = data.requestId;
  if (!requestIdRaw) {
    errors.push("L'ID de la demande est requis");
  } else {
    const numericRequestId = Number(requestIdRaw);
    if (isNaN(numericRequestId) || numericRequestId <= 0) {
      errors.push("L'ID de la demande doit être un nombre positif");
    }
  }

  // Validation du userId
  const userId = typeof data.userId === "string" ? data.userId.trim() : "";
  if (!userId) {
    errors.push("L'ID utilisateur est requis");
  } else if (!/^user_[a-zA-Z0-9]{24,}$/.test(userId)) {
    errors.push("Format d'ID utilisateur invalide");
  }

  // Validation du rôle
  const role =
    typeof data.role === "string" ? data.role.trim().toLowerCase() : "";
  if (!role) {
    errors.push("Le rôle est requis");
  } else if (!VALID_ROLES.includes(role as any)) {
    errors.push(
      `Le rôle doit être l'un des suivants: ${VALID_ROLES.join(", ")}`
    );
  }

  // Validation du statut
  const status =
    typeof data.status === "string" ? data.status.trim().toLowerCase() : "";
  if (!status) {
    errors.push("Le statut est requis");
  } else if (!VALID_STATUSES.includes(status as any)) {
    errors.push(
      `Le statut doit être l'un des suivants: ${VALID_STATUSES.join(", ")}`
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
    const sanitizedData: ValidateFarmerRequestBody = {
      requestId: Number(requestIdRaw), // ✅ number garanti ici
      userId,
      role: role as any,
      status: status as any,
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
 * Fonction pour vérifier les permissions administrateur
 */
async function checkAdminPermissions(requestingUserId: string): Promise<{
  hasPermission: boolean;
  error?: string;
}> {
  try {
    // ✅ clerkClient est maintenant une fonction asynchrone
    const client = await clerkClient();
    const requestingUser = await client.users.getUser(requestingUserId);
    const userRole = requestingUser.publicMetadata?.role as string;

    if (userRole !== "admin") {
      return {
        hasPermission: false,
        error:
          "Seuls les administrateurs peuvent valider les demandes de producteurs",
      };
    }

    return { hasPermission: true };
  } catch (error) {
    console.error(
      "[VALIDATE] Erreur lors de la vérification des permissions:",
      error
    );
    return {
      hasPermission: false,
      error: "Impossible de vérifier les permissions",
    };
  }
}

/**
 * Fonction pour créer automatiquement un listing approuvé
 */
async function createListingForApprovedFarmer(
  supabase: ReturnType<typeof createSupabaseClient>,
  farmerRequest: FarmerRequestData,
  userId: string
): Promise<{ success: boolean; listingId?: number; error?: string }> {
  try {
    const {
      id: requestId,
      farm_name,
      location,
      description,
      phone,
      website,
      email,
      products,
    } = farmerRequest;

    // ✅ Récupérer les coordonnées GPS depuis farmer_requests
    const { data: requestWithCoords, error: coordsError } = await supabase
      .from("farmer_requests")
      .select("lat, lng")
      .eq("id", requestId)
      .single();

    if (coordsError) {
      console.error("[VALIDATE] Erreur récupération coordonnées:", coordsError);
      return {
        success: false,
        error: "Erreur lors de la récupération des coordonnées GPS",
      };
    }

    const lat = requestWithCoords?.lat;
    const lng = requestWithCoords?.lng;

    // ✅ Vérifier que les coordonnées existent et sont valides
    if (!lat || !lng || lat === 0 || lng === 0) {
      console.error(
        `[VALIDATE] Coordonnées GPS invalides pour farmer_request ${requestId}:`,
        { lat, lng }
      );
      return {
        success: false,
        error:
          "Coordonnées GPS manquantes ou invalides. L'adresse doit être saisie avec Mapbox au Step 1.",
      };
    }

    console.log(
      `[VALIDATE] Création listing avec coordonnées GPS: lat=${lat}, lng=${lng}`
    );

    const listingData = {
      createdBy: userId,
      name: farm_name,
      description: description || null,
      phoneNumber: phone || null,
      email,
      website: website || null,
      address: location,
      product_type: products || null,
      status: "draft" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lat, // ✅ Coordonnées GPS depuis farmer_requests
      lng, // ✅ Coordonnées GPS depuis farmer_requests
      active: true,
    };

    const { data: insertedListing, error: insertListingError } = await supabase
      .from("listing")
      .insert([listingData])
      .select("id")
      .single();

    if (insertListingError || !insertedListing) {
      console.error("[VALIDATE] Erreur création listing:", insertListingError);
      return {
        success: false,
        error: "Impossible de créer la fiche producteur",
      };
    }

    // Mise à jour du profil avec farm_id
    const { error: profileLinkError } = await supabase
      .from("profiles")
      .update({
        farm_id: insertedListing.id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileLinkError) {
      console.warn(
        "[VALIDATE] Erreur liaison profil-listing:",
        profileLinkError
      );
      // Non bloquant
    }

    console.log(
      `✅ Listing créé avec succès (ID: ${insertedListing.id}) avec coordonnées GPS: lat=${lat}, lng=${lng}`
    );

    return {
      success: true,
      listingId: insertedListing.id,
    };
  } catch (error) {
    console.error("[VALIDATE] Erreur lors de la création du listing:", error);
    return {
      success: false,
      error: "Erreur inattendue lors de la création du listing",
    };
  }
}

/**
 * API Route pour valider une demande de producteur
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const timestamp = new Date().toISOString();

  try {
    // ✅ auth() est maintenant asynchrone
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

    // Vérification des permissions administrateur
    const permissionCheck = await checkAdminPermissions(requestingUserId);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: "Permissions insuffisantes",
          message: permissionCheck.error || "Accès refusé",
          timestamp,
        },
        { status: 403 }
      );
    }

    // Parse et validation du corps de requête
    let requestBody: any;

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

      requestBody = await req.json();
    } catch (parseError) {
      console.error("[VALIDATE] Erreur parsing JSON:", parseError);
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
    const validation = validateFarmerRequestData(requestBody);

    if (!validation.isValid) {
      console.warn("[VALIDATE] Validation échouée:", validation.errors);
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

    const { requestId, userId, role, status, reason } =
      validation.sanitizedData!;

    // Création du client Supabase
    const supabase = createSupabaseClient();

    // 1. Récupération de la demande
    const { data: farmerRequestData, error: requestError } = await supabase
      .from("farmer_requests")
      .select("*")
      .eq("id", requestId) // ✅ requestId est bien un number
      .single();

    if (requestError || !farmerRequestData) {
      console.error("[VALIDATE] Demande introuvable:", requestError);
      return NextResponse.json(
        {
          success: false,
          error: "Demande introuvable",
          message: "La demande spécifiée n'existe pas",
          timestamp,
        },
        { status: 404 }
      );
    }

    const farmerRequest = farmerRequestData as FarmerRequestData;

    // Vérifier que la demande est en attente
    if (farmerRequest.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Demande déjà traitée",
          message: `Cette demande a déjà été ${farmerRequest.status}`,
          timestamp,
        },
        { status: 400 }
      );
    }

    // 2. Mise à jour du rôle Clerk
    try {
      const client = await clerkClient(); // ✅ client Clerk
      await client.users.updateUser(userId, {
        publicMetadata: {
          role,
          roleUpdatedAt: timestamp,
          roleUpdatedBy: requestingUserId,
          ...(reason && { roleChangeReason: reason }),
        },
      });
    } catch (clerkError: any) {
      console.error("[VALIDATE] Erreur Clerk update:", clerkError);
      const errorMessage = (clerkError as any)?.message || String(clerkError);

      if (
        errorMessage.includes("not found") ||
        (clerkError as any)?.status === 404
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Utilisateur introuvable",
            message: "L'utilisateur spécifié n'existe pas dans Clerk",
            timestamp,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la mise à jour du rôle",
          message: "Impossible de mettre à jour le rôle dans Clerk",
          timestamp,
          details:
            process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }

    // 3. Mise à jour du rôle dans Supabase (profil)
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        role,
        updated_at: timestamp,
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.error("[VALIDATE] Erreur update profil:", profileUpdateError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la mise à jour du profil",
          message: "Impossible de mettre à jour le profil Supabase",
          timestamp,
        },
        { status: 500 }
      );
    }

    // 4. Mise à jour de la demande (statut + timestamp)
    const updateData = {
      status,
      updated_at: timestamp,
      approved_by_admin_at: status === "approved" ? timestamp : null,
      ...(reason && { admin_reason: reason }),
      validated_by: requestingUserId,
    };

    const { error: requestUpdateError } = await supabase
      .from("farmer_requests")
      .update(updateData)
      .eq("id", requestId);

    if (requestUpdateError) {
      console.error("[VALIDATE] Erreur update demande:", requestUpdateError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la mise à jour de la demande",
          message: "Impossible de mettre à jour le statut de la demande",
          timestamp,
        },
        { status: 500 }
      );
    }

    let createdListingId: number | undefined;

    // 5. Création automatique du listing si approuvé
    if (status === "approved") {
      const listingResult = await createListingForApprovedFarmer(
        supabase,
        farmerRequest,
        userId
      );

      if (!listingResult.success) {
        // Le listing n'a pas pu être créé, mais on ne bloque pas la validation
        console.warn("[VALIDATE] Échec création listing:", listingResult.error);
      } else {
        createdListingId = listingResult.listingId;
      }
    }

    // 6. Envoi de l'email de statut au producteur
    try {
      // ✅ Adaptation du type phone: string | null -> string | undefined
      const emailPayload: EmailFarmerRequest = {
        ...(farmerRequest as any),
        phone: farmerRequest.phone ?? undefined,
      };

      await sendFarmerRequestStatusEmail(emailPayload, status);
    } catch (emailError) {
      console.warn("[VALIDATE] Email non envoyé:", emailError);
      // Non bloquant - on continue même si l'email échoue
    }

    // Réponse de succès
    const successMessage =
      status === "approved"
        ? `Demande approuvée avec succès${
            createdListingId ? `. Listing créé (ID: ${createdListingId})` : ""
          }.`
        : "Demande rejetée avec succès.";

    return NextResponse.json(
      {
        success: true,
        message: successMessage,
        timestamp,
        ...(createdListingId && { createdListingId }),
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
    console.error("[VALIDATE] Erreur serveur critique:", error);

    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne lors de la validation",
        message: "Une erreur inattendue s'est produite sur le serveur",
        timestamp,
        details: isDev && error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Export des types pour utilisation externe
 */
export type {
  ValidateFarmerRequestBody,
  FarmerRequestData,
  ApiResponse,
  ValidationResult,
};

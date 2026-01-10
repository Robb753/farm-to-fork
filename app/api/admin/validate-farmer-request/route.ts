// app/api/admin/validate-farmer-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { sendFarmerRequestStatusEmail } from "@/lib/config/email-notifications";
import type { Database, ListingInsert } from "@/lib/types/database";
import type { FarmerRequest as EmailFarmerRequest } from "@/lib/config/email-notifications";

/**
 * Types pour la requête de validation
 */
interface ValidateFarmerRequestBody {
  requestId: number; // number garanti après sanitisation
  userId: string;
  role: "farmer" | "admin" | "user";
  status: "approved" | "rejected";
  reason?: string;
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
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Valider + sanitiser les données
 */
function validateFarmerRequestData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Aucune donnée fournie ou format invalide"],
    };
  }

  const raw = data as Record<string, unknown>;

  // requestId
  const requestIdRaw = raw.requestId;
  if (
    requestIdRaw === undefined ||
    requestIdRaw === null ||
    requestIdRaw === ""
  ) {
    errors.push("L'ID de la demande est requis");
  } else {
    const numericRequestId = Number(requestIdRaw);
    if (!Number.isFinite(numericRequestId) || numericRequestId <= 0) {
      errors.push("L'ID de la demande doit être un nombre positif");
    }
  }

  // userId
  const userId = typeof raw.userId === "string" ? raw.userId.trim() : "";
  if (!userId) {
    errors.push("L'ID utilisateur est requis");
  } else if (!/^user_[a-zA-Z0-9]{24,}$/.test(userId)) {
    errors.push("Format d'ID utilisateur invalide");
  }

  // role
  const role =
    typeof raw.role === "string" ? raw.role.trim().toLowerCase() : "";
  if (!role) {
    errors.push("Le rôle est requis");
  } else if (!VALID_ROLES.includes(role as any)) {
    errors.push(
      `Le rôle doit être l'un des suivants: ${VALID_ROLES.join(", ")}`
    );
  }

  // status
  const status =
    typeof raw.status === "string" ? raw.status.trim().toLowerCase() : "";
  if (!status) {
    errors.push("Le statut est requis");
  } else if (!VALID_STATUSES.includes(status as any)) {
    errors.push(
      `Le statut doit être l'un des suivants: ${VALID_STATUSES.join(", ")}`
    );
  }

  // reason
  const reason = typeof raw.reason === "string" ? raw.reason.trim() : undefined;
  if (reason && reason.length > MAX_REASON_LENGTH) {
    errors.push(
      `La raison ne peut pas dépasser ${MAX_REASON_LENGTH} caractères`
    );
  }

  if (errors.length > 0) return { isValid: false, errors };

  return {
    isValid: true,
    errors: [],
    sanitizedData: {
      requestId: Number(requestIdRaw),
      userId,
      role: role as ValidateFarmerRequestBody["role"],
      status: status as ValidateFarmerRequestBody["status"],
      ...(reason ? { reason } : {}),
    },
  };
}

/**
 * Vérifier permissions admin (Clerk)
 */
async function checkAdminPermissions(requestingUserId: string): Promise<{
  hasPermission: boolean;
  error?: string;
}> {
  try {
    const client = await clerkClient();
    const requestingUser = await client.users.getUser(requestingUserId);
    const userRole = requestingUser.publicMetadata?.role as string | undefined;

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
 * Crée un listing pour un farmer approuvé
 * - supprime le champ `status` (il n'existe pas dans ta table listing)
 * - évite d'insérer 2 listings si `createdBy` est UNIQUE (check + early return)
 * - utilise les types ListingInsert (alignés avec lib/types/database.ts)
 */
async function createListingForApprovedFarmer(
  supabase: ReturnType<typeof createSupabaseClient>,
  farmerRequest: Database["public"]["Tables"]["farmer_requests"]["Row"],
  userId: string
): Promise<{ success: boolean; listingId?: number; error?: string }> {
  try {
    const requestId = farmerRequest.id;

    // ✅ si createdBy est UNIQUE, on évite un doublon
    const { data: existingListing, error: existingError } = await supabase
      .from("listing")
      .select("id")
      .eq("createdBy", userId)
      .maybeSingle();

    if (existingError) {
      console.warn("[VALIDATE] Warning check existing listing:", existingError);
      // non bloquant, on continue
    } else if (existingListing?.id) {
      return { success: true, listingId: existingListing.id };
    }

    // ✅ récupérer coords depuis farmer_requests (tu as lat/lng dans le type)
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

    const lat = requestWithCoords?.lat ?? null;
    const lng = requestWithCoords?.lng ?? null;

    // ✅ Vérifier coordonnées valides
    if (lat === null || lng === null || lat === 0 || lng === 0) {
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

    const listingData: ListingInsert = {
      createdBy: userId,
      name: farmerRequest.farm_name,
      description: farmerRequest.description ?? null,
      phoneNumber: farmerRequest.phone ?? null,
      email: farmerRequest.email ?? null,
      website: farmerRequest.website ?? null,
      address: farmerRequest.location,
      product_type: farmerRequest.products ?? null, // ✅ selon tes types (string | null)
      lat,
      lng,
      active: true,
      updated_at: new Date().toISOString(),
    };

    const { data: insertedListing, error: insertListingError } = await supabase
      .from("listing")
      .insert(listingData) // ✅ 1 objet
      .select("id")
      .single();

    if (insertListingError || !insertedListing) {
      console.error("[VALIDATE] Erreur création listing:", insertListingError);
      return {
        success: false,
        error: "Impossible de créer la fiche producteur",
      };
    }

    // Liaison profile -> farm_id (non bloquant)
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
    }

    console.log(
      `✅ Listing créé (ID: ${insertedListing.id}) lat=${lat} lng=${lng}`
    );

    return { success: true, listingId: insertedListing.id };
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

    // Permissions admin
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

    // Parse JSON
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
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

    let requestBody: unknown;
    try {
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

    // Validate / sanitize
    const validation = validateFarmerRequestData(requestBody);
    if (!validation.isValid || !validation.sanitizedData) {
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
      validation.sanitizedData;

    // Client Supabase service role
    const supabase = createSupabaseClient();

    // 1) Fetch farmer request
    const { data: farmerRequest, error: requestError } = await supabase
      .from("farmer_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !farmerRequest) {
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

    // Déjà traité ?
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

    // 2) Update Clerk user role
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          role,
          roleUpdatedAt: timestamp,
          roleUpdatedBy: requestingUserId,
          ...(reason ? { roleChangeReason: reason } : {}),
        },
      });
    } catch (clerkError: any) {
      console.error("[VALIDATE] Erreur Clerk update:", clerkError);
      const errorMessage = clerkError?.message || String(clerkError);

      if (errorMessage.includes("not found") || clerkError?.status === 404) {
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

    // 3) Update Supabase profile role
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ role, updated_at: timestamp })
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

    // 4) Update farmer request status
    const updateData: Database["public"]["Tables"]["farmer_requests"]["Update"] =
      {
        status,
        updated_at: timestamp,
        approved_by_admin_at: status === "approved" ? timestamp : null,
        validated_by: requestingUserId,
        ...(reason ? { admin_reason: reason } : {}),
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

    // 5) Create listing if approved
    let createdListingId: number | undefined;
    if (status === "approved") {
      const listingResult = await createListingForApprovedFarmer(
        supabase,
        farmerRequest,
        userId
      );

      if (!listingResult.success) {
        console.warn("[VALIDATE] Échec création listing:", listingResult.error);
      } else {
        createdListingId = listingResult.listingId;
      }
    }

    // 6) Send status email (non bloquant)
    try {
      const emailPayload: EmailFarmerRequest = {
        ...(farmerRequest as any),
        phone: farmerRequest.phone ?? undefined, // adapt null -> undefined if needed
      };

      await sendFarmerRequestStatusEmail(emailPayload, status);
    } catch (emailError) {
      console.warn("[VALIDATE] Email non envoyé:", emailError);
    }

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
        ...(createdListingId ? { createdListingId } : {}),
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

export type { ValidateFarmerRequestBody, ApiResponse, ValidationResult };

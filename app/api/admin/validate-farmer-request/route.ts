// app/api/admin/validate-farmer-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { sendFarmerRequestStatusEmail } from "@/lib/config/email-notifications";
import type {
  Database,
  ListingInsert,
  FarmerRequestUpdate,
} from "@/lib/types/database";
import type { FarmerRequest as EmailFarmerRequest } from "@/lib/config/email-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ✅ Types DB utiles
 */
type DbProductType = Database["public"]["Enums"]["product_type_enum"];

/**
 * ✅ Parse robust product types (farmer_requests.products = string | null)
 * - accepte: '["fruits","legumes"]' (JSON)
 * - accepte: 'fruits,legumes' / 'fruits; legumes' / 'fruits|legumes'
 * - accepte: array (si un jour tu changes le type)
 */
const PRODUCT_TYPE_VALUES: readonly DbProductType[] = [
  "fruits",
  "legumes",
  "produits_laitiers",
  "viande",
  "cereales",
] as const;

function isDbProductType(v: unknown): v is DbProductType {
  return (
    typeof v === "string" &&
    (PRODUCT_TYPE_VALUES as readonly string[]).includes(v)
  );
}

function parseProductTypeEnumArray(raw: unknown): DbProductType[] | null {
  if (raw == null) return null;

  // array déjà
  if (Array.isArray(raw)) {
    const arr = raw.filter(isDbProductType);
    return arr.length ? Array.from(new Set(arr)) : null;
  }

  // string: JSON ou CSV
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;

    // JSON array ?
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return parseProductTypeEnumArray(parsed);
    } catch {
      // ignore
    }

    // CSV fallback
    const parts = t
      .split(/[,;|]/g)
      .map((s) => s.trim())
      .filter(Boolean);

    return parseProductTypeEnumArray(parts);
  }

  return null;
}

/**
 * Body / response types
 */
interface ValidateFarmerRequestBody {
  requestId: number; // number garanti après sanitisation
  userId: string;
  role: "farmer" | "admin" | "user";
  status: "approved" | "rejected";
  reason?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
  timestamp?: string;
  createdListingId?: number;
  details?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: ValidateFarmerRequestBody;
}

const VALID_STATUSES = ["approved", "rejected"] as const;
const VALID_ROLES = ["farmer", "admin", "user"] as const;
const MAX_REASON_LENGTH = 500;

/**
 * Supabase (service role) sécurisé
 */
function createSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Variables d'environnement Supabase manquantes. Vérifie SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Validate + sanitize
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
    const n = Number(requestIdRaw);
    if (!Number.isFinite(n) || n <= 0)
      errors.push("L'ID de la demande doit être un nombre positif");
  }

  // userId
  const userId = typeof raw.userId === "string" ? raw.userId.trim() : "";
  if (!userId) errors.push("L'ID utilisateur est requis");

  // role
  const role =
    typeof raw.role === "string" ? raw.role.trim().toLowerCase() : "";
  if (!role) errors.push("Le rôle est requis");
  else if (!VALID_ROLES.includes(role as any)) {
    errors.push(
      `Le rôle doit être l'un des suivants: ${VALID_ROLES.join(", ")}`
    );
  }

  // status
  const status =
    typeof raw.status === "string" ? raw.status.trim().toLowerCase() : "";
  if (!status) errors.push("Le statut est requis");
  else if (!VALID_STATUSES.includes(status as any)) {
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

  if (errors.length) return { isValid: false, errors };

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
 * Admin permissions via Clerk
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
    console.error("[VALIDATE] Erreur vérification permissions:", error);
    return {
      hasPermission: false,
      error: "Impossible de vérifier les permissions",
    };
  }
}

async function createListingForApprovedFarmer(
  supabase: SupabaseClient<Database>,
  farmerRequest: Database["public"]["Tables"]["farmer_requests"]["Row"],
  userId: string
): Promise<{ success: boolean; listingId?: number; error?: string }> {
  try {
    const requestId = farmerRequest.id;

    // éviter doublon
    const { data: existingListing, error: existingError } = await supabase
      .from("listing")
      .select("id")
      .eq("createdBy", userId)
      .maybeSingle();

    if (existingError) {
      console.warn("[VALIDATE] Warning check existing listing:", existingError);
    } else if (existingListing?.id) {
      return { success: true, listingId: existingListing.id };
    }

    // coords depuis farmerRequest (déjà dans Row)
    const lat = farmerRequest.lat ?? null;
    const lng = farmerRequest.lng ?? null;

    if (lat === null || lng === null || lat === 0 || lng === 0) {
      console.error(
        `[VALIDATE] Coordonnées GPS invalides (request ${requestId})`,
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
      clerk_user_id: userId, // ✅ très utile pour retrouver le listing
      name: farmerRequest.farm_name ?? null,
      description: farmerRequest.description ?? null,
      phoneNumber: farmerRequest.phone ?? null,
      email: farmerRequest.email ?? null,
      website: farmerRequest.website ?? null,
      address: farmerRequest.location ?? null,

      // ✅ FIX: enum array (pas string)
      product_type: parseProductTypeEnumArray(farmerRequest.products),

      lat,
      lng,

      active: true,
      updated_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      published_at: new Date().toISOString(), // si tu veux le publier direct à l’approval
    };

    const { data: insertedListing, error: insertListingError } = await supabase
      .from("listing")
      .insert(listingData)
      .select("id")
      .single();

    if (insertListingError || !insertedListing) {
      console.error("[VALIDATE] Erreur création listing:", insertListingError);
      return {
        success: false,
        error: "Impossible de créer la fiche producteur",
      };
    }

    // profile -> farm_id (non bloquant)
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

    return { success: true, listingId: insertedListing.id };
  } catch (error) {
    console.error("[VALIDATE] Erreur création listing:", error);
    return {
      success: false,
      error: "Erreur inattendue lors de la création du listing",
    };
  }
}

/**
 * API Route
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

    // admin permissions
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

    // content-type json
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

    const validation = validateFarmerRequestData(requestBody);
    if (!validation.isValid || !validation.sanitizedData) {
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

    // supabase service role
    const supabase = createSupabaseClient();

    // 1) fetch farmer_request
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

    // 2) update Clerk user metadata role
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

    // 3) update profile role
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

    // 4) update farmer_requests status
    const updateData: FarmerRequestUpdate = {
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

    // 5) create listing if approved
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

    // 6) send email (non bloquant)
    try {
      const emailPayload: EmailFarmerRequest = {
        ...(farmerRequest as any),
        phone: farmerRequest.phone ?? undefined,
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

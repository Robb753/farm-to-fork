// app/api/admin/validate-farmer-request/route.ts
// ✅ VERSION CORRIGÉE : Le trigger gère la création du listing

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { sendFarmerRequestStatusEmail } from "@/lib/config/email-notifications";
import type { Database, FarmerRequestUpdate } from "@/lib/types/database";
import type { FarmerRequest as EmailFarmerRequest } from "@/lib/config/email-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Body / response types
 */
interface ValidateFarmerRequestBody {
  requestId: number;
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

    // 3) ✅ SUPPRIMÉ : Ne plus mettre à jour profile ici
    // Le trigger s'en charge

    // 4) ✅ MODIFIÉ : Mise à jour de farmer_requests
    // Le trigger va créer le profile et le listing automatiquement
    const updateData: FarmerRequestUpdate = {
      status,
      updated_at: timestamp,
      approved_by_admin_at: status === "approved" ? timestamp : null,
      validated_by: requestingUserId,
      ...(reason ? { admin_reason: reason } : {}),
    };

    console.log("[VALIDATE] Mise à jour farmer_request:", {
      requestId,
      updateData,
    });

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
          details:
            process.env.NODE_ENV === "development"
              ? requestUpdateError.message
              : undefined,
        },
        { status: 500 }
      );
    }

    // 5) ✅ SUPPRIMÉ : Ne plus créer le listing ici
    // Le trigger s'en charge automatiquement

    // 6) send email (non bloquant)
    try {
      const emailPayload: EmailFarmerRequest = {
        ...(farmerRequest as any),
        phone: farmerRequest.phoneNumber ?? undefined,
      };

      await sendFarmerRequestStatusEmail(emailPayload, status);
    } catch (emailError) {
      console.warn("[VALIDATE] Email non envoyé:", emailError);
    }

    const successMessage =
      status === "approved"
        ? "Demande approuvée avec succès ! Le listing et le profil ont été créés."
        : "Demande rejetée avec succès.";

    return NextResponse.json(
      {
        success: true,
        message: successMessage,
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

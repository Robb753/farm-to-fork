// app/api/onboarding/submit-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Interface pour le step 1 de l'onboarding
 */
interface OnboardingStep1Body {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string; // Optionnel au step 1
  farmName: string;
  siret: string;
  department: string;
}

/**
 * Interface pour la réponse
 */
interface OnboardingResponse {
  success: boolean;
  message: string;
  requestId?: number;
  error?: string;
}

/**
 * Création du client Supabase
 */
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * API Route pour soumettre une demande d'onboarding (Step 1)
 *
 * Flow:
 * 1. Validation des données
 * 2. Vérification des doublons
 * 3. Insertion dans farmer_requests avec les BONNES colonnes
 * 4. Envoi notification admin
 * 5. Retour requestId pour tracking
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<OnboardingResponse>> {
  const timestamp = new Date().toISOString();

  try {
    // Parse du body
    let body: OnboardingStep1Body;

    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Corps de requête invalide",
          message: "Impossible de parser la requête JSON",
        },
        { status: 400 }
      );
    }

    const {
      userId,
      email,
      firstName,
      lastName,
      phone,
      farmName,
      siret,
      department,
    } = body;

    // Validation des champs requis
    const requiredFields = [
      { field: userId, name: "userId" },
      { field: email, name: "email" },
      { field: firstName, name: "firstName" },
      { field: lastName, name: "lastName" },
      { field: farmName, name: "farmName" },
      { field: siret, name: "siret" },
      { field: department, name: "department" },
    ];

    const missingFields = requiredFields
      .filter(({ field }) => !field || String(field).trim().length === 0)
      .map(({ name }) => name);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Champs requis manquants",
          message: `Champs manquants: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Email invalide",
          message: "Le format de l'email n'est pas valide",
        },
        { status: 400 }
      );
    }

    // Validation format userId Clerk
    if (!userId.startsWith("user_")) {
      return NextResponse.json(
        {
          success: false,
          error: "UserId invalide",
          message: "L'ID utilisateur doit être un ID Clerk valide",
        },
        { status: 400 }
      );
    }

    // Validation SIRET (14 chiffres)
    const siretCleaned = siret.replace(/\s/g, "");
    if (!/^\d{14}$/.test(siretCleaned)) {
      return NextResponse.json(
        {
          success: false,
          error: "SIRET invalide",
          message: "Le SIRET doit contenir 14 chiffres",
        },
        { status: 400 }
      );
    }

    // Validation département (2 ou 3 chiffres, ou 2A/2B pour la Corse)
    const departmentCleaned = department.trim().toUpperCase();
    if (!/^(?:\d{2,3}|2[AB])$/.test(departmentCleaned)) {
      return NextResponse.json(
        {
          success: false,
          error: "Département invalide",
          message:
            "Le département doit être au format 01-95, 971-976, 2A ou 2B",
        },
        { status: 400 }
      );
    }

    // Vérifier si demande en attente existe déjà
    const { data: existing, error: checkError } = await supabase
      .from("farmer_requests")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("[ONBOARDING] Erreur vérification doublon:", checkError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur de vérification",
          message: "Impossible de vérifier les demandes existantes",
        },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Candidature existante",
          message: "Vous avez déjà une candidature en cours de traitement",
        },
        { status: 409 }
      );
    }

    // ✅ CORRECTION : Préparation des données avec les BONNES colonnes
    const requestData = {
      // Identifiants
      user_id: userId,
      email: email.trim().toLowerCase(),

      // ✅ Informations personnelles dans leurs colonnes dédiées
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone?.trim() || null,

      // ✅ Informations entreprise dans leurs colonnes dédiées
      siret: siretCleaned,
      department: departmentCleaned,

      // ✅ Informations ferme
      farm_name: farmName.trim(),
      location: `Département ${departmentCleaned}`, // Sera enrichi au step 2

      // ✅ Description vide pour l'instant (sera remplie au step 2)
      description: null,

      // ✅ Champs optionnels (seront remplis au step 2)
      website: null,
      products: null,

      // ✅ Statut et timestamps
      status: "pending" as const,
      created_at: timestamp,
      updated_at: timestamp,
    };

    // Insertion dans farmer_requests
    const { data: inserted, error: insertError } = await supabase
      .from("farmer_requests")
      .insert([requestData])
      .select("id")
      .single();

    if (insertError) {
      console.error("[ONBOARDING] Erreur insertion:", insertError);

      // Gestion des contraintes uniques
      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "Candidature existante",
            message: "Une candidature avec ces informations existe déjà",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Erreur d'enregistrement",
          message: "Impossible d'enregistrer votre candidature",
        },
        { status: 500 }
      );
    }

    const requestId = inserted?.id;

    // Envoi notification admin (non bloquant)
    try {
      const notificationPayload = {
        requestId,
        user_id: userId,
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone?.trim() || null,
        farm_name: farmName.trim(),
        siret: siretCleaned,
        department: departmentCleaned,
        location: requestData.location,
        status: "pending",
        created_at: timestamp,
      };

      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/send-notification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notificationPayload),
        }
      );
    } catch (emailError) {
      console.warn("[ONBOARDING] ⚠️ Erreur notification admin:", emailError);
      // Non bloquant - la demande est enregistrée
    }

    // Retour succès
    return NextResponse.json(
      {
        success: true,
        message:
          "Votre demande a été soumise avec succès. Vous recevrez une réponse sous 24-48h.",
        requestId,
      },
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[ONBOARDING] Erreur serveur critique:", error);

    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
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
 * Export des types pour utilisation externe
 */
export type { OnboardingStep1Body, OnboardingResponse };

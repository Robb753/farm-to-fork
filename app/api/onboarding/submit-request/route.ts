// app/api/onboarding/submit-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface OnboardingStep1Body {
  userId?: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  farmName: string;
  siret: string;
  location: string;
  lat: number;
  lng: number;
}

interface OnboardingResponse {
  success: boolean;
  message: string;
  requestId?: number;
  error?: string;
  details?: string;
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(
  req: NextRequest
): Promise<NextResponse<OnboardingResponse>> {
  const timestamp = new Date().toISOString();

  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Non authentifié",
          message: "Vous devez être connecté pour soumettre une demande",
        },
        { status: 401 }
      );
    }

    let body: OnboardingStep1Body;
    try {
      body = await req.json();
    } catch {
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
      userId: userIdFromBody,
      email: emailFromBody,
      firstName,
      lastName,
      phone,
      farmName,
      siret,
      location,
      lat,
      lng,
    } = body;

    if (userIdFromBody && userIdFromBody !== clerkUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "userId ne correspond pas à l'utilisateur authentifié",
        },
        { status: 403 }
      );
    }

    const clerkUser = await currentUser();
    const emailFromClerk = clerkUser?.primaryEmailAddress?.emailAddress ?? null;

    const resolvedEmail = (emailFromClerk ?? emailFromBody ?? "")
      .trim()
      .toLowerCase();

    // ✅ required fields
    const missing: string[] = [];
    if (!resolvedEmail) missing.push("email");
    if (!firstName?.trim()) missing.push("firstName");
    if (!lastName?.trim()) missing.push("lastName");
    if (!farmName?.trim()) missing.push("farmName");
    if (!siret?.trim()) missing.push("siret");
    if (!location?.trim()) missing.push("location");
    if (!Number.isFinite(Number(lat))) missing.push("lat");
    if (!Number.isFinite(Number(lng))) missing.push("lng");

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Champs requis manquants",
          message: `Champs manquants: ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resolvedEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Email invalide",
          message: "Le format de l'email n'est pas valide",
        },
        { status: 400 }
      );
    }

    // ✅ SIRET
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

    // ✅ Coords
    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return NextResponse.json(
        {
          success: false,
          error: "Coordonnées invalides",
          message: "lat/lng doivent être des nombres valides",
        },
        { status: 400 }
      );
    }

    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return NextResponse.json(
        {
          success: false,
          error: "Coordonnées invalides",
          message: "lat/lng hors limites",
        },
        { status: 400 }
      );
    }

    // ✅ Doublon pending
    const { data: existing, error: checkError } = await supabase
      .from("farmer_requests")
      .select("id,status")
      .eq("user_id", clerkUserId)
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
          message: "Vous avez déjà une candidature en cours",
        },
        { status: 409 }
      );
    }

    const requestData: Database["public"]["Tables"]["farmer_requests"]["Insert"] =
      {
        user_id: clerkUserId,
        email: resolvedEmail,

        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phoneNumber: phone?.trim() || null,

        siret: siretCleaned,
        farm_name: farmName.trim(),

        location: location.trim(),
        lat: latNum,
        lng: lngNum,

        description: null,
        website: null,
        products: null,

        status: "pending",
        created_at: timestamp,
        updated_at: timestamp,
      };

    const { data: inserted, error: insertError } = await supabase
      .from("farmer_requests")
      .insert([requestData])
      .select("id")
      .single();

    if (insertError) {
      console.error("[ONBOARDING] Erreur insertion:", insertError);
      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "Candidature existante",
            message: "Une candidature existe déjà",
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

    return NextResponse.json(
      {
        success: true,
        message:
          "Votre demande a été soumise avec succès. Vous recevrez une réponse sous 24-48h.",
        requestId: inserted.id,
      },
      { status: 201 }
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

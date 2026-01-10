// app/api/apply-farmer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ApplyFarmerResponse = {
  success: boolean;
  error?: string;
  message?: string;
  requestId?: number;
  details?: string;
};

type Body = {
  userId: string;
  email: string;

  firstName: string;
  lastName: string;
  farmName: string;
  siret: string;
  department: string;

  location: string;
  lat: number;
  lng: number;

  // optionnels (step 2)
  description?: string;
  products?: string;
  website?: string;
  phone?: string;
};

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Variables d'environnement Supabase manquantes");
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const siretRegex = /^\d{14}$/;

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApplyFarmerResponse>> {
  const now = new Date().toISOString();

  try {
    const body = (await req.json()) as Partial<Body>;

    const missing: string[] = [];
    const requireString = (key: keyof Body) => {
      const v = body[key];
      if (typeof v !== "string" || v.trim().length === 0)
        missing.push(String(key));
    };

    requireString("userId");
    requireString("email");
    requireString("firstName");
    requireString("lastName");
    requireString("farmName");
    requireString("siret");
    requireString("department");
    requireString("location");

    if (typeof body.lat !== "number" || !Number.isFinite(body.lat))
      missing.push("lat");
    if (typeof body.lng !== "number" || !Number.isFinite(body.lng))
      missing.push("lng");

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Champs requis manquants",
          message: `Manquants: ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const userId = body.userId!.trim();
    const email = body.email!.trim().toLowerCase();

    if (!userId.startsWith("user_")) {
      return NextResponse.json(
        {
          success: false,
          error: "userId invalide",
          message: "ID Clerk attendu",
        },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Email invalide",
          message: "Format email invalide",
        },
        { status: 400 }
      );
    }

    const siret = body.siret!.replace(/\s/g, "");
    if (!siretRegex.test(siret)) {
      return NextResponse.json(
        {
          success: false,
          error: "SIRET invalide",
          message: "Le SIRET doit contenir 14 chiffres",
        },
        { status: 400 }
      );
    }

    // Empêcher doublon pending
    const { data: existing, error: existingErr } = await supabase
      .from("farmer_requests")
      .select("id,status")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingErr) {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur DB",
          message: "Vérification impossible",
        },
        { status: 500 }
      );
    }
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Déjà soumis",
          message: "Une demande est déjà en cours (pending).",
        },
        { status: 409 }
      );
    }

    const insertData: Database["public"]["Tables"]["farmer_requests"]["Insert"] =
      {
        user_id: userId,
        email,

        first_name: body.firstName!.trim(),
        last_name: body.lastName!.trim(),
        phone: body.phone?.trim() || null,

        siret,
        department: body.department!.trim(),

        farm_name: body.farmName!.trim(),
        location: body.location!.trim(),
        description: body.description?.trim() || null,
        products: body.products?.trim() || null,
        website: body.website?.trim() || null,

        lat: body.lat!,
        lng: body.lng!,

        status: "pending",
        created_at: now,
        updated_at: now,
      };

    const { data: inserted, error: insertErr } = await supabase
      .from("farmer_requests")
      .insert(insertData)
      .select("id")
      .single();

    if (insertErr) {
      return NextResponse.json(
        {
          success: false,
          error: "Insert failed",
          message: "Impossible d'enregistrer la demande",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Demande envoyée avec succès.",
      requestId: inserted.id,
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
        message: "Une erreur inattendue s'est produite",
        details:
          process.env.NODE_ENV === "development" && e instanceof Error
            ? e.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

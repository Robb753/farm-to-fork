// app/api/apply-farmer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Types pour la candidature de producteur
 */
interface ApplyFarmerRequestBody {
  userId: string;
  email: string;
  farmName: string;
  phone: string;
  location: string;
  description: string;
  website?: string;
  products?: string;
}

/**
 * Type pour la réponse API
 */
interface ApplyFarmerResponse {
  success: boolean;
  error?: string;
  message?: string;
  requestId?: number;
  details?: string;
}

/**
 * Type pour l'enregistrement farmer_request
 */
interface FarmerRequestInsert {
  user_id: string;
  email: string;
  farm_name: string;
  phone: string;
  location: string;
  description: string;
  website?: string | null;
  products?: string | null;
  status: "pending";
  created_at: string;
  updated_at: string;
}

// Validation des variables d'environnement
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Variables d'environnement Supabase manquantes");
}

// Accès serveur uniquement (pas NEXT_PUBLIC)
const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * API Route pour soumettre une candidature de producteur
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApplyFarmerResponse>> {
  try {
    // Parse et validation du corps de requête
    let body: ApplyFarmerRequestBody;

    try {
      body = await req.json();
    } catch (parseError) {
      console.error("[APPLY FARMER] Erreur parsing JSON:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Corps de requête JSON invalide",
          message: "Impossible de parser la requête",
        },
        { status: 400 }
      );
    }

    const {
      userId,
      email,
      farmName,
      phone,
      location,
      description,
      website,
      products,
    } = body;

    // Validation des champs requis
    const requiredFields = [
      { field: userId, name: "userId" },
      { field: email, name: "email" },
      { field: farmName, name: "farmName" },
      { field: phone, name: "phone" },
      { field: location, name: "location" },
      { field: description, name: "description" },
    ];

    const missingFields = requiredFields
      .filter(
        ({ field }) =>
          !field || (typeof field === "string" && field.trim().length === 0)
      )
      .map(({ name }) => name);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Champs requis manquants",
          message: `Les champs suivants sont requis: ${missingFields.join(", ")}`,
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

    // Validation du format userId Clerk
    if (!userId.startsWith("user_")) {
      return NextResponse.json(
        {
          success: false,
          error: "Format userId invalide",
          message: "L'ID utilisateur doit être un ID Clerk valide",
        },
        { status: 400 }
      );
    }

    // Validation de la longueur des champs
    if (farmName.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Nom de ferme trop court",
          message: "Le nom de la ferme doit contenir au moins 2 caractères",
        },
        { status: 400 }
      );
    }

    if (description.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Description trop courte",
          message: "La description doit contenir au moins 10 caractères",
        },
        { status: 400 }
      );
    }

    // Vérifier s'il y a déjà une candidature en cours pour cet utilisateur
    const { data: existingRequest, error: checkError } = await supabase
      .from("farmer_requests")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "pending")
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = pas de résultat trouvé
      console.error(
        "[APPLY FARMER] Erreur vérification candidature existante:",
        checkError
      );
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la vérification",
          message: "Impossible de vérifier les candidatures existantes",
        },
        { status: 500 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Candidature déjà existante",
          message: "Vous avez déjà une candidature en cours de traitement",
        },
        { status: 409 }
      );
    }

    // Préparation des données à insérer
    const farmerRequestData: FarmerRequestInsert = {
      user_id: userId,
      email: email.trim().toLowerCase(),
      farm_name: farmName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      description: description.trim(),
      website: website?.trim() || null,
      products: products?.trim() || null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insertion de la demande dans la base de données
    const { data: insertedRequest, error: insertError } = await supabase
      .from("farmer_requests")
      .insert(farmerRequestData)
      .select("id")
      .single();

    if (insertError) {
      console.error("[APPLY FARMER] Erreur insertion Supabase:", insertError);

      // Gestion spécifique des erreurs de contrainte
      if (insertError.code === "23505") {
        // Contrainte unique violée
        return NextResponse.json(
          {
            success: false,
            error: "Candidature déjà existante",
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

    const requestId = insertedRequest?.id;

    // Optionnel: Envoyer une notification aux administrateurs
    try {
      // Import dynamique pour éviter les erreurs si le service n'existe pas
      const { sendAdminNotificationEmail } = await import(
        "@/lib/config/email-notifications"
      );

      // Utiliser directement farmerRequestData qui correspond au type attendu
      await sendAdminNotificationEmail(farmerRequestData as any);
    } catch (emailError) {
      console.warn(
        "[APPLY FARMER] ⚠️ Erreur envoi notification admin:",
        emailError
      );
      // Non bloquant - la candidature est enregistrée même si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message:
        "Votre candidature a été soumise avec succès. Vous recevrez une réponse par email.",
      requestId,
    });
  } catch (error) {
    console.error("[APPLY FARMER] Erreur serveur:", error);

    // Gestion d'erreur avec détails selon l'environnement
    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
        message:
          "Une erreur inattendue s'est produite lors de l'enregistrement de votre candidature",
        ...(isDev && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

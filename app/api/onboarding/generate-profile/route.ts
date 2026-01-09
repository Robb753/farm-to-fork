// app/api/onboarding/generate-profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// ⚠️ Décommenter si tu utilises OpenAI
// import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Interface pour le step 2
 */
interface GenerateProfileBody {
  requestId: number;
  story: string;
  website?: string;
  photos?: string[]; // URLs des photos uploadées
}

/**
 * Interface pour le profil généré
 */
interface GeneratedProfile {
  farmProfile: {
    name: string;
    description: string;
    location: string;
    contact: string;
  };
  products: Array<{
    id: number;
    name: string;
    category: string;
    price: number;
    unit: string;
    status: string;
  }>;
  production_method?: string[];
  purchase_mode?: string[];
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ⚠️ Décommenter si tu utilises OpenAI
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

/**
 * API Route pour générer un profil via AI (Step 2)
 *
 * Cette API est OPTIONNELLE - tu peux la développer plus tard
 * Pour l'instant, on peut retourner un profil mock ou skip cette étape
 */
export async function POST(req: NextRequest) {
  try {
    const { requestId, story, website, photos }: GenerateProfileBody =
      await req.json();

    // Validation
    if (!requestId || !story) {
      return NextResponse.json(
        { success: false, error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe et est approuvée
    const { data: request, error: requestError } = await supabase
      .from("farmer_requests")
      .select("id, status, farm_name")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json(
        { success: false, error: "Demande introuvable" },
        { status: 404 }
      );
    }

    if (request.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Demande non approuvée" },
        { status: 403 }
      );
    }

    // ========================================
    // OPTION 1 : Mock (pour développement)
    // ========================================
    const mockProfile: GeneratedProfile = {
      farmProfile: {
        name: request.farm_name,
        description: story.substring(0, 200) + "...",
        location: "À définir",
        contact: "À compléter",
      },
      products: [
        {
          id: 1,
          name: "Produit 1",
          category: "légumes",
          price: 0,
          unit: "kg",
          status: "available",
        },
      ],
    };

    // ========================================
    // OPTION 2 : OpenAI (à décommenter)
    // ========================================
    /*
    const prompt = `
Tu es un expert en marketing agricole.
À partir de cette histoire de ferme, génère un profil structuré JSON:

Histoire: ${story}
Site web: ${website || "Non renseigné"}

Génère un JSON avec cette structure exacte:
{
  "farmProfile": {
    "name": "nom de la ferme extrait",
    "description": "description marketée (150-200 mots)",
    "location": "localisation extraite",
    "contact": "email extrait ou 'à compléter'"
  },
  "products": [
    {
      "id": 1,
      "name": "nom produit",
      "category": "légumes|fruits|produits laitiers|viande|oeufs",
      "price": 0,
      "unit": "kg|unité|litre",
      "status": "available"
    }
  ],
  "production_method": ["Agriculture biologique", "Agriculture durable"],
  "purchase_mode": ["Vente directe à la ferme", "Marché local"]
}

Réponds UNIQUEMENT avec le JSON, sans markdown.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const generatedProfile: GeneratedProfile = JSON.parse(content);
    */

    // Mise à jour de farmer_requests avec les nouvelles infos
    await supabase
      .from("farmer_requests")
      .update({
        description: story,
        website: website || null,
        // products: JSON.stringify(generatedProfile.products), // Optionnel
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    return NextResponse.json({
      success: true,
      data: mockProfile, // ou generatedProfile si OpenAI activé
      message: "Profil généré avec succès",
    });
  } catch (error) {
    console.error("[GENERATE-PROFILE] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la génération",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

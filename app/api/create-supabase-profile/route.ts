// app/api/create-profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Types pour la requête de création de profil
 */
interface CreateProfileRequestBody {
  userId: string;
  role: "user" | "farmer" | "admin";
}

/**
 * Type pour la réponse API
 */
interface CreateProfileResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: {
    profileId?: string;
    listingId?: number;
  };
  details?: string;
}

/**
 * Rôles autorisés pour la création de profil
 */
const VALID_ROLES = ["user", "farmer", "admin"] as const;
type ValidRole = typeof VALID_ROLES[number];

// Validation et récupération des variables d'environnement côté serveur
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Variables d'environnement Supabase manquantes");
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * API Route pour créer un profil utilisateur
 * 
 * Cette route permet de :
 * - Créer un profil utilisateur dans Supabase après inscription Clerk
 * - Récupérer l'email depuis Clerk automatiquement
 * - Créer un listing vide si le rôle est "farmer"
 * - Gérer les erreurs de duplication et autres cas d'erreur
 * 
 * @param request - Requête contenant userId et role
 * @returns Réponse JSON avec succès/erreur
 * 
 * @example
 * ```typescript
 * // Côté client
 * const response = await fetch("/api/create-profile", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     userId: "user_2abc123",
 *     role: "farmer"
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateProfileResponse>> {
  try {
    // Parse et validation du corps de requête
    let body: CreateProfileRequestBody;
    
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[CREATE PROFILE] Erreur parsing JSON:", parseError);
      return NextResponse.json(
        { 
          success: false,
          error: "Corps de requête JSON invalide",
          message: "Impossible de parser la requête"
        },
        { status: 400 }
      );
    }

    const { userId, role } = body;

    // Validation des paramètres requis
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: "userId manquant",
          message: "L'ID utilisateur est requis"
        },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { 
          success: false,
          error: "role manquant",
          message: "Le rôle utilisateur est requis"
        },
        { status: 400 }
      );
    }

    // Validation du format userId (doit commencer par "user_" pour Clerk)
    if (typeof userId !== "string" || !userId.startsWith("user_")) {
      return NextResponse.json(
        { 
          success: false,
          error: "Format userId invalide",
          message: "L'ID utilisateur doit être un ID Clerk valide"
        },
        { status: 400 }
      );
    }

    // Validation du rôle autorisé
    if (!VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json(
        { 
          success: false,
          error: "Rôle invalide",
          message: `Le rôle doit être l'un des suivants: ${VALID_ROLES.join(", ")}`
        },
        { status: 400 }
      );
    }

    console.log(`[CREATE PROFILE] Création profil pour userId: ${userId}, rôle: ${role}`);

    // Vérifier si le profil existe déjà
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 = pas de résultat trouvé
      console.error("[CREATE PROFILE] Erreur vérification profil existant:", checkError);
      return NextResponse.json(
        { 
          success: false,
          error: "Erreur lors de la vérification du profil",
          message: "Impossible de vérifier si le profil existe déjà"
        },
        { status: 500 }
      );
    }

    if (existingProfile) {
      return NextResponse.json(
        { 
          success: false,
          error: "Profil déjà existant",
          message: "Un profil existe déjà pour cet utilisateur"
        },
        { status: 409 }
      );
    }

    // Récupérer l'utilisateur depuis Clerk
    let user;
    try {
      user = await clerkClient.users.getUser(userId);
    } catch (clerkError) {
      console.error("[CREATE PROFILE] Erreur récupération utilisateur Clerk:", clerkError);
      
      if (clerkError instanceof Error && clerkError.message.includes("not found")) {
        return NextResponse.json(
          { 
            success: false,
            error: "Utilisateur non trouvé",
            message: "L'utilisateur spécifié n'existe pas dans Clerk"
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          success: false,
          error: "Erreur Clerk",
          message: "Impossible de récupérer les données utilisateur depuis Clerk"
        },
        { status: 500 }
      );
    }

    // Extraction de l'email principal
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { 
          success: false,
          error: "Adresse email non trouvée",
          message: "Aucune adresse email principale trouvée pour cet utilisateur"
        },
        { status: 400 }
      );
    }

    console.log(`[CREATE PROFILE] Email récupéré: ${email}`);

    // Création du profil dans Supabase
    const profileData = {
      user_id: userId,
      role,
      email,
      favorites: "[]", // JSON string pour les favoris
      farm_id: 0, // Valeur par défaut
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: profileResult, error: profileError } = await supabase
      .from("profiles")
      .insert(profileData)
      .select("user_id")
      .single();

    if (profileError) {
      console.error("[CREATE PROFILE] Erreur création profil:", profileError);
      
      // Gestion spécifique des erreurs de contrainte
      if (profileError.code === "23505") { // Contrainte unique violée
        return NextResponse.json(
          { 
            success: false,
            error: "Profil déjà existant",
            message: "Un profil existe déjà pour cet utilisateur"
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          success: false,
          error: "Erreur lors de la création du profil",
          message: "Impossible de créer le profil dans la base de données"
        },
        { status: 500 }
      );
    }

    console.log(`✅ [CREATE PROFILE] Profil créé avec succès pour ${userId}`);

    const responseData: CreateProfileResponse["data"] = {
      profileId: profileResult.user_id,
    };

    // Si rôle = farmer, créer une entrée vide dans listing
    if (role === "farmer") {
      const listingData = {
        createdBy: userId, // Utilise l'ID utilisateur au lieu de l'email
        name: "", // Nom par défaut vide
        address: "", // Adresse par défaut vide
        active: false,
        lat: 0, // Coordonnées par défaut
        lng: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: listingResult, error: listingError } = await supabase
        .from("listing")
        .insert(listingData)
        .select("id")
        .single();

      if (listingError) {
        console.error("[CREATE PROFILE] Erreur création listing:", listingError);
        
        // Le profil est créé, mais pas le listing - on log l'erreur mais on ne fait pas échouer la requête
        console.warn("[CREATE PROFILE] ⚠️ Listing non créé pour le farmer, mais profil OK");
        
        return NextResponse.json({
          success: true,
          message: "Profil créé avec succès, mais erreur lors de la création du listing",
          data: responseData,
        });
      }

      // Mettre à jour le profil avec l'ID du listing
      if (listingResult) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ farm_id: listingResult.id, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        if (updateError) {
          console.warn("[CREATE PROFILE] ⚠️ Impossible de lier le listing au profil:", updateError);
        }

        responseData.listingId = listingResult.id;
        console.log(`✅ [CREATE PROFILE] Listing créé avec ID: ${listingResult.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: role === "farmer" 
        ? "Profil et listing farmer créés avec succès"
        : "Profil créé avec succès",
      data: responseData,
    });

  } catch (error) {
    console.error("[CREATE PROFILE] Erreur serveur:", error);
    
    // Gestion d'erreur avec détails selon l'environnement
    const isDev = process.env.NODE_ENV === "development";
    
    return NextResponse.json(
      { 
        success: false,
        error: "Erreur interne du serveur",
        message: "Une erreur inattendue s'est produite lors de la création du profil",
        ...(isDev && { 
          details: error instanceof Error ? error.message : String(error) 
        })
      },
      { status: 500 }
    );
  }
}

/**
 * Fonction utilitaire pour valider un rôle
 * 
 * @param role - Rôle à valider
 * @returns true si le rôle est valide
 */
export function isValidRole(role: string): role is ValidRole {
  return VALID_ROLES.includes(role as ValidRole);
}

/**
 * Export des types pour utilisation externe
 */
export type {
  CreateProfileRequestBody,
  CreateProfileResponse,
  ValidRole,
};
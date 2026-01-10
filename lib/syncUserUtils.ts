// lib/syncUserUtils.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { UserResource } from "@clerk/types";

/**
 * Types pour la synchronisation utilisateur
 */
interface SyncProfileOptions {
  createListing?: boolean;
}

export type AllowedRole = "user" | "farmer" | "admin";
export type SupabaseDbClient = SupabaseClient<Database>;

/**
 * Extrait l'email principal d'un utilisateur Clerk
 */
export const getEmailFromUser = (user: UserResource | null): string | null => {
  if (!user) return null;

  return (
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    null
  );
};

/**
 * Met à jour le rôle utilisateur dans Clerk via API
 */
export const updateClerkRole = async (
  userId: string,
  role: AllowedRole
): Promise<boolean> => {
  try {
    const response = await fetch("/api/update-user-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({ userId, role }),
    });

    if (!response.ok) {
      console.error(
        `[DEBUG] Échec de la mise à jour du rôle. Statut: ${response.status}`
      );
      const data = await response.json().catch(() => ({}));
      console.error("[DEBUG] Détails de l'erreur:", data);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[DEBUG] Erreur mise à jour rôle Clerk:", error);
    return false;
  }
};

/**
 * ✅ Synchronise le profil utilisateur avec Supabase (upsert)
 * IMPORTANT: supabase est passé en paramètre (pas de hook ici).
 */
export const syncProfileToSupabase = async (
  supabase: SupabaseDbClient,
  user: UserResource,
  role: AllowedRole,
  options: SyncProfileOptions = {}
): Promise<boolean> => {
  if (!user) throw new Error("Utilisateur non défini");

  const allowedRoles: AllowedRole[] = ["user", "farmer", "admin"];
  if (!allowedRoles.includes(role)) {
    throw new Error(`[SECURITE] Tentative de rôle invalide: ${role}`);
  }

  try {
    const email = getEmailFromUser(user);
    if (!email) throw new Error("Email non disponible");

    // ✅ jsonb: on stocke un tableau, pas une string
    const profileData: any = {
      user_id: user.id,
      email,
      role,
      updated_at: new Date().toISOString(),
      favorites: [],
    };

    // ✅ Seulement ajouter farm_id si farmer + demande de création listing
    if (role === "farmer" && options.createListing) {
      try {
        const listingId = await ensureFarmerListing(supabase, user.id);
        profileData.farm_id = listingId;
      } catch (listingError) {
        console.warn(
          "[DEBUG] Impossible de créer le listing, profil sans farm_id:",
          listingError
        );
      }
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (error) {
      console.error("[DEBUG] Erreur Supabase:", error);
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("[DEBUG] Erreur sync Supabase:", error);
    throw error;
  }
};

/**
 * Queue de création de listings pour éviter les conflits
 */
let isCreatingListing = false;
const listingCreationQueue: Array<{
  userId: string;
  resolve: (id: number) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * ✅ Crée (si besoin) un listing "placeholder" pour un farmer et renvoie son id
 * - identifie le listing par createdBy = userId
 * - gère les conflits et évite les créations simultanées
 */
export const ensureFarmerListing = async (
  supabase: SupabaseDbClient,
  userId: string
): Promise<number> => {
  if (!userId) return Promise.reject(new Error("UserId manquant"));

  if (isCreatingListing) {
    return new Promise((resolve, reject) => {
      listingCreationQueue.push({ userId, resolve, reject });
    });
  }

  isCreatingListing = true;

  try {
    // 1) Vérifier si un listing existe déjà
    const { data: existingListing, error: checkError } = await supabase
      .from("listing")
      .select("id")
      .eq("createdBy", userId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingListing?.id) return existingListing.id;

    // 2) Créer un listing minimal
    const { data: newListing, error: createError } = await supabase
      .from("listing")
      .insert({
        name: `Ferme de ${userId.substring(0, 8)}`,
        address: "À compléter",
        lat: 46.2276,
        lng: 2.2137,
        createdBy: userId,
        active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError) {
      // 23505 = unique violation (si tu as une contrainte unique sur createdBy)
      if ((createError as any).code === "23505") {
        const { data: conflictListing, error: conflictError } = await supabase
          .from("listing")
          .select("id")
          .eq("createdBy", userId)
          .maybeSingle();

        if (conflictError) throw conflictError;
        if (conflictListing?.id) return conflictListing.id;

        throw new Error("Listing existant mais non récupéré");
      }

      throw createError;
    }

    if (!newListing?.id) throw new Error("Listing créé mais id manquant");
    return newListing.id;
  } catch (error) {
    console.error("[DEBUG] Erreur ensureFarmerListing:", error);
    throw error;
  } finally {
    isCreatingListing = false;

    // Traiter le prochain élément de la queue
    if (listingCreationQueue.length > 0) {
      const next = listingCreationQueue.shift()!;
      ensureFarmerListing(supabase, next.userId)
        .then(next.resolve)
        .catch(next.reject);
    }
  }
};

/**
 * Récupère le profil depuis Supabase avec retry automatique
 */
export const getProfileFromSupabase = async (
  supabase: SupabaseDbClient,
  userId: string,
  maxAttempts: number = 5
): Promise<{ role: AllowedRole } | null> => {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (data) return data as { role: AllowedRole };

    // PGRST116 = no rows found
    if (error?.code === "PGRST116" && attempt < maxAttempts) {
      console.warn(
        `[DEBUG] Tentative ${attempt} : profil non trouvé, nouvelle tentative...`
      );
      await new Promise((res) => setTimeout(res, 400 * attempt));
      continue;
    }

    console.error("[DEBUG] Erreur récupération profil Supabase:", error);
    return null;
  }

  return null;
};

/**
 * Détermine le rôle utilisateur à partir de Clerk et/ou Supabase
 */
export const determineUserRole = async (
  supabase: SupabaseDbClient,
  user: UserResource
): Promise<AllowedRole> => {
  if (!user?.id) return "user";

  // 1) Vérifier d'abord les métadonnées Clerk
  const clerkRole = (user.publicMetadata as any)?.role;
  if (["user", "farmer", "admin"].includes(clerkRole)) {
    return clerkRole as AllowedRole;
  }

  // 2) Fallback vers Supabase avec retry intégré
  const profile = await getProfileFromSupabase(supabase, user.id);
  if (profile?.role && ["user", "farmer", "admin"].includes(profile.role)) {
    return profile.role;
  }

  // 3) Valeur par défaut sécurisée
  return "user";
};

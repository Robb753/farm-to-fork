// lib/syncUserUtils.ts
import { supabase } from "@/utils/supabase/client";
import type { UserResource } from "@clerk/types";

/**
 * Types pour la synchronisation utilisateur
 */
interface SyncProfileOptions {
  createListing?: boolean;
}

type AllowedRole = "user" | "farmer" | "admin";

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
 * ✅ CORRECTION COMPLÈTE: Synchronise le profil utilisateur avec Supabase
 */
export const syncProfileToSupabase = async (
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

    // ✅ CORRECTION: Ne pas mettre farm_id pour les utilisateurs normaux
    const profileData: any = {
      user_id: user.id,
      email,
      role,
      updated_at: new Date().toISOString(),
      favorites: JSON.stringify([]), // ✅ JSON.stringify pour compatibilité Supabase
    };

    // ✅ Seulement ajouter farm_id si c'est un farmer ET qu'on a un listing
    if (role === "farmer" && options.createListing) {
      try {
        const listingId = await ensureFarmerListing(user.id);
        profileData.farm_id = listingId;
      } catch (listingError) {
        console.warn(
          "[DEBUG] Impossible de créer le listing, profil sans farm_id:",
          listingError
        );
        // On continue sans farm_id plutôt que de faire échouer toute la création
      }
    }
    // ✅ Pour les users normaux, on ne met PAS de farm_id (NULL par défaut)

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profileData, {
        onConflict: "user_id",
        ignoreDuplicates: false,
      });

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
  email: string;
  resolve: (id: number) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * ✅ CORRECTION: Utiliser l'userId au lieu de l'email pour éviter les conflits
 */
export const ensureFarmerListing = async (userId: string): Promise<number> => {
  if (!userId) return Promise.reject(new Error("UserId manquant"));

  if (isCreatingListing) {
    return new Promise((resolve, reject) => {
      listingCreationQueue.push({ email: userId, resolve, reject }); // Réutilise la queue existante
    });
  }

  isCreatingListing = true;

  try {
    // Vérifier si le listing existe déjà avec l'userId
    const { data: existingListing, error: checkError } = await supabase
      .from("listing")
      .select("id")
      .eq("createdBy", userId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingListing) return existingListing.id;

    // Créer un nouveau listing avec les champs requis
    const { data: newListing, error: createError } = await supabase
      .from("listing")
      .insert({
        name: `Ferme de ${userId.substring(0, 8)}`, // Nom par défaut basé sur l'userId
        address: "À compléter", // Champ requis
        lat: 46.2276, // Centre de la France par défaut
        lng: 2.2137, // Centre de la France par défaut
        createdBy: userId, // ✅ userId au lieu de l'email
        active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError) {
      if (createError.code === "23505") {
        // Conflit - listing créé entre temps
        const { data: conflictListing } = await supabase
          .from("listing")
          .select("id")
          .eq("createdBy", userId)
          .maybeSingle();

        if (conflictListing) return conflictListing.id;
        throw new Error("Listing existant mais non récupéré");
      }

      throw createError;
    }

    return newListing?.id;
  } catch (error) {
    console.error("[DEBUG] Erreur ensureFarmerListing:", error);
    throw error;
  } finally {
    isCreatingListing = false;

    // Traiter le prochain élément de la queue
    if (listingCreationQueue.length > 0) {
      const next = listingCreationQueue.shift()!;
      ensureFarmerListing(next.email).then(next.resolve).catch(next.reject);
    }
  }
};

/**
 * Récupère le profil depuis Supabase avec retry automatique
 */
export const getProfileFromSupabase = async (
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

    if (error?.code === "PGRST116" && attempt < maxAttempts) {
      console.warn(
        `[DEBUG] Tentative ${attempt} : profil non trouvé, nouvelle tentative...`
      );
      await new Promise((res) => setTimeout(res, 400 * attempt)); // Backoff exponentiel
    } else {
      console.error("[DEBUG] Erreur récupération profil Supabase:", error);
      return null;
    }
  }

  return null;
};

/**
 * Détermine le rôle utilisateur à partir de Clerk et/ou Supabase
 */
export const determineUserRole = async (
  user: UserResource
): Promise<AllowedRole> => {
  if (!user?.id) return "user";

  // Vérifier d'abord les métadonnées Clerk
  const clerkRole = (user.publicMetadata as any)?.role;
  if (["user", "farmer", "admin"].includes(clerkRole)) {
    return clerkRole as AllowedRole;
  }

  // Fallback vers Supabase avec retry intégré
  const profile = await getProfileFromSupabase(user.id);
  if (profile?.role && ["user", "farmer", "admin"].includes(profile.role)) {
    return profile.role;
  }

  // Valeur par défaut sécurisée
  return "user";
};

// lib/syncUserUtils.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { ClerkUserDTO } from "@/lib/store/userStore";

export type AllowedRole = "user" | "farmer" | "admin";
export type SupabaseDbClient = SupabaseClient<Database>;

/**
 * Extrait l'email principal (DTO)
 */
export const getEmailFromUser = (user: ClerkUserDTO | null): string | null => {
  if (!user) return null;
  return user.email ?? null;
};

/**
 * Synchronise le metadata Clerk de l'utilisateur connecté avec son rôle en DB.
 * Le rôle est relu côté serveur depuis Supabase — rien n'est envoyé par le client.
 */
export const updateClerkRole = async (): Promise<boolean> => {
  try {
    const response = await fetch("/api/sync-my-role", {
      method: "POST",
      headers: { "Cache-Control": "no-cache" },
    });

    if (!response.ok) {
      console.error(`[SYNC-MY-ROLE] Échec. Statut: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[SYNC-MY-ROLE] Erreur:", error);
    return false;
  }
};

/**
 * Synchronise le profil utilisateur avec Supabase (upsert).
 *
 * Note : la création du listing farmer est gérée exclusivement par le
 * flow d'onboarding (api/onboarding/create-listing) via clerk_user_id.
 * Elle n'a pas lieu ici.
 */
export const syncProfileToSupabase = async (
  supabase: SupabaseDbClient,
  user: ClerkUserDTO,
  role: AllowedRole
): Promise<boolean> => {
  if (!user?.id) throw new Error("Utilisateur non défini");

  const allowedRoles: AllowedRole[] = ["user", "farmer", "admin"];
  if (!allowedRoles.includes(role)) {
    throw new Error(`[SECURITE] Tentative de rôle invalide: ${role}`);
  }

  try {
    const email = getEmailFromUser(user);
    if (!email) throw new Error("Email non disponible");

    // Ne pas écraser favorites à chaque upsert :
    // on lit d'abord pour savoir si le profil existe déjà.
    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      console.warn("Warn read profile before upsert:", existingError);
    }

    const profileData = {
      user_id: user.id,
      email,
      role,
      updated_at: new Date().toISOString(),
      ...(existing ? {} : { favorites: [] }),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (error) {
      console.error("Erreur Supabase:", error);
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("Erreur sync Supabase:", error);
    throw error;
  }
};

/**
 * Récupère le profil depuis Supabase avec retry limité.
 *
 * maxAttempts = 2 suffit : si le profil n'existe pas après syncProfileToSupabase,
 * un seul retry à 200 ms couvre les latences réseau normales.
 * L'ancien seuil de 5 tentatives (400 * attempt ms) pouvait bloquer jusqu'à 6 s
 * pour chaque nouvel utilisateur dont le profil n'existait pas encore.
 */
export const getProfileFromSupabase = async (
  supabase: SupabaseDbClient,
  userId: string,
  maxAttempts: number = 2
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
        `Tentative ${attempt} : profil non trouvé, nouvelle tentative dans 200 ms...`
      );
      await new Promise((res) => setTimeout(res, 200));
      continue;
    }

    console.error("Erreur récupération profil Supabase:", error);
    return null;
  }

  return null;
};

/**
 * Détermine le rôle utilisateur à partir de Clerk (DTO) et/ou Supabase
 */
export const determineUserRole = async (
  supabase: SupabaseDbClient,
  user: ClerkUserDTO
): Promise<AllowedRole> => {
  if (!user?.id) return "user";

  // 1) métadonnées Clerk
  const clerkRole = user.publicMetadata?.role;
  if (clerkRole && ["user", "farmer", "admin"].includes(clerkRole)) {
    return clerkRole;
  }

  // 2) fallback Supabase avec retry
  const profile = await getProfileFromSupabase(supabase, user.id);
  if (profile?.role && ["user", "farmer", "admin"].includes(profile.role)) {
    return profile.role;
  }

  // 3) default safe
  return "user";
};

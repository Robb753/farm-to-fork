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
 * Synchronise le profil utilisateur avec Supabase.
 *
 * Stratégie INSERT / UPDATE séparés pour éviter le trigger
 * `trg_prevent_profiles_sensitive_changes` qui bloque toute
 * modification de user_id / email / farm_id via un upsert.
 *
 * - Première connexion  → INSERT complet (user_id, email, role, favorites)
 * - Reconnexion         → UPDATE uniquement updated_at (colonnes protégées intactes)
 *
 * Note : la promotion de rôle (user → farmer / admin) est gérée
 * exclusivement côté serveur via le bypass `app.bypass_sensitive = 'on'`.
 * Elle ne passe pas par cette fonction.
 *
 * Note : la création du listing farmer est gérée exclusivement par le
 * flow d'onboarding (api/onboarding/create-listing) via clerk_user_id.
 * Elle n'a pas lieu ici.
 */
export const syncProfileToSupabase = async (
  supabase: SupabaseDbClient,
  user: ClerkUserDTO,
  role: AllowedRole,
): Promise<boolean> => {
  if (!user?.id) throw new Error("Utilisateur non défini");

  const allowedRoles: AllowedRole[] = ["user", "farmer", "admin"];
  if (!allowedRoles.includes(role)) {
    throw new Error(`[SECURITE] Tentative de rôle invalide: ${role}`);
  }

  try {
    const email = getEmailFromUser(user);
    if (!email) throw new Error("Email non disponible");

    // Vérification d'existence — évite d'écraser les colonnes protégées
    // (user_id, email, farm_id) lors d'une reconnexion.
    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      console.warn("Warn read profile before insert/update:", existingError);
    }

    if (!existing) {
      // 🆕 Première connexion → INSERT complet
      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        email,
        role,
        favorites: [],
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Erreur Supabase (insert):", error);
        throw new Error(`Erreur Supabase: ${error.message}`);
      }
    } else {
      // 🔄 Reconnexion → UPDATE uniquement les colonnes non-protégées
      // ❌ PAS de user_id, email, farm_id, role — protégés par le trigger
      //    trg_prevent_profiles_sensitive_changes
      const { error } = await supabase
        .from("profiles")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Erreur Supabase (update):", error);
        throw new Error(`Erreur Supabase: ${error.message}`);
      }
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
  maxAttempts: number = 2,
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
        `Tentative ${attempt} : profil non trouvé, nouvelle tentative dans 200 ms...`,
      );
      await new Promise((res) => setTimeout(res, 200));
      continue;
    }

    console.error("Erreur récupération profil Supabase:", error);
    return null;
  }

  return null;
};

// Clerk est la source de vérité — lecture directe, pas de fallback Supabase
export const getUserRole = (user: ClerkUserDTO): AllowedRole => {
  if (!user?.id) return "user";
  const role = user.publicMetadata?.role;
  if (role === "farmer" || role === "admin") return role;
  return "user";
};

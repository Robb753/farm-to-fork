// lib/syncUserUtils.js

import { supabase } from "@/utils/supabase/client";

export const getEmailFromUser = (user) => {
  return (
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    null
  );
};

export const updateClerkRole = async (userId, role) => {
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

export const syncProfileToSupabase = async (
  user,
  role,
  { createListing = false } = {}
) => {
  if (!user) throw new Error("Utilisateur non défini");

  const allowedRoles = ["user", "farmer"];
  if (!allowedRoles.includes(role)) {
    throw new Error(`[SECURITE] Tentative de rôle invalide: ${role}`);
  }

  try {
    const email = getEmailFromUser(user);
    if (!email) throw new Error("Email non disponible");


    const { data, error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        email,
        role,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        favorites: [],
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.error("[DEBUG] Erreur Supabase:", error);
      throw new Error(`Erreur Supabase: ${error.message}`);
    }


    if (role === "farmer" && createListing) {
      await ensureFarmerListing(email);
    }

    return true;
  } catch (error) {
    console.error("[DEBUG] Erreur sync Supabase:", error);
    throw error;
  }
};

let isCreatingListing = false;
let listingCreationQueue = [];

export const ensureFarmerListing = async (email) => {
  if (!email) return Promise.reject(new Error("Email manquant"));

  if (isCreatingListing) {
    return new Promise((resolve, reject) => {
      listingCreationQueue.push({ email, resolve, reject });
    });
  }

  isCreatingListing = true;

  try {
    const { data: existingListing, error: checkError } = await supabase
      .from("listing")
      .select("id")
      .eq("createdBy", email)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingListing) return existingListing.id;

    const { data: newListing, error: createError } = await supabase
      .from("listing")
      .insert({
        createdBy: email,
        active: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === "23505") {
        const { data: conflictListing } = await supabase
          .from("listing")
          .select("id")
          .eq("createdBy", email)
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

    if (listingCreationQueue.length > 0) {
      const next = listingCreationQueue.shift();
      ensureFarmerListing(next.email).then(next.resolve).catch(next.reject);
    }
  }
};

export const getProfileFromSupabase = async (userId, maxAttempts = 5) => {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (data) return data;

    if (error?.code === "PGRST116" && attempt < maxAttempts) {
      console.warn(
        `[DEBUG] Tentative ${attempt} : profil non trouvé, nouvelle tentative...`
      );
      await new Promise((res) => setTimeout(res, 400)); // attendre 400 ms
    } else {
      console.error("[DEBUG] Erreur récupération profil Supabase:", error);
      return null;
    }
  }

  return null;
};

export const determineUserRole = async (user) => {
  if (!user?.id) return "user";

  const clerkRole = user?.publicMetadata?.role;
  if (["user", "farmer"].includes(clerkRole)) return clerkRole;

  const profile = await getProfileFromSupabase(user.id); // ⬅️ retry intégré
  if (["user", "farmer"].includes(profile?.role)) return profile.role;

  return "user";
};

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
    console.log(
      `[DEBUG] Tentative de mise à jour du rôle dans Clerk: ${role} pour l'utilisateur ${userId}`
    );

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
        `[DEBUG] Échec de la mise à jour du rôle dans Clerk. Statut: ${response.status}`
      );
      const data = await response.json().catch(() => ({}));
      console.error("[DEBUG] Détails de l'erreur:", data);
      return false;
    }

    console.log("[DEBUG] ✅ Rôle mis à jour avec succès dans Clerk");
    return true;
  } catch (error) {
    console.error(
      "[DEBUG] Erreur lors de la mise à jour du rôle dans Clerk:",
      error
    );
    return false;
  }
};

export const syncProfileToSupabase = async (user, role) => {
  if (!user) {
    throw new Error("Utilisateur non défini");
  }

  try {
    const email = getEmailFromUser(user);
    if (!email) {
      console.warn("[DEBUG] Aucun email trouvé pour l'utilisateur");
      throw new Error("Email de l'utilisateur non disponible");
    }

    console.log(`[DEBUG] Synchronisation du profil avec rôle: ${role}`);

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
      console.error("[DEBUG] Erreur lors de l'upsert du profil:", error);
      throw new Error(`Erreur Supabase: ${error.message}`);
    } else {
      console.log("[DEBUG] ✅ Profil synchronisé avec succès");
    }

    if (role === "farmer") {
      await ensureFarmerListing(email);
    }

    return true;
  } catch (error) {
    console.error(
      "[DEBUG] Erreur lors de la synchronisation avec Supabase:",
      error
    );
    throw error;
  }
};

let isCreatingListing = false;
let listingCreationQueue = [];

export const ensureFarmerListing = async (email) => {
  if (!email) {
    return Promise.reject(new Error("Email non défini"));
  }

  // Ajouter à la file d'attente si une création est déjà en cours
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

    if (checkError) {
      console.error("[DEBUG] Erreur vérification listing:", checkError);
      throw new Error(`Erreur vérification listing: ${checkError.message}`);
    }

    if (existingListing) {
      console.log("[DEBUG] Listing existant trouvé, ID:", existingListing.id);
      return existingListing.id;
    }

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
        console.warn(
          "[DEBUG] ⚠️ Listing déjà existant pour cet email (conflit unique)."
        );

        // Au lieu d'un alert, récupérer le listing existant
        const { data: conflictListing } = await supabase
          .from("listing")
          .select("id")
          .eq("createdBy", email)
          .maybeSingle();

        if (conflictListing) {
          return conflictListing.id;
        }

        throw new Error("Listing existant mais impossible à récupérer");
      } else {
        console.error("[DEBUG] Erreur création listing:", createError);
        throw new Error(`Erreur création listing: ${createError.message}`);
      }
    }

    console.log("[DEBUG] ✅ Listing créé avec succès, ID:", newListing?.id);
    return newListing?.id;
  } catch (error) {
    console.error("[DEBUG] Erreur globale ensureFarmerListing:", error);
    throw error;
  } finally {
    isCreatingListing = false;

    // Traiter la file d'attente
    if (listingCreationQueue.length > 0) {
      const next = listingCreationQueue.shift();
      ensureFarmerListing(next.email).then(next.resolve).catch(next.reject);
    }
  }
};

export const getProfileFromSupabase = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("[DEBUG] Erreur récupération profil Supabase:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[DEBUG] Exception récupération profil Supabase:", error);
    return null;
  }
};

export const determineUserRole = async (user) => {
  // Priorité 1: Le rôle de la session en cours
  const pendingRole = sessionStorage.getItem("pendingUserRole");
  if (pendingRole === "farmer" || pendingRole === "user") {
    return pendingRole;
  }

  // Priorité 2: Le rôle stocké localement
  const localRole = localStorage.getItem("userRole");
  if (localRole === "farmer" || localRole === "user") {
    return localRole;
  }

  // Priorité 3: Le rôle des métadonnées Clerk
  const clerkRole = user?.publicMetadata?.role;
  if (clerkRole === "farmer" || clerkRole === "user") {
    return clerkRole;
  }

  // Priorité 4: Le rôle dans Supabase
  try {
    const profile = await getProfileFromSupabase(user.id);
    if (profile?.role === "farmer" || profile?.role === "user") {
      return profile.role;
    }
  } catch (error) {
    console.error(
      "[DEBUG] Erreur lors de la récupération du profil Supabase:",
      error
    );
  }

  // Valeur par défaut
  return "user";
};

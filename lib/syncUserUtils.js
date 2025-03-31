// lib/syncUserUtils.js
import { supabase } from "@/utils/supabase/client";

export async function updateClerkRole(userId, role) {
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
      return false;
    }

    console.log("[DEBUG] ✅ Rôle mis à jour avec succès dans Clerk");
    return true;
  } catch (error) {
    console.error("[DEBUG] Erreur updateClerkRole:", error);
    return false;
  }
}

export async function syncProfileToSupabase(user, role) {
  if (!user) return;

  try {
    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses[0]?.emailAddress;

    if (!email) {
      console.warn("[DEBUG] Aucun email trouvé pour l'utilisateur");
      return;
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
    } else {
      console.log("[DEBUG] ✅ Profil synchronisé avec succès");
    }

    if (role === "farmer") {
      await ensureFarmerListing(email);
    }
  } catch (error) {
    console.error("[DEBUG] Erreur syncProfileToSupabase:", error);
  }
}

export async function ensureFarmerListing(email) {
  if (!email) return;

  try {
    const { data: existingListing, error: checkError } = await supabase
      .from("listing")
      .select("id")
      .eq("createdBy", email)
      .maybeSingle();

    if (checkError) {
      console.error("[DEBUG] Erreur vérification listing:", checkError);
      return;
    }

    if (!existingListing) {
      console.log("[DEBUG] Création d'un nouveau listing pour l'agriculteur");

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
        console.error("[DEBUG] Erreur création listing:", createError);
      } else {
        console.log("[DEBUG] ✅ Listing créé, ID:", newListing?.id);
      }
    } else {
      console.log("[DEBUG] Listing existant trouvé, ID:", existingListing.id);
    }
  } catch (error) {
    console.error("[DEBUG] Erreur ensureFarmerListing:", error);
  }
}

export function getEmailFromUser(user) {
  return (
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    null
  );
}

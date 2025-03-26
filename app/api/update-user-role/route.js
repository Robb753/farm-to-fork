// /app/api/update-user-role/route.js
import { clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID et rôle requis" },
        { status: 400 }
      );
    }

    console.log(
      `Mise à jour du rôle pour l'utilisateur ${userId} vers ${role}`
    );

    // 1. Récupérer les informations de l'utilisateur
    let user;
    try {
      user = await clerkClient.users.getUser(userId);
      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }
      console.log("Utilisateur trouvé dans Clerk:", user.id);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'utilisateur Clerk:",
        error
      );
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération de l'utilisateur",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Extraire l'email principal
    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "Email non trouvé pour cet utilisateur" },
        { status: 400 }
      );
    }
    console.log("Email utilisateur:", email);

    // 2. Mettre à jour les métadonnées dans Clerk avec gestion des erreurs et retries
    let clerkUpdateSuccess = false;
    let clerkError = null;

    for (let attempt = 0; attempt < 3 && !clerkUpdateSuccess; attempt++) {
      try {
        console.log(`Tentative ${attempt + 1} de mise à jour Clerk...`);

        // Vérifier d'abord si le rôle est déjà correctement défini
        if (user.publicMetadata?.role === role) {
          console.log("Le rôle est déjà défini correctement dans Clerk");
          clerkUpdateSuccess = true;
          break;
        }

        // Mise à jour des métadonnées dans Clerk
        await clerkClient.users.updateUser(userId, {
          publicMetadata: { role },
        });

        // Vérifier si la mise à jour a réussi
        const updatedUser = await clerkClient.users.getUser(userId);
        console.log(
          "Métadonnées après mise à jour:",
          updatedUser.publicMetadata
        );

        if (updatedUser.publicMetadata?.role === role) {
          clerkUpdateSuccess = true;
          console.log("✅ Mise à jour Clerk réussie!");
          break;
        } else {
          console.warn(
            "⚠️ Le rôle n'est pas correctement défini après mise à jour"
          );
        }

        // Pause avant nouvelle tentative
        if (!clerkUpdateSuccess && attempt < 2) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      } catch (err) {
        clerkError = err;
        console.error(`❌ Tentative ${attempt + 1} échouée:`, err);
        if (attempt < 2)
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }

    // 3. Synchroniser avec Supabase (qu'importe si Clerk a réussi ou non)
    let supabaseSuccess = false;
    let supabaseError = null;

    try {
      console.log("Synchronisation avec Supabase...");

      // Vérifier si le profil existe déjà
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Erreur lors de la vérification du profil:", checkError);
        supabaseError = checkError;
      } else {
        console.log("Profil existant:", existingProfile);

        if (existingProfile) {
          // Mettre à jour seulement si nécessaire
          if (existingProfile.role !== role) {
            console.log(
              `Mise à jour du profil: ${existingProfile.role} -> ${role}`
            );
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                email,
                role,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);

            if (updateError) {
              console.error(
                "Erreur lors de la mise à jour du profil:",
                updateError
              );
              supabaseError = updateError;
            } else {
              console.log("✅ Profil mis à jour avec succès");
              supabaseSuccess = true;
            }
          } else {
            console.log("Aucune mise à jour nécessaire, rôle déjà correct");
            supabaseSuccess = true;
          }
        } else {
          // Créer un nouveau profil
          console.log("Création d'un nouveau profil...");
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: userId,
              email,
              role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              favorites: [],
            });

          if (insertError) {
            if (insertError.code === "23505") {
              console.log(
                "Détection de collision - tentative de mise à jour..."
              );
              // Tenter une mise à jour à la place
              const { error: fallbackError } = await supabase
                .from("profiles")
                .update({
                  email,
                  role,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", userId);

              if (fallbackError) {
                console.error(
                  "Échec de la mise à jour après collision:",
                  fallbackError
                );
                supabaseError = fallbackError;
              } else {
                console.log("✅ Mise à jour réussie après collision");
                supabaseSuccess = true;
              }
            } else {
              console.error(
                "Erreur lors de la création du profil:",
                insertError
              );
              supabaseError = insertError;
            }
          } else {
            console.log("✅ Nouveau profil créé avec succès");
            supabaseSuccess = true;
          }
        }
      }
    } catch (error) {
      console.error("Exception lors de la synchronisation Supabase:", error);
      supabaseError = error;
    }

    // 4. Si c'est un agriculteur, créer/vérifier un listing
    let listingSuccess = false;
    let listingError = null;

    if (role === "farmer") {
      try {
        console.log("Rôle agriculteur - vérification du listing...");

        const { data: existingListing, error: checkListingError } =
          await supabase
            .from("listing")
            .select("id")
            .eq("createdBy", email)
            .maybeSingle();

        if (checkListingError) {
          console.error(
            "Erreur lors de la vérification du listing:",
            checkListingError
          );
          listingError = checkListingError;
        } else {
          console.log("Listing existant:", existingListing);

          if (!existingListing) {
            console.log("Création d'un nouveau listing...");
            const { error: createListingError } = await supabase
              .from("listing")
              .insert({
                createdBy: email,
                active: false,
                created_at: new Date().toISOString(),
              });

            if (createListingError) {
              console.error(
                "Erreur lors de la création du listing:",
                createListingError
              );
              listingError = createListingError;
            } else {
              console.log("✅ Nouveau listing créé avec succès");
              listingSuccess = true;
            }
          } else {
            console.log("Listing existant, aucune action nécessaire");
            listingSuccess = true;
          }
        }
      } catch (error) {
        console.error("Exception lors de la gestion du listing:", error);
        listingError = error;
      }
    } else {
      // Pas un agriculteur, donc aucun listing nécessaire
      listingSuccess = true;
    }

    // 5. Résumé et réponse
    console.log("=== Résumé de l'opération ===");
    console.log(
      "Mise à jour Clerk:",
      clerkUpdateSuccess ? "Réussie ✅" : "Échouée ❌"
    );
    console.log(
      "Mise à jour Supabase:",
      supabaseSuccess ? "Réussie ✅" : "Échouée ❌"
    );

    if (role === "farmer") {
      console.log(
        "Gestion du listing:",
        listingSuccess ? "Réussie ✅" : "Échouée ❌"
      );
    }

    // Renvoyer une réponse détaillée
    return NextResponse.json({
      success: clerkUpdateSuccess && supabaseSuccess,
      clerkUpdate: {
        success: clerkUpdateSuccess,
        error: clerkError ? String(clerkError) : null,
      },
      supabaseUpdate: {
        success: supabaseSuccess,
        error: supabaseError ? String(supabaseError) : null,
      },
      listingUpdate:
        role === "farmer"
          ? {
              success: listingSuccess,
              error: listingError ? String(listingError) : null,
            }
          : null,
      role,
    });
  } catch (error) {
    console.error("Erreur générale lors de la mise à jour du rôle:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(error) },
      { status: 500 }
    );
  }
}
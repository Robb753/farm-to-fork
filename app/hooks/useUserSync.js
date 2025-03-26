"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function useUserSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSyncing, setIsSyncing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Vérifier et synchroniser l'utilisateur
  useEffect(() => {
    if (!isLoaded) return;

    const syncUser = async () => {
      // Si l'utilisateur n'est pas connecté
      if (!isSignedIn || !user) {
        setUserRole(null);
        setIsReady(true);
        return;
      }

      setIsSyncing(true);
      try {
        // Vérifier si c'est une nouvelle inscription avec rôle spécifié dans l'URL
        const isNewSignup = searchParams.get("newSignup") === "true";
        const urlRole = searchParams.get("role");

        if (isNewSignup && urlRole) {
          console.log("Nouvelle inscription détectée avec rôle:", urlRole);
          // Nettoyer l'URL tout en gardant le reste des paramètres
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("newSignup");
          newParams.delete("role");
          if (newParams.toString()) {
            router.replace(`${pathname}?${newParams.toString()}`);
          } else {
            router.replace(pathname);
          }
        }

        // 1. Sources de vérité pour le rôle, par ordre de priorité:
        let role = null;

        // a) Paramètre d'URL pour nouvelle inscription
        if (isNewSignup && urlRole) {
          role = urlRole;

          // Mise à jour immédiate dans Clerk
          try {
            await fetch("/api/update-user-role", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id, role }),
            });
          } catch (err) {
            console.error("Erreur mise à jour rôle:", err);
          }
        }

        // b) Métadonnées publiques de Clerk
        if (!role) {
          role = user.publicMetadata?.role;
        }

        // c) SessionStorage (stockage temporaire de l'inscription)
        if (!role) {
          const pendingRole = sessionStorage.getItem("pendingUserRole");

          if (pendingRole) {
            role = pendingRole;

            // Nettoyer après utilisation
            sessionStorage.removeItem("pendingUserRole");
            sessionStorage.removeItem("pendingUserId");

            // Mise à jour dans Clerk
            try {
              await fetch("/api/update-user-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, role }),
              });
            } catch (err) {
              console.error("Erreur mise à jour rôle:", err);
            }
          }
        }

        // d) Profil Supabase
        if (!role) {
          try {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("role")
              .eq("user_id", user.id)
              .single();

            if (profileData?.role) {
              role = profileData.role;

              // Synchroniser avec Clerk
              try {
                await fetch("/api/update-user-role", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: user.id, role }),
                });
              } catch (err) {
                console.error("Erreur mise à jour rôle:", err);
              }
            }
          } catch (err) {
            console.error("Erreur vérification profil:", err);
          }
        }

        // e) localStorage (stockage persistant)
        if (!role) {
          const storedRole = localStorage.getItem("userRole");

          if (storedRole) {
            role = storedRole;

            // Nettoyer après utilisation
            localStorage.removeItem("userRole");

            // Mise à jour dans Clerk et Supabase
            try {
              await fetch("/api/update-user-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, role }),
              });
            } catch (err) {
              console.error("Erreur mise à jour rôle:", err);
            }
          }
        }

        // f) Fallback vers "user" si aucun rôle n'est trouvé
        role = role || "user";
        console.log("Rôle utilisateur:", role);
        setUserRole(role);

        // 2. Synchroniser le profil avec Supabase
        await syncProfileToSupabase(user, role);

        // 3. Redirection basée sur le rôle si nécessaire
        handleRoleBasedRedirection(role);
      } catch (error) {
        console.error("Erreur de synchronisation:", error);
        toast.error("Erreur lors de la synchronisation de votre profil");
      } finally {
        setIsSyncing(false);
        setIsReady(true);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, router, pathname, searchParams]);

  // Fonction de synchronisation du profil avec Supabase
  const syncProfileToSupabase = async (user, role) => {
    try {
      const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses[0]?.emailAddress;

      if (!email) {
        return;
      }

      // Gérer les erreurs de clé dupliquée
      try {
        // Vérifier si le profil existe
        const { data: existingProfile, error: checkError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (checkError) {
          console.error("Erreur vérification profil:", checkError);
          return;
        }

        if (existingProfile) {
          // Mettre à jour seulement si le rôle est différent
          if (existingProfile.role !== role) {
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                email,
                role,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id);

            if (updateError) {
              console.error("Erreur mise à jour profil:", updateError);
            }
          }
        } else {
          // Tenter de créer un nouveau profil avec gestion des erreurs
          try {
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                user_id: user.id,
                email,
                role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                favorites: [],
              });

            if (insertError) {
              if (insertError.code === "23505") {
                // Essayer une mise à jour
                const { error: fallbackError } = await supabase
                  .from("profiles")
                  .update({
                    email,
                    role,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", user.id);

                if (fallbackError) {
                  console.error(
                    "Erreur mise à jour après collision:",
                    fallbackError
                  );
                }
              } else {
                console.error("Erreur création profil:", insertError);
              }
            }
          } catch (insertCatchError) {
            console.error("Exception création profil:", insertCatchError);
          }
        }
      } catch (supabaseError) {
        console.error("Erreur Supabase:", supabaseError);
      }

      // Si c'est un agriculteur, vérifier/créer un listing
      if (role === "farmer") {
        try {
          const { data: existingListing, error: listingCheckError } =
            await supabase
              .from("listing")
              .select("id")
              .eq("createdBy", email)
              .maybeSingle();

          if (listingCheckError) {
            console.error("Erreur vérification listing:", listingCheckError);
            return;
          }

          if (!existingListing) {
            const { error: createListingError } = await supabase
              .from("listing")
              .insert({
                createdBy: email,
                active: false,
                created_at: new Date().toISOString(),
              });

            if (createListingError) {
              console.error("Erreur création listing:", createListingError);
            }
          }
        } catch (listingError) {
          console.error("Exception gestion listing:", listingError);
        }
      }
    } catch (error) {
      console.error("Erreur synchronisation Supabase:", error);
    }
  };

  // Fonction de redirection basée sur le rôle
  const handleRoleBasedRedirection = (role) => {
    // Pages spéciales qui ne déclenchent pas de redirection
    const authPages = ["/sign-in", "/sign-up", "/signup-role"];
    const isOnAuthPage = authPages.includes(pathname);

    // Pages autorisées pour les agriculteurs
    const farmerAllowedPages = [
      "/", // Accueil
      "/add-new-listing", // Ajouter listing
      "/view-listing", // Voir listing
      "/farmer-dashboard", // Dashboard farmer
      "/profile", // Profil utilisateur
      "/forum", // Forum
      "/map-view", // Carte
      "/user", // Page utilisateur
    ];

    // Vérifier si la page actuelle est une page edit-listing
    const isOnEditListingPage = pathname.startsWith("/edit-listing/");

    // Si on est sur une page d'authentification alors qu'on est déjà connecté
    if (isOnAuthPage && isSignedIn) {
      router.push("/");
      return;
    }

    // Gestion spécifique pour les agriculteurs
    if (role === "farmer") {
      // Vérifier si l'utilisateur est sur une page autorisée
      const isOnAllowedPage = farmerAllowedPages.some(
        (page) =>
          pathname === page || (page !== "/" && pathname.startsWith(page))
      );

      if (!isOnAllowedPage && !isOnEditListingPage) {
        checkFarmerListing();
      }
    }
  };

  // Vérifier si l'agriculteur a un listing
  const checkFarmerListing = async () => {
    try {
      const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses[0]?.emailAddress;

      if (!email) {
        return;
      }

      const { data: listingData, error } = await supabase
        .from("listing")
        .select("id")
        .eq("createdBy", email)
        .maybeSingle();

      if (error) {
        console.error("Erreur vérification listing:", error);
        return;
      }

      if (listingData?.id) {
        router.push(`/edit-listing/${listingData.id}`);
      } else {
        router.push("/add-new-listing");
      }
    } catch (error) {
      console.error("Erreur vérification listing:", error);
    }
  };

  // Fermer modaux si nécessaire (fonctionnalité de ModalCloser)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const closeModals = () => {
      // Essayer de fermer via les boutons de fermeture
      const closeButtons = document.querySelectorAll(
        'button[aria-label="Fermer la fenêtre"]'
      );

      if (closeButtons.length > 0) {
        closeButtons.forEach((button) => button.click());
      }

      // Si nous sommes sur la page signup-role, rediriger vers l'accueil
      if (pathname === "/signup-role") {
        router.push("/");
      }
    };

    closeModals();

    // Exécuter également après un court délai
    const timeout = setTimeout(() => {
      closeModals();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isLoaded, isSignedIn, pathname, router]);

  return {
    user,
    isLoaded,
    isSignedIn,
    isSyncing,
    isReady,
    role: userRole,
    isFarmer: userRole === "farmer",
    isUser: userRole === "user" || !userRole,
  };
}

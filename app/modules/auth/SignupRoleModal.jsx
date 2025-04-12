"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignUp, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function SignupRoleModal({ onClose }) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { client } = useClerk();
  const modalCloseRef = useRef(false);

  useEffect(() => {
    const storedRole = sessionStorage.getItem("pendingUserRole");
    if (storedRole === "user" || storedRole === "farmer") {
      console.log("[DEBUG] Rôle récupéré du sessionStorage:", storedRole);
      setSelectedRole(storedRole);
    }
  }, []);

  useEffect(() => {
    if (selectedRole === "user" || selectedRole === "farmer") {
      sessionStorage.setItem("pendingUserRole", selectedRole);
    }
  }, [selectedRole]);

  // Effet pour gérer la redirection après fermeture du modal
  useEffect(() => {
    const pendingRedirect = sessionStorage.getItem("pendingRedirect");
    if (pendingRedirect && modalCloseRef.current) {
      const timeoutId = setTimeout(() => {
        sessionStorage.removeItem("pendingRedirect");
        console.log(`[REDIRECTION] Vers ${pendingRedirect}`);
        window.location.href = pendingRedirect;
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (!modalCloseRef.current && !isSubmitting) {
        // Nettoyer uniquement si on n'a pas complété l'inscription
        sessionStorage.removeItem("pendingUserRole");
      }
    };
  }, [isSubmitting]);

  const handleClose = () => {
    if (isSubmitting) return;

    modalCloseRef.current = true;
    sessionStorage.removeItem("pendingUserRole");
    sessionStorage.removeItem("pendingRedirect");

    if (onClose) {
      onClose();
    } else {
      router.push("/");
    }
  };

  const handleComplete = async (result) => {
    if (selectedRole !== "user" && selectedRole !== "farmer") {
      toast.error("Veuillez sélectionner un rôle valide.");
      return;
    }

    if (!result?.createdUserId) {
      console.error("[DEBUG] Pas d'ID utilisateur créé");
      return;
    }

    const userId = result.createdUserId;
    setIsSubmitting(true);

    try {
      // Stocker les informations localement
      sessionStorage.setItem("pendingUserRole", selectedRole);
      sessionStorage.setItem("pendingUserId", userId);
      localStorage.setItem("userRole", selectedRole);

      if (selectedRole === "farmer") {
        sessionStorage.setItem("isNewFarmer", "true");
        localStorage.setItem("isNewFarmer", "true");
      }

      toast.info(
        `Création de votre compte en cours en tant que ${
          selectedRole === "farmer" ? "agriculteur" : "utilisateur"
        }...`
      );

      // Tentatives de mise à jour du rôle dans Clerk
      let success = false;
      let attempts = 0;
      const maxAttempts = 5;

      while (!success && attempts < maxAttempts) {
        attempts++;
        const delay = Math.pow(2, attempts - 1) * 500;
        if (attempts > 1) await new Promise((r) => setTimeout(r, delay));

        try {
          const response = await fetch("/api/update-user-role", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
            body: JSON.stringify({ userId, role: selectedRole }),
          });

          const responseData = await response.json();
          console.log(`[DEBUG] Réponse tentative ${attempts}:`, responseData);

          if (response.ok) {
            await client.session.refresh();

            let sessionReady = false;
            let sessionTries = 0;
            while (!sessionReady && sessionTries < 10) {
              sessionTries++;
              await new Promise((res) => setTimeout(res, 500));
              const user = await client.getUser();
              const currentRole = user?.publicMetadata?.role;
              if (currentRole === selectedRole) sessionReady = true;
            }

            success = true;
          }
        } catch (err) {
          console.error(`[DEBUG] Erreur tentative ${attempts}:`, err);
        }
      }

      if (success) {
        toast.success(
          `Compte créé avec succès en tant que ${
            selectedRole === "farmer" ? "agriculteur" : "utilisateur"
          }`
        );
        await new Promise((r) => setTimeout(r, 500));
      } else {
        toast.warning(
          "Votre compte a été créé, mais certains paramètres n'ont pas pu être enregistrés."
        );
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Nettoyage des données temporaires
      sessionStorage.removeItem("pendingUserRole");
      sessionStorage.removeItem("pendingUserId");
      localStorage.removeItem("isNewFarmer");

      // Redirection immédiate selon le rôle
      const redirectUrl =
        selectedRole === "farmer"
          ? "/signup/syncing"
          : `/?newSignup=true&role=user&t=${Date.now()}`;

      console.log(`[DEBUG] Redirection immédiate vers ${redirectUrl}`);
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("[DEBUG] Erreur lors de l'inscription:", error);
      toast.error(
        "Une erreur est survenue lors de la création de votre compte"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Modal onClose={handleClose}>
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        <section className="relative hidden lg:block bg-gray-900 lg:col-span-5 xl:col-span-6 rounded-l-lg overflow-hidden">
          <Image
            alt="Ferme"
            src="/image1.jpg"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 z-10">
            <h2 className="text-3xl font-bold text-white">
              Rejoignez Farm To Fork
            </h2>
            <p className="mt-2 text-white/90">
              Choisissez votre rôle pour démarrer votre aventure.
            </p>
          </div>
        </section>

        <main className="flex flex-col lg:col-span-7 xl:col-span-6 bg-white rounded-r-lg overflow-y-auto p-6">
          <div className="w-full">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Je suis...
              </h3>
              <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
                {["user", "farmer"].map((role) => (
                  <label
                    key={role}
                    className={`flex flex-col p-4 border rounded-md cursor-pointer transition w-full ${
                      selectedRole === role
                        ? "border-green-500 bg-green-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={() => setSelectedRole(role)}
                        className="mr-2 h-4 w-4 text-green-600"
                        disabled={isSubmitting}
                      />
                      <span className="font-medium">
                        {role === "user" ? "Utilisateur" : "Agriculteur"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 pl-6">
                      {role === "user"
                        ? "Je souhaite acheter des produits directement des agriculteurs."
                        : "Je souhaite vendre mes produits sur la plateforme."}
                    </p>
                  </label>
                ))}
              </div>
              {!selectedRole && (
                <p className="text-sm text-red-500 mt-2">
                  <span className="inline-block mr-1">⚠️</span>
                  Veuillez sélectionner un rôle pour activer le formulaire.
                </p>
              )}
            </div>

            <SignUp
              routing="hash"
              signInUrl="/sign-in"
              forceRedirectUrl={false}
              fallbackRedirectUrl="/signup/syncing?from=fallback"
              appearance={{
                elements: {
                  formButtonPrimary: selectedRole
                    ? "bg-green-600 hover:bg-green-700"
                    : "pointer-events-none opacity-50 cursor-not-allowed",
                  formButtonPrimaryContent: isSubmitting ? "hidden" : "block",
                  formButtonPrimaryLoading: isSubmitting
                    ? "flex items-center justify-center gap-2"
                    : "hidden",
                },
                variables: {
                  colorPrimary: "#16a34a",
                  borderRadius: "0.375rem",
                },
              }}
              onComplete={handleComplete}
            />
          </div>
        </main>
      </div>
    </Modal>
  );
}

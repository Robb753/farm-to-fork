"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SignupRoleModal({ onClose }) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("user");

  // Stocker le rôle dans sessionStorage dès qu'il change
  useEffect(() => {
    sessionStorage.setItem("pendingUserRole", selectedRole);
    console.log("Rôle stocké dans sessionStorage:", selectedRole);
  }, [selectedRole]);

  const handleClose = () => {
    // Nettoyer sessionStorage lors de la fermeture du modal
    sessionStorage.removeItem("pendingUserRole");

    if (onClose) {
      onClose();
    } else {
      router.push("/");
    }
  };

  const handleComplete = async (result) => {
    if (result?.createdUserId) {
      try {
        console.log("Inscription complétée, userId:", result.createdUserId);
        console.log("Rôle final choisi:", selectedRole);

        // Stocker le rôle dans tous les stockages disponibles pour maximiser les chances
        localStorage.setItem("userRole", selectedRole);
        sessionStorage.setItem("pendingUserRole", selectedRole);
        sessionStorage.setItem("pendingUserId", result.createdUserId);

        // Afficher un message de création en cours
        toast.info(
          `Création de votre compte en cours en tant que ${
            selectedRole === "farmer" ? "agriculteur" : "utilisateur"
          }...`
        );

        // Tenter une mise à jour immédiate du rôle dans Clerk et Supabase
        try {
          for (let attempt = 0; attempt < 3; attempt++) {
            const response = await fetch("/api/update-user-role", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: result.createdUserId,
                role: selectedRole,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log("Mise à jour du rôle réussie:", data);
              break;
            } else {
              console.error(`Tentative ${attempt + 1} échouée`);
              if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
            }
          }
        } catch (error) {
          console.error("Erreur lors de la mise à jour du rôle:", error);
          // Continuer même en cas d'erreur - les mécanismes de secours prendront le relais
        }

        // Message de succès
        toast.success(
          `Compte créé avec succès en tant que ${
            selectedRole === "farmer" ? "agriculteur" : "utilisateur"
          }`
        );

        // Petit délai pour permettre à Clerk et Supabase de se synchroniser
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Rediriger avec des paramètres pour indiquer une nouvelle inscription
        if (selectedRole === "farmer") {
          console.log("Redirection vers la page d'ajout de listing");
          router.push(`/add-new-listing?newSignup=true&role=${selectedRole}`);
        } else {
          console.log("Redirection vers la page d'accueil");
          router.push(`/?newSignup=true&role=${selectedRole}`);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la finalisation de l'inscription:",
          error
        );
        toast.error(
          "Une erreur est survenue lors de la création de votre compte"
        );
        router.push("/");
      }
    }
  };

  return (
    <Modal onClose={handleClose}>
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Image à gauche (desktop only) */}
        <section className="relative hidden lg:block bg-gray-900 lg:col-span-5 xl:col-span-6 rounded-l-lg overflow-hidden">
          <img
            alt="Ferme"
            src="/image1.jpg"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 z-10">
            <h2 className="text-3xl font-bold text-white">
              Rejoignez Farm To Fork
            </h2>
            <p className="mt-2 text-white/90">
              Choisissez votre rôle pour démarrer votre aventure.
            </p>
          </div>
        </section>

        {/* SignUp Formulaire à droite */}
        <main className="flex flex-col lg:col-span-7 xl:col-span-6 bg-white rounded-r-lg overflow-y-auto p-6">
          <div className="w-full">
            {/* Sélection de rôle personnalisée */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Je suis...
              </h3>
              <div className="flex space-x-4">
                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition w-full">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={selectedRole === "user"}
                    onChange={() => {
                      setSelectedRole("user");
                      console.log("Rôle sélectionné: user");
                    }}
                    className="mr-2 h-4 w-4 text-green-600"
                  />
                  <span>Utilisateur</span>
                </label>
                <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition w-full">
                  <input
                    type="radio"
                    name="role"
                    value="farmer"
                    checked={selectedRole === "farmer"}
                    onChange={() => {
                      setSelectedRole("farmer");
                      console.log("Rôle sélectionné: farmer");
                    }}
                    className="mr-2 h-4 w-4 text-green-600"
                  />
                  <span>Agriculteur</span>
                </label>
              </div>
            </div>

            {/* Formulaire d'inscription Clerk */}
            <SignUp
              routing="hash"
              signInUrl="/sign-in"
              appearance={{
                elements: {
                  formButtonPrimary: "bg-green-600 hover:bg-green-700",
                  rootBox: "px-2",
                  formFieldLabel: "mt-2",
                  socialButtonsBlockButton: "my-1",
                  formFieldAction: "mt-1",
                  form: "px-2",
                  headerTitle: "mt-2 mb-1",
                  headerSubtitle: "mb-3",
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

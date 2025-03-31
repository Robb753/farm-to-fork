"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignUp, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SignupRoleModal({ onClose }) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { client } = useClerk();

  useEffect(() => {
    const storedRole = sessionStorage.getItem("pendingUserRole");
    if (storedRole === "user" || storedRole === "farmer") {
      console.log("[DEBUG] Rôle récupéré du sessionStorage:", storedRole);
      setSelectedRole(storedRole);
    }
  }, []);

  useEffect(() => {
    if (selectedRole === "user" || selectedRole === "farmer") {
      console.log(
        "[DEBUG] Mise à jour du rôle dans sessionStorage:",
        selectedRole
      );
      sessionStorage.setItem("pendingUserRole", selectedRole);
    }
  }, [selectedRole]);

  const handleClose = () => {
    if (isSubmitting) return;
    sessionStorage.removeItem("pendingUserRole");
    onClose ? onClose() : router.push("/");
  };

  const forceRedirect = (url, reason = "") => {
    console.log(`[REDIRECTION] Vers ${url} | Raison : ${reason}`);
    window.location.replace(url);
    setTimeout(() => {
      console.warn("[REDIRECTION] Fallback activé après 1s");
      window.location.href = url;
    }, 1000);
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
    console.log("[DEBUG] Inscription complète, userId:", userId);
    console.log("[DEBUG] Rôle sélectionné:", selectedRole);

    try {
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

      let success = false;
      let attempts = 0;
      const maxAttempts = 5;

      while (!success && attempts < maxAttempts) {
        attempts++;
        const delay = Math.pow(2, attempts - 1) * 500;

        if (attempts > 1) {
          console.log(`[DEBUG] Attente ${delay}ms avant tentative ${attempts}`);
          await new Promise((r) => setTimeout(r, delay));
        }

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
            console.log("[DEBUG] Mise à jour du rôle réussie");
            try {
              console.log("[DEBUG] Rafraîchissement de la session Clerk...");
              await client.session.refresh();
              console.log("[DEBUG] Session Clerk actualisée");
            } catch (err) {
              console.warn("[DEBUG] Erreur session.refresh():", err);
            }

            // Attendre que Clerk reflète bien le rôle mis à jour
            let sessionReady = false;
            let sessionTries = 0;
            const maxSessionTries = 10;

            while (!sessionReady && sessionTries < maxSessionTries) {
              sessionTries++;
              await new Promise((res) => setTimeout(res, 500));
              const user = await client.getUser();
              const currentRole = user?.publicMetadata?.role;
              console.log(
                `[DEBUG] Vérif session ${sessionTries} : rôle =`,
                currentRole
              );

              if (currentRole === selectedRole) {
                sessionReady = true;
                console.log(
                  "[DEBUG] 🎉 Session Clerk synchronisée avec le rôle"
                );
              }
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

      sessionStorage.removeItem("pendingUserRole");
      sessionStorage.removeItem("pendingUserId");
      localStorage.removeItem("isNewFarmer");

      const redirectUrl =
        selectedRole === "farmer"
          ? "/signup/syncing"
          : `/?newSignup=true&role=user&t=${Date.now()}`;

console.log("[DEBUG] Redirection finale vers :", redirectUrl);
      forceRedirect(redirectUrl, "Session Clerk synchronisée");
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
              <div className="flex space-x-4">
                {["user", "farmer"].map((role) => (
                  <label
                    key={role}
                    className={`flex items-center p-3 border rounded-md cursor-pointer transition w-full ${
                      selectedRole === role
                        ? "border-green-500 bg-green-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={selectedRole === role}
                      onChange={() => setSelectedRole(role)}
                      className="mr-2 h-4 w-4 text-green-600"
                      disabled={isSubmitting}
                    />
                    <span>
                      {role === "user" ? "Utilisateur" : "Agriculteur"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {!selectedRole && (
              <p className="text-sm text-red-500 mb-4">
                Veuillez sélectionner un rôle pour activer le formulaire.
              </p>
            )}

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

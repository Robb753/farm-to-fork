"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

export default function SignupModalSimple({ onClose }) {
  const router = useRouter();
  const [hasSignedUp, setHasSignedUp] = useState(false);

  const handleComplete = async (result) => {
    if (!result?.createdUserId) return;

    try {
      const userId = result.createdUserId;

      // Stocker le rôle par défaut
      localStorage.setItem("userRole", "user");

      const response = await fetch("/api/update-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "user" }),
      });

      if (!response.ok) {
        toast.warning("Compte créé, mais problème d'enregistrement du rôle.");
      } else {
        toast.success("Bienvenue ! Votre compte est prêt. 🎉");
      }

      // Étape UX :
      setHasSignedUp(true);

      // Petite pause pour laisser le toast s'afficher
      setTimeout(() => {
        if (onClose) onClose(); // fermeture du modal
        router.push("/"); // redirection vers la home
      }, 1000);
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Une erreur est survenue pendant l'inscription.");
    }
  };

  return (
    <Modal onClose={onClose}>
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
              Créez votre compte pour enregistrer vos favoris et découvrir les
              fermes locales.
            </p>
          </div>
        </section>

        <main className="flex flex-col lg:col-span-7 xl:col-span-6 bg-white rounded-r-lg overflow-y-auto p-6">
          <div className="w-full">
            {!hasSignedUp ? (
              <SignUp
                routing="hash"
                signInUrl="/sign-in"
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-green-600 hover:bg-green-700",
                  },
                  variables: {
                    colorPrimary: "#16a34a",
                    borderRadius: "0.375rem",
                  },
                }}
                onComplete={handleComplete}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="text-green-600 text-3xl mb-4">🎉</div>
                <h2 className="text-2xl font-semibold mb-2">
                  Inscription réussie !
                </h2>
                <p className="text-gray-600">
                  Redirection vers la page d'accueil...
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </Modal>
  );
}

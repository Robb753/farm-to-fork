"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignUp, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SignupRoleModal({ onClose }) {
  const router = useRouter();
  const { client } = useClerk();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const role = "user"; // Rôle forcé

  const handleClose = () => {
    if (isSubmitting) return;
    if (onClose) onClose();
    else router.push("/");
  };

  const handleComplete = async (result) => {
    if (!result?.createdUserId) {
      console.error("[DEBUG] Pas d'ID utilisateur créé");
      return;
    }

    const userId = result.createdUserId;
    setIsSubmitting(true);

    try {
      toast.info("Création de votre compte...");

      const response = await fetch("/api/update-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        toast.warning("Compte créé, mais le rôle n'a pas pu être synchronisé.");
      } else {
        await client.session.refresh();
        toast.success("Compte créé avec succès !");
      }

      // Redirection vers /request-farmer-access si prévu par la page appelante
      const redirectUrl =
        typeof window !== "undefined" &&
        window.location.pathname.includes("signup-farmer")
          ? "/request-farmer-access"
          : "/";

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    } catch (error) {
      console.error("[DEBUG] Erreur lors de l'inscription:", error);
      toast.error("Une erreur est survenue pendant l'inscription.");
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
              Créez votre compte pour enregistrer vos favoris ou publier votre
              ferme.
            </p>
          </div>
        </section>

        <main className="flex flex-col lg:col-span-7 xl:col-span-6 bg-white rounded-r-lg overflow-y-auto p-6">
          <div className="w-full">
            <SignUp
              routing="hash"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/"
              appearance={{
                elements: {
                  formButtonPrimary: isSubmitting
                    ? "pointer-events-none opacity-50"
                    : "bg-green-600 hover:bg-green-700",
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

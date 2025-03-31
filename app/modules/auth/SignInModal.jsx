"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SignInModal({ onClose }) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/"); // Fallback si onClose n'est pas fourni
    }
  };

  return (
    <Modal onClose={handleClose}>
      <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[85vh]">
        {/* Image à gauche sur grands écrans */}
        <section className="relative hidden lg:block bg-gray-900 lg:col-span-5 xl:col-span-6 rounded-l-lg overflow-hidden h-full">
          <Image
            alt="Champs agricoles"
            src="/image1.jpg"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            width={500}
            height={500}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 z-10">
            <h2 className="text-3xl font-bold text-white">
              Bienvenue sur Farm To Fork !
            </h2>
            <p className="mt-2 text-white/90">
              Connectez-vous pour découvrir les fermes locales.
            </p>
          </div>
        </section>

        {/* Formulaire à droite */}
        <main className="flex flex-col lg:col-span-7 xl:col-span-6 bg-white rounded-r-lg overflow-y-auto p-6 max-h-[85vh]">
          <SignIn
            routing="hash"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                formButtonPrimary: "bg-green-600 hover:bg-green-700",
                rootBox: "",
                formFieldLabel: "",
                socialButtonsBlockButton: "my-1",
                formFieldAction: "mt-1",
                form: "px-2",
                headerTitle: "mt-2 mb-1",
                headerSubtitle: "mb-3",
                formFieldInput:
                  "rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500",
                card: "shadow-none",
              },
              variables: {
                colorPrimary: "#16a34a",
                borderRadius: "0.375rem",
              },
            }}
          />
        </main>
      </div>
    </Modal>
  );
}

"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpFarmerPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/request-farmer-access");
    }
  }, [isLoaded, isSignedIn, router]);

  if (isLoaded && isSignedIn) return null;

  return (
    <section className="bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:min-h-screen">
        <section className="relative flex h-32 sm:h-48 md:h-64 lg:h-full items-end bg-gray-900 lg:col-span-5 xl:col-span-6">
          <Image
            alt="Champs agricoles"
            src="/image1.jpg"
            fill
            className="absolute inset-0 object-cover opacity-70"
            priority
          />
          <div className="hidden lg:block lg:relative lg:p-12">
            <Link className="block text-white" href="/">
              <span className="sr-only">Accueil</span>
              <svg
                className="h-8 sm:h-10"
                viewBox="0 0 28 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 12L12 20L24 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-white">
              Rejoignez Farm To Fork !
            </h2>
            <p className="mt-4 text-white/90 leading-relaxed">
              Créez un compte pour enregistrer votre ferme ou suivre vos
              producteurs préférés.
            </p>
          </div>
        </section>

        <main className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 md:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <div className="max-w-lg w-full">
            <div className="lg:hidden mb-4 text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                Rejoignez Farm To Fork !
              </h1>
              <p className="mt-2 text-gray-500">
                Créez un compte pour commencer.
              </p>
            </div>

            <SignUp
              routing="hash"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/request-farmer-access"
              appearance={{
                elements: {
                  formButtonPrimary: "bg-green-600 hover:bg-green-700",
                },
              }}
            />
          </div>
        </main>
      </div>
    </section>
  );
}

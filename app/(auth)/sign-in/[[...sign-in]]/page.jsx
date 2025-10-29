"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const params = useSearchParams();

  // Supporte ?redirect=/chemin
  const redirectTarget = useMemo(() => {
    const r = params?.get("redirect");
    return r && r.startsWith("/") ? r : "/";
  }, [params]);

  // Déjà connecté → redirection douce
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(redirectTarget);
    }
  }, [isLoaded, isSignedIn, router, redirectTarget]);

  if (isLoaded && isSignedIn) return null;

  return (
    <section className="bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:min-h-screen">
        {/* Image / branding */}
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
              <svg className="h-8 sm:h-10" viewBox="0 0 28 24" fill="none">
                <path d="M0.41 10.3847C1.14777 7.4194..." fill="currentColor" />
              </svg>
            </Link>

            <h2 className="mt-6 text-3xl font-bold text-white">
              Bienvenue sur Farm To Fork !
            </h2>
            <p className="mt-4 text-white/90 leading-relaxed">
              Connectez-vous pour accéder à vos fermes, favoris et plus encore.
            </p>
          </div>
        </section>

        {/* Formulaire */}
        <main className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 md:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <div className="max-w-lg w-full">
            <div className="lg:hidden mb-4 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Bienvenue sur Farm To Fork
              </h1>
              <p className="mt-2 text-gray-500">
                Connectez-vous pour accéder à vos favoris et tableaux de bord.
              </p>
            </div>

            <SignIn
              signUpUrl="/sign-up"
              fallbackRedirectUrl={redirectTarget}
              appearance={{
                elements: {
                  formButtonPrimary:
                    "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500",
                  card: "shadow-xl rounded-xl",
                },
              }}
            />
          </div>
        </main>
      </div>
    </section>
  );
}

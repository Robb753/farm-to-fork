"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FarmerGuard({ children }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Vérifier si les données utilisateur sont chargées
    if (!isLoaded) return;

    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!user) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`
      );
      return;
    }

    // Vérifier le rôle de l'utilisateur
    const userRole = user?.publicMetadata?.role;

    if (userRole !== "farmer") {
      // Rediriger vers la page d'erreur d'autorisation
      router.push("/unauthorized");
      return;
    }

    // Si l'utilisateur est autorisé, afficher le contenu
    setAuthorized(true);
  }, [isLoaded, user, router]);

  // Afficher un état de chargement pendant la vérification
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Afficher le contenu protégé
  return <>{children}</>;
}

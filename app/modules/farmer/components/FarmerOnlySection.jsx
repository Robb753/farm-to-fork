"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function FarmerOnlySection({ children }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoaded) return;

      // Vérifier si l'utilisateur est connecté
      if (!user) {
        router.push("/sign-in");
        return;
      }

      // Vérifier le rôle de l'utilisateur
      const userRole = user.publicMetadata?.role;

      if (userRole === "farmer") {
        setIsAuthorized(true);
      } else {
        toast.error("Cette section est réservée aux agriculteurs");
        router.push("/");
      }

      setIsChecking(false);
    };

    checkAccess();
  }, [isLoaded, user, router]);

  // Afficher un indicateur de chargement pendant la vérification
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas autorisé, ne rien afficher (la redirection est déjà en cours)
  if (!isAuthorized) {
    return null;
  }

  // Afficher le contenu si l'utilisateur est un agriculteur
  return <>{children}</>;
}

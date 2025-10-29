"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import useUserRole from "@/components/hooks/useUserRole";
import { useClerk } from "@clerk/nextjs";

export default function FarmerOnlySection({ children }) {
  const { role, isFarmer, isAdmin, loading, user } = useUserRole();
  const { openSignIn, openSignUp } = useClerk();

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
        <div className="h-4 w-3/5 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-gray-700 mb-4">
          Connecte-toi pour accéder à cet espace producteur.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => openSignIn({ redirectUrl: "/dashboard/farms" })}
          >
            Se connecter
          </Button>
          <Button
            variant="outline"
            onClick={() => openSignUp({ redirectUrl: "/become-farmer" })}
          >
            Créer un compte
          </Button>
        </div>
      </div>
    );
  }

  if (!(isFarmer || isAdmin)) {
    return (
      <div className="rounded-xl border bg-amber-50 p-6">
        <p className="text-amber-900">
          Cet espace est réservé aux producteurs. Ton rôle actuel :{" "}
          <b>{role ?? "user"}</b>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

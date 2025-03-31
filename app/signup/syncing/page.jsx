// app/signup/syncing/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignupSyncingPage() {
  const { user } = useUser();
  const { session } = useClerk();
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;

      const role = user.publicMetadata?.role;
      console.log(`[SYNC] Tentative ${tries + 1} — Rôle actuel :`, role);

      if (role === "farmer") {
        console.log(
          "[SYNC] ✅ Rôle confirmé, redirection vers /dashboard/farms"
        );
        router.replace("/dashboard/farms");
      } else if (tries === 5) {
        console.warn("[SYNC] 🔄 Tentative de rechargement de la session...");
        window.location.reload(); // Force Clerk à recharger le user
      } else if (tries < 12) {
        setTimeout(() => {
          setTries((prev) => prev + 1);
        }, 1000);
      } else {
        console.warn(
          "[SYNC] ⏱ Timeout de synchronisation. Redirection fallback."
        );
        router.replace("/");
      }
    };

    checkRole();
  }, [tries, user]);


  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Finalisation de votre inscription...
        </h1>
        <p className="text-gray-500">
          Nous synchronisons votre profil avec nos serveurs...
        </p>
        <p className="text-sm text-gray-400">Tentative #{tries + 1}/10</p>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserRoleDirect as useUserRole } from "@/app/contexts/UserRoleTransitionProvider";

export default function SignupSyncingPage() {
  const router = useRouter();
  const { role, isReady, isFarmer, isUser } = useUserRole();
  const [tries, setTries] = useState(1);

  useEffect(() => {
    if (!isReady) return;

    if (isFarmer) {
      router.replace("/dashboard/farms");
    } else if (isUser) {
      router.replace("/");
    }
  }, [isReady, isFarmer, isUser, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTries((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto" />
        <h1 className="text-2xl font-semibold text-gray-800">
          Finalisation de votre inscription...
        </h1>
        <p className="text-gray-500">
          Nous synchronisons votre profil avec nos serveurs...
        </p>
        <p className="text-sm text-gray-400">Tentative #{tries}/10</p>
      </div>
    </main>
  );
}

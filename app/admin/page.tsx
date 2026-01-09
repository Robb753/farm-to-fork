// app/admin/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { COLORS } from "@/lib/config";
import { toast } from "sonner";

/**
 * Page admin principale
 *
 * Redirige automatiquement vers /admin/notifications si l'utilisateur est admin
 * Sinon, redirige vers l'accueil
 */
export default function AdminPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    const role = user?.publicMetadata?.role as string | undefined;

    if (!user) {
      toast.error("Vous devez être connecté");
      router.replace("/sign-in");
      return;
    }

    if (role === "admin") {
      // Rediriger vers le dashboard des notifications
      router.replace("/admin/notifications");
    } else {
      // Pas admin, rediriger vers l'accueil
      toast.error("Accès refusé : vous n'êtes pas administrateur");
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="h-12 w-12 animate-spin"
          style={{ color: COLORS.PRIMARY }}
        />
        <p style={{ color: COLORS.TEXT_SECONDARY }}>
          Vérification des accès administrateur...
        </p>
      </div>
    </div>
  );
}

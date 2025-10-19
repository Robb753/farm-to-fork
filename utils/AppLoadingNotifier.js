"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store/userStore";

export default function AppLoadingNotifier() {
  // On lit simplement le flag du store (garde le même nom que chez toi)
  const isWaitingForProfile = useUserStore((s) => s.isWaitingForProfile);

  const toastIdRef = useRef(null);

  useEffect(() => {
    if (isWaitingForProfile) {
      // évite d'empiler plusieurs toasts
      if (!toastIdRef.current) {
        toastIdRef.current = toast.loading("Chargement de votre profil…");
      }
    } else {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      } else {
        // au cas où un autre toast "loading" global serait affiché
        toast.dismiss();
      }
    }

    // cleanup si le composant se démonte pendant le chargement
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [isWaitingForProfile]);

  return null;
}

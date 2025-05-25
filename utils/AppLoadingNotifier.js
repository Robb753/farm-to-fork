"use client";


import { useUserRole } from "@/app/contexts/UserRoleContext";
import { useEffect } from "react";
import { toast } from "sonner";

export default function AppLoadingNotifier() {
  const { isWaitingForProfile } = useUserRole();

  useEffect(() => {
    if (isWaitingForProfile) {
      toast.loading("Chargement de votre profil...");
    } else {
      toast.dismiss(); // supprime le toast quand c’est prêt
    }
  }, [isWaitingForProfile]);

  return null;
}

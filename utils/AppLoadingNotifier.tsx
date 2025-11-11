"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store/userStore";

/**
 * Composant pour afficher les notifications de chargement de profil utilisateur
 * 
 * Features:
 * - Affiche un toast de chargement quand le profil utilisateur est en cours de synchronisation
 * - Évite les doublons de toasts avec une référence
 * - Cleanup automatique au démontage du composant
 * - Utilise le store utilisateur centralisé
 */
export default function AppLoadingNotifier(): null {
  // Lecture du flag de chargement depuis le store utilisateur
  const isWaitingForProfile = useUserStore((state) => state.isWaitingForProfile);

  // Référence pour stocker l'ID du toast et éviter les doublons
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (isWaitingForProfile) {
      // Évite d'empiler plusieurs toasts
      if (!toastIdRef.current) {
        toastIdRef.current = toast.loading("Chargement de votre profil…");
      }
    } else {
      // Ferme le toast de chargement si il existe
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      } else {
        // Au cas où un autre toast "loading" global serait affiché
        toast.dismiss();
      }
    }

    // Cleanup si le composant se démonte pendant le chargement
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [isWaitingForProfile]);

  // Ce composant ne rend rien visuellement
  return null;
}
// app/_components/ModalCloser.tsx

"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PATHS } from "@/lib/config";

export default function ModalCloser() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  // Fonction pour tenter de fermer les modals
  const closeModals = useCallback(() => {
    // Essayer de fermer via le bouton de fermeture
    const closeButtons = document.querySelectorAll(
      'button[aria-label="Fermer la fenêtre"]'
    );
    if (closeButtons.length > 0) {
      closeButtons.forEach((button) => (button as HTMLButtonElement).click());
    }

    // Si nous sommes sur la page signup-role, rediriger vers l'accueil
    if (pathname === "/signup-role" && isLoaded) {
      router.push(PATHS.HOME);
    }

    // Si un modal de sélection de rôle est présent et qu'on est connecté
    const roleModal = document.querySelector('div[role="dialog"]');
    if (roleModal && isSignedIn) {
      // Essayer de simuler un clic en dehors du modal pour le fermer
      const backdrop = document.querySelector(".fixed.inset-0.z-50");
      if (backdrop) {
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        backdrop.dispatchEvent(clickEvent);
      }

      // Si toujours présent, forcer la redirection
      setTimeout(() => {
        if (document.querySelector('div[role="dialog"]')) {
          router.push(PATHS.HOME);
        }
      }, 500);
    }
  }, [pathname, router, isSignedIn, isLoaded]);

  useEffect(() => {
    // Exécuter immédiatement
    closeModals();

    // Et aussi après un court délai pour les modaux qui pourraient s'afficher après le chargement initial
    const timeout = setTimeout(() => {
      closeModals();
    }, 1000);

    // Configurer un observateur de mutations pour détecter l'apparition de nouveaux modals
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              (node as Element).querySelector &&
              (node as Element).querySelector('div[role="dialog"]')
            ) {
              closeModals();
            }
          });
        }
      });
    });

    // Observer les changements dans le body
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [closeModals]);

  // Ce composant n'affiche rien
  return null;
}
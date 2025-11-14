// FilterSection/hooks/useMobileDetection.ts

import { useState, useEffect, useCallback } from "react";
import { BREAKPOINTS, DEBOUNCE_DELAYS } from "../utils/constants";

/**
 * Hook pour la détection mobile optimisée
 *
 * Features:
 * - ✅ Détection responsive fiable
 * - ✅ Debounced resize pour les performances
 * - ✅ SSR safe (évite hydration mismatch)
 * - ✅ Cleanup automatique des event listeners
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ═══ Fonction de vérification mobile ═══
  const checkMobile = useCallback(() => {
    const width = window.innerWidth;
    setIsMobile(width <= BREAKPOINTS.MOBILE);
  }, []);

  // ═══ Debounced resize handler ═══
  const debouncedResize = useCallback(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, DEBOUNCE_DELAYS.RESIZE);
    };
  }, [checkMobile]);

  // ═══ Setup initial et event listeners ═══
  useEffect(() => {
    if (typeof window === "undefined") return;

    setMounted(true);
    checkMobile();

    const handleResize = debouncedResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [checkMobile, debouncedResize]);

  return {
    isMobile,
    mounted,
    isTablet:
      mounted &&
      window.innerWidth <= BREAKPOINTS.TABLET &&
      window.innerWidth > BREAKPOINTS.MOBILE,
    isDesktop: mounted && window.innerWidth > BREAKPOINTS.TABLET,
  };
}

/**
 * Hook pour la détection MediaQuery spécifique
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook pour orientation (portrait/landscape)
 */
export function useOrientation() {
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const isLandscape = useMediaQuery("(orientation: landscape)");

  return {
    isPortrait,
    isLandscape,
  };
}

/**
 * Hook pour les preferences utilisateur
 */
export function useUserPreferences() {
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)"
  );
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const prefersHighContrast = useMediaQuery("(prefers-contrast: high)");

  return {
    prefersReducedMotion,
    prefersDarkMode,
    prefersHighContrast,
  };
}

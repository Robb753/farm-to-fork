"use client";

import { useMemo, useSyncExternalStore } from "react";
import { BREAKPOINTS, DEBOUNCE_DELAYS } from "../utils/constants";

/**
 * ✅ External store: window.innerWidth (SSR-safe)
 * - Pas de setState dans useEffect
 * - Debounce du notify
 */
function subscribeWindowWidth(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const handler = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      onStoreChange();
    }, DEBOUNCE_DELAYS.RESIZE);
  };

  window.addEventListener("resize", handler, { passive: true });

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    window.removeEventListener("resize", handler);
  };
}

function getWindowWidthSnapshot(): number {
  return typeof window === "undefined" ? 0 : window.innerWidth;
}

function getWindowWidthServerSnapshot(): number {
  return 0;
}

/**
 * Hook pour la détection mobile optimisée (Compiler-friendly)
 */
export function useMobileDetection(): {
  mounted: boolean;
  width?: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  const width = useSyncExternalStore(
    subscribeWindowWidth,
    getWindowWidthSnapshot,
    getWindowWidthServerSnapshot
  );

  const mounted = width !== 0;

  const isMobile = mounted && width <= BREAKPOINTS.MOBILE;
  const isTablet =
    mounted && width <= BREAKPOINTS.TABLET && width > BREAKPOINTS.MOBILE;
  const isDesktop = mounted && width > BREAKPOINTS.TABLET;

  return useMemo(
    () => ({
      mounted,
      width: mounted ? width : undefined,
      isMobile,
      isTablet,
      isDesktop,
    }),
    [mounted, width, isMobile, isTablet, isDesktop]
  );
}

/**
 * ✅ External store: matchMedia(query) (SSR-safe)
 * - Pas de setState dans useEffect
 *
 * On gère:
 * - API moderne: addEventListener/removeEventListener
 * - API legacy: addListener/removeListener (anciens Safari/WebViews)
 */
type MediaQueryListLegacy = MediaQueryList & {
  addListener?: (
    listener: (this: MediaQueryList, ev: MediaQueryListEvent) => any
  ) => void;
  removeListener?: (
    listener: (this: MediaQueryList, ev: MediaQueryListEvent) => any
  ) => void;
};

function subscribeMediaQuery(
  query: string,
  onStoreChange: () => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const mql = window.matchMedia(query) as MediaQueryListLegacy;
  const handler = () => onStoreChange();

  // ✅ API moderne
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", handler);
    return () => {
      mql.removeEventListener("change", handler);
    };
  }

  // ✅ Fallback legacy
  if (typeof mql.addListener === "function") {
    mql.addListener(handler);
    return () => {
      mql.removeListener?.(handler);
    };
  }

  // ✅ Ultra fallback: pas d'abonnement possible
  return () => {};
}

function getMediaQuerySnapshot(query: string): boolean {
  return typeof window === "undefined"
    ? false
    : window.matchMedia(query).matches;
}

function getMediaQueryServerSnapshot(): boolean {
  return false;
}

/**
 * Hook pour la détection MediaQuery spécifique
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query),
    getMediaQueryServerSnapshot
  );
}

/**
 * Hook pour orientation (portrait/landscape)
 */
export function useOrientation(): {
  isPortrait: boolean;
  isLandscape: boolean;
} {
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const isLandscape = useMediaQuery("(orientation: landscape)");

  return useMemo(
    () => ({ isPortrait, isLandscape }),
    [isPortrait, isLandscape]
  );
}

/**
 * Hook pour les preferences utilisateur
 */
export function useUserPreferences(): {
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
  prefersHighContrast: boolean;
} {
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)"
  );
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const prefersHighContrast = useMediaQuery("(prefers-contrast: high)");

  return useMemo(
    () => ({ prefersReducedMotion, prefersDarkMode, prefersHighContrast }),
    [prefersReducedMotion, prefersDarkMode, prefersHighContrast]
  );
}

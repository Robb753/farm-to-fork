// lib/hooks/useIsClient.ts
"use client";

import { useSyncExternalStore } from "react";

function subscribe(_: () => void) {
  // Pas d'abonnement réel, mais l'API l'exige
  return () => {};
}

export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true, // snapshot côté client
    () => false // snapshot côté serveur
  );
}

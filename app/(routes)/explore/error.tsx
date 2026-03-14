"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for the /explore route (map + listings).
 * Shown when the map or listing data fails to load.
 */
export default function ExploreError({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    console.error("[ExploreError]", error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-120px)] items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-5xl">🗺️</div>
        <h2 className="text-xl font-semibold text-gray-900">
          Impossible de charger la carte
        </h2>
        <p className="text-gray-600 text-sm">
          Une erreur est survenue lors du chargement de la carte ou des producteurs.
          Vérifiez votre connexion et réessayez.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

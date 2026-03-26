"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for /farm/[id] pages.
 * Shown when farm data fails to load or a tab throws.
 */
export default function FarmError({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    console.error("[FarmError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 px-4">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="text-5xl">🌾</div>
        <h2 className="text-xl font-semibold text-gray-900">
          Impossible de charger cette fiche
        </h2>
        <p className="text-gray-600 text-sm">
          Les informations de cette ferme n'ont pas pu être récupérées.
          Réessayez ou explorez d'autres producteurs.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Réessayer
          </button>
          <Link
            href="/explore"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Explorer la carte
          </Link>
        </div>
      </div>
    </div>
  );
}

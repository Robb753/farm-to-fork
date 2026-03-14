"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary — catches any unhandled error in the app shell.
 * Must be a Client Component (Next.js requirement).
 */
export default function GlobalError({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    // Log to error monitoring service (e.g. Sentry) if configured
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900">
          Une erreur est survenue
        </h1>
        <p className="text-gray-600">
          Une erreur inattendue s'est produite. Veuillez réessayer ou retourner à l'accueil.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left text-xs bg-red-50 border border-red-200 rounded p-3 overflow-auto max-h-40 text-red-700">
            {error.message}
          </pre>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

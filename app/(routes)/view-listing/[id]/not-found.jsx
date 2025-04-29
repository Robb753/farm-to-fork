// app/(routes)/view-listing/[id]/not-found.jsx
"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="bg-red-100 border border-red-300 rounded-lg p-6 max-w-md">
        <h2 className="text-xl font-semibold text-red-700 mb-3">
          Ferme introuvable
        </h2>
        <p className="text-gray-700 mb-4">
          Désolé, cette ferme n'existe pas ou n'est pas disponible.
        </p>
        <Link
          href="/explore"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Retourner à la carte
        </Link>
      </div>
    </div>
  );
}

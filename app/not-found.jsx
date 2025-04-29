"use client";

import Link from "next/link";
import { Ghost } from "lucide-react";
import React from "react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
      {/* Icône fantôme */}
      <Ghost className="w-24 h-24 text-green-700 mb-6 md:mb-8" />

      {/* Titre principal */}
      <h1 className="text-3xl md:text-5xl font-bold text-green-700 mb-4 text-center">
        Oups, page introuvable !
      </h1>

      {/* Sous-titre */}
      <p className="text-gray-600 text-md md:text-lg mb-8 text-center max-w-md">
        Il semble que vous soyez perdu entre les fermes 🌾.
        <br />
        Pas de souci, nous allons vous remettre sur le bon chemin.
      </p>

      {/* Bouton retour */}
      <Link
        href="/"
        className="bg-green-700 hover:bg-green-800 transition text-white text-sm md:text-lg px-6 py-3 rounded-full"
      >
        Revenir à l'accueil
      </Link>
    </div>
  );
}

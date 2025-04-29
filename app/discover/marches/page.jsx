"use client";

import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function MarchesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Fil d'Ariane (visible seulement sur md+) */}
      <div className="hidden md:block">
        <Breadcrumb />
      </div>

      {/* Carte principale */}
      <div className="bg-blue-50 p-8 rounded-2xl shadow-md">
        <h1 className="text-4xl font-bold text-blue-700 mb-6 text-center">
          Les Marchés
        </h1>

        <p className="text-lg text-gray-700 text-center mb-8 max-w-2xl mx-auto">
          Retrouvez les marchés partenaires pour acheter directement aux
          producteurs locaux, découvrir les spécialités régionales et soutenir
          l'économie de proximité.
        </p>

        <div className="flex justify-center">
          <div className="bg-white p-6 rounded-xl shadow-inner max-w-xl">
            <p className="text-center text-gray-500">
              🛒 La carte des marchés sera disponible bientôt !
              <br />
              Explorez prochainement les meilleurs marchés autour de vous.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function ProduitsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Fil d'Ariane (visible seulement sur md+) */}
      <div className="hidden md:block">
        <Breadcrumb />
      </div>

      {/* Carte principale */}
      <div className="bg-yellow-50 p-8 rounded-2xl shadow-md">
        <h1 className="text-4xl font-bold text-yellow-700 mb-6 text-center">
          Nos Produits
        </h1>

        <p className="text-lg text-gray-700 text-center mb-8 max-w-2xl mx-auto">
          Fruits, légumes, viandes, produits laitiers, et bien plus encore. Farm
          To Fork sélectionne pour vous les meilleurs produits fermiers issus de
          circuits courts.
        </p>

        <div className="flex justify-center">
          <div className="bg-white p-6 rounded-xl shadow-inner max-w-xl">
            <p className="text-center text-gray-500">
              🥕 La sélection de produits sera disponible prochainement !
              <br />
              Retrouvez bientôt vos producteurs locaux et leurs spécialités.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

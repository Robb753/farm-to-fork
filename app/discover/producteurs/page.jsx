"use client";

import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function ProducteursPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Fil d'Ariane (visible seulement sur md+) */}
      <div className="hidden md:block">
        <Breadcrumb />
      </div>

      {/* Carte principale */}
      <div className="bg-green-50 p-8 rounded-2xl shadow-md">
        <h1 className="text-4xl font-bold text-green-700 mb-6 text-center">
          Les Producteurs
        </h1>

        <p className="text-lg text-gray-700 text-center mb-8 max-w-2xl mx-auto">
          Découvrez les fermes et producteurs partenaires à travers la France et
          l'Europe. Chaque producteur propose des produits authentiques, issus
          d'un savoir-faire local.
        </p>

        <div className="flex justify-center">
          <div className="bg-white p-6 rounded-xl shadow-inner max-w-xl">
            <p className="text-center text-gray-500">
              🚜 La liste des producteurs arrive bientôt !
              <br />
              Restez connectés pour explorer nos premières fermes partenaires.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

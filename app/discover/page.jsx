"use client";

import Link from "next/link";
import { Wheat, ShoppingBasket, MapPinned } from "@/utils/icons";
import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function DiscoverLandingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Fil d'Ariane */}
      <Breadcrumb />

      {/* Titre principal */}
      <h1 className="text-4xl font-bold text-center mb-12">
        Découvrir les Saveurs Locales
      </h1>

      {/* Cartes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Producteurs */}
        <Link href="/discover/producteurs" className="group">
          <div className="bg-green-50 p-8 rounded-2xl shadow-md hover:shadow-lg hover:translate-y-1 transition flex flex-col items-center text-center cursor-pointer">
            <Wheat className="h-12 w-12 text-green-700 mb-4 group-hover:scale-110 transition" />
            <h2 className="text-2xl font-semibold text-green-700 mb-2">
              Producteurs
            </h2>
            <p className="text-gray-600">
              Rencontrez les producteurs locaux engagés dans une agriculture
              authentique.
            </p>
          </div>
        </Link>

        {/* Produits */}
        <Link href="/discover/produits" className="group">
          <div className="bg-yellow-50 p-8 rounded-2xl shadow-md hover:shadow-lg hover:translate-y-1 transition flex flex-col items-center text-center cursor-pointer">
            <ShoppingBasket className="h-12 w-12 text-yellow-600 mb-4 group-hover:scale-110 transition" />
            <h2 className="text-2xl font-semibold text-yellow-600 mb-2">
              Produits
            </h2>
            <p className="text-gray-600">
              Découvrez une sélection de produits fermiers issus des circuits
              courts.
            </p>
          </div>
        </Link>

        {/* Marchés */}
        <Link href="/discover/marches" className="group">
          <div className="bg-blue-50 p-8 rounded-2xl shadow-md hover:shadow-lg hover:translate-y-1 transition flex flex-col items-center text-center cursor-pointer">
            <MapPinned className="h-12 w-12 text-blue-600 mb-4 group-hover:scale-110 transition" />
            <h2 className="text-2xl font-semibold text-blue-600 mb-2">
              Marchés
            </h2>
            <p className="text-gray-600">
              Parcourez les marchés partenaires pour acheter en direct et
              soutenir le local.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

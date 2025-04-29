"use client";

import Link from "next/link";
import { Target, Handshake, Leaf } from "lucide-react";
import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function AboutLandingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Fil d'Ariane */}
      <Breadcrumb />

      {/* Titre principal */}
      <h1 className="text-4xl font-bold text-center mb-12">
        À Propos de Farm To Fork
      </h1>

      {/* Cartes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Missions */}
        <Link href="/about/missions" className="group">
          <div className="bg-green-50 p-8 rounded-2xl shadow-md hover:shadow-lg hover:translate-y-1 transition flex flex-col items-center text-center cursor-pointer">
            <Target className="h-12 w-12 text-green-700 mb-4 group-hover:scale-110 transition" />
            <h2 className="text-2xl font-semibold text-green-700 mb-2">
              Notre Mission
            </h2>
            <p className="text-gray-600">
              Découvrez pourquoi nous avons créé Farm To Fork et ce que nous
              défendons.
            </p>
          </div>
        </Link>

        {/* Comment ça marche */}
        <Link href="/about/how" className="group">
          <div className="bg-yellow-50 p-8 rounded-2xl shadow-md hover:shadow-lg hover:translate-y-1 transition flex flex-col items-center text-center cursor-pointer">
            <Handshake className="h-12 w-12 text-yellow-600 mb-4 group-hover:scale-110 transition" />
            <h2 className="text-2xl font-semibold text-yellow-600 mb-2">
              Comment ça marche
            </h2>
            <p className="text-gray-600">
              Comprenez comment la plateforme relie producteurs et
              consommateurs.
            </p>
          </div>
        </Link>

        {/* Durabilité */}
        <Link href="/about/durability" className="group">
          <div className="bg-blue-50 p-8 rounded-2xl shadow-md hover:shadow-lg hover:translate-y-1 transition flex flex-col items-center text-center cursor-pointer">
            <Leaf className="h-12 w-12 text-blue-600 mb-4 group-hover:scale-110 transition" />
            <h2 className="text-2xl font-semibold text-blue-600 mb-2">
              Durabilité
            </h2>
            <p className="text-gray-600">
              Notre engagement pour un modèle alimentaire local et responsable.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

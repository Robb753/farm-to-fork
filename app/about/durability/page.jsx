"use client";

import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function Durability() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Fil d'Ariane */}
      <Breadcrumb />

      {/* Titre principal */}
      <h1 className="text-4xl font-bold mb-12 text-center">
        Notre Vision de la Durabilité
      </h1>

      {/* Introduction */}
      <p className="text-lg mb-12 text-center max-w-2xl mx-auto text-gray-700">
        Farm to Fork facilite l'accès direct aux producteurs locaux grâce à des
        outils modernes, pour simplifier les échanges et valoriser l'offre
        locale.
      </p>

      {/* Cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Card 1 */}
        <div className="bg-green-50 p-6 rounded-2xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-4">
            📍 Mieux connecter producteurs et consommateurs
          </h2>
          <p className="text-gray-700">
            Farm to Fork rend visible l'offre locale et facilite la découverte
            de producteurs proches, tout en simplifiant les achats en direct.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-yellow-50 p-6 rounded-2xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-4">
            🛒 Accès rapide aux circuits courts
          </h2>
          <p className="text-gray-700">
            Les utilisateurs trouvent facilement des produits locaux grâce à des
            filtres clairs et une carte interactive, sans intermédiaires
            compliqués.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-blue-50 p-6 rounded-2xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-4">
            📊 Outils simples pour les producteurs
          </h2>
          <p className="text-gray-700">
            Chaque ferme dispose d'un espace pour présenter ses produits,
            actualiser ses informations et se rendre accessible auprès de
            nouveaux clients.
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-purple-50 p-6 rounded-2xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-4">🔧 Un projet évolutif</h2>
          <p className="text-gray-700">
            Farm to Fork s'adapte aux besoins des producteurs et des
            utilisateurs, pour construire des solutions pratiques, simples et
            durables dans le temps.
          </p>
        </div>
      </div>

      {/* Conclusion */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-lg text-gray-700">
          Une approche directe et concrète pour soutenir l'économie locale.
        </p>
      </div>
    </div>
  );
}

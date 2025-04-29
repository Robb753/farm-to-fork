"use client";

import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function Missions() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Fil d'Ariane */}
      <Breadcrumb />

      {/* Titre principal */}
      <h1 className="text-4xl font-bold mb-12 text-center">Nos Missions</h1>

      {/* Introduction */}
      <p className="text-lg mb-12 text-center max-w-2xl mx-auto text-gray-700">
        Chez <strong>Farm to Fork</strong>, notre mission est simple : <br />
        <em>
          Reconnecter producteurs et consommateurs avec des outils modernes et
          accessibles.
        </em>
      </p>

      {/* Cartes de missions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Card 1 */}
        <div className="bg-green-50 p-6 rounded-2xl shadow hover:shadow-lg hover:translate-y-1 transition">
          <h2 className="text-xl font-bold mb-4">
            🌱 Redonner de la visibilité aux producteurs
          </h2>
          <p className="text-gray-700 mb-4">
            Trop de fermes restent invisibles, faute d'outils numériques
            adaptés.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Une page dédiée, simple à créer</li>
            <li>Une carte interactive pour se faire découvrir</li>
            <li>Un espace pour présenter produits et savoir-faire</li>
          </ul>
        </div>

        {/* Card 2 */}
        <div className="bg-yellow-50 p-6 rounded-2xl shadow hover:shadow-lg hover:translate-y-1 transition">
          <h2 className="text-xl font-bold mb-4">
            🛒 Faciliter l'accès aux circuits courts
          </h2>
          <p className="text-gray-700 mb-4">
            Le circuit court doit être accessible à tous grâce à Farm to Fork.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Trouver des producteurs proches</li>
            <li>Filtrer par type de produit et distribution</li>
            <li>Accéder à des initiatives locales durables</li>
          </ul>
        </div>

        {/* Card 3 */}
        <div className="bg-blue-50 p-6 rounded-2xl shadow hover:shadow-lg hover:translate-y-1 transition">
          <h2 className="text-xl font-bold mb-4">
            🌾 Soutenir l'autonomie économique des fermes
          </h2>
          <p className="text-gray-700 mb-4">
            Aider les producteurs à trouver de nouveaux leviers d'indépendance.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Mise en avant de projets à soutenir</li>
            <li>Financement participatif et tokenisation</li>
            <li>Communautés engagées autour des fermes</li>
          </ul>
        </div>
      </div>

      {/* Conclusion */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">
          🌍 Un projet humain, durable et ambitieux
        </h2>
        <p className="text-lg text-gray-700">
          Chaque ferme compte. Chaque geste d'achat local compte. Farm to Fork
          est une invitation à construire ensemble un modèle alimentaire plus
          juste, plus humain et plus durable.
        </p>
      </div>
    </div>
  );
}

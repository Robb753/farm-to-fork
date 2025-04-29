"use client";

import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";

export default function How() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Fil d'Ariane */}
      <Breadcrumb />

      {/* Titre principal */}
      <h1 className="text-4xl font-bold mb-12 text-center">
        Comment fonctionne Farm to Fork
      </h1>

      {/* Introduction */}
      <p className="text-lg mb-12 text-center max-w-2xl mx-auto text-gray-700">
        Farm to Fork est une plateforme simple, construite autour d'une idée
        forte :{" "}
        <em>
          mettre en relation directe producteurs locaux et consommateurs engagés
        </em>
        .
      </p>

      {/* Cartes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Card 1 */}
        <div className="bg-green-50 p-6 rounded-2xl shadow hover:shadow-lg hover:translate-y-1 transition">
          <h2 className="text-xl font-bold mb-4">🌱 Pour les Producteurs</h2>
          <p className="text-gray-700 mb-4">
            Chaque ferme peut créer un compte gratuit et obtenir :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Un profil personnalisé (photos, présentation, produits)</li>
            <li>Indiquer ses points de vente : ferme, marchés, AMAP</li>
            <li>
              Accès au tableau de bord pour mettre à jour ses informations
            </li>
          </ul>
        </div>

        {/* Card 2 */}
        <div className="bg-yellow-50 p-6 rounded-2xl shadow hover:shadow-lg hover:translate-y-1 transition">
          <h2 className="text-xl font-bold mb-4">🌍 Pour les Consommateurs</h2>
          <p className="text-gray-700 mb-4">Tout visiteur peut :</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Explorer une carte interactive des fermes proches</li>
            <li>Filtrer par type de produits ou mode de distribution</li>
            <li>Ajouter ses fermes préférées en favoris</li>
            <li>
              Contacter directement les producteurs pour acheter en circuit
              court
            </li>
          </ul>
        </div>

        {/* Card 3 */}
        <div className="bg-blue-50 p-6 rounded-2xl shadow hover:shadow-lg hover:translate-y-1 transition">
          <h2 className="text-xl font-bold mb-4">✨ Fonctionnalités à venir</h2>
          <p className="text-gray-700 mb-4">
            Farm to Fork évolue en continu. Prochainement :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>
              Financement participatif pour soutenir les projets agricoles
            </li>
            <li>
              Badges de durabilité pour valoriser les pratiques écologiques
            </li>
            <li>
              Statistiques pour aider les fermes à mieux connaître leur audience
            </li>
          </ul>
        </div>
      </div>

      {/* Conclusion */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-lg text-gray-700">
          Farm to Fork est un projet vivant : votre retour compte pour
          construire ensemble un réseau alimentaire local plus solide et
          durable.
        </p>
      </div>
    </div>
  );
}

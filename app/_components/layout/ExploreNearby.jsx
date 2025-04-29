"use client";

import { useLanguage } from "@/app/contexts/Language-context";
import Link from "next/link"; // <-- Pour mettre des liens
import React from "react";

function ExploreNearby() {
  const { t } = useLanguage();

  const cards = [
    {
      title: t("Marchés"),
      description: t(
        "Découvrez les marchés et les événements saisonniers près de chez vous."
      ),
      badge: t("Featured"),
      badgeColor: "text-teal-600",
      link: "/discover/marches", // ✅ lien vers marchés
    },
    {
      title: t("Produits"),
      description: t(
        "Les meilleurs produits de votre région, directement du producteur."
      ),
      badge: t("Popular"),
      badgeColor: "text-rose-600",
      link: "/discover/produits", // ✅ lien vers produits
    },
    {
      title: t("Agriculteurs"),
      description: t(
        "Rencontrez les agriculteurs passionnés près de chez vous."
      ),
      badge: t("Nouveau"),
      badgeColor: "text-amber-600",
      link: "/discover/producteurs", // ✅ lien vers producteurs
    },
    {
      title: t("Ateliers & Dégustations"),
      description: t(
        "Participez à des ateliers culinaires et des dégustations de produits locaux."
      ),
      badge: t("Événements"),
      badgeColor: "text-indigo-600",
      link: "/events", // ✅ temporairement, je propose de pointer vers /explore (future page événements)
    },
  ];

  return (
    <section className="px-4 py-16 md:px-8 max-w-7xl mx-auto">
      <h2 className="text-4xl font-serif font-bold text-gray-900 mb-6 relative inline-block">
        {t("explore")}
        <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-teal-400 rounded-full"></div>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
        {cards.map((card, index) => (
          <ExploreCard key={index} {...card} t={t} />
        ))}
      </div>
    </section>
  );
}

function ExploreCard({ title, description, badge, badgeColor, link, t }) {
  return (
    <Link href={link} className="group">
      <div className="relative overflow-hidden rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-[#F9F7F1] to-[#EAEAEA] h-72 flex flex-col justify-between p-6 md:p-8">
        {/* Badge en haut */}
        <div className="absolute top-2 left-4 px-3 py-1 text-xs font-semibold text-white rounded-full shadow-md uppercase tracking-wide select-none bg-white bg-opacity-10">
          <span className={`${badgeColor}`}>{badge}</span>
        </div>

        {/* Contenu principal */}
        <div>
          <h3 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2 mt-4">
            {title}
          </h3>
          <p className="text-gray-700 text-sm md:text-base">{description}</p>
        </div>

        {/* Bouton Discover aligné en bas */}
        <div className="mt-auto px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-sm transition-colors flex items-center justify-center gap-2 text-sm group-hover:gap-3 duration-300">
          {t("discover")}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default ExploreNearby;

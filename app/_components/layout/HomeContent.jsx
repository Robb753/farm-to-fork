// app/HomeContent.jsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import ExploreNearby from "./ExploreNearby";
import EuropeanFeatures from "./EuropeanFeatures";
import { useTranslation } from "@/lib/store/settingsStore";

const MapboxCitySearch = dynamic(
  () => import("@/app/modules/maps/components/shared/MapboxCitySearch"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg bg-white max-w-lg w-full">
        <div className="w-5 h-5 bg-gray-200 rounded mr-3 animate-pulse" />
        <div className="flex-grow h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    ),
  }
);

function HomeContent() {
  const t = useTranslation();

  return (
    <div>
      {/* Hero Section avec barre de recherche */}
      <div className="relative h-[420px] md:h-[540px] rounded-xl">

        {/* Vidéo en fond */}
        <video
          src="/856065-hd_1920_1080_30fps.mp4"
          poster="/hero-poster.jpg" // optionnel mais conseillé
          preload="metadata"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
        />

        {/* Overlay au-dessus de la vidéo */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50 z-10 rounded-xl" />

        {/* Contenu au-dessus de l’overlay */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-5 tracking-wide drop-shadow-lg">
            {t("welcome")}
          </h1>
          <p className="text-lg md:text-2xl max-w-3xl font-light leading-relaxed drop-shadow-md mb-5">
            {t("connect")}
          </p>

          {/* Champ + suggestions au-dessus de tout (header inclus) */}
          <div className="w-full max-w-lg relative z-[400]">
            <MapboxCitySearch
              variant="hero"
              placeholder="Entrez une ville pour explorer…"
            />
          </div>
        </div>
      </div>

      <ExploreNearby />
      <EuropeanFeatures />
    </div>
  );
}

export default HomeContent;

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import ExploreNearby from "./ExploreNearby";
import EuropeanFeatures from "./EuropeanFeatures";
// ✅ Nouvel import Zustand
import { useMapActions } from "@/lib/store/mapListingsStore";
import MapboxCitySearch from "@/app/modules/maps/components/shared/MapboxCitySearch";
import { useTranslation } from "@/lib/store/settingsStore";

function HomeContent() {
  // ✅ Hook Zustand remplace l'ancien contexte
  const { setCoordinates } = useMapActions();
  const t = useTranslation();
  const router = useRouter();

  const handleCitySelect = (cityData) => {
    // MapboxCitySearch retourne { coordinates: [lng, lat], ... }
    if (!cityData?.coordinates) return;

    const [lng, lat] = cityData.coordinates;
    setCoordinates({ lat, lng });
  };

  return (
    <div>
      {/* Hero Section avec barre de recherche */}
      <div className="relative h-[450px] md:h-[550px]">
        <Toaster richColors />
        <video
          src={"/856065-hd_1920_1080_30fps.mp4"}
          autoPlay
          loop
          playsInline
          muted
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 tracking-wide drop-shadow-lg">
            {t("welcome")}
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl font-light leading-relaxed drop-shadow-md mb-6">
            {t("connect")}
          </p>
          <div className="w-full max-w-lg">
            <MapboxCitySearch
              onCitySelect={handleCitySelect}
              placeholder="Entrez une ville pour explorer..."
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

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import ExploreNearby from "./ExploreNearby";
import EuropeanFeatures from "./EuropeanFeatures";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";
import CitySearch from "@/app/modules/maps/components/shared/CitySearch";
import { useTranslation } from "@/lib/store/settingsStore";

function HomeContent() {
  const { setCoordinates } = useMapState();
  const t = useTranslation();
  const router = useRouter();

  const handleCitySelect = (cityData) => {
    if (!cityData?.value?.geometry) return;

    const lat = cityData.value.geometry.location.lat();
    const lng = cityData.value.geometry.location.lng();

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
            <CitySearch
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
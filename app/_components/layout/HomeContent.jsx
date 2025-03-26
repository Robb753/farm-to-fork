"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import GoogleAddressSearchForHeader from "../../modules/maps/components/GoogleAddressSearchForHeader";
import ExploreNearby from "./ExploreNearby";
import EuropeanFeatures from "./EuropeanFeatures";
import { useCoordinates } from "@/app/contexts/CoordinateContext";
import { useLanguage } from "@/app/contexts/Language-context";

function HomeContent() {
  const { setCoordinates } = useCoordinates();
  const { t } = useLanguage(); // ✅ Utilisation du hook de traduction
  const router = useRouter(); // ✅ Ajout du routeur Next.js

  // ✅ Gestion de la sélection d'une ville
  const handleCitySelect = (v) => {
    const lat = v?.value?.geometry?.location?.lat() || 0;
    const lng = v?.value?.geometry?.location?.lng() || 0;

    // ✅ Mettre à jour les coordonnées globales
    setCoordinates({ lat, lng });

    // ✅ Redirection vers la page Explore
    router.push(`/explore?lat=${lat}&lng=${lng}`);
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
          <div className="w-full max-w-lg bg-white shadow-md rounded-full px-4 py-2 flex items-center">
            {/* ✅ Utilisation de `handleCitySelect` pour la redirection */}
            <GoogleAddressSearchForHeader selectedAddress={handleCitySelect} />
          </div>
        </div>
      </div>

      {/* Sections modifiées */}
      <ExploreNearby />
      <EuropeanFeatures />
    </div>
  );
}

export default HomeContent;

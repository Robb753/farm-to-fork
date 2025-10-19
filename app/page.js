"use client";

import { useState, useEffect } from "react";
// ✅ Plus besoin d'importer MapDataProvider, on utilise directement Zustand
import Explore from "./_components/layout/Explore";
import HomeContent from "./_components/layout/HomeContent";
// ✅ Hook pour initialiser l'API Google Maps
import { useMapActions } from "@/lib/store/mapListingsStore";

export default function Home() {
  const [viewMap, setViewMap] = useState(false);

  // ✅ Actions Zustand pour initialiser la carte
  const { setApiLoaded, setApiLoading } = useMapActions();

  // ✅ Initialisation de l'API Google Maps avec Zustand
  useEffect(() => {
    const initializeGoogleMapsAPI = async () => {
      // Vérifier si l'API est déjà chargée
      if (window.google?.maps) {
        setApiLoaded(true);
        return;
      }

      try {
        setApiLoading(true);

        // Charger l'API Google Maps si pas encore fait
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker&language=fr&region=FR`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          setApiLoaded(true);
          setApiLoading(false);
        };

        script.onerror = () => {
          console.error("Erreur lors du chargement de l'API Google Maps");
          setApiLoading(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error("Erreur lors de l'initialisation de Google Maps:", error);
        setApiLoading(false);
      }
    };

    initializeGoogleMapsAPI();
  }, [setApiLoaded, setApiLoading]);

  const handleViewMap = () => {
    setViewMap(true);
  };

  return (
    <div>
      {/* ✅ Plus de MapDataProvider nécessaire - Zustand est global */}
      {viewMap ? <Explore /> : <HomeContent onViewMap={handleViewMap} />}
    </div>
  );
}

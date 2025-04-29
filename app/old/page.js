"use client";
import { useState } from "react";
import { MapStateProvider } from "@/app/contexts/MapDataContext/MapStateContext";
import Explore from "./_components/layout/Explore";
import HomeContent from "./_components/layout/HomeContent";

export default function Home() {
  const [viewMap, setViewMap] = useState(false);

  const handleViewMap = () => {
    setViewMap(true);
  };

  // Envelopper le contenu avec MapStateProvider
  return (
    <MapStateProvider>
      <div>
        {viewMap ? <Explore /> : <HomeContent onViewMap={handleViewMap} />}
      </div>
    </MapStateProvider>
  );
}

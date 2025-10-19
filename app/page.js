"use client";

import { useState } from "react";
import { MapDataProvider } from "@/app/contexts/MapDataContext/MapDataProvider";
import Explore from "./_components/layout/Explore";
import HomeContent from "./_components/layout/HomeContent";
import { DebugStore } from "./_components/DebugStore";

export default function Home() {
  const [viewMap, setViewMap] = useState(false);

  const handleViewMap = () => {
    setViewMap(true);
  };

  return (
    <MapDataProvider>
      <div>
        {viewMap ? <Explore /> : <HomeContent onViewMap={handleViewMap} />}
      </div>

      {/* 🐛 DEBUG PANEL - À ENLEVER AVANT PRODUCTION */}
      <DebugStore />
    </MapDataProvider>
  );
}

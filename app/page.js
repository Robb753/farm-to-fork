"use client";

import { useState } from "react";
import { MapDataProvider } from "@/app/contexts/MapDataContext/MapDataProvider";
import Explore from "./_components/layout/Explore";
import HomeContent from "./_components/layout/HomeContent";

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
    </MapDataProvider>
  );
}

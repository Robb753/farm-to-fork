"use client";

import { useState } from "react";
import Explore from "./_components/layout/Explore";
import HomeContent from "./_components/layout/HomeContent";

export default function Home() {
  const [viewMap, setViewMap] = useState(false);

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

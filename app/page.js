"use client"
import { useState } from "react";
import HomeContent from "./_components/HomeContent";
import ListingMapView from "./_components/ListingMapView";

export default function Home() {
  const [viewMap, setViewMap] = useState(false);

  const handleViewMap = () => {
    setViewMap(true);
  };

  return (
    <div className="p-4">
      {viewMap ? (
        <ListingMapView typeferme="Productor" />
      ) : (
        <HomeContent onViewMap={handleViewMap} />
      )}
      
    </div>
    
  );
}

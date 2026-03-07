"use client";

import dynamic from "next/dynamic";

const MapboxSection = dynamic(() => import("./MapboxSection"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-600">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

export default MapboxSection;

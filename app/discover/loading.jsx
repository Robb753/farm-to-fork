"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      {/* Spinner */}
      <div className="animate-spin ease-linear rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-8"></div>

      {/* Texte de chargement */}
      <p className="text-gray-500 text-lg animate-pulse">
        Chargement en cours...
      </p>
    </div>
  );
}

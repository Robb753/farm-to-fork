"use client";

import React from "react";
import dynamic from "next/dynamic";
import ExploreNearby from "./ExploreNearby";
import EuropeanFeatures from "./EuropeanFeatures";
import { cn } from "@/lib/utils";

/**
 * Interface pour HomeContent
 */
interface HomeContentProps {
  className?: string;
  onViewMap?: () => void;
}

/**
 * Chargement dynamique de MapboxCitySearch (optionnel)
 */
const MapboxCitySearch = dynamic(
  () => import("@/app/modules/maps/components/shared/MapboxCitySearch"),
  {
    ssr: false,
    loading: () => (
      <input
        type="text"
        placeholder="🔍 Entrez une ville pour explorer..."
        disabled
        style={{
          width: "100%",
          padding: "15px 20px",
          borderRadius: "50px",
          border: "none",
          fontSize: "16px",
          textAlign: "center",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
        }}
      />
    ),
  }
);

/**
 * Composant HomeContent principal de Farm To Fork
 *
 * Version finale avec styles robustes qui contournent les conflits CSS
 */
const HomeContent: React.FC<HomeContentProps> = ({
  className = "",
  onViewMap,
}) => {
  return (
    <div className={cn("", className)}>
      {/* HERO SECTION avec styles inline robustes */}
      <div
        style={{
          position: "relative",
          height: "500px",
          borderRadius: "12px",
          overflow: "hidden",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          display: "block",
          width: "100%",
          minHeight: "500px",
          zIndex: 1,
          marginBottom: "2rem",
        }}
      >
        {/* Vidéo en arrière-plan (optionnelle) */}
        <video
          src="/856065-hd_1920_1080_30fps.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
          }}
          onError={(e) => {
            // Masquer la vidéo en cas d'erreur - le gradient restera
            e.currentTarget.style.display = "none";
          }}
        />

        {/* Overlay sombre */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 2,
          }}
        />

        {/* Contenu hero */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "20px",
            zIndex: 3,
          }}
        >
          {/* Titre principal */}
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: "bold",
              marginBottom: "20px",
              color: "white",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              fontFamily: "serif",
            }}
          >
            🌾 Bienvenue chez Farm To Fork
          </h1>

          {/* Sous-titre */}
          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
              marginBottom: "30px",
              color: "white",
              maxWidth: "700px",
              lineHeight: "1.6",
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            Connectons les producteurs locaux aux consommateurs à travers
            l'Europe
          </p>

          {/* Recherche Mapbox */}
          <div
            style={{ width: "100%", maxWidth: "500px", marginBottom: "25px" }}
          >
            <MapboxCitySearch
              variant="hero"
              placeholder="🔍 Entrez une ville pour explorer..."
              className="w-full"
            />
          </div>

          {/* Bouton vers la carte */}
          {onViewMap && (
            <button
              onClick={onViewMap}
              style={{
                padding: "15px 30px",
                backgroundColor: "white",
                color: "#059669",
                fontWeight: "bold",
                borderRadius: "50px",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
              }}
            >
              🗺️ Voir la carte des producteurs
            </button>
          )}
        </div>
      </div>

      {/* Sections du contenu */}
      <div style={{ marginTop: "3rem" }}>
        <ExploreNearby />
      </div>

      <div style={{ marginTop: "3rem" }}>
        <EuropeanFeatures />
      </div>
    </div>
  );
};

export default HomeContent;

export type { HomeContentProps };

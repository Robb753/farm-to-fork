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
 * ✅ Version corrigée avec z-index et isolation fixés pour la dropdown Mapbox
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
          overflow: "visible", // ✅ CHANGÉ : visible au lieu de hidden
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          display: "block",
          width: "100%",
          minHeight: "500px",
          zIndex: 1,
          marginBottom: "2rem",
          isolation: "auto", // ✅ AJOUTÉ : Empêche l'isolation qui casse le z-index
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
            borderRadius: "12px", // ✅ AJOUTÉ : Garde les coins arrondis
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
            borderRadius: "12px", // ✅ AJOUTÉ : Garde les coins arrondis
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

          {/* ✅ CORRECTION : Container de recherche Mapbox avec z-index forcé */}
          <div
            className="hero-search-container" // ✅ Classe CSS spéciale
            style={{
              width: "100%",
              maxWidth: "500px",
              marginBottom: "25px",
              position: "relative", // ✅ CRUCIAL
              zIndex: 200, // ✅ Z-index très élevé
              isolation: "auto", // ✅ Pas d'isolation
            }}
            data-hero-root="true" // ✅ Attribut data pour cibler en CSS
          >
            <MapboxCitySearch
              variant="hero"
              placeholder="🔍 Entrez une ville pour explorer..."
              className="w-full mapbox-dropdown"
            />
          </div>
        </div>
      </div>

      {/* Sections du contenu */}
      <div style={{ marginTop: "3rem" }}>
        <ExploreNearby />
      </div>

      <div style={{ marginTop: "3rem" }}>
        <EuropeanFeatures />
      </div>

      {/* ✅ CSS inline pour forcer la dropdown au-dessus */}
      <style jsx global>{`
        /* Container hero sans isolation */
        [data-hero-root="true"] {
          isolation: auto !important;
          z-index: 200 !important;
          position: relative !important;
        }

        /* Force la dropdown Mapbox au-dessus de tout */
        [data-hero-root="true"] [role="listbox"],
        [data-hero-root="true"] .dropdown-menu,
        .mapbox-dropdown [role="listbox"],
        .mapbox-dropdown .dropdown-menu {
          position: absolute !important;
          z-index: 99999 !important;
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
        }

        /* Supprime l'isolation des parents qui cassent le z-index */
        .hero-search-container,
        .hero-search-container * {
          isolation: auto !important;
        }
      `}</style>
    </div>
  );
};

export default HomeContent;

export type { HomeContentProps };

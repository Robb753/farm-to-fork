// app/modules/maps/components/MapboxSection.jsx
"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  useMapboxState,
  useMapboxActions,
  MAPBOX_CONFIG,
} from "@/lib/store/mapboxListingsStore";

// Configuration du token Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const MapboxSection = ({ isMapExpanded, isMobile = false }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());

  // État Zustand
  const { isLoaded, coordinates, zoom, style, bounds } = useMapboxState();
  const {
    setMapLoaded,
    setMapInstance,
    setMapBounds,
    setMapZoom,
    setCoordinates,
  } = useMapboxActions();

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialisation de la carte
  useEffect(() => {
    if (!mapContainer.current || isInitialized) return;

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: style || MAPBOX_CONFIG.style,
        center: coordinates || MAPBOX_CONFIG.center,
        zoom: zoom || MAPBOX_CONFIG.zoom,
        minZoom: MAPBOX_CONFIG.minZoom,
        maxZoom: MAPBOX_CONFIG.maxZoom,
        // Options spécifiques mobile
        ...(isMobile && {
          dragPan: true,
          touchZoomRotate: true,
          doubleClickZoom: true,
          scrollZoom: true,
        }),
        // Options desktop
        ...(!isMobile && {
          dragPan: true,
          scrollZoom: true,
          boxZoom: true,
          dragRotate: true,
          keyboard: true,
          doubleClickZoom: true,
          touchZoomRotate: true,
        }),
      });

      mapRef.current = map;
      setMapInstance(map);

      // Event listeners
      map.on("load", () => {
        console.log("🗺️ Mapbox chargé avec succès");
        setMapLoaded(true);
        setIsInitialized(true);

        // Ajouter les sources et layers pour les marqueurs
        addMarkersLayer(map);
      });

      map.on("moveend", () => {
        const center = map.getCenter();
        const currentZoom = map.getZoom();
        const currentBounds = map.getBounds();

        setCoordinates([center.lng, center.lat]);
        setMapZoom(currentZoom);
        setMapBounds([
          [currentBounds.getWest(), currentBounds.getSouth()],
          [currentBounds.getEast(), currentBounds.getNorth()],
        ]);
      });

      map.on("error", (e) => {
        console.error("❌ Erreur Mapbox:", e.error);
      });

      // Navigation controls (sauf sur mobile)
      if (!isMobile) {
        map.addControl(new mapboxgl.NavigationControl(), "top-right");
      }

      // Scale control
      map.addControl(
        new mapboxgl.ScaleControl({
          maxWidth: 80,
          unit: "metric",
        }),
        "bottom-left"
      );
    } catch (error) {
      console.error("❌ Erreur initialisation Mapbox:", error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [isInitialized, coordinates, zoom, style, isMobile]);

  // Fonction pour ajouter la layer des marqueurs
  const addMarkersLayer = useCallback((map) => {
    // Source pour les listings
    map.addSource("listings", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // Layer pour les clusters
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "listings",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#51bbd6", // Couleur pour < 10
          10,
          "#f1f075", // Couleur pour 10-30
          30,
          "#f28cb1", // Couleur pour > 30
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          20, // Rayon pour < 10
          10,
          30, // Rayon pour 10-30
          30,
          40, // Rayon pour > 30
        ],
      },
    });

    // Layer pour le texte des clusters
    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "listings",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    // Layer pour les marqueurs individuels
    map.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "listings",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "case",
          ["==", ["get", "availability"], "open"],
          "#22c55e", // Vert pour ouvert
          "#ef4444", // Rouge pour fermé
        ],
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    // Event listeners pour les interactions
    map.on("click", "clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });

      if (features.length > 0) {
        const clusterId = features[0].properties.cluster_id;
        map
          .getSource("listings")
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      }
    });

    map.on("click", "unclustered-point", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["unclustered-point"],
      });

      if (features.length > 0) {
        const listing = features[0].properties;
        console.log("Listing cliqué:", listing);

        // Créer une popup
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `
            <div class="p-3">
              <h3 class="font-bold">${listing.name}</h3>
              <p class="text-sm text-gray-600">${listing.address}</p>
              <span class="inline-block px-2 py-1 rounded-full text-xs font-medium ${
                listing.availability === "open"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }">
                ${listing.availability === "open" ? "Ouvert" : "Fermé"}
              </span>
            </div>
          `
          )
          .addTo(map);
      }
    });

    // Curseur pointer sur survol
    map.on("mouseenter", "clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("mouseenter", "unclustered-point", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "unclustered-point", () => {
      map.getCanvas().style.cursor = "";
    });
  }, []);

  // Fonction pour mettre à jour les données des marqueurs
  const updateMarkersData = useCallback(
    (listings) => {
      if (!mapRef.current || !isLoaded) return;

      const geojsonData = {
        type: "FeatureCollection",
        features: listings.map((listing) => ({
          type: "Feature",
          properties: {
            id: listing.id,
            name: listing.name,
            address: listing.address,
            availability: listing.availability,
          },
          geometry: {
            type: "Point",
            coordinates: [parseFloat(listing.lng), parseFloat(listing.lat)],
          },
        })),
      };

      const source = mapRef.current.getSource("listings");
      if (source) {
        source.setData(geojsonData);
      }
    },
    [isLoaded]
  );

  // Fonction pour voler vers des coordonnées
  const flyTo = useCallback((coordinates, zoomLevel = 14) => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: coordinates,
      zoom: zoomLevel,
      duration: 2000,
    });
  }, []);

  // Exposer les méthodes utiles
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      mapRef.current.updateMarkersData = updateMarkersData;
      mapRef.current.flyTo = flyTo;
    }
  }, [isLoaded, updateMarkersData, flyTo]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 font-medium">Token Mapbox manquant</p>
          <p className="text-sm text-gray-600">
            Ajoutez NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN à votre .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: "300px" }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MapboxSection);

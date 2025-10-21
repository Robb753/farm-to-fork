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
import {
  useListingsState,
  useInteractionsState,
  useInteractionsActions,
  useFiltersState,
} from "@/lib/store/mapListingsStore";

// Configuration du token Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const MapboxSection = ({ isMapExpanded, isMobile = false }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const popupRef = useRef(null);
  const isInitializedRef = useRef(false); // Utiliser useRef au lieu de useState

  // État Zustand - Carte
  const { isLoaded, coordinates, zoom, style, bounds } = useMapboxState();
  const {
    setMapLoaded,
    setMapInstance,
    setMapBounds,
    setMapZoom,
    setCoordinates,
  } = useMapboxActions();

  // État Zustand - Listings et interactions
  const { visible: visibleListings } = useListingsState();
  const { hoveredListingId, selectedListingId } = useInteractionsState();
  const { setHoveredListingId, setSelectedListingId, setOpenInfoWindowId } =
    useInteractionsActions();
  const filters = useFiltersState();

  // Initialisation de la carte
  useEffect(() => {
    if (!mapContainer.current || isInitializedRef.current) return;

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
        isInitializedRef.current = true;

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
        isInitializedRef.current = false;
      }
    };
  }, []); // Pas de dépendances - la carte ne doit être initialisée qu'une seule fois

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

    // Layer pour les marqueurs individuels avec état hover/select
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
        "circle-radius": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          12, // Radius pour sélection
          ["boolean", ["feature-state", "hover"], false],
          10, // Radius pour hover
          8, // Radius normal
        ],
        "circle-stroke-width": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          3,
          ["boolean", ["feature-state", "hover"], false],
          2.5,
          2,
        ],
        "circle-stroke-color": "#ffffff",
        "circle-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          1,
          ["boolean", ["feature-state", "hover"], false],
          0.9,
          0.85,
        ],
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
        const listingId = listing.id;

        // Toggle selection
        const alreadySelected = selectedListingId === listingId;
        setSelectedListingId(alreadySelected ? null : listingId);
        setOpenInfoWindowId(alreadySelected ? null : listingId);

        // Créer ou fermer popup
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }

        if (!alreadySelected) {
          const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            offset: 25,
            maxWidth: "250px",
          })
            .setLngLat(e.lngLat)
            .setHTML(
              `
              <div class="p-3" style="max-width: 220px;">
                <h3 class="font-medium text-sm mb-1">${listing.name || "Ferme"}</h3>
                <p class="text-xs text-gray-600 mb-2">${
                  listing.address || "Adresse non disponible"
                }</p>
                <span class="inline-block px-2 py-1 rounded-full text-xs font-medium" style="
                  background-color: ${
                    listing.availability === "open" ? "#dcfce7" : "#fee2e2"
                  };
                  color: ${listing.availability === "open" ? "#166534" : "#991b1b"};
                ">
                  ${listing.availability === "open" ? "Ouvert" : "Fermé"}
                </span>
              </div>
            `
            )
            .addTo(map);

          popupRef.current = popup;

          // Écouter la fermeture de la popup
          popup.on("close", () => {
            setSelectedListingId(null);
            setOpenInfoWindowId(null);
            popupRef.current = null;
          });
        }

        // Scroll to listing dans la liste
        requestAnimationFrame(() => {
          const listEl = document.getElementById(`listing-${listingId}`);
          if (listEl) {
            listEl.scrollIntoView({ behavior: "smooth", block: "center" });
            listEl.classList.add("selected-listing");
            setTimeout(
              () => listEl.classList.remove("selected-listing"),
              1500
            );
          }
        });
      }
    });

    // Curseur pointer sur survol
    map.on("mouseenter", "clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("mouseenter", "unclustered-point", (e) => {
      map.getCanvas().style.cursor = "pointer";

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["unclustered-point"],
      });

      if (features.length > 0) {
        const listing = features[0].properties;
        setHoveredListingId(listing.id);

        // Afficher popup au hover après un délai
        setTimeout(() => {
          if (
            !popupRef.current &&
            selectedListingId !== listing.id &&
            hoveredListingId === listing.id
          ) {
            const popup = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 25,
              maxWidth: "220px",
            })
              .setLngLat([parseFloat(listing.lng), parseFloat(listing.lat)])
              .setHTML(
                `
                <div class="p-2" style="max-width: 200px;">
                  <h3 class="font-medium text-xs mb-1">${listing.name || "Ferme"}</h3>
                  <p class="text-xs text-gray-600">${
                    listing.address || "Adresse non disponible"
                  }</p>
                </div>
              `
              )
              .addTo(map);

            popupRef.current = popup;
          }
        }, 300);
      }
    });

    map.on("mouseleave", "unclustered-point", () => {
      map.getCanvas().style.cursor = "";
      setHoveredListingId(null);

      // Fermer la popup de hover si ce n'est pas une sélection
      if (popupRef.current && !selectedListingId) {
        setTimeout(() => {
          if (popupRef.current && !selectedListingId) {
            popupRef.current.remove();
            popupRef.current = null;
          }
        }, 100);
      }
    });
  }, []);

  // Fonction pour mettre à jour les données des marqueurs
  const updateMarkersData = useCallback(
    (listings) => {
      if (!mapRef.current || !isLoaded) return;

      // Filtrer les listings selon les filtres actifs
      const filteredListings = listings.filter((listing) => {
        const hasActiveFilters = Object.values(filters).some(
          (arr) => arr && arr.length > 0
        );
        if (!hasActiveFilters) return true;

        return Object.entries(filters).every(([key, values]) => {
          if (!values || values.length === 0) return true;

          let listingValues = [];
          if (listing[key]) {
            listingValues = Array.isArray(listing[key])
              ? listing[key]
              : [listing[key]];
          }

          if (listingValues.length === 0) return false;
          return values.some((value) => listingValues.includes(value));
        });
      });

      const geojsonData = {
        type: "FeatureCollection",
        features: filteredListings.map((listing) => ({
          type: "Feature",
          properties: {
            id: listing.id,
            name: listing.name,
            address: listing.address,
            availability: listing.availability,
            lng: listing.lng,
            lat: listing.lat,
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
    [isLoaded, filters]
  );

  // Mettre à jour les marqueurs quand les listings ou filtres changent
  useEffect(() => {
    if (visibleListings && visibleListings.length > 0) {
      updateMarkersData(visibleListings);
    }
  }, [visibleListings, filters, updateMarkersData]);

  // Mettre à jour le feature-state pour le hover
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const map = mapRef.current;

    // Réinitialiser tous les états hover
    visibleListings?.forEach((listing) => {
      map.setFeatureState(
        { source: "listings", id: listing.id },
        { hover: false }
      );
    });

    // Activer le hover pour le listing survolé
    if (hoveredListingId) {
      map.setFeatureState(
        { source: "listings", id: hoveredListingId },
        { hover: true }
      );
    }
  }, [hoveredListingId, isLoaded, visibleListings]);

  // Mettre à jour le feature-state pour la sélection
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const map = mapRef.current;

    // Réinitialiser tous les états selected
    visibleListings?.forEach((listing) => {
      map.setFeatureState(
        { source: "listings", id: listing.id },
        { selected: false }
      );
    });

    // Activer le selected pour le listing sélectionné
    if (selectedListingId) {
      map.setFeatureState(
        { source: "listings", id: selectedListingId },
        { selected: true }
      );
    }
  }, [selectedListingId, isLoaded, visibleListings]);

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

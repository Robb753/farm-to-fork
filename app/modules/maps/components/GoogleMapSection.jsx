"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";
import { useListingState } from "@/app/contexts/MapDataContext/ListingStateContext";
import { useFilterState } from "@/app/contexts/MapDataContext/FilterStateContext";
import CustomInfoWindow from "./CustomInfoWindow";
import FarmInfoWindow from "./FarmInfoWindow";
import { useSearchParams, useRouter } from "next/navigation";
import { useMapData } from "@/app/contexts/MapDataContext/useMapData";
import debounce from "lodash.debounce";

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  mapId: process.env.NEXT_PUBLIC_MAP_ID,
};

// Fonction manuelle pour gérer le filtrage
function filterListingsByType(listings, filters) {
  if (
    !listings ||
    !filters ||
    Object.values(filters).every((arr) => !arr || arr.length === 0)
  ) {
    return listings || [];
  }

  return listings.filter((listing) => {
    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;

      const listingValues = Array.isArray(listing[key])
        ? listing[key]
        : listing[key]
        ? [listing[key]]
        : [];

      if (listingValues.length === 0) return false;

      return values.some((value) => listingValues.includes(value));
    });
  });
}

function GoogleMapSection({ isMapExpanded }) {
  const {
    isApiLoaded,
    coordinates,
    setCoordinates,
    handleMapLoad: contextHandleMapLoad,
  } = useMapState();

  const {
    allListings,
    hoveredListingId,
    setHoveredListingId,
    openInfoWindowId,
    setOpenInfoWindowId,
    clearSelection,
  } = useListingState();

  const { filters } = useFilterState();

  const mapInstanceRef = useRef(null);
  const [infoWindowPosition, setInfoWindowPosition] = useState(null);
  const initialUrlParsed = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // État local pour stocker les markers actifs
  const [activeMarkers, setActiveMarkers] = useState([]);
  const markersRef = useRef(new Map());

  // Effet pour filtrer les listings et créer/mettre à jour les marqueurs
  const previousListingIdsRef = useRef([]);

  useEffect(() => {
    if (!mapInstanceRef.current || !allListings) return;

    const filteredListings = filterListingsByType(allListings, filters);

    // 🔁 Comparer les IDs pour éviter de recréer les marqueurs si les listings ne changent pas
    const newIds = filteredListings
      .map((l) => l.id)
      .sort()
      .join(",");
    const prevIds = previousListingIdsRef.current.sort().join(",");

    if (newIds === prevIds) {
      console.log("✅ Listings identiques, pas de recréation de marqueurs.");
      return;
    }

    previousListingIdsRef.current = filteredListings.map((l) => l.id);

    // Nettoyer tous les anciens marqueurs
    activeMarkers.forEach((marker) => {
      if (marker) marker.setMap(null);
    });
    markersRef.current.clear();

    const createMarkers = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary(
        "marker"
      );

      const newMarkers = filteredListings.map((listing) => {
        // Créer l'élément SVG
        const el = document.createElement("div");
        el.className = "marker-wrapper";
        el.innerHTML = `
        <div class="pin-marker">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 384 512">
            <path 
              fill="${listing.availability === "open" ? "#22c55e" : "#ef4444"}"
              d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"
            />
          </svg>
        </div>
      `;

        const marker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: {
            lat: parseFloat(listing.lat),
            lng: parseFloat(listing.lng),
          },
          content: el,
          title: listing.name || "Ferme",
        });

        markersRef.current.set(listing.id, { marker, element: el });

        marker.addListener("gmp-click", () => {
          setOpenInfoWindowId(
            openInfoWindowId === listing.id ? null : listing.id
          );
        });

        marker.addListener("gmp-mouseover", () => {
          setHoveredListingId(listing.id);
          const svg = el.querySelector("svg");
          if (svg) {
            svg.style.transition =
              "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
            svg.style.transform = "scale(1.3) translateY(-5px)";
            svg.style.filter = "drop-shadow(0 5px 5px rgba(0, 0, 0, 0.3))";
          }
        });

        marker.addListener("gmp-mouseout", () => {
          setHoveredListingId(null);
          const svg = el.querySelector("svg");
          if (svg) {
            svg.style.transition = "transform 0.3s ease, filter 0.3s ease";
            svg.style.transform = "scale(1) translateY(0)";
            svg.style.filter = "none";
          }
        });

        return marker;
      });

      setActiveMarkers(newMarkers);
    };

    createMarkers();

    return () => {
      activeMarkers.forEach((marker) => {
        if (marker) marker.setMap(null);
      });
      markersRef.current.clear();
    };
  }, [allListings, filters]);

  useEffect(() => {
    if (!initialUrlParsed.current) {
      const urlLat = parseFloat(searchParams.get("lat"));
      const urlLng = parseFloat(searchParams.get("lng"));
      if (!isNaN(urlLat) && !isNaN(urlLng)) {
        setCoordinates({ lat: urlLat, lng: urlLng });
      }
      initialUrlParsed.current = true;
    }
  }, [searchParams, setCoordinates]);

  useEffect(() => {
    if (mapInstanceRef.current && coordinates) {
      mapInstanceRef.current.panTo(coordinates);
    }
  }, [coordinates]);

  const updateUrlWithCenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const center = map.getCenter();
    if (!center) return;

    const lat = center.lat().toFixed(6);
    const lng = center.lng().toFixed(6);

    const searchParams = new URLSearchParams();
    searchParams.set("lat", lat);
    searchParams.set("lng", lng);

    Object.entries(filters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        searchParams.set(key, values.join(","));
      }
    });

    router.replace(`/explore?${searchParams.toString()}`, { scroll: false });
  }, [router, filters]);

  const handleCloseInfoWindow = useCallback(() => {
    setOpenInfoWindowId(null);
    clearSelection();
  }, [setOpenInfoWindowId, clearSelection]);

  const handleMapLoad = useCallback(
    (map) => {
      mapInstanceRef.current = map;
      map.addListener("idle", updateUrlWithCenter);
      map.addListener("click", handleCloseInfoWindow);
      if (contextHandleMapLoad) {
        contextHandleMapLoad(map);
      }
    },
    [updateUrlWithCenter, handleCloseInfoWindow, contextHandleMapLoad]
  );

  const mapContainerStyle = useMemo(
    () => ({ width: "100%", height: "100%" }),
    []
  );

  useEffect(() => {
    if (openInfoWindowId && mapInstanceRef.current) {
      const listing = allListings?.find((l) => l.id === openInfoWindowId);
      if (listing) {
        setInfoWindowPosition({
          lat: parseFloat(listing.lat),
          lng: parseFloat(listing.lng),
        });
      }
    } else {
      setInfoWindowPosition(null);
    }
  }, [openInfoWindowId, allListings]);

  // Effet pour mettre à jour l'animation des marqueurs survolés
  useEffect(() => {
    const markerData = markersRef.current.get(hoveredListingId);
    if (markerData && markerData.element) {
      const svg = markerData.element.querySelector("svg");
      if (svg) {
        svg.style.transition =
          "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
        svg.style.transform = "scale(1.3) translateY(-5px)";
        svg.style.filter = "drop-shadow(0 5px 5px rgba(0, 0, 0, 0.3))";
      }
    }

    return () => {
      const markerData = markersRef.current.get(hoveredListingId);
      if (markerData && markerData.element) {
        const svg = markerData.element.querySelector("svg");
        if (svg) {
          svg.style.transition = "transform 0.3s ease, filter 0.3s ease";
          svg.style.transform = "scale(1) translateY(0)";
          svg.style.filter = "none";
        }
      }
    };
  }, [hoveredListingId]);

  if (!isApiLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
     <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={coordinates || { lat: 46.6, lng: 1.88 }}
        zoom={12}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {/* Les marqueurs sont gérés par les effets et ne sont pas directement rendus ici */}

        {infoWindowPosition &&
          mapInstanceRef.current &&
          openInfoWindowId &&
          (() => {
            const selected = allListings?.find(
              (i) => i.id === openInfoWindowId
            );
            if (!selected) return null;
            return (
              <CustomInfoWindow
                map={mapInstanceRef.current}
                position={infoWindowPosition}
                onClose={handleCloseInfoWindow}
              >
                <FarmInfoWindow
                  item={selected}
                  onClose={handleCloseInfoWindow}
                />
              </CustomInfoWindow>
            );
          })()}
      </GoogleMap>
    </div>
  );
}

export default React.memo(GoogleMapSection);

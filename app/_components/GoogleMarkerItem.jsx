import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import MarkerListingItem from "./MarkerListingItem";

// Variable globale pour stocker l'instance de l'InfoWindow actuellement ouverte
let activeInfoWindow = null;
let activeMarker = null; // Pour stocker le marqueur actuellement actif

function GoogleMarkerItem({ map, item }) {
  const markerRef = useRef(null);
  const infoWindowRef = useRef(null); // Référence pour l'InfoWindow de ce marqueur

  const createMarkerContent = () => {
    return (
      <div className="marker-container">
        <img
          src="./fourchette.png"
          alt="Marker"
          className="icon-image w-10 h-10"
        />
      </div>
    );
  };

  useEffect(() => {
    if (!map || !item?.coordinates) return;

    const initializeMarker = async () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      try {
        const { AdvancedMarkerElement } =
          await window.google.maps.importLibrary("marker");

        const markerDiv = document.createElement("div");
        const root = createRoot(markerDiv);
        root.render(createMarkerContent());

        markerRef.current = new AdvancedMarkerElement({
          map,
          content: markerDiv,
          position: item.coordinates,
          title: item.name,
        });

        // Listener pour ouvrir ou fermer la vignette au clic
        markerRef.current.addListener("click", () => {
          if (activeInfoWindow && activeMarker === markerRef.current) {
            activeInfoWindow.close();
            activeInfoWindow = null;
            activeMarker = null;
            return;
          }

          if (activeInfoWindow) {
            activeInfoWindow.close();
            activeInfoWindow = null;
            activeMarker = null;
          }

          if (!infoWindowRef.current) {
            const infoWindowDiv = document.createElement("div");
            const infoRoot = createRoot(infoWindowDiv);
            infoRoot.render(<MarkerListingItem item={item} />);

            infoWindowRef.current = new window.google.maps.InfoWindow({
              content: infoWindowDiv,
              disableAutoPan: true, // Pour empêcher le recentrage de la carte
            });
          }

          infoWindowRef.current.open({
            anchor: markerRef.current,
            map,
          });

          // Masquer la croix de fermeture avec JavaScript dans l'événement domready
          google.maps.event.addListenerOnce(
            infoWindowRef.current,
            "domready",
            () => {
              const iwOuter = document.querySelector(".gm-style-iw");
              if (iwOuter) {
                const closeButton = iwOuter.nextSibling;
                if (closeButton) {
                  closeButton.style.display = "none"; // Masquer la croix de fermeture
                }
              }
            }
          );

          activeInfoWindow = infoWindowRef.current;
          activeMarker = markerRef.current;

          // Listener pour réinitialiser si l'InfoWindow est fermée manuellement
          infoWindowRef.current.addListener("closeclick", () => {
            activeInfoWindow = null;
            activeMarker = null;
          });
        });

        map.addListener("click", () => {
          if (activeInfoWindow) {
            activeInfoWindow.close();
            activeInfoWindow = null;
            activeMarker = null;
          }
        });
      } catch (error) {
        console.error("Error initializing marker:", error);
      }
    };

    initializeMarker();

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, item]);

  return null;
}

export default GoogleMarkerItem;

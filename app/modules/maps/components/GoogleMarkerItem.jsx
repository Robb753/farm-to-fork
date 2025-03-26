import React, { useEffect, useRef } from "react";
import { useMapListing } from "@/app/contexts/MapListingContext";

// Variable globale pour stocker l'infoWindow active
let activeInfoWindow = null;

function GoogleMarkerItem({ map, item }) {
  const markerRef = useRef(null);
  const infoWindowRef = useRef(null);

  const {
    hoveredListingId,
    setHoveredListingId,
    selectedListingId,
    setSelectedListingId,
  } = useMapListing();

  useEffect(() => {
    if (!map || !item?.coordinates) return;

    let marker = null;

    const setupMarker = async () => {
      try {
        // Importer la bibliothèque de marqueurs
        const { AdvancedMarkerElement } = await google.maps.importLibrary(
          "marker"
        );

        // Créer l'élément de marqueur simple (un div avec une image)
        const markerElement = document.createElement("div");
        markerElement.innerHTML = `
          <img 
            src="./fourchette.png" 
            alt="Marker" 
            style="width: 32px; height: 32px; cursor: pointer; transition: transform 0.2s ease-out;" 
            data-listing-id="${item.id}"
          />
        `;

        // Créer le marqueur avancé
        marker = new AdvancedMarkerElement({
          map,
          position: item.coordinates,
          content: markerElement,
          title: item.name || "Ferme",
        });

        markerRef.current = marker;

        // Créer l'infoWindow pour ce marqueur
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${
                item.name || "Sans nom"
              }</h3>
              <p style="font-size: 0.875rem; margin-bottom: 4px;">${
                item.address || ""
              }</p>
              <p style="font-size: 0.75rem;">${
                item.description?.substring(0, 100) || ""
              }${item.description?.length > 100 ? "..." : ""}</p>
              <a href="/view-listing/${
                item.id
              }" style="display: inline-block; margin-top: 8px; padding: 4px 8px; background-color: #16a34a; color: white; border-radius: 4px; font-size: 0.75rem; text-decoration: none;">
                Voir détails
              </a>
            </div>
          `,
          maxWidth: 250,
        });

        infoWindowRef.current = infoWindow;

        // Ajouter les écouteurs d'événements
        marker.addEventListener("gmp-click", () => {
          // Fermer l'infoWindow active si elle existe
          if (activeInfoWindow) {
            activeInfoWindow.close();
          }

          infoWindow.open({
            anchor: marker,
            map,
          });

          activeInfoWindow = infoWindow;
          setSelectedListingId(item.id);

          // Faire défiler jusqu'à l'élément correspondant dans la liste
          const listingElement = document.getElementById(`listing-${item.id}`);
          if (listingElement) {
            listingElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        });

        // Ajouter des écouteurs pour le survol
        marker.addEventListener("gmp-mouseover", () => {
          const imgElement = markerElement.querySelector("img");
          if (imgElement) {
            imgElement.style.transform = "scale(1.2)";
            imgElement.style.filter = "drop-shadow(0 0 3px rgba(0,0,0,0.3))";
          }
          setHoveredListingId(item.id);
        });

        marker.addEventListener("gmp-mouseout", () => {
          const imgElement = markerElement.querySelector("img");
          if (imgElement) {
            imgElement.style.transform = "scale(1)";
            imgElement.style.filter = "none";
          }
          setHoveredListingId(null);
        });

        // Fermer l'infoWindow lorsqu'on clique sur la carte
        map.addListener("click", () => {
          if (activeInfoWindow) {
            activeInfoWindow.close();
            activeInfoWindow = null;
            setSelectedListingId(null);
          }
        });
      } catch (error) {
        console.error("Error creating marker:", error);
      }
    };

    setupMarker();

    // Nettoyage au démontage
    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        if (activeInfoWindow === infoWindowRef.current) {
          activeInfoWindow = null;
        }
      }
    };
  }, [map, item, setHoveredListingId, setSelectedListingId]);

  // Effet pour gérer les changements d'état externes
  useEffect(() => {
    if (!markerRef.current) return;

    const markerElement = markerRef.current.content;
    if (!markerElement) return;

    const imgElement = markerElement.querySelector("img");
    if (!imgElement) return;

    // Mettre à jour l'apparence du marqueur lorsqu'il est survolé ou sélectionné
    if (hoveredListingId === item.id || selectedListingId === item.id) {
      imgElement.style.transform = "scale(1.2)";
      imgElement.style.filter = "drop-shadow(0 0 3px rgba(0,0,0,0.3))";
    } else {
      imgElement.style.transform = "scale(1)";
      imgElement.style.filter = "none";
    }

    // Ouvrir l'infoWindow si ce marqueur est sélectionné
    if (selectedListingId === item.id && infoWindowRef.current) {
      if (activeInfoWindow && activeInfoWindow !== infoWindowRef.current) {
        activeInfoWindow.close();
      }

      if (activeInfoWindow !== infoWindowRef.current) {
        infoWindowRef.current.open({
          anchor: markerRef.current,
          map,
        });
        activeInfoWindow = infoWindowRef.current;
      }
    }
  }, [hoveredListingId, selectedListingId, item.id, map]);

  return null;
}

export default GoogleMarkerItem;
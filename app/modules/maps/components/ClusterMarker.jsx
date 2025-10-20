import React, { useRef, useEffect, useCallback } from "react";
// ✅ Import Zustand
import { useInteractionsActions } from "@/lib/store/mapListingsStore";
import { sortListingsByDistance } from "@/utils/markerClusterUtility";
import { CustomInfoWindow } from "./CustomInfoWindow";

/**
 * Composant pour afficher un marqueur de cluster sur la carte avec une gestion optimisée
 */
const ClusterMarker = ({ map, cluster, onClusterClick }) => {
  const markerRef = useRef(null);
  const markerElementRef = useRef(null);
  const spiderfyStateRef = useRef({ isSpiderfied: false, markers: [] });
  const infoWindowRef = useRef(null);
  // ✅ Hook Zustand
  const { setSelectedListingId } = useInteractionsActions();

  // Création optimisée du contenu du marqueur de cluster avec memoization
  const createClusterElement = useCallback(() => {
    const element = document.createElement("div");
    element.className = "marker-cluster-container";
    element.innerHTML = `
      <div class="flex items-center justify-center bg-green-600 text-white rounded-full w-12 h-12 shadow-lg transition-all duration-300 hover:scale-110">
        <span class="text-sm font-semibold">${cluster.count}</span>
      </div>
    `;
    return element;
  }, [cluster.count]);

  // Nettoyage des marqueurs du spiderfy avec debounce intégré
  const cleanupSpiderfyMarkers = useCallback(() => {
    // Supprimer tous les marqueurs spiderfied
    spiderfyStateRef.current.markers.forEach((marker) => {
      if (marker) marker.map = null;
    });

    spiderfyStateRef.current = {
      isSpiderfied: false,
      markers: [],
    };

    // Restaurer l'apparence du marqueur de cluster
    if (markerElementRef.current) {
      const clusterDiv = markerElementRef.current.querySelector("div");
      if (clusterDiv) {
        clusterDiv.classList.remove("opacity-60");
        clusterDiv.classList.remove("scale-110");
      }
    }

    // Fermer la fenêtre d'information si elle est ouverte
    if (infoWindowRef.current) {
      infoWindowRef.current = null;
    }
  }, []);

  // Effet pour créer le marqueur de cluster avec optimisations
  useEffect(() => {
    if (!map || !cluster || !cluster.position) return;

    let isComponentMounted = true;
    let markerLibrary = null;

    // Fonction pour charger la bibliothèque de marqueurs
    const loadMarkerLibrary = async () => {
      if (!window.google || !window.google.maps) return null;
      return await google.maps.importLibrary("marker");
    };

    const setupClusterMarker = async () => {
      try {
        // Charger la bibliothèque de marqueurs
        markerLibrary = await loadMarkerLibrary();
        if (!isComponentMounted || !markerLibrary) return;

        const { AdvancedMarkerElement } = markerLibrary;

        // Créer l'élément du marqueur
        const clusterElement = createClusterElement();
        markerElementRef.current = clusterElement;

        // Créer le marqueur avancé avec options optimisées
        const marker = new AdvancedMarkerElement({
          map,
          position: cluster.position,
          content: clusterElement,
          title: `Groupe de ${cluster.count} fermes`,
          zIndex: 2000, // Placer les clusters au-dessus des marqueurs individuels
          collisionBehavior:
            cluster.count > 10
              ? "REQUIRED"
              : "OPTIONAL_AND_HIDES_LOWER_PRIORITY",
        });

        // Stocker la référence au marqueur
        markerRef.current = marker;

        // Ajouter les gestionnaires d'événements avec une meilleure gestion des clics
        let clickTimeout = null;
        marker.addListener("gmp-click", () => {
          // Éviter les double-clics accidentels
          if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
          } else {
            clickTimeout = setTimeout(() => {
              handleClusterClick();
              clickTimeout = null;
            }, 200);
          }
        });

        // Animation au survol optimisée
        marker.addListener("gmp-mouseover", () => {
          if (clusterElement) {
            const clusterDiv = clusterElement.querySelector("div");
            if (clusterDiv) {
              clusterDiv.classList.add("shadow-xl");
              clusterDiv.classList.add("scale-110");
            }
          }
        });

        marker.addListener("gmp-mouseout", () => {
          if (clusterElement && !spiderfyStateRef.current.isSpiderfied) {
            const clusterDiv = clusterElement.querySelector("div");
            if (clusterDiv) {
              clusterDiv.classList.remove("shadow-xl");
              clusterDiv.classList.remove("scale-110");
            }
          }
        });
      } catch (error) {
        console.error("Error creating cluster marker:", error);
      }
    };

    setupClusterMarker();

    return () => {
      isComponentMounted = false;

      // Nettoyer le marqueur
      if (markerRef.current) {
        markerRef.current.map = null;
      }

      // Nettoyer les marqueurs du spider
      cleanupSpiderfyMarkers();
    };
  }, [map, cluster, createClusterElement, cleanupSpiderfyMarkers]);

  // Gérer le clic sur un cluster avec meilleure gestion des états
  const handleClusterClick = useCallback(() => {
    if (!map || !cluster) return;

    // Si le cluster est déjà en mode "spiderfié", nettoyer et fermer
    if (spiderfyStateRef.current.isSpiderfied) {
      cleanupSpiderfyMarkers();
      return;
    }

    // Options pour gérer les clusters selon le nombre d'éléments et le niveau de zoom
    const currentZoom = map.getZoom();

    if (cluster.count <= 5) {
      // Pour les petits clusters, utiliser le "spiderfy"
      spiderfyCluster();
    } else if (cluster.count <= 10) {
      // Pour les clusters moyens, zoomer et centrer
      map.setZoom(Math.min(currentZoom + 1, 18));
      map.panTo(cluster.position);
    } else {
      // Pour les grands clusters, zoomer davantage
      map.setZoom(Math.min(currentZoom + 2, 19));
      map.panTo(cluster.position);
    }

    // Appeler le callback s'il est fourni
    if (onClusterClick) {
      onClusterClick(cluster);
    }
  }, [map, cluster, onClusterClick, cleanupSpiderfyMarkers, spiderfyCluster]);

  // Fonction pour créer une disposition en "araignée" des marqueurs du cluster
  const spiderfyCluster = useCallback(async () => {
    if (!map || !cluster || !cluster.items || cluster.items.length === 0)
      return;

    // Marquer le cluster comme spiderfied
    spiderfyStateRef.current.isSpiderfied = true;

    // Charger la bibliothèque de marqueurs si ce n'est pas déjà fait
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    // Réduire l'opacité du marqueur de cluster principal
    if (markerElementRef.current) {
      const clusterDiv = markerElementRef.current.querySelector("div");
      if (clusterDiv) {
        clusterDiv.classList.add("opacity-60");
      }
    }

    // Trier les listings par distance par rapport au centre du cluster
    const sortedItems = sortListingsByDistance(
      cluster.items,
      cluster.position.lat,
      cluster.position.lng
    );

    // Paramètres pour disposer les marqueurs en cercle
    const numMarkers = Math.min(sortedItems.length, 8); // Limiter à 8 marqueurs maximum
    const radius = 50; // Rayon en pixels
    const spiderfyMarkers = [];

    for (let i = 0; i < numMarkers; i++) {
      const item = sortedItems[i];

      // Calculer la position dans le cercle
      const angle = (i / numMarkers) * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      // Convertir les décalages de pixels en coordonnées LatLng
      const pixelPosition = map
        .getProjection()
        .fromLatLngToPoint(
          new google.maps.LatLng(cluster.position.lat, cluster.position.lng)
        );

      const scale = Math.pow(2, map.getZoom());
      const worldPoint = new google.maps.Point(
        (pixelPosition.x * scale + x) / scale,
        (pixelPosition.y * scale + y) / scale
      );

      const position = map.getProjection().fromPointToLatLng(worldPoint);

      // Créer l'élément de marqueur
      const markerElement = document.createElement("div");
      markerElement.className = "spider-marker-element";
      markerElement.setAttribute("data-listing-id", item.id);

      // Image du marqueur avec classe CSS pour animation
      markerElement.innerHTML = `
        <div class="spider-marker animate-fade-in-up" style="animation-delay: ${
          i * 50
        }ms">
          <img 
            src="${
              item.availability === "open"
                ? "./marker-green.svg"
                : "./marker-red.svg"
            }" 
            alt="${item.name || "Ferme"}" 
            class="w-8 h-8 transition-all duration-200"
          />
        </div>
      `;

      // Créer le marqueur
      const spiderMarker = new AdvancedMarkerElement({
        map,
        position: {
          lat: position.lat(),
          lng: position.lng(),
        },
        content: markerElement,
        title: item.name || "Ferme",
        zIndex: 1500,
      });

      // Ajouter le gestionnaire de clic pour sélectionner le listing
      spiderMarker.addListener("gmp-click", () => {
        // Fermer la disposition en araignée
        cleanupSpiderfyMarkers();

        // Sélectionner le listing
        if (setSelectedListingId) {
          setSelectedListingId(item.id);

          // Faire défiler jusqu'à l'élément dans la liste
          requestAnimationFrame(() => {
            const listingElement = document.getElementById(
              `listing-${item.id}`
            );
            if (listingElement) {
              listingElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });

              // Ajouter une classe pour l'animation
              listingElement.classList.add("selected-listing");
              setTimeout(() => {
                listingElement.classList.remove("selected-listing");
              }, 1500);
            }
          });
        }
      });

      // Ajouter une animation au survol
      spiderMarker.addListener("gmp-mouseover", () => {
        const imgElement = markerElement.querySelector("img");
        if (imgElement) {
          imgElement.style.transform = "scale(1.3)";
          imgElement.style.filter = "drop-shadow(0 0 4px rgba(0,0,0,0.4))";
        }
      });

      spiderMarker.addListener("gmp-mouseout", () => {
        const imgElement = markerElement.querySelector("img");
        if (imgElement) {
          imgElement.style.transform = "scale(1)";
          imgElement.style.filter = "none";
        }
      });

      // Afficher une infoWindow au survol prolongé
      let hoverTimeout = null;
      spiderMarker.addListener("gmp-mouseover", () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);

        hoverTimeout = setTimeout(() => {
          // Créer l'InfoWindow si elle n'existe pas déjà
          if (!infoWindowRef.current) {
            infoWindowRef.current = (
              <CustomInfoWindow
                map={map}
                position={{
                  lat: position.lat(),
                  lng: position.lng(),
                }}
                onClose={() => {
                  infoWindowRef.current = null;
                }}
              >
                <div className="p-2">
                  <h3 className="font-medium text-sm">
                    {item.name || "Ferme"}
                  </h3>
                  <p className="text-xs text-gray-600">{item.address || ""}</p>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.availability === "open"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.availability === "open" ? "Ouvert" : "Fermé"}
                    </span>
                  </div>
                </div>
              </CustomInfoWindow>
            );
          }
        }, 500); // Afficher après 500ms de survol
      });

      spiderMarker.addListener("gmp-mouseout", () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          hoverTimeout = null;
        }
      });

      // Ajouter le marqueur à la liste pour le nettoyage ultérieur
      spiderfyMarkers.push(spiderMarker);
    }

    // Stocker les marqueurs pour le nettoyage
    spiderfyStateRef.current.markers = spiderfyMarkers;
  }, [map, cluster, setSelectedListingId, cleanupSpiderfyMarkers]);

  // Lorsque la position du cluster change, nettoyer et recréer
  useEffect(() => {
    if (spiderfyStateRef.current.isSpiderfied) {
      cleanupSpiderfyMarkers();
    }
  }, [cluster.position, cleanupSpiderfyMarkers]);

  // Ce composant ne rend rien dans le DOM car il gère directement les objets Google Maps
  return null;
};

export default React.memo(ClusterMarker);

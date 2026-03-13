"use client";

/**
 * MapboxClusterLayer — remplace MapboxMarkers.tsx
 *
 * Clustering natif Mapbox GL JS (GeoJSON source → WebGL layers).
 * Zéro DOM marker, zéro loop de création sur chaque pan/zoom.
 *
 * Stage 1 ✅  clusters + clic cluster → flyTo, clic ferme → store + popup légère
 * Stage 2 ✅  hover sync liste ↔ carte via feature-state
 * Stage 3 🔜  style "sélectionné" (lignes TODO commentées ci-dessous)
 * Stage 4 🔜  FarmSelectedPanel remplace la popup Mapbox inline
 *
 * Garanties lifecycle :
 *   • Un seul binding par event (handlers définis dans la closure de l'effect [map])
 *   • Guards getSource / getLayer avant chaque opération Mapbox
 *   • Teardown strict au démontage : events → layers → source → popup
 *   • Style reload → isReadyRef reset → re-setup idempotent → setData immédiat
 *   • promoteId: 'id' sur la source → feature-state hover/selected opérationnel
 */

import { useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";

import { COLORS, CLUSTER_CONFIG } from "@/lib/config";
import { useFilteredListings, useUnifiedStore } from "@/lib/store";
import type { Listing } from "@/lib/store";

// ─── Identifiants stables ─────────────────────────────────────────────────────

const SOURCE_ID = "farms-source" as const;
const LAYER_CLUSTERS = "farms-clusters" as const;
const LAYER_CLUSTER_COUNT = "farms-cluster-count" as const;
const LAYER_POINTS = "farms-points" as const;

// Ordre de suppression : du haut vers le bas dans la stack Mapbox
const LAYERS_TEARDOWN_ORDER = [
  LAYER_CLUSTER_COUNT,
  LAYER_CLUSTERS,
  LAYER_POINTS,
] as const;

// ─── GeoJSON ──────────────────────────────────────────────────────────────────

function parseCoord(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function toGeoJSON(
  listings: Listing[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

  for (const l of listings) {
    const lat = parseCoord(l.lat);
    const lng = parseCoord(l.lng);
    if (lat === null || lng === null) continue;
    if (lat === 0 && lng === 0) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        id: l.id, // ← promu en feature ID via promoteId: 'id'
        name: l.name ?? `Ferme #${l.id}`,
        address: l.address ?? "",
        active: Boolean(l.active),
        claimed: Boolean(l.clerk_user_id),
      },
    });
  }

  return { type: "FeatureCollection", features };
}

// ─── Guards lifecycle ──────────────────────────────────────────────────────────

function isMapAlive(map: mapboxgl.Map): boolean {
  try {
    return (
      !(map as unknown as { _removed?: boolean })._removed &&
      map.getContainer().isConnected
    );
  } catch {
    return false;
  }
}

// ─── Ajout des layers (chaque fonction est idempotente) ───────────────────────

function addSourceIfNeeded(
  map: mapboxgl.Map,
  data: GeoJSON.FeatureCollection<GeoJSON.Point>,
): void {
  if (map.getSource(SOURCE_ID)) return;

  map.addSource(SOURCE_ID, {
    type: "geojson",
    data,
    cluster: true,
    clusterRadius: CLUSTER_CONFIG.radius,
    clusterMaxZoom: CLUSTER_CONFIG.maxZoom,
    clusterMinPoints: 2,
    promoteId: "id", // ← Stage 2+ : setFeatureState par listing ID
  });
}

function addClustersLayerIfNeeded(map: mapboxgl.Map): void {
  if (map.getLayer(LAYER_CLUSTERS)) return;

  const { colors, sizes } = CLUSTER_CONFIG;

  map.addLayer({
    id: LAYER_CLUSTERS,
    type: "circle",
    source: SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        colors.small,
        10,
        colors.medium,
        50,
        colors.large,
      ],
      "circle-radius": [
        "step",
        ["get", "point_count"],
        sizes.small / 2,
        10,
        sizes.medium / 2,
        50,
        sizes.large / 2,
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.9,
    },
  });
}

function addClusterCountLayerIfNeeded(map: mapboxgl.Map): void {
  if (map.getLayer(LAYER_CLUSTER_COUNT)) return;

  map.addLayer({
    id: LAYER_CLUSTER_COUNT,
    type: "symbol",
    source: SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 13,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ffffff" },
  });
}

function addPointsLayerIfNeeded(map: mapboxgl.Map): void {
  if (map.getLayer(LAYER_POINTS)) return;

  map.addLayer({
    id: LAYER_POINTS,
    type: "circle",
    source: SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      // Stage 2 : hover via feature-state (actif grâce au promoteId)
      "circle-radius": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        14,
        // Stage 3 TODO : ajouter selected avant le fallback
        // ["boolean", ["feature-state", "selected"], false], 16,
        10,
      ],
      "circle-color": [
        "case",
        ["get", "active"],
        COLORS.PRIMARY,
        "#d97706", // ferme non revendiquée
      ],
      "circle-stroke-width": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        3,
        2,
      ],
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.95,
    },
  });
}

// ─── Suppression sécurisée ────────────────────────────────────────────────────

function safeRemoveLayers(map: mapboxgl.Map): void {
  for (const id of LAYERS_TEARDOWN_ORDER) {
    try {
      if (map.getLayer(id)) map.removeLayer(id);
    } catch {}
  }
}

function safeRemoveSource(map: mapboxgl.Map): void {
  try {
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  } catch {}
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function MapboxClusterLayer(): null {
  const map = useUnifiedStore((s) => s.map.instance) as mapboxgl.Map | null;
  const filteredListings = useFilteredListings();
  const hoveredId = useUnifiedStore(
    (s) => s.interactions.hoveredListingId,
  );

  // ── Refs ──────────────────────────────────────────────────────────────────

  // true = source + layers présents et opérationnels sur la carte
  const isReadyRef = useRef(false);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const prevHoveredRef = useRef<number | null>(null);

  // Garde les données fraîches dans les closures sans recréer les handlers
  const filteredListingsRef = useRef(filteredListings);
  useEffect(() => {
    filteredListingsRef.current = filteredListings;
  }, [filteredListings]);

  // GeoJSON mémoïsé — recalculé uniquement si filteredListings change
  const geojson = useMemo(
    () => toGeoJSON(filteredListings),
    [filteredListings],
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Setup idempotent : safe à appeler plusieurs fois de suite
  function setupLayers(m: mapboxgl.Map): void {
    if (isReadyRef.current) return; // déjà fait
    if (!m.isStyleLoaded()) return; // style pas encore prêt
    if (!isMapAlive(m)) return; // map déjà détruite

    addSourceIfNeeded(m, toGeoJSON(filteredListingsRef.current));
    addClustersLayerIfNeeded(m);
    addClusterCountLayerIfNeeded(m);
    addPointsLayerIfNeeded(m);

    isReadyRef.current = true;
  }

  // Teardown complet — toujours appelé avant le unbinding des events
  function teardownLayers(m: mapboxgl.Map): void {
    try {
      popupRef.current?.remove();
    } catch {}
    popupRef.current = null;

    if (!isMapAlive(m)) {
      isReadyRef.current = false;
      return;
    }

    safeRemoveLayers(m);
    safeRemoveSource(m);
    isReadyRef.current = false;
  }

  // ── Effect principal : binding unique + setup initial ─────────────────────
  //
  // Tous les handlers sont définis dans la closure de cet effect.
  // → référence unique par instance de map
  // → pas de double-binding possible si la map instance ne change pas
  // → pas de stale closure : `map` est capturé fraîchement à chaque re-bind

  useEffect(() => {
    if (!map) return;

    // ── Handlers ────────────────────────────────────────────────────────────

    function onClusterClick(
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ): void {
      if (!isMapAlive(map)) return;

      const [feature] = map.queryRenderedFeatures(e.point, {
        layers: [LAYER_CLUSTERS],
      });
      if (!feature) return;

      const clusterId = feature.properties?.cluster_id as number | undefined;
      if (clusterId == null) return;

      const source = map.getSource(SOURCE_ID) as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (!source) return;

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null || !isMapAlive(map)) return;
        map.flyTo({
          center: (feature.geometry as GeoJSON.Point)
            .coordinates as [number, number],
          zoom: zoom + 0.5,
          speed: 1.4,
        });
      });
    }

    function onPointClick(
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
    ): void {
      if (!isMapAlive(map)) return;

      const [feature] = map.queryRenderedFeatures(e.point, {
        layers: [LAYER_POINTS],
      });
      if (!feature) return;

      const props = feature.properties as { id: number; name: string };
      const coords = (feature.geometry as GeoJSON.Point)
        .coordinates as [number, number];

      // Dispatch vers le store
      // Stage 4 → remplacer par listingsActions.setOpenInfoWindowId(props.id)
      //           pour ouvrir FarmSelectedPanel automatiquement
      useUnifiedStore
        .getState()
        .interactionsActions.setSelectedListing(props.id);

      // Rétro-compatibilité : composants existants écoutant ce CustomEvent
      // Stage 4 → supprimer quand FarmSelectedPanel est actif
      window.dispatchEvent(
        new CustomEvent("listingSelected", {
          detail: { id: props.id, fromMap: true },
        }),
      );

      // Popup légère Stage 1 (nom uniquement)
      // Stage 4 → supprimer bloc entier, remplacé par FarmSelectedPanel
      try {
        popupRef.current?.remove();
      } catch {}
      popupRef.current = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 12,
        maxWidth: "220px",
        className: "farm-popup",
      })
        .setLngLat(coords)
        .setHTML(
          `<p style="margin:0;font-family:system-ui;font-size:13px;font-weight:600;color:${COLORS.TEXT_PRIMARY}">${props.name}</p>`,
        )
        .addTo(map);

      popupRef.current.on("close", () => {
        popupRef.current = null;
      });
    }

    function setCursor(): void {
      map.getCanvas().style.cursor = "pointer";
    }
    function resetCursor(): void {
      map.getCanvas().style.cursor = "";
    }

    function onStyleLoad(): void {
      // Le style a été rechargé : tous les layers/source ont disparu
      isReadyRef.current = false;
      setupLayers(map);
      // Réinjecter les données via la ref (pas de stale closure)
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined)?.setData(
        toGeoJSON(filteredListingsRef.current),
      );
    }

    // ── Binding ─────────────────────────────────────────────────────────────

    map.on("style.load", onStyleLoad);
    map.on("click", LAYER_CLUSTERS, onClusterClick);
    map.on("click", LAYER_POINTS, onPointClick);
    map.on("mouseenter", LAYER_CLUSTERS, setCursor);
    map.on("mouseleave", LAYER_CLUSTERS, resetCursor);
    map.on("mouseenter", LAYER_POINTS, setCursor);
    map.on("mouseleave", LAYER_POINTS, resetCursor);

    // Setup initial si le style est déjà prêt (cas normal au montage)
    if (map.isStyleLoaded()) setupLayers(map);

    return () => {
      // ── Unbinding strict ─────────────────────────────────────────────────
      map.off("style.load", onStyleLoad);
      map.off("click", LAYER_CLUSTERS, onClusterClick);
      map.off("click", LAYER_POINTS, onPointClick);
      map.off("mouseenter", LAYER_CLUSTERS, setCursor);
      map.off("mouseleave", LAYER_CLUSTERS, resetCursor);
      map.off("mouseenter", LAYER_POINTS, setCursor);
      map.off("mouseleave", LAYER_POINTS, resetCursor);

      teardownLayers(map);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]); // handlers se recréent uniquement si l'instance de map change

  // ── Effect données : mise à jour GeoJSON quand les filtres changent ────────
  //
  // isReadyRef bloque si la source n'existe pas encore.
  // Le optional chaining est une sécurité supplémentaire.

  useEffect(() => {
    if (!map || !isReadyRef.current) return;
    (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined)?.setData(
      geojson,
    );
  }, [map, geojson]);

  // ── Effect hover : synchronisation liste ↔ carte (Stage 2) ────────────────
  //
  // setFeatureState est wrappé en try/catch : la feature peut ne pas être rendue
  // (hors viewport ou dans un cluster) sans que ce soit une erreur bloquante.

  useEffect(() => {
    if (!map || !isReadyRef.current) return;

    const prev = prevHoveredRef.current;
    const next = hoveredId;

    if (prev === next) return;

    if (prev !== null) {
      try {
        map.setFeatureState({ source: SOURCE_ID, id: prev }, { hover: false });
      } catch {}
    }

    if (next !== null) {
      try {
        map.setFeatureState({ source: SOURCE_ID, id: next }, { hover: true });
      } catch {}
    }

    prevHoveredRef.current = next;
  }, [map, hoveredId]);

  return null;
}

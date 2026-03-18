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
 */

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";

import { COLORS, CLUSTER_CONFIG } from "@/lib/config";
import { useFilteredListings, useUnifiedStore } from "@/lib/store";
import type { Listing } from "@/lib/store";

const SOURCE_ID = "farms-source" as const;
const LAYER_CLUSTERS = "farms-clusters" as const;
const LAYER_CLUSTER_COUNT = "farms-cluster-count" as const;
const LAYER_POINTS = "farms-points" as const;

const LAYERS_TEARDOWN_ORDER = [
  LAYER_CLUSTER_COUNT,
  LAYER_CLUSTERS,
  LAYER_POINTS,
] as const;

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
        id: l.id,
        name: l.name ?? `Ferme #${l.id}`,
        address: l.address ?? "",
        active: Boolean(l.active),
        claimed: Boolean(l.clerk_user_id),
      },
    });
  }

  return { type: "FeatureCollection", features };
}

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
    promoteId: "id",
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
      "circle-radius": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        14,
        // Stage 3 TODO:
        ["boolean", ["feature-state", "selected"], false], 16,
        10,
      ],
      "circle-color": ["case", ["get", "active"], COLORS.PRIMARY, "#d97706"],
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

function safeRemoveLayers(map: mapboxgl.Map): void {
  for (const id of LAYERS_TEARDOWN_ORDER) {
    try {
      if (map.getLayer(id)) map.removeLayer(id);
    } catch {
      // Ignore Mapbox teardown race conditions during unmount/style reload.
    }
  }
}

function safeRemoveSource(map: mapboxgl.Map): void {
  try {
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  } catch {
    // Ignore Mapbox teardown race conditions during unmount/style reload.
  }
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function MapboxClusterLayer(): null {
  const map = useUnifiedStore((s) => s.map.instance) as mapboxgl.Map | null;
  const filteredListings = useFilteredListings();
  const hoveredId = useUnifiedStore((s) => s.interactions.hoveredListingId);

  const isReadyRef = useRef(false);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const prevHoveredRef = useRef<number | null>(null);

  const filteredListingsRef = useRef(filteredListings);
  useEffect(() => {
    filteredListingsRef.current = filteredListings;
  }, [filteredListings]);

  const geojson = useMemo(
    () => toGeoJSON(filteredListings),
    [filteredListings],
  );

  function setupLayers(m: mapboxgl.Map): void {
    if (isReadyRef.current) return;
    if (!m.isStyleLoaded()) return;
    if (!isMapAlive(m)) return;

    addSourceIfNeeded(m, toGeoJSON(filteredListingsRef.current));
    addClustersLayerIfNeeded(m);
    addClusterCountLayerIfNeeded(m);
    addPointsLayerIfNeeded(m);

    isReadyRef.current = true;
  }

  function teardownLayers(m: mapboxgl.Map): void {
    try {
      popupRef.current?.remove();
    } catch {
      // Popup may already be removed.
    }
    popupRef.current = null;

    if (!isMapAlive(m)) {
      isReadyRef.current = false;
      return;
    }

    safeRemoveLayers(m);
    safeRemoveSource(m);
    isReadyRef.current = false;
  }

  useEffect(() => {
    if (!map) return;
    const mapInstance = map;

    function onClusterClick(
      e: mapboxgl.MapMouseEvent & {
        features?: mapboxgl.MapboxGeoJSONFeature[];
      },
    ): void {
      if (!isMapAlive(mapInstance)) return;

      const [feature] = mapInstance.queryRenderedFeatures(e.point, {
        layers: [LAYER_CLUSTERS],
      });
      if (!feature) return;

      const clusterId = feature.properties?.cluster_id as number | undefined;
      if (clusterId == null) return;

      const source = mapInstance.getSource(SOURCE_ID) as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (!source) return;

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null || !isMapAlive(mapInstance)) return;

        mapInstance.flyTo({
          center: (feature.geometry as GeoJSON.Point).coordinates as [
            number,
            number,
          ],
          zoom: zoom + 0.5,
          speed: 1.4,
        });
      });
    }

    function onPointClick(
      e: mapboxgl.MapMouseEvent & {
        features?: mapboxgl.MapboxGeoJSONFeature[];
      },
    ): void {
      if (!isMapAlive(mapInstance)) return;

      const [feature] = mapInstance.queryRenderedFeatures(e.point, {
        layers: [LAYER_POINTS],
      });
      if (!feature) return;

      const props = feature.properties as { id: number; name: string; address: string };
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [
        number,
        number,
      ];

      useUnifiedStore
        .getState()
        .interactionsActions.setSelectedListing(props.id);

      window.dispatchEvent(
        new CustomEvent("listingSelected", {
          detail: { id: props.id, fromMap: true },
        }),
      );

      try {
        popupRef.current?.remove();
      } catch {
        // Previous popup may already be removed.
      }

      popupRef.current = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 12,
        maxWidth: "300px",
        className: "farm-popup",
      })
        .setLngLat(coords)
        .setHTML(
          `<div style="font-family:system-ui;padding:4px 24px 4px 0">` +
          `<p style="margin:0 0 6px;font-size:13px;font-weight:700;line-height:1.4;word-wrap:break-word;overflow-wrap:break-word;color:${COLORS.TEXT_PRIMARY}">${esc(props.name)}</p>` +
          `<p style="margin:0 0 8px;font-size:12px;color:#6b7280">${esc(props.address)}</p>` +
          `<a href="/farm/${props.id}" style="display:inline-block;font-size:12px;font-weight:600;color:${COLORS.PRIMARY};text-decoration:none">Voir la fiche →</a>` +
          `</div>`,
        )
        .addTo(mapInstance);

      popupRef.current.on("close", () => {
        popupRef.current = null;
      });
    }

    function setCursor(): void {
      mapInstance.getCanvas().style.cursor = "pointer";
    }

    function resetCursor(): void {
      mapInstance.getCanvas().style.cursor = "";
    }

    function onPointMouseEnter(e: mapboxgl.MapMouseEvent): void {
      mapInstance.getCanvas().style.cursor = "pointer";
      const [feat] = mapInstance.queryRenderedFeatures(e.point, {
        layers: [LAYER_POINTS],
      });
      const id = feat?.properties?.id as number | undefined;
      if (id != null) {
        useUnifiedStore.getState().interactionsActions.setHoveredListing(id);
      }
    }

    function onPointMouseLeave(): void {
      mapInstance.getCanvas().style.cursor = "";
      useUnifiedStore.getState().interactionsActions.setHoveredListing(null);
    }

    function onStyleLoad(): void {
      isReadyRef.current = false;
      setupLayers(mapInstance);

      (
        mapInstance.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
      )?.setData(toGeoJSON(filteredListingsRef.current));
    }

    mapInstance.on("style.load", onStyleLoad);
    mapInstance.on("click", LAYER_CLUSTERS, onClusterClick);
    mapInstance.on("click", LAYER_POINTS, onPointClick);
    mapInstance.on("mouseenter", LAYER_CLUSTERS, setCursor);
    mapInstance.on("mouseleave", LAYER_CLUSTERS, resetCursor);
    mapInstance.on("mouseenter", LAYER_POINTS, onPointMouseEnter);
    mapInstance.on("mouseleave", LAYER_POINTS, onPointMouseLeave);

    if (mapInstance.isStyleLoaded()) setupLayers(mapInstance);

    return () => {
      mapInstance.off("style.load", onStyleLoad);
      mapInstance.off("click", LAYER_CLUSTERS, onClusterClick);
      mapInstance.off("click", LAYER_POINTS, onPointClick);
      mapInstance.off("mouseenter", LAYER_CLUSTERS, setCursor);
      mapInstance.off("mouseleave", LAYER_CLUSTERS, resetCursor);
      mapInstance.off("mouseenter", LAYER_POINTS, onPointMouseEnter);
      mapInstance.off("mouseleave", LAYER_POINTS, onPointMouseLeave);

      teardownLayers(mapInstance);
    };
  }, [map]);

  useEffect(() => {
    if (!map || !isReadyRef.current) return;
    const mapInstance = map;

    (
      mapInstance.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
    )?.setData(geojson);
  }, [map, geojson]);

  useEffect(() => {
    if (!map || !isReadyRef.current) return;
    const mapInstance = map;

    const prev = prevHoveredRef.current;
    const next = hoveredId;

    if (prev === next) return;

    if (prev !== null) {
      try {
        mapInstance.setFeatureState(
          { source: SOURCE_ID, id: prev },
          { hover: false },
        );
      } catch {
        // Feature may not be rendered anymore.
      }
    }

    if (next !== null) {
      try {
        mapInstance.setFeatureState(
          { source: SOURCE_ID, id: next },
          { hover: true },
        );
      } catch {
        // Feature may not be rendered yet or may be clustered.
      }
    }

    prevHoveredRef.current = next;
  }, [map, hoveredId]);

  return null;
}

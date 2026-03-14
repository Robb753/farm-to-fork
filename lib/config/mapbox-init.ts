/**
 * Mapbox token initialization — executed once at module evaluation.
 * Import this module at the top of MapboxSection.tsx (client-only chunk).
 * The `typeof window` guard ensures this never runs on the server.
 */
import mapboxgl from "mapbox-gl";

if (typeof window !== "undefined") {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  if (!token) {
    console.error("[mapbox-init] NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is not set");
  } else {
    mapboxgl.accessToken = token;
  }
}

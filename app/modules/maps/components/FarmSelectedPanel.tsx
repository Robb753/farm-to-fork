"use client";

/**
 * FarmSelectedPanel — Stage 4 (actif)
 *
 * Panneau React flottant affiché quand une ferme est sélectionnée sur la carte.
 * Remplace la mapboxgl.Popup inline de MapboxClusterLayer.
 */

import { useUnifiedStore, useAllListings } from "@/lib/store";
import { COLORS } from "@/lib/config";

export default function FarmSelectedPanel() {
  const selectedId = useUnifiedStore((s) => s.interactions.selectedListingId);
  const isOpen = useUnifiedStore((s) => s.interactions.infoWindowOpen);
  const clearSelection = useUnifiedStore(
    (s) => s.listingsActions.clearSelection,
  );
  const allListings = useAllListings();

  if (!isOpen || selectedId === null) return null;

  const farm = allListings.find((l) => l.id === selectedId);
  if (!farm) return null;

  const isUnclaimed = !farm.active && !farm.clerk_user_id;
  const imageUrl =
    Array.isArray(farm.listingImages) && farm.listingImages.length > 0
      ? farm.listingImages[0]?.url
      : null;
  const products = farm.product_type ?? [];
  const isActive = farm.active ?? false;
  const distLabel =
    farm.distance != null
      ? farm.distance < 1
        ? `${Math.round(farm.distance * 1000)} m`
        : `${farm.distance.toFixed(1)} km`
      : null;

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10
                 w-80 max-w-[90vw] rounded-xl shadow-xl
                 border border-gray-100 overflow-hidden"
      style={{ background: COLORS.BG_WHITE }}
    >
      {/* Image banner */}
      {imageUrl && (
        <div className="relative h-28 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={farm.name}
            className="w-full h-full object-cover"
          />
          {/* Availability badge over image */}
          {farm.active !== undefined && (
            <span
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: isActive ? "rgba(22,163,74,0.9)" : "rgba(220,38,38,0.85)",
                color: "#fff",
              }}
            >
              {isActive ? "Ouvert" : "Fermé"}
            </span>
          )}
          {/* Close button over image */}
          <button
            onClick={clearSelection}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/20 transition-colors"
            aria-label="Fermer"
            style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Header (no image case) */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex-1 min-w-0">
          {isUnclaimed && (
            <span
              className="inline-block mb-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: "#fef3c7", color: "#92400e" }}
            >
              Ferme pré-enregistrée
            </span>
          )}
          <h3
            className="font-semibold text-sm truncate"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {farm.name}
          </h3>
          {farm.address && (
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              📍 {farm.address}
            </p>
          )}

          {/* Rating + Distance */}
          {(farm.rating != null || distLabel) && (
            <div className="flex items-center gap-2 mt-1">
              {farm.rating != null && (
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#92400e" }}>
                  <span style={{ color: "#fbbf24" }}>★</span>
                  {farm.rating}
                </span>
              )}
              {distLabel && (
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "#f0fdf4",
                    color: "#16a34a",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  {distLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Close button (no image case) */}
        {!imageUrl && (
          <button
            onClick={clearSelection}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Product tags */}
      {products.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {products.slice(0, 3).map((p, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${COLORS.PRIMARY}12`,
                color: COLORS.PRIMARY,
                border: `1px solid ${COLORS.PRIMARY}25`,
              }}
            >
              {p}
            </span>
          ))}
          {products.length > 3 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
            >
              +{products.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Availability badge (no image case) */}
      {!imageUrl && farm.active !== undefined && (
        <div className="px-4 pb-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: isActive ? "#dcfce7" : "#fee2e2",
              color: isActive ? "#16a34a" : "#dc2626",
            }}
          >
            {isActive ? "Ouvert" : "Fermé"}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <a
          href={`/farm/${farm.slug ?? farm.id}`}
          className="flex-1 py-2 px-3 rounded-lg text-center text-xs font-semibold text-white"
          style={{ background: COLORS.PRIMARY }}
        >
          Voir la ferme →
        </a>
        {isUnclaimed && (
          <a
            href={`/farm/${farm.slug ?? farm.id}/claim`}
            className="flex-1 py-2 px-3 rounded-lg text-center text-xs font-semibold text-white"
            style={{ background: "#d97706" }}
          >
            Revendiquer →
          </a>
        )}
      </div>
    </div>
  );
}

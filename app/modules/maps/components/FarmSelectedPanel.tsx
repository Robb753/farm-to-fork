"use client";

/**
 * FarmSelectedPanel — Stage 4
 *
 * Panneau React flottant affiché quand une ferme est sélectionnée sur la carte.
 * Remplace la mapboxgl.Popup inline de MapboxClusterLayer.
 *
 * Activation (Stage 4) :
 *   1. Dans MapboxSection.tsx : décommenter <FarmSelectedPanel />
 *   2. Dans MapboxClusterLayer.tsx onPointClick :
 *      - remplacer interactionsActions.setSelectedListing(id)
 *        par listingsActions.setOpenInfoWindowId(id)
 *      - supprimer le bloc popup Mapbox
 *      - supprimer le dispatch CustomEvent listingSelected
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

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10
                 w-80 max-w-[90vw] rounded-xl shadow-xl
                 border border-gray-100 overflow-hidden"
      style={{ background: COLORS.BG_WHITE }}
    >
      {/* En-tête */}
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
              {farm.address}
            </p>
          )}
        </div>

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
      </div>

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

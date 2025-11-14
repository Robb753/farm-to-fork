// FilterSection/components/ViewToggle.tsx

import React from "react";
import { MapPin, List } from "lucide-react";
import { CSS_CLASSES } from "../utils/constants";
import { useUIActions, useUIState } from "@/lib/store";

/**
 * Composant pour basculer entre vue liste et vue carte
 *
 * Features:
 * - ✅ Toggle visuel liste/carte
 * - ✅ État visuel clair (actif/inactif)
 * - ✅ Accessibilité avec aria-pressed
 * - ✅ Responsive (masqué sur mobile)
 * - ✅ Performance optimisée
 */
const ViewToggle: React.FC = () => {
  const { isMapExpanded } = useUIState();
  const { setMapExpanded } = useUIActions();

  return (
    <div className="hidden md:flex">
      <div className="ml-2 flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-[0_1px_0_0_rgba(17,24,39,0.04)]">
        {/* Bouton Vue Liste */}
        <button
          className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition ${CSS_CLASSES.FOCUS_RING} ${
            !isMapExpanded
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium"
              : "text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => setMapExpanded(false)}
          aria-label="Afficher en mode liste"
          aria-pressed={!isMapExpanded}
          type="button"
        >
          <List className="h-4 w-4" />
          <span>Liste</span>
        </button>

        {/* Bouton Vue Carte */}
        <button
          className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition ${CSS_CLASSES.FOCUS_RING} ${
            isMapExpanded
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium"
              : "text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => setMapExpanded(true)}
          aria-label="Afficher en mode carte"
          aria-pressed={isMapExpanded}
          type="button"
        >
          <MapPin className="h-4 w-4" />
          <span>Carte</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(ViewToggle);

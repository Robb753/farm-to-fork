// FilterSection/components/ActiveFilters.tsx

import React from "react";
import { X } from "lucide-react";
import { CSS_CLASSES, A11Y_MESSAGES, type FilterKey } from "../utils/constants";
import { FilterState } from "@/lib/store/shared/types";

interface ActiveFiltersProps {
  filters: FilterState;
  activeFilterCount: number;
  onFilterToggle: <K extends FilterKey>(key: K, value: string) => void;
  onResetAll: () => void;
  className?: string;
}

/**
 * Composant pour afficher et gérer les filtres actifs
 *
 * Features:
 * - ✅ Affichage en chips des filtres actifs
 * - ✅ Suppression individuelle des filtres
 * - ✅ Reset global des filtres
 * - ✅ Accessibilité complète
 * - ✅ Performance optimisée
 */
const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  activeFilterCount,
  onFilterToggle,
  onResetAll,
  className = "",
}) => {
  // Ne pas afficher si aucun filtre actif
  if (activeFilterCount === 0) {
    return null;
  }

  return (
    <div
      className={`mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-3 py-1 ${className}`}
    >
      {/* Label */}
      <span className={`text-xs ${CSS_CLASSES.TEXT_MUTED}`}>
        Filtres actifs :
      </span>

      {/* Chips des filtres actifs */}
      {(Object.entries(filters) as [FilterKey, string[]][]).flatMap(
        ([key, values]) =>
          (values || []).map((value) => (
            <FilterChip
              key={`${String(key)}-${value}`}
              value={value}
              onRemove={() => onFilterToggle(key, value)}
            />
          ))
      )}

      {/* Bouton reset global */}
      <button
        onClick={onResetAll}
        className={`ml-2 text-xs ${CSS_CLASSES.TEXT_MUTED} hover:text-gray-700 transition-colors ${CSS_CLASSES.FOCUS_RING}`}
        aria-label={A11Y_MESSAGES.RESET_ALL}
      >
        Effacer tous les filtres
      </button>
    </div>
  );
};

/**
 * Composant chip individuel pour un filtre
 */
interface FilterChipProps {
  value: string;
  onRemove: () => void;
}

const FilterChip: React.FC<FilterChipProps> = React.memo(
  ({ value, onRemove }) => (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
      <span className="max-w-[120px] truncate" title={value}>
        {value}
      </span>
      <button
        onClick={onRemove}
        aria-label={`Retirer le filtre ${value}`}
        className={`text-emerald-700 hover:text-emerald-900 transition-colors rounded ${CSS_CLASSES.FOCUS_RING}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
);

FilterChip.displayName = "FilterChip";

export default React.memo(ActiveFilters);

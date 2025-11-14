// FilterSection/utils/constants.ts

/**
 * Constantes pour éviter les re-créations à chaque render
 */

import type { FilterState } from "@/lib/store/types";

// ✅ Types d'agriculture constants
export const AGRICULTURE_TYPES = [
  { id: "conventional", label: "Agriculture conventionnelle" },
  { id: "organic", label: "Agriculture biologique" },
  { id: "sustainable", label: "Agriculture durable" },
  { id: "reasoned", label: "Agriculture raisonnée" },
] as const;

// ✅ Clés de filtres typées
export type FilterKey = keyof FilterState;

export const FILTER_KEYS: readonly FilterKey[] = [
  "product_type",
  "certifications",
  "purchase_mode",
  "production_method",
  "additional_services",
  "availability",
  "mapType",
] as const;

// ✅ Délais de debounce
export const DEBOUNCE_DELAYS = {
  URL_SYNC: 300,
  SEARCH: 500,
  RESIZE: 150,
} as const;

// ✅ Z-index pour les dropdowns
export const Z_INDEX = {
  DROPDOWN: 10000,
  MODAL: 50,
  MOBILE_MODAL: 50,
} as const;

// ✅ Breakpoints pour la détection mobile
export const BREAKPOINTS = {
  MOBILE: 767,
  TABLET: 1024,
} as const;

// ✅ Classes CSS communes
export const CSS_CLASSES = {
  FOCUS_RING:
    "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded",
  BUTTON_BASE: "transition-colors hover:bg-gray-50",
  CHECKBOX_CHECKED: "border-emerald-600 bg-emerald-600",
  CHECKBOX_UNCHECKED: "border-gray-300 bg-white",
  BADGE_ACTIVE: "bg-emerald-600 text-white",
  TEXT_MUTED: "text-gray-500",
} as const;

// ✅ Messages d'accessibilité
export const A11Y_MESSAGES = {
  FILTER_SELECT: (item: string) => `Sélectionner ${item}`,
  FILTER_DESELECT: (item: string) => `Désélectionner ${item}`,
  CLEAR_SECTION: (section: string) => `Effacer les filtres ${section}`,
  RESET_ALL: "Effacer tous les filtres actifs",
  OPEN_MODAL: "Ouvrir le panneau de filtres avancés",
  CLOSE_MODAL: (section: string) => `Fermer le menu ${section}`,
  BACK_TO_LIST: "Retour à la liste",
} as const;

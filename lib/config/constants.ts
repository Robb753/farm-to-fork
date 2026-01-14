// lib/config/constants.ts
// Constantes centralisées pour l'application Farm-to-Fork

import type { FilterSection } from "@/lib/types/ui";

// ==================== PRODUITS ====================

/**
 * Types de produits disponibles
 */
export const PRODUCT_TYPES = [
  "Fruits",
  "Légumes",
  "Produits laitiers",
  "Viande",
  "Œufs",
  "Produits transformés",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

// ==================== CERTIFICATIONS ====================

export const CERTIFICATIONS = [
  "Label AB",
  "Label Rouge",
  "AOC/AOP",
  "IGP",
  "Demeter",
  "HVE",
] as const;

export type Certification = (typeof CERTIFICATIONS)[number];

// ==================== MODES D'ACHAT ====================

export const PURCHASE_MODES = [
  "Vente directe à la ferme",
  "Marché local",
  "Livraison à domicile",
  "Point de vente collectif",
  "Drive fermier",
  "Click & Collect",
] as const;

export type PurchaseMode = (typeof PURCHASE_MODES)[number];

// ==================== MÉTHODES DE PRODUCTION ====================

/**
 * Méthodes de production agricole
 */
export const PRODUCTION_METHODS = [
  "Agriculture conventionnelle",
  "Agriculture biologique",
  "Agriculture durable",
  "Agriculture raisonnée",
] as const;

export type ProductionMethod = (typeof PRODUCTION_METHODS)[number];

// ==================== SERVICES ADDITIONNELS ====================

export const ADDITIONAL_SERVICES = [
  "Visite de la ferme",
  "Ateliers de cuisine",
  "Dégustation",
  "Activités pour enfants",
  "Hébergement",
  "Réservation pour événements",
  "Événements pour professionnels",
] as const;

export type AdditionalService = (typeof ADDITIONAL_SERVICES)[number];

// ==================== DISPONIBILITÉ ====================

/**
 * Options de disponibilité des produits
 */
export const AVAILABILITY_OPTIONS = [
  "Saisonnière",
  "Toute l'année",
  "Pré-commande",
  "Sur abonnement",
  "Événements spéciaux",
] as const;

export type AvailabilityOption = (typeof AVAILABILITY_OPTIONS)[number];

// ==================== SECTIONS DE FILTRES ====================

/**
 * Configuration des sections de filtres pour l'interface utilisateur
 * Utilisé pour générer les modales de filtres
 */
export const FILTER_SECTIONS: FilterSection[] = [
  {
    id: "product_type",
    title: "Produits",
    options: PRODUCT_TYPES.map((type) => ({
      id: type.toLowerCase().replace(/\s+/g, "-"),
      label: type,
      value: type,
    })),
  },
  {
    id: "certifications",
    title: "Certifications",
    options: CERTIFICATIONS.map((cert) => ({
      id: cert.toLowerCase().replace(/[/\s]+/g, "-"),
      label: cert,
      value: cert,
    })),
  },
  {
    id: "purchase_mode",
    title: "Distribution",
    options: PURCHASE_MODES.map((mode) => ({
      id: mode.toLowerCase().replace(/\s+/g, "-"),
      label: mode,
      value: mode,
    })),
  },
  {
    id: "production_method",
    title: "Production",
    options: PRODUCTION_METHODS.map((method) => ({
      id: method.toLowerCase().replace(/\s+/g, "-"),
      label: method,
      value: method,
    })),
  },
  {
    id: "additional_services",
    title: "Services",
    options: ADDITIONAL_SERVICES.map((service) => ({
      id: service.toLowerCase().replace(/\s+/g, "-"),
      label: service,
      value: service,
    })),
  },
  {
    id: "availability",
    title: "Disponibilité",
    options: AVAILABILITY_OPTIONS.map((opt) => ({
      id: opt.toLowerCase().replace(/\s+/g, "-"),
      label: opt,
      value: opt,
    })),
  },
];

/**
 * Version legacy des sections de filtres (pour compatibilité)
 * @deprecated Utiliser FILTER_SECTIONS à la place
 */
export const filterSections = [
  {
    title: "Produits",
    key: "product_type",
    items: [...PRODUCT_TYPES],
  },
  {
    title: "Certifications",
    key: "certifications",
    items: [...CERTIFICATIONS],
  },
  {
    title: "Distribution",
    key: "purchase_mode",
    items: [...PURCHASE_MODES],
  },
  {
    title: "Production",
    key: "production_method",
    items: [...PRODUCTION_METHODS],
  },
  {
    title: "Services",
    key: "additional_services",
    items: [...ADDITIONAL_SERVICES],
  },
  {
    title: "Disponibilité",
    key: "availability",
    items: [...AVAILABILITY_OPTIONS],
  },
];

// ==================== COULEURS ====================

/**
 * Palette de couleurs principale de l'application
 * Extraites depuis email-notifications.js et autres fichiers
 */
export const COLORS = {
  // Couleurs principales
  PRIMARY: "#16a34a", // Vert principal Farm To Fork
  PRIMARY_BG: "#f0fdf4", // Fond vert clair
  PRIMARY_DARK: "#15803d", // Vert foncé pour les hovers

  // ✅ Accent (ex: doré)
  ACCENT: "#FFD700",
  ACCENT_BG: "#FFF6CC",

  // Couleurs de bordure et séparation
  BORDER: "#e5e7eb", // Bordure grise standard
  BORDER_LIGHT: "#f3f4f6", // Bordure grise claire
  BORDER_DARK: "#374151", // Bordure sombre pour footer/dark mode

  // Couleurs de texte
  TEXT_PRIMARY: "#111827", // Texte noir principal
  TEXT_SECONDARY: "#6b7280", // Texte gris secondaire
  TEXT_MUTED: "#9ca3af", // Texte gris atténué
  TEXT_LIGHT: "#666", // Texte gris clair (legacy)
  TEXT_WHITE: "#ffffff", // Texte blanc pour fond sombre

  // Couleurs de fond
  BG_WHITE: "#ffffff", // Fond blanc principal
  BG_GRAY: "#f9fafb", // Fond gris clair
  BG_GRAY_LIGHT: "#f3f4f6", // Fond gris très clair
  BG_DARK: "#111827", // Fond sombre pour footer/dark mode

  // Couleurs d'action et d'état
  LINK: "#2563eb", // Bleu pour les liens
  SUCCESS: "#16a34a", // Vert succès
  SUCCESS_BG: "#dcfce7", // Fond vert succès
  ERROR: "#dc2626", // Rouge erreur
  WARNING: "#f59e0b", // Orange avertissement
  INFO: "#3b82f6", // Bleu information
} as const;

/**
 * Type dérivé pour s'assurer que seules les couleurs définies sont utilisées
 */
export type ColorKey = keyof typeof COLORS;

/**
 * Helper pour vérifier qu'une couleur existe
 */
export const isValidColor = (color: string): color is ColorKey => {
  return color in COLORS;
};

/**
 * Helper pour obtenir une couleur avec fallback
 */
export const getColor = (colorKey: ColorKey, fallback?: string): string => {
  return COLORS[colorKey] || fallback || "#000000";
};

// ==================== CLÉS DE STOCKAGE ====================

/**
 * Clés pour le stockage local (localStorage)
 */
export const STORAGE_KEYS = {
  APP_STORE: "farm2fork-storage",
  USER_STORE: "farm2fork-user",
  SETTINGS_STORE: "farm2fork-settings",
  UNIFIED_STORE: "farm2fork-unified",
} as const;

// ==================== PARAMÈTRES DE PAGINATION ====================

/**
 * Paramètres de pagination pour les listings
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  LEGACY_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// ==================== LIMITES ET SEUILS ====================

/**
 * Limites diverses de l'application
 */
export const LIMITS = {
  // Texte
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_NAME_LENGTH: 100,
  MAX_ADDRESS_LENGTH: 200,

  // Listes
  MAX_IMAGES_PER_LISTING: 10,
  MAX_PRODUCTS_PER_LISTING: 50,

  // Performance
  DEBOUNCE_SEARCH_MS: 300,
  SPINNER_DELAY_MS: 200,
} as const;

// ==================== URLS ET ENDPOINTS ====================

/**
 * URLs et chemins de l'application
 * Note: Les URLs complètes avec domaine doivent utiliser process.env.NEXT_PUBLIC_SITE_URL
 */
export const PATHS = {
  // Pages
  HOME: "/",
  LISTINGS: "/listings",
  EDIT_LISTING: "/edit-listing",
  ADMIN: "/admin",
  ADMIN_NOTIFICATIONS: "/admin/notifications",
  REQUEST_CONFIRMATION: "/request-confirmation",
  SIGNUP_FARMER: "/signup-farmer",
  BECOME_FARMER: "/become-farmer",
  CONTACT: "/contact",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  DASHBOARD: "/dashboard",

  // API Routes
  API_LISTINGS: "/api/get-listings",
  API_VALIDATE_REQUEST: "/api/validate-farmer-request",
  API_GET_REQUESTS: "/api/get-farmer-requests",

  // Assets
  LOGO: "/logo.png",
} as const;

// ==================== FORMATS ====================

/**
 * Formats de date et heure
 */
export const DATE_FORMATS = {
  DISPLAY_FULL: {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  } as const,
  DISPLAY_DATE: {
    day: "2-digit",
    month: "long",
    year: "numeric",
  } as const,
  ISO_DATE: "YYYY-MM-DD",
} as const;

/**
 * Locale par défaut
 */
export const DEFAULT_LOCALE = "fr-FR";

// ==================== EXPORTS GROUPÉS ====================

/**
 * Export groupé de toutes les options de filtres
 */
export const FILTER_OPTIONS = {
  PRODUCT_TYPES,
  CERTIFICATIONS,
  PURCHASE_MODES,
  PRODUCTION_METHODS,
  ADDITIONAL_SERVICES,
  AVAILABILITY_OPTIONS,
} as const;

/**
 * Export groupé de toutes les constantes
 */
export const CONSTANTS = {
  COLORS,
  STORAGE_KEYS,
  PAGINATION,
  LIMITS,
  PATHS,
  DATE_FORMATS,
  DEFAULT_LOCALE,
} as const;

export const FEEDBACK_CONFIG = {
  SUBMIT_URL: "https://submit-form.com/6Rlha6Mzr",
  BASE_URL: "https://www.farmtofork.fr",
  SUCCESS_URL: "https://www.farmtofork.fr/feedback/success",
  ERROR_URL: "https://www.farmtofork.fr/feedback/error",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  FARMER: "farmer",
  USER: "user",
} as const;
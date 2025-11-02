// lib/config/index.ts
// Point d'entrée centralisé pour toutes les configurations

// ==================== EXPORTS DE CONSTANTS.TS ====================

export {
  // Types de produits
  PRODUCT_TYPES,
  type ProductType,

  // Certifications
  CERTIFICATIONS,
  type Certification,

  // Modes d'achat
  PURCHASE_MODES,
  type PurchaseMode,

  // Méthodes de production
  PRODUCTION_METHODS,
  type ProductionMethod,

  // Services additionnels
  ADDITIONAL_SERVICES,
  type AdditionalService,

  // Disponibilité
  AVAILABILITY_OPTIONS,
  type AvailabilityOption,

  // Sections de filtres
  FILTER_SECTIONS,
  filterSections, // Legacy

  // Couleurs
  COLORS,

  // Clés de stockage
  STORAGE_KEYS,

  // Pagination
  PAGINATION,

  // Limites
  LIMITS,

  // Chemins
  PATHS,

  // Formats de date
  DATE_FORMATS,
  DEFAULT_LOCALE,

  // Exports groupés
  FILTER_OPTIONS,
  CONSTANTS,
} from "./constants";

// ==================== EXPORTS DE MAP.CONFIG.TS ====================

export {
  // Configuration Mapbox
  MAPBOX_CONFIG,
  MAP_CENTER,

  // Styles
  MAP_STYLES,
  type MapStyle,

  // Marqueurs
  MARKER_CONFIG,

  // Clusters
  CLUSTER_CONFIG,

  // Popups
  POPUP_CONFIG,

  // Navigation
  NAVIGATION_CONFIG,

  // Géolocalisation
  GEOLOCATION_CONFIG,

  // Limites géographiques
  FRANCE_BOUNDS,
  REGIONS,
  type Region,

  // Performance
  PERFORMANCE_CONFIG,

  // Export groupé
  MAP_CONFIG,
} from "./map.config";

// ==================== EXPORTS DE EMAIL.CONFIG.TS ====================

export {
  // Configuration de base
  EMAIL_CONFIG,

  // Sujets
  EMAIL_SUBJECTS,

  // Styles
  EMAIL_STYLES,

  // Assets
  EMAIL_ASSETS,

  // Templates
  EMAIL_TEMPLATES,
  type EmailTemplate,

  // Formatters
  EMAIL_FORMATTERS,

  // Builders
  EMAIL_BUILDERS,

  // Export groupé
  MAIL_CONFIG,

  // Legacy
  mailConfigs,
} from "./email.config";

// ==================== EXPORTS DE DATABASE.CONFIG.TS ====================

export {
  // Tables
  TABLES,
  COMMON_COLUMNS,

  // Profiles
  PROFILES_COLUMNS,
  PROFILE_ROLES,
  type ProfileRole,
  PROFILE_SELECT_FIELDS,

  // Listing
  LISTING_COLUMNS,
  LISTING_SELECT_FIELDS,

  // Farmer requests
  FARMER_REQUESTS_COLUMNS,
  FARMER_REQUEST_STATUS,
  type FarmerRequestStatus,

  // Products
  PRODUCTS_COLUMNS,

  // RLS
  RLS_POLICIES,

  // Relations
  RELATIONS,

  // Storage buckets
  STORAGE_BUCKETS,

  // Helpers
  DB_HELPERS,

  // Export groupé
  DATABASE_CONFIG,
} from "./database.config";

// ==================== EXPORTS DE UPLOADS.CONFIG.TS ====================

export {
  // Limites de taille
  FILE_SIZE_LIMITS,
  FILE_SIZE_LIMITS_READABLE,

  // Types acceptés
  ACCEPTED_IMAGE_TYPES,
  type AcceptedImageType,
  ACCEPTED_IMAGE_EXTENSIONS,
  ACCEPTED_DOCUMENT_TYPES,
  type AcceptedDocumentType,
  ACCEPTED_DOCUMENT_EXTENSIONS,

  // Limites de quantité
  FILE_COUNT_LIMITS,

  // Compression
  IMAGE_COMPRESSION_CONFIG,
  THUMBNAIL_CONFIG,

  // Validation
  FILE_VALIDATORS,

  // Messages d'erreur
  UPLOAD_ERROR_MESSAGES,

  // Chemins de stockage
  STORAGE_PATHS,

  // Helpers
  UPLOAD_HELPERS,

  // Export groupé
  UPLOAD_CONFIG,
} from "./uploads.config";

// ==================== EXPORT GROUPÉ GLOBAL ====================

import * as ConstantsModule from "./constants";
import * as MapConfigModule from "./map.config";
import * as EmailConfigModule from "./email.config";
import * as DatabaseConfigModule from "./database.config";
import * as UploadsConfigModule from "./uploads.config";

/**
 * Export groupé de toutes les configurations pour un import simplifié
 *
 * @example
 * ```typescript
 * import { APP_CONFIG } from "@/lib/config";
 *
 * const colors = APP_CONFIG.constants.COLORS;
 * const mapCenter = APP_CONFIG.map.MAP_CENTER;
 * const emailFrom = APP_CONFIG.email.EMAIL_CONFIG.fromAddress;
 * ```
 */
export const APP_CONFIG = {
  /**
   * Constantes de l'application
   */
  constants: ConstantsModule,

  /**
   * Configuration de la carte
   */
  map: MapConfigModule,

  /**
   * Configuration des emails
   */
  email: EmailConfigModule,

  /**
   * Configuration de la base de données
   */
  database: DatabaseConfigModule,

  /**
   * Configuration des uploads
   */
  uploads: UploadsConfigModule,
} as const;

// ==================== TYPES D'HELPER ====================

/**
 * Type helper pour extraire les valeurs d'un objet const
 */
export type ValueOf<T> = T[keyof T];

/**
 * Type helper pour extraire les clés d'un objet const
 */
export type KeyOf<T> = keyof T;

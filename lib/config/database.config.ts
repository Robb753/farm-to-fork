// lib/config/database.config.ts
// Configuration de la base de données (noms de tables, schémas, etc.)

// ==================== NOMS DE TABLES ====================

/**
 * Noms des tables Supabase
 * Centralise tous les noms de tables pour éviter les typos
 */
export const TABLES = {
  /**
   * Table des profils utilisateurs
   */
  PROFILES: "profiles",

  /**
   * Table des listings (fermes, producteurs, points de vente)
   */
  LISTING: "listing",

  /**
   * Table des images de listings
   */
  LISTING_IMAGES: "listingImages",

  /**
   * Table des produits
   */
  PRODUCTS: "products",

  /**
   * Table des demandes d'accès producteur
   */
  FARMER_REQUESTS: "farmer_requests",

  /**
   * Table des favoris (relation user-listing)
   */
  FAVORITES: "favorites",

  /**
   * Table des avis/reviews
   */
  REVIEWS: "reviews",
} as const;

// ==================== COLONNES COMMUNES ====================

/**
 * Colonnes communes à plusieurs tables
 */
export const COMMON_COLUMNS = {
  ID: "id",
  CREATED_AT: "created_at",
  MODIFIED_AT: "modified_at",
  UPDATED_AT: "updated_at",
  PUBLISHED_AT: "published_at",
  DELETED_AT: "deleted_at",
  ACTIVE: "active",
} as const;

// ==================== SCHÉMA PROFILES ====================

/**
 * Colonnes de la table profiles
 */
export const PROFILES_COLUMNS = {
  ID: "id",
  EMAIL: "email",
  ROLE: "role",
  FAVORITES: "favorites",
  CREATED_AT: "created_at",
  UPDATED_AT: "updated_at",
  FIRST_NAME: "first_name",
  LAST_NAME: "last_name",
  PHONE: "phone",
  AVATAR_URL: "avatar_url",
} as const;

/**
 * Rôles possibles dans profiles
 */
export const PROFILE_ROLES = ["user", "farmer", "admin"] as const;
export type ProfileRole = (typeof PROFILE_ROLES)[number];

// ==================== SCHÉMA LISTING ====================

/**
 * Colonnes de la table listing
 */
export const LISTING_COLUMNS = {
  ID: "id",
  NAME: "name",
  ADDRESS: "address",
  LAT: "lat",
  LNG: "lng",
  AVAILABILITY: "availability",
  PRODUCT_TYPE: "product_type",
  CERTIFICATIONS: "certifications",
  PURCHASE_MODE: "purchase_mode",
  PRODUCTION_METHOD: "production_method",
  ADDITIONAL_SERVICES: "additional_services",
  RATING: "rating",
  DESCRIPTION: "description",
  EMAIL: "email",
  PHONE_NUMBER: "phoneNumber",
  WEBSITE: "website",
  ACTIVE: "active",
  CREATED_AT: "created_at",
  MODIFIED_AT: "modified_at",
  PUBLISHED_AT: "published_at",
  USER_ID: "user_id",
  FARM_NAME: "farm_name",
} as const;

// ==================== SCHÉMA FARMER_REQUESTS ====================

/**
 * Colonnes de la table farmer_requests
 */
export const FARMER_REQUESTS_COLUMNS = {
  ID: "id",
  USER_ID: "user_id",
  EMAIL: "email",
  FARM_NAME: "farm_name",
  LOCATION: "location",
  PHONE: "phone",
  WEBSITE: "website",
  DESCRIPTION: "description",
  PRODUCTS: "products",
  STATUS: "status",
  CREATED_AT: "created_at",
  UPDATED_AT: "updated_at",
  REVIEWED_BY: "reviewed_by",
  REVIEWED_AT: "reviewed_at",
  REJECTION_REASON: "rejection_reason",
} as const;

/**
 * Statuts possibles pour farmer_requests
 */
export const FARMER_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type FarmerRequestStatus =
  (typeof FARMER_REQUEST_STATUS)[keyof typeof FARMER_REQUEST_STATUS];

// ==================== SCHÉMA PRODUCTS ====================

/**
 * Colonnes de la table products
 */
export const PRODUCTS_COLUMNS = {
  ID: "id",
  NAME: "name",
  CATEGORY: "category",
  TYPE: "type",
  LABELS: "labels",
  LISTING_ID: "listing_id",
  CREATED_AT: "created_at",
  UPDATED_AT: "updated_at",
} as const;

// ==================== REQUÊTES COURANTES ====================

/**
 * Champs à sélectionner pour un listing complet
 */
export const LISTING_SELECT_FIELDS = [
  LISTING_COLUMNS.ID,
  LISTING_COLUMNS.NAME,
  LISTING_COLUMNS.ADDRESS,
  LISTING_COLUMNS.LAT,
  LISTING_COLUMNS.LNG,
  LISTING_COLUMNS.AVAILABILITY,
  LISTING_COLUMNS.PRODUCT_TYPE,
  LISTING_COLUMNS.CERTIFICATIONS,
  LISTING_COLUMNS.PURCHASE_MODE,
  LISTING_COLUMNS.PRODUCTION_METHOD,
  LISTING_COLUMNS.ADDITIONAL_SERVICES,
  LISTING_COLUMNS.RATING,
  LISTING_COLUMNS.DESCRIPTION,
  LISTING_COLUMNS.EMAIL,
  LISTING_COLUMNS.PHONE_NUMBER,
  LISTING_COLUMNS.WEBSITE,
  LISTING_COLUMNS.ACTIVE,
  LISTING_COLUMNS.CREATED_AT,
  LISTING_COLUMNS.MODIFIED_AT,
  LISTING_COLUMNS.PUBLISHED_AT,
].join(", ");

/**
 * Champs à sélectionner pour un profil complet
 */
export const PROFILE_SELECT_FIELDS = [
  PROFILES_COLUMNS.ID,
  PROFILES_COLUMNS.EMAIL,
  PROFILES_COLUMNS.ROLE,
  PROFILES_COLUMNS.FAVORITES,
  PROFILES_COLUMNS.FIRST_NAME,
  PROFILES_COLUMNS.LAST_NAME,
  PROFILES_COLUMNS.PHONE,
  PROFILES_COLUMNS.AVATAR_URL,
].join(", ");

// ==================== POLITIQUES RLS (Row Level Security) ====================

/**
 * Noms des politiques RLS pour référence
 */
export const RLS_POLICIES = {
  LISTING: {
    SELECT_PUBLIC: "listing_select_public",
    INSERT_FARMER: "listing_insert_farmer",
    UPDATE_OWN: "listing_update_own",
    DELETE_OWN: "listing_delete_own",
  },
  PROFILES: {
    SELECT_OWN: "profiles_select_own",
    UPDATE_OWN: "profiles_update_own",
  },
  FARMER_REQUESTS: {
    INSERT_AUTHENTICATED: "farmer_requests_insert_authenticated",
    SELECT_ADMIN: "farmer_requests_select_admin",
    UPDATE_ADMIN: "farmer_requests_update_admin",
  },
} as const;

// ==================== RELATIONS ====================

/**
 * Configuration des relations entre tables
 */
export const RELATIONS = {
  LISTING_TO_IMAGES: {
    foreignKey: "listing_id",
    referencedTable: TABLES.LISTING,
    referencedColumn: "id",
  },
  LISTING_TO_PRODUCTS: {
    foreignKey: "listing_id",
    referencedTable: TABLES.LISTING,
    referencedColumn: "id",
  },
  LISTING_TO_USER: {
    foreignKey: "user_id",
    referencedTable: TABLES.PROFILES,
    referencedColumn: "id",
  },
  FARMER_REQUEST_TO_USER: {
    foreignKey: "user_id",
    referencedTable: TABLES.PROFILES,
    referencedColumn: "id",
  },
} as const;

// ==================== BUCKETS STORAGE ====================

/**
 * Noms des buckets de stockage Supabase
 */
export const STORAGE_BUCKETS = {
  /**
   * Bucket pour les images de listings
   */
  LISTING_IMAGES: "listing-images",

  /**
   * Bucket pour les avatars utilisateurs
   */
  AVATARS: "avatars",

  /**
   * Bucket pour les documents (PDFs, certifications, etc.)
   */
  DOCUMENTS: "documents",
} as const;

// ==================== HELPERS ====================

/**
 * Helpers pour construire les requêtes
 */
export const DB_HELPERS = {
  /**
   * Construire une clause WHERE pour les filtres
   */
  buildFilterWhere: (filters: Record<string, string[]>) => {
    const conditions: string[] = [];

    Object.entries(filters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        // Pour les colonnes qui sont des tableaux (JSONB)
        conditions.push(`${key} && ARRAY[${values.map((v) => `'${v}'`).join(",")}]`);
      }
    });

    return conditions.length > 0 ? conditions.join(" AND ") : null;
  },

  /**
   * Construire une clause de tri
   */
  buildOrderBy: (column: string, direction: "asc" | "desc" = "desc") => {
    return `${column}.${direction}`;
  },

  /**
   * Construire une pagination
   */
  buildPagination: (page: number, pageSize: number) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  },
} as const;

// ==================== EXPORT GROUPÉ ====================

/**
 * Configuration complète de la base de données
 */
export const DATABASE_CONFIG = {
  tables: TABLES,
  commonColumns: COMMON_COLUMNS,
  profiles: {
    columns: PROFILES_COLUMNS,
    roles: PROFILE_ROLES,
    selectFields: PROFILE_SELECT_FIELDS,
  },
  listing: {
    columns: LISTING_COLUMNS,
    selectFields: LISTING_SELECT_FIELDS,
  },
  farmerRequests: {
    columns: FARMER_REQUESTS_COLUMNS,
    status: FARMER_REQUEST_STATUS,
  },
  products: {
    columns: PRODUCTS_COLUMNS,
  },
  rlsPolicies: RLS_POLICIES,
  relations: RELATIONS,
  storage: STORAGE_BUCKETS,
  helpers: DB_HELPERS,
} as const;

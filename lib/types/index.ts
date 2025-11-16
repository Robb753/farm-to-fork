// lib/types/index.ts
// Point d'entrée centralisé pour tous les types de l'application

// Énumérations
export * from "./enums";

// Types de store et d'état
export * from "../store/shared/types";

// Types UI
export * from "./ui";

// Réexportations nommées pour faciliter l'utilisation
export type {
  // Types de base
  LatLng,
  MapBounds,
  Listing,
  ListingImage,
  FilterState,
  UserProfile,
  Role,

  // Types d'état
  MapState,
  ListingsState,
  UserState,
  SettingsState,
  UIState,

  // Types de store (legacy)
  AppState,
  AppActions,
} from "../store/shared/types";

export type {
  // Types UI
  Product,
  ProductSelectorProps,
  FilterOption,
  FilterSection,
  ModalProps,
  LoadingProps,
  EmptyStateProps,
  StatusBadgeProps,
} from "./ui";

export {
  // Énumérations
  UserRole,
  Availability,
  Language,
  Theme,
  ProductType,
  Certification,
  PurchaseMode,
  ProductionMethod,
  AdditionalService,
  MapType,
} from "./enums";

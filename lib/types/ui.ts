// lib/types/ui.ts
// Types pour les composants UI et formulaires

/**
 * Produit agricole avec ses métadonnées
 */
export interface Product {
  name: string;
  category: string;
  type: string;
  labels: string[];
}

/**
 * Props pour le sélecteur de produits
 */
export interface ProductSelectorProps {
  selectedTypes: string[];
  selectedProducts: string[];
  onChange: (products: string[]) => void;
}

/**
 * Option de filtre générique
 */
export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

/**
 * Section de filtres avec ses options
 */
export interface FilterSection {
  id: string;
  title: string;
  options: FilterOption[];
}

/**
 * Props pour les modales
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

/**
 * Props pour les composants de chargement
 */
export interface LoadingProps {
  isLoading: boolean;
  message?: string;
}

/**
 * Props pour les états vides
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Badge de statut
 */
export interface StatusBadgeProps {
  status: "success" | "error" | "warning" | "info";
  label: string;
}

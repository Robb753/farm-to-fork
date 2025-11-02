// lib/types/enums.ts
// Énumérations pour remplacer les types littéraux string

/**
 * Rôles utilisateur dans l'application
 */
export enum UserRole {
  USER = "user",
  FARMER = "farmer",
  ADMIN = "admin",
}

/**
 * Statut de disponibilité d'un listing
 */
export enum Availability {
  OPEN = "open",
  CLOSED = "closed",
}

/**
 * Langues supportées dans l'application
 */
export enum Language {
  FR = "fr",
  EN = "en",
}

/**
 * Thèmes de l'application
 */
export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

/**
 * Types de produits disponibles
 */
export enum ProductType {
  FRUITS = "Fruits",
  LEGUMES = "Légumes",
  PRODUITS_LAITIERS = "Produits laitiers",
  VIANDE = "Viande",
  OEUFS = "Œufs",
  PRODUITS_TRANSFORMES = "Produits transformés",
}

/**
 * Certifications possibles
 */
export enum Certification {
  LABEL_AB = "Label AB",
  LABEL_ROUGE = "Label Rouge",
  AOC_AOP = "AOC/AOP",
  IGP = "IGP",
  DEMETER = "Demeter",
}

/**
 * Modes d'achat disponibles
 */
export enum PurchaseMode {
  VENTE_DIRECTE = "Vente directe",
  MARCHE_LOCAL = "Marché local",
  LIVRAISON = "Livraison",
  CLICK_COLLECT = "Click & Collect",
}

/**
 * Méthodes de production
 */
export enum ProductionMethod {
  CONVENTIONAL = "Conventional",
  ORGANIC = "Organic",
  SUSTAINABLE = "Sustainable",
  REASONED = "Reasoned",
}

/**
 * Services additionnels
 */
export enum AdditionalService {
  FARM_VISITS = "Farm visits",
  COOKING_WORKSHOPS = "Cooking workshops",
  TASTING = "Tasting",
  EDUCATIONAL_PROGRAMS = "Educational programs",
}

/**
 * Types de cartes supportés
 */
export enum MapType {
  STANDARD = "standard",
  SATELLITE = "satellite",
  TERRAIN = "terrain",
}

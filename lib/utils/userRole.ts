// lib/utils/userRole.ts
// Fonctions utilitaires pour la gestion des rôles utilisateur

/**
 * Type pour les métadonnées publiques Clerk
 */
export interface ClerkPublicMetadata {
  role?: string;
  [key: string]: any;
}

/**
 * Rôles valides dans l'application
 */
export const VALID_ROLES = ["user", "farmer", "admin"] as const;
export type ValidRole = typeof VALID_ROLES[number];

/**
 * Fonction utilitaire pour valider un rôle utilisateur
 *
 * @param role - Rôle à valider
 * @returns true si le rôle est valide
 *
 * @example
 * ```typescript
 * if (isValidUserRole("admin")) {
 *   console.log("Rôle admin valide");
 * }
 * ```
 */
export function isValidUserRole(role: string | undefined): role is ValidRole {
  if (!role) return false;
  return VALID_ROLES.includes(role as ValidRole);
}

/**
 * Fonction utilitaire pour extraire le rôle depuis les métadonnées Clerk
 *
 * @param metadata - Métadonnées publiques Clerk
 * @returns Rôle extrait et validation
 *
 * @example
 * ```typescript
 * const { role, hasRole, isValid } = extractUserRole(user.publicMetadata);
 * if (isValid) {
 *   console.log(`Rôle valide: ${role}`);
 * }
 * ```
 */
export function extractUserRole(metadata: ClerkPublicMetadata | null | undefined): {
  role: string | undefined;
  hasRole: boolean;
  isValid: boolean;
} {
  const role = metadata?.role as string | undefined;
  const hasRole = !!role;
  const isValid = isValidUserRole(role);

  return { role, hasRole, isValid };
}

/**
 * Vérifie si un utilisateur a un rôle spécifique
 *
 * @param metadata - Métadonnées publiques Clerk
 * @param targetRole - Rôle cible à vérifier
 * @returns true si l'utilisateur a le rôle spécifié
 *
 * @example
 * ```typescript
 * if (hasRole(user.publicMetadata, "admin")) {
 *   // Logique pour les admins
 * }
 * ```
 */
export function hasRole(
  metadata: ClerkPublicMetadata | null | undefined,
  targetRole: ValidRole
): boolean {
  const { role, isValid } = extractUserRole(metadata);
  return isValid && role === targetRole;
}

/**
 * Vérifie si un utilisateur a au moins un des rôles spécifiés
 *
 * @param metadata - Métadonnées publiques Clerk
 * @param roles - Liste des rôles acceptés
 * @returns true si l'utilisateur a au moins un des rôles
 *
 * @example
 * ```typescript
 * if (hasAnyRole(user.publicMetadata, ["admin", "farmer"])) {
 *   // Accès autorisé pour admin ou farmer
 * }
 * ```
 */
export function hasAnyRole(
  metadata: ClerkPublicMetadata | null | undefined,
  roles: ValidRole[]
): boolean {
  const { role, isValid } = extractUserRole(metadata);
  return isValid && roles.includes(role as ValidRole);
}

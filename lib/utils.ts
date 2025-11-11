// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitaire pour combiner des classes CSS avec Tailwind
 *
 * Combine clsx et tailwind-merge pour gérer:
 * - Les classes conditionnelles
 * - La déduplication des classes Tailwind conflictuelles
 *
 * @param inputs - Classes CSS à combiner
 * @returns Classes CSS optimisées
 *
 * @example
 * ```typescript
 * cn("px-4 py-2", isActive && "bg-blue-500", "px-6")
 * // Result: "py-2 bg-blue-500 px-6" (px-4 mergé avec px-6)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Utilitaire pour formater les coordonnées géographiques
 */
export function formatCoordinate(coord: number, precision: number = 6): string {
  return coord.toFixed(precision);
}

/**
 * Utilitaire pour valider un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Utilitaire pour valider un numéro de téléphone français
 */
export function isValidPhoneFR(phone: string): boolean {
  const phoneRegex = /^(?:(?:\+33|0)[1-9](?:[0-9]{8}))$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Formate un numéro de téléphone français pour l'affichage
 */
export function formatPhoneFR(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("33")) {
    // Format international
    return `+33 ${cleaned.slice(2).replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")}`;
  } else if (cleaned.startsWith("0")) {
    // Format national
    return cleaned.replace(
      /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
      "$1 $2 $3 $4 $5"
    );
  }

  return phone;
}

/**
 * Utilitaire pour slugifier un string (URL-safe)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, "") // Garder seulement lettres, chiffres, espaces et tirets
    .trim()
    .replace(/[\s_-]+/g, "-") // Remplacer espaces et underscores par des tirets
    .replace(/^-+|-+$/g, ""); // Supprimer tirets en début/fin
}

/**
 * Utilitaire pour capitaliser la première lettre
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Utilitaire pour tronquer un texte
 */
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

/**
 * Utilitaire pour formater une date relative (ex: "il y a 2 heures")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffInMs = now.getTime() - targetDate.getTime();

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "À l'instant";
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;

  return targetDate.toLocaleDateString("fr-FR");
}

/**
 * Utilitaire pour détecter si on est côté client
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Utilitaire pour détecter si on est sur mobile
 */
export function isMobile(): boolean {
  if (!isClient()) return false;
  return window.innerWidth < 768;
}

/**
 * Utilitaire pour créer un délai (Promise-based)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utilitaire pour débounce une fonction
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Utilitaire pour throttle une fonction
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Utilitaire pour générer un ID unique
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Utilitaire pour copier du texte dans le presse-papier
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isClient()) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback pour les navigateurs plus anciens
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  }
}

/**
 * Utilitaire pour parser des paramètres URL
 */
export function parseURLParams(url: string): Record<string, string> {
  try {
    const searchParams = new URL(url).searchParams;
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

/**
 * Utilitaire pour formater un prix en euros
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/**
 * Utilitaire pour générer une couleur à partir d'un string (pour avatars)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Type guard pour vérifier si une valeur est définie
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard pour vérifier si une chaîne n'est pas vide
 */
export function isNonEmptyString(
  value: string | null | undefined
): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Utilitaire pour créer un range de nombres
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Utilitaire pour grouper des éléments d'un tableau
 */
export function groupBy<T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (grouped, item) => {
      const key = getKey(item);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
      return grouped;
    },
    {} as Record<K, T[]>
  );
}

/**
 * Export des utilitaires les plus utilisés
 */
export { clsx, type ClassValue };

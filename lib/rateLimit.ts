/**
 * lib/rateLimit.ts
 *
 * Rate limiter in-memory avec sliding window.
 *
 * ⚠️  LIMITATION SERVERLESS : chaque instance Lambda/Edge a sa propre mémoire.
 *     Ce rate limiter est efficace contre les rafales rapides sur une instance chaude,
 *     mais ne garantit pas une limite globale stricte en environnement distribué.
 *
 * ✅  UPGRADE : Pour une limite globale en production, remplacer par Upstash :
 *     https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *     npm install @upstash/ratelimit @upstash/redis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitConfig {
  /** Nombre maximum de requêtes autorisées par fenêtre */
  maxRequests: number;
  /** Durée de la fenêtre en millisecondes */
  windowMs: number;
}

export interface RateLimitResult {
  /** true si la requête est autorisée */
  success: boolean;
  /** Nombre de requêtes restantes dans la fenêtre courante */
  remaining: number;
  /** Timestamp (ms) auquel la fenêtre se réinitialise */
  resetAt: number;
}

// Store global (partagé par toutes les routes dans une même instance)
const store = new Map<string, RateLimitEntry>();

// Nettoyage des entrées expirées toutes les 5 minutes
let lastCleanup = Date.now();
function maybeCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

/**
 * Vérifie et incrémente le compteur pour une clé donnée.
 *
 * @param key     Clé unique (ex: "orders:user_abc123" ou "orders:ip:1.2.3.4")
 * @param config  Limites à appliquer
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  maybeCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // Fenêtre expirée ou première requête → nouvelle fenêtre
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.maxRequests - 1, resetAt };
  }

  // Limite atteinte
  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Incrémenter dans la fenêtre courante
  entry.count += 1;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Extrait l'IP du client depuis les headers Next.js.
 * Utilise x-forwarded-for (Vercel/proxy) en priorité, sinon x-real-ip.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Configs prédéfinies par type d'endpoint.
 * Ajuster selon le trafic réel observé en production.
 */
export const RATE_LIMITS = {
  /** Création de commandes : 10 par minute par utilisateur */
  orders: { maxRequests: 10, windowMs: 60_000 },
  /** Revendication de ferme : 5 par minute par utilisateur */
  claimFarm: { maxRequests: 5, windowMs: 60_000 },
  /** Soumission onboarding : 3 tentatives par 5 minutes par utilisateur */
  onboarding: { maxRequests: 3, windowMs: 5 * 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

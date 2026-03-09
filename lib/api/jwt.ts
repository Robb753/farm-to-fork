/**
 * Extrait le `sub` (userId Clerk) du payload JWT sans vérifier la signature.
 *
 * Sécurité : acceptable car Supabase vérifie la signature côté DB/RLS.
 * Cette fonction ne sert qu'à identifier l'utilisateur pour le rate-limiting
 * et la construction du client Supabase ; l'accès aux données reste contrôlé par RLS.
 */
export function getJwtSub(token: string): string | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const json = Buffer.from(padded, "base64").toString("utf8");
    const data = JSON.parse(json) as { sub?: unknown };

    return typeof data.sub === "string" && data.sub.length > 0
      ? data.sub
      : null;
  } catch {
    return null;
  }
}

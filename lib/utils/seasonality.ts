// lib/utils/seasonality.ts
// Logique métier pour les produits de saison — sans logique dans les composants UI.

export interface SeasonalProduct {
  name: string;
  seasonal: boolean;
  season_start: string | null;
  season_end: string | null;
}

const STRAWBERRY_PATTERNS = ["fraise", "fraises", "strawberry"];

function isStrawberry(name: string): boolean {
  const lower = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return STRAWBERRY_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Retourne true si la liste de produits contient au moins une fraise
 * actuellement en saison (seasonal + today ∈ [season_start, season_end]).
 */
export function hasSeasonalStrawberries(
  products?: SeasonalProduct[] | null
): boolean {
  if (!products?.length) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return products.some((p) => {
    if (!isStrawberry(p.name)) return false;
    if (!p.seasonal) return false;
    if (!p.season_start || !p.season_end) return false;

    const start = new Date(p.season_start);
    const end = new Date(p.season_end);

    // Guard against invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

    return today >= start && today <= end;
  });
}

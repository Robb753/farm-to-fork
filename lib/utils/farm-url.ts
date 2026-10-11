/** Public farm page only; order and claim routes have their own parameters. */
export function getPublicFarmUrl(farm: {
  id: number | string;
  slug?: string | null;
}): string {
  return farm.slug
    ? `/farm/${encodeURIComponent(farm.slug)}`
    : `/farm/id/${encodeURIComponent(String(farm.id))}`;
}

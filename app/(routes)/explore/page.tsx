// app/explore/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import Explore from "@/app/_components/layout/Explore";

export const metadata: Metadata = {
  title: "Explorer les fermes | Farm to Fork",
  description:
    "Explorez la carte interactive des producteurs locaux en France. Trouvez des fermes, marchés et produits fermiers près de chez vous.",
  openGraph: {
    title: "Explorer les fermes | Farm to Fork",
    description:
      "Carte interactive des producteurs locaux — fermes, marchés et produits fermiers en circuits courts.",
    type: "website",
  },
};

/**
 * Skeleton layout-preserving fallback matching the split-screen map+listing layout.
 * Using fixed dimensions prevents CLS when the real content streams in.
 */
function ExploreSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col" aria-hidden="true">
      {/* Filter bar */}
      <div className="sticky top-0 border-b shadow-sm bg-white h-16 animate-pulse" />

      {/* Split view */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Listing panel */}
        <div className="w-full md:basis-1/2 overflow-y-auto p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-3 shadow-sm flex gap-4">
              <div className="h-28 w-40 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse" />
                <div className="h-3.5 w-2/3 bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map panel */}
        <div className="hidden md:block md:basis-1/2 bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Page d'exploration des producteurs et fermes
 *
 * Server Component wrapper: exports metadata + streams static shell.
 * <Explore /> is a client component containing all map/filter/listing logic.
 */
export default function ExplorePage(): JSX.Element {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <Explore />
    </Suspense>
  );
}

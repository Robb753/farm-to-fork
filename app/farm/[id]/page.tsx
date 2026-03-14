// app/farm/[id]/page.tsx
import Link from "next/link";
import { ChevronRight, Loader2, MapPin } from "lucide-react";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";
import type { Metadata } from "next";

import { supabaseServerPublic } from "@/utils/supabase/server-public";

// Composants enfants (tous "use client" — s'hydratent normalement)
import HeroSection from "./_components/HeroSection";
import FarmTabsClient from "./_components/FarmTabsClient";
import ContactCard from "./_components/ContactCard";
import OpeningHoursCard from "./_components/OpeningHoursCard";
import MapCard from "./_components/MapCard";

type ListingWithImages = Database["public"]["Tables"]["listing"]["Row"] & {
  listingImages: Database["public"]["Tables"]["listingImages"]["Row"][];
};

interface PageProps {
  params: { id: string };
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getListing(id: string): Promise<ListingWithImages | null> {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) return null;

  const { data, error } = await supabaseServerPublic
    .from("listing")
    .select(`*, listingImages (*)`)
    .eq("id", parsedId)
    .or(
      "active.eq.true,and(active.eq.false,osm_id.not.is.null,clerk_user_id.is.null)"
    )
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    console.error("Supabase error [farm page]:", error);
    return null;
  }

  return data as ListingWithImages;
}

// ─── generateMetadata ────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const listing = await getListing(params.id);
  if (!listing) return { title: "Ferme introuvable | Farm To Fork" };

  return {
    title: `${listing.name ?? "Ferme locale"} | Farm To Fork`,
    description:
      listing.description?.slice(0, 155) ??
      `Découvrez ${listing.name ?? "cette ferme locale"} – produits frais et locaux près de chez vous.`,
  };
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SidebarCardSkeleton(): JSX.Element {
  return (
    <div className="bg-white rounded-lg p-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FarmPage({
  params,
}: PageProps): Promise<JSX.Element> {
  const listing = await getListing(params.id);

  // 404 serveur immédiat — pas de flash loader → EmptyState
  if (!listing) notFound();

  const breadcrumbItems = [
    { href: "/", label: "Accueil" },
    { href: "/explore", label: "Explorer" },
    { href: null, label: listing.name ?? "Ferme" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section principale */}
          <main className="lg:col-span-2 space-y-6">
            {/* Bannière de revendication */}
            {listing.osm_id && !listing.clerk_user_id && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2 text-amber-800 text-sm">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-amber-600" />
                  <span>
                    <strong>Propriétaire de cette ferme ?</strong> Cette fiche a
                    été pré-enregistrée depuis OpenStreetMap et attend
                    d&apos;être revendiquée.
                  </span>
                </div>
                <Link
                  href={`/farm/${listing.id}/claim`}
                  className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Revendiquer cette ferme
                </Link>
              </div>
            )}

            {/* Fil d'Ariane */}
            <nav
              className="flex flex-wrap items-center gap-2 text-sm mb-2"
              aria-label="Fil d'Ariane"
            >
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "text-gray-500 hover:text-green-600 transition-colors",
                        "hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 rounded-sm"
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-green-700 font-medium truncate max-w-[200px] sm:max-w-[300px]">
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>

            {/* Hero Section */}
            <Suspense
              fallback={
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              }
            >
              <HeroSection listing={listing} />
            </Suspense>

            {/* Onglets (état + analytics côté client) */}
            <FarmTabsClient listing={listing} />
          </main>

          {/* Sidebar */}
          <aside className="space-y-6 order-first lg:order-last">
            <div className="sticky top-6 space-y-6 z-20">
              <Suspense fallback={<SidebarCardSkeleton />}>
                <ContactCard listing={listing} />
              </Suspense>

              <Suspense fallback={<SidebarCardSkeleton />}>
                <OpeningHoursCard listing={listing} />
              </Suspense>

              <Suspense fallback={<SidebarCardSkeleton />}>
                <MapCard listing={listing} />
              </Suspense>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      parameters: Record<string, unknown>
    ) => void;
  }
}

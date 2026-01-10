"use client";

import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense, useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase/client";
import type { Database } from "@/lib/types/database";

// Import des composants enfants
import HeroSection from "./_components/HeroSection";
import PresentationTab from "./_components/PresentationTab";
import BoutiqueTab from "@/app/modules/shop/BoutiqueTab";
import ServicesTab from "./_components/ServicesTab";
import ReviewsTab from "./_components/ReviewsTab";
import ContactCard from "./_components/ContactCard";
import OpeningHoursCard from "./_components/OpeningHoursCard";
import MapCard from "./_components/MapCard";

/**
 * Type pour un listing avec ses images et relations
 */
type ListingWithImages = Database["public"]["Tables"]["listing"]["Row"] & {
  listingImages: Database["public"]["Tables"]["listingImages"]["Row"][];
};

/**
 * Types des onglets disponibles
 */
type TabValue = "presentation" | "boutique" | "services" | "avis";

/**
 * Configuration des onglets avec métadonnées
 */
const TABS_CONFIG: Array<{
  value: TabValue;
  label: string;
  description: string;
  icon?: string;
}> = [
  {
    value: "presentation",
    label: "Présentation",
    description: "Découvrez l'histoire et les valeurs de la ferme",
    icon: "🏪",
  },
  {
    value: "boutique",
    label: "Boutique",
    description: "Achetez les produits de cette ferme",
    icon: "🛒",
  },
  {
    value: "services",
    label: "Services",
    description: "Services proposés par la ferme",
    icon: "⚙️",
  },
  {
    value: "avis",
    label: "Avis",
    description: "Avis et témoignages clients",
    icon: "⭐",
  },
];

/**
 * Composant principal d'affichage d'un listing de ferme
 */
export default function FarmPage(): JSX.Element {
  const params = useParams();
  const idParam = params?.id;

  const [listing, setListing] = useState<ListingWithImages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("presentation");

  /**
   * Charger les données du listing
   */
  useEffect(() => {
    async function loadListing() {
      // Vérifier que le paramètre existe
      if (!idParam || typeof idParam !== "string") {
        setIsLoading(false);
        setListing(null);
        return;
      }

      const parsedId = parseInt(idParam, 10);

      // Vérifier que c'est un nombre valide
      if (isNaN(parsedId)) {
        setIsLoading(false);
        setListing(null);
        return;
      }

      try {
        setIsLoading(true);

        // Charger le listing avec ses images
        const { data: listingData, error: listingError } = await supabase
          .from("listing")
          .select(
            `
            *,
            listingImages (*)
          `
          )
          .eq("id", parsedId)
          .eq("active", true)
          .single();

        if (listingError) {
          console.error("Supabase error:", listingError);
          throw listingError;
        }

        setListing(listingData as ListingWithImages);
      } catch (error) {
        console.error("Erreur chargement ferme:", error);
        setListing(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadListing();
  }, [idParam]);

  /**
   * Analytics: Track tab switches
   */
  const handleTabChange = (value: string): void => {
    const tabValue = value as TabValue;
    setActiveTab(tabValue);

    // Analytics tracking
    if (listing && typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "tab_switch", {
        event_category: "listing_interaction",
        event_label: tabValue,
        listing_id: listing.id,
        listing_name: listing.name,
      });
    }
  };

  /**
   * Analytics: Track page view
   */
  useEffect(() => {
    if (listing && typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "listing_view", {
        event_category: "listing",
        event_label: listing.name,
        listing_id: listing.id,
        value: 1,
      });
    }
  }, [listing]);

  /**
   * Génère le breadcrumb dynamique
   */
  const breadcrumbItems = [
    { href: "/", label: "Accueil" },
    { href: "/explore", label: "Explorer" },
    { href: null, label: listing?.name || "Ferme" },
  ];

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
          <p className="text-gray-500">
            Chargement des informations de la ferme...
          </p>
        </div>
      </div>
    );
  }

  // Ferme non trouvée
  if (!listing) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Layout responsive avec grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section principale (Tabs & Hero) */}
          <main className="lg:col-span-2 space-y-6">
            {/* Fil d'Ariane amélioré */}
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

            {/* Système d'onglets amélioré */}
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList
                className={cn(
                  "grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1",
                  "bg-white/80 backdrop-blur-sm shadow-sm border",
                  "rounded-xl"
                )}
              >
                {TABS_CONFIG.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative flex flex-col items-center gap-1 p-3",
                      "text-xs sm:text-sm font-medium",
                      "transition-all duration-200",
                      "data-[state=active]:bg-green-600 data-[state=active]:text-white",
                      "data-[state=active]:shadow-lg data-[state=active]:scale-105",
                      "hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500",
                      "rounded-lg"
                    )}
                    aria-label={tab.description}
                  >
                    <span className="text-base sm:hidden">{tab.icon}</span>
                    <span className="hidden sm:inline text-lg">{tab.icon}</span>
                    <span className="truncate max-w-full">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Contenu des onglets */}
              <div className="mt-6">
                <TabsContent value="presentation" className="space-y-6">
                  <Suspense fallback={<TabContentSkeleton />}>
                    <PresentationTab listing={listing} />
                  </Suspense>
                </TabsContent>

                <TabsContent value="boutique" className="space-y-6">
                  <Suspense fallback={<TabContentSkeleton />}>
                    <BoutiqueTab listing={listing} />
                  </Suspense>
                </TabsContent>

                <TabsContent value="services" className="space-y-6">
                  <Suspense fallback={<TabContentSkeleton />}>
                    <ServicesTab listing={listing} />
                  </Suspense>
                </TabsContent>

                <TabsContent value="avis" className="space-y-6">
                  <Suspense fallback={<TabContentSkeleton />}>
                    <ReviewsTab listing={listing} />
                  </Suspense>
                </TabsContent>
              </div>
            </Tabs>
          </main>

          {/* Sidebar avec cartes d'informations */}
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

/**
 * Skeleton pour le contenu des onglets
 */
function TabContentSkeleton(): JSX.Element {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-6 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton pour les cartes de la sidebar
 */
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

/**
 * Types déclarés globalement pour analytics
 */
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      parameters: Record<string, any>
    ) => void;
  }
}

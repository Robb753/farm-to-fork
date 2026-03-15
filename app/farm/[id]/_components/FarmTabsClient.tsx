// app/farm/[id]/_components/FarmTabsClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

import dynamic from "next/dynamic";

const PresentationTab = dynamic(() => import("./PresentationTab"), {
  ssr: false,
  loading: () => <TabContentSkeleton />,
});
const BoutiqueTab = dynamic(() => import("@/app/modules/shop/BoutiqueTab"), {
  ssr: false,
  loading: () => <TabContentSkeleton />,
});
const ServicesTab = dynamic(() => import("./ServicesTab"), {
  ssr: false,
  loading: () => <TabContentSkeleton />,
});
const ReviewsTab = dynamic(() => import("./ReviewsTab"), {
  ssr: false,
  loading: () => <TabContentSkeleton />,
});

type ListingWithImages = Database["public"]["Tables"]["listing"]["Row"] & {
  listingImages: Database["public"]["Tables"]["listingImages"]["Row"][];
};

type TabValue = "presentation" | "boutique" | "services" | "avis";

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

interface FarmTabsClientProps {
  listing: ListingWithImages;
}

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

export default function FarmTabsClient({
  listing,
}: FarmTabsClientProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabValue>("presentation");

  // Analytics: page view (une seule fois au montage)
  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "listing_view", {
        event_category: "listing",
        event_label: listing.name,
        listing_id: listing.id,
        value: 1,
      });
    }
  }, [listing.id, listing.name]);

  const handleTabChange = (value: string): void => {
    const tabValue = value as TabValue;
    setActiveTab(tabValue);

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "tab_switch", {
        event_category: "listing_interaction",
        event_label: tabValue,
        listing_id: listing.id,
        listing_name: listing.name,
      });
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
  );
}

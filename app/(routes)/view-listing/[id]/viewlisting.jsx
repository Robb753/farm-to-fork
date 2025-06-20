"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeroSection from "../_components/HeroSection";
import PresentationTab from "../_components/PresentationTab";
import ProductsTab from "../_components/ProductsTab";
import ServicesTab from "../_components/ServicesTab";
import ReviewsTab from "../_components/ReviewsTab";
import ContactCard from "../_components/ContactCard";
import OpeningHoursCard from "../_components/OpeningHoursCard";
import MapCard from "../_components/MapCard";

export default function ViewListing({ listing }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section principale (Tabs & Hero) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fil d'Ariane */}
          <nav className="flex flex-wrap items-center gap-2 text-sm mb-2">
            <Link
              href="/"
              className="text-gray-500 hover:text-green-600 transition-colors"
            >
              Accueil
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link
              href="/explore"
              className="text-gray-500 hover:text-green-600 transition-colors"
            >
              Explorer
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-green-700 font-medium truncate max-w-[200px]">
              {listing?.name}
            </span>
          </nav>

          <HeroSection listing={listing} />

          <Tabs defaultValue="presentation" className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
              <TabsTrigger value="presentation">Présentation</TabsTrigger>
              <TabsTrigger value="produits">Produits</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="avis">Avis</TabsTrigger>
            </TabsList>

            <TabsContent value="presentation">
              <PresentationTab listing={listing} />
            </TabsContent>

            <TabsContent value="produits">
              <ProductsTab listing={listing} />
            </TabsContent>

            <TabsContent value="services">
              <ServicesTab listing={listing} />
            </TabsContent>

            <TabsContent value="avis">
              <ReviewsTab listing={listing} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar (cartes infos) */}
        <div className="space-y-6">
          <ContactCard listing={listing} />
          <OpeningHoursCard />
          <MapCard listing={listing} />
        </div>
      </div>
    </div>
  );
}

"use client";

<MapCard listing={listing} />;

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Heart,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ChevronRight,
} from "@/utils/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ViewListingg({ listing }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = () => setIsFavorite((prev) => !prev);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
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
          {listing.name}
        </span>
      </nav>

      {/* Title & Favorite */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {listing.name || "Ferme locale"}
        </h1>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFavorite}
          className={`rounded-full h-10 w-10 ${
            isFavorite ? "border-red-400 text-red-500" : "border-gray-300"
          }`}
        >
          <Heart className={isFavorite ? "fill-current" : ""} />
        </Button>
      </div>

      {/* Main Layout */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-8">
          {/* Hero Image */}
          <div className="rounded-xl overflow-hidden shadow-md mb-6">
            {listing.listingImages?.[0]?.url ? (
              <Image
                src={listing.listingImages[0].url}
                alt={`Image de ${listing.name}`}
                width={1200}
                height={600}
                className="w-full h-[300px] object-cover"
                priority
              />
            ) : (
              <div className="bg-gray-200 h-[300px] flex items-center justify-center">
                <span className="text-gray-500">Aucune image disponible</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="presentation">
            <TabsList className="bg-green-50 p-1 rounded-lg">
              <TabsTrigger value="presentation">Présentation</TabsTrigger>
              <TabsTrigger value="produits">Produits</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>

            {/* Présentation */}
            <TabsContent value="presentation">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {listing.description || "Aucune description disponible."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Produits */}
            <TabsContent value="produits">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Produits proposés</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {listing.products?.length > 0 ? (
                    listing.products.map((product, index) => (
                      <Badge key={index} variant="outline">
                        {product}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500">Aucun produit listé.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services */}
            <TabsContent value="services">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Services disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Visites de la ferme</li>
                    <li>Cueillettes saisonnières</li>
                    <li>Dégustations sur place</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Call to Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button className="bg-green-600 hover:bg-green-700">
              Demander une visite
            </Button>
            <Button
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              Acheter directement
            </Button>
          </div>
        </div>

        {/* Right Column - Contact Info */}
        <div className="space-y-6 sticky top-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="text-green-600 w-5 h-5" />
                <span className="text-gray-700">
                  {listing.address || "Adresse non renseignée"}
                </span>
              </div>
              {listing.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="text-green-600 w-5 h-5" />
                  <span className="text-gray-700">{listing.phone}</span>
                </div>
              )}
              {listing.email && (
                <div className="flex items-center gap-3">
                  <Mail className="text-green-600 w-5 h-5" />
                  <span className="text-gray-700">{listing.email}</span>
                </div>
              )}
              {listing.website && (
                <div className="flex items-center gap-3">
                  <Globe className="text-green-600 w-5 h-5" />
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:underline"
                  >
                    {listing.website}
                  </a>
                </div>
              )}
              {listing.openingHours && (
                <div className="flex items-center gap-3">
                  <Clock className="text-green-600 w-5 h-5" />
                  <div className="text-gray-700 text-sm">
                    {listing.openingHours}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

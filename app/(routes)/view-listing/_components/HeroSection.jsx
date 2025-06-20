"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Slider from "./Slider";
import {
  Heart,
  Share2,
  MapPin,
  Star,
  Leaf,
  Award,
  Users,
  Calendar,
} from "@/utils/icons";

export default function HeroSection({ listing }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const images = listing?.listingImages || [];
  const certifications = listing?.certifications || [];
  const address = listing?.address || "Adresse inconnue";
  const name = listing?.name || "Ferme locale";

  return (
    <div className="overflow-hidden rounded-lg shadow-sm border bg-white">
      {/* Image Slider */}
      {images.length > 0 ? (
        <Slider imageList={images.map((img) => ({ url: img.url }))} />
      ) : (
        <div className="h-96 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">Aucune image disponible</span>
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-2">
            <h1 className="text-2xl font-bold text-green-800">{name}</h1>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              {/* Rating */}
              <div className="flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400" />
                ))}
                <span className="text-gray-600 ml-1">(127 avis)</span>
              </div>

              {/* Bio Badge */}
              <Badge className="bg-green-100 text-green-800">
                <Leaf className="h-3 w-3 mr-1" />
                Agriculture Biologique
              </Badge>
            </div>

            <p className="text-muted-foreground text-sm flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {address}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFavorite(!isFavorite)}
              className={isFavorite ? "text-red-500 border-red-200" : ""}
              aria-label="Ajouter aux favoris"
            >
              <Heart
                className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
              />
            </Button>
            <Button variant="outline" size="icon" aria-label="Partager">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Badges (wrap) */}
        <div className="flex flex-wrap gap-2">
          {certifications.length > 0 && (
            <Badge variant="outline" className="flex items-center">
              <Award className="h-3 w-3 mr-1" />
              {certifications.join(", ")}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            Ferme Familiale
          </Badge>
          <Badge variant="outline" className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Depuis 1985
          </Badge>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm">
            Demander une visite
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-green-600 text-green-700 text-sm"
          >
            Acheter directement
          </Button>
        </div>
      </div>
    </div>
  );
}

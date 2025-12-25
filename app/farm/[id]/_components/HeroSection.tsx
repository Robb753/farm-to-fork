"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Calendar,
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Phone,
  Globe,
} from "@/utils/icons";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing avec ses images
 */
type ListingWithImages = Database["public"]["Tables"]["listing"]["Row"] & {
  listingImages?: Database["public"]["Tables"]["listingImages"]["Row"][];
};

/**
 * Props du composant HeroSection
 */
interface HeroSectionProps {
  listing: ListingWithImages;
  className?: string;
}

/**
 * Composant Hero Section d'un listing de ferme
 *
 * Features:
 * - Galerie d'images avec navigation
 * - Informations principales de la ferme
 * - Note et avis (statiques pour éviter hydration mismatch)
 * - Badges de certification et méthodes
 * - Actions de contact et partage
 *
 * @param listing - Données du listing
 * @param className - Classes CSS additionnelles
 * @returns JSX.Element - Section hero avec galerie et infos
 */
export default function HeroSection({
  listing,
  className,
}: HeroSectionProps): JSX.Element {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Éviter les erreurs d'hydration en attendant le client
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * Images de la galerie (images du listing + image de profil en fallback)
   */
  const galleryImages = [
    ...(listing.listingImages?.map((img) => img.url) || []),
    ...(listing.profileImage ? [listing.profileImage] : []),
  ];

  // Image par défaut si aucune image
  const defaultImage = "/images/placeholder-farm.jpg";
  const displayImages =
    galleryImages.length > 0 ? galleryImages : [defaultImage];

  /**
   * Note statique pour éviter l'hydration mismatch
   * À remplacer par une vraie note depuis la base de données
   */
  const staticRating = 4.6;
  const staticReviewCount = 23;

  /**
   * Navigation dans la galerie
   */
  const nextImage = (): void => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = (): void => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + displayImages.length) % displayImages.length
    );
  };

  /**
   * Gestion du partage
   */
  const handleShare = async (): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.name,
          text: `Découvrez ${listing.name} - Ferme locale`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback vers copie dans le clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  /**
   * Copie l'URL dans le clipboard
   */
  const copyToClipboard = (): void => {
    navigator.clipboard.writeText(window.location.href);
    // Ici tu pourrais ajouter un toast de confirmation
  };

  /**
   * Gestion des favoris
   */
  const handleFavorite = (): void => {};

  /**
   * Actions de contact
   */
  const handleContact = (): void => {
    if (listing.phoneNumber) {
      window.open(`tel:${listing.phoneNumber}`, "_self");
    } else if (listing.email) {
      window.open(`mailto:${listing.email}`, "_self");
    }
  };

  const handleWebsite = (): void => {
    if (listing.website) {
      window.open(listing.website, "_blank");
    }
  };

  /**
   * Obtient les badges de certification
   */
  const getCertificationBadges = () => {
    // Si pas de certifications, retourner array vide
    if (!listing.certifications) {
      return [];
    }

    // Enum certification_enum peut être une valeur unique ou null
    // Convertir en array pour traitement uniforme
    const cert = listing.certifications;

    const badge = (() => {
      switch (cert) {
        case "bio":
          return {
            label: "Bio",
            color: "bg-green-100 text-green-700 border-green-200",
            icon: "🌱",
          };
        case "label_rouge":
          return {
            label: "Label Rouge",
            color: "bg-red-100 text-red-700 border-red-200",
            icon: "🏷️",
          };
        case "aoc":
          return {
            label: "AOC",
            color: "bg-purple-100 text-purple-700 border-purple-200",
            icon: "⭐",
          };
        case "local":
          return {
            label: "Local",
            color: "bg-blue-100 text-blue-700 border-blue-200",
            icon: "📍",
          };
        default:
          return {
            label: String(cert),
            color: "bg-gray-100 text-gray-700 border-gray-200",
            icon: "✓",
          };
      }
    })();

    return [badge];
  };

  if (!isClient) {
    return (
      <div
        className={cn(
          "w-full h-96 bg-gray-100 rounded-lg animate-pulse",
          className
        )}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden bg-white shadow-lg", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Galerie d'images */}
        <div className="relative aspect-[4/3] lg:aspect-square">
          <Image
            src={displayImages[currentImageIndex]}
            alt={`${listing.name} - Image ${currentImageIndex + 1}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={(e) => {
              e.currentTarget.src = defaultImage;
            }}
          />

          {/* Navigation galerie */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                aria-label="Image suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Indicateurs */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentImageIndex
                        ? "bg-white"
                        : "bg-white/50 hover:bg-white/80"
                    )}
                    aria-label={`Aller à l'image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Actions flottantes */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleFavorite}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
              aria-label="Ajouter aux favoris"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              onClick={handleShare}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
              aria-label="Partager"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Informations de la ferme */}
        <div className="p-6 lg:p-8 flex flex-col justify-between">
          {/* Header avec nom et localisation */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {listing.name}
              </h1>

              {listing.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{listing.address}</span>
                </div>
              )}
            </div>

            {/* Note et avis (statiques) */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(staticRating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
                <span className="font-medium text-gray-900">
                  {staticRating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {staticReviewCount} avis
              </span>
            </div>

            {/* Type de ferme */}
            {listing.typeferme && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <Award className="h-3 w-3 mr-1" />
                  {listing.typeferme}
                </Badge>
              </div>
            )}

            {/* Certifications */}
            {listing.certifications && getCertificationBadges().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getCertificationBadges().map((badge, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={cn("text-xs", badge.color)}
                  >
                    <span className="mr-1">{badge.icon}</span>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description courte */}
            {listing.description && (
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                {listing.description}
              </p>
            )}
          </div>

          {/* Actions de contact */}
          <div className="flex flex-col gap-3 mt-6">
            <div className="flex gap-2">
              {listing.phoneNumber && (
                <Button
                  onClick={handleContact}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
              )}

              {listing.website && (
                <Button
                  variant="outline"
                  onClick={handleWebsite}
                  className="flex-1"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Site web
                </Button>
              )}
            </div>

            {/* Informations additionnelles */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Mis à jour récemment</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Ferme familiale</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
